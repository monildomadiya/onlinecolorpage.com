# Deploying to Azure

The app is deployed to **Azure App Service (Linux, Node 22)** as a prebuilt
standalone bundle. No container registry is involved.

> The `Dockerfile` is still here and still works — use it for Container Apps,
> Fly, Render or anywhere else that wants an image. It is simply not the
> cheapest path on Azure, where a registry is an extra bill for no benefit.

**Why the bundle is built in CI and not on Azure:** `sharp` ships platform
binaries. A bundle built on Windows carries `@img/sharp-win32-x64`, which App
Service cannot load. The workflow builds on `ubuntu-latest`, so the binaries
match.

---

## Before you start

- An Azure subscription, and the `az` CLI signed in (`az login`).
- Supabase and R2 already configured — see [SETUP.md](./SETUP.md).
- The repo on GitHub.

Pick names once and reuse them:

```bash
RG=onlinecolorpage-rg
LOCATION=centralindia          # or whichever region is closest to your visitors
PLAN=onlinecolorpage-plan
APP=onlinecolorpage            # becomes https://onlinecolorpage.azurewebsites.net
```

---

## 1. Create the resources

```bash
az group create --name $RG --location $LOCATION
```

```bash
az appservice plan create --resource-group $RG --name $PLAN --is-linux --sku B1
```

> **B1 (~$13/month) is the realistic floor.** F1 has no Always On, no custom
> domain, and only 60 CPU-minutes a day, which the sharp and pdf-lib work in the
> upload route exhausts quickly. Move to P1v3 when traffic justifies it.

```bash
az webapp create --resource-group $RG --plan $PLAN --name $APP --runtime "NODE:22-lts"
```

The standalone bundle starts itself, so tell App Service to run it directly
instead of looking for a package.json script:

```bash
az webapp config set --resource-group $RG --name $APP --startup-file "node server.js" --always-on true
```

---

## 2. Application settings

Server-side secrets are read at run time, so they live here rather than in the
build. Changing one restarts the app; no rebuild is needed.

Once `.env.local` is filled in, one command copies the run-time half of it to
the Web App and then waits for `/api/health` to confirm the result:

```bash
npm run azure:settings
```

It sends the values as a temporary `@file` rather than as command arguments,
so they stay out of your shell history and the process list, and prints only a
masked prefix. Override the target with `AZURE_RESOURCE_GROUP` and
`AZURE_WEBAPP_NAME` if your names differ.

By hand, the same thing:

```bash
az webapp config appsettings set --resource-group $RG --name $APP --settings NODE_ENV=production SCM_DO_BUILD_DURING_DEPLOYMENT=false SUPABASE_SERVICE_ROLE_KEY="sb_secret_..." R2_ACCOUNT_ID="..." R2_ACCESS_KEY_ID="..." R2_SECRET_ACCESS_KEY="..." R2_BUCKET="onlinecolorpage" R2_PUBLIC_BASE_URL="https://cdn.onlinecolorpage.com" ADMIN_BOOTSTRAP_EMAIL="you@example.com"
```

`SCM_DO_BUILD_DURING_DEPLOYMENT=false` matters — the bundle arrives already
built, and letting Oryx rebuild it on Azure both wastes minutes and reinstalls
`sharp` in a way that can miss the native binaries.

The `NEXT_PUBLIC_*` values are **not** here. They are inlined into the browser
bundle at build time, so they belong to the workflow (step 4).

Check it came up:

```bash
curl https://$APP.azurewebsites.net/api/health
```

That returns `{"ok":true,"supabase":true,"r2":true,…}` when both services are
wired up. `"r2":false` means the `R2_*` settings above did not take.

---

## 3. Custom domain and HTTPS

Get the two values your DNS needs:

```bash
az webapp show -g $RG -n $APP --query "{ip:inboundIpAddress,asuid:customDomainVerificationId}" -o table
```

At your DNS provider:

| Type    | Name    | Value                               |
| ------- | ------- | ----------------------------------- |
| `A`     | `@`     | the Web App's inbound IP            |
| `TXT`   | `asuid` | the domain verification id          |
| `CNAME` | `www`   | `onlinecolorpage.azurewebsites.net` |

> Behind Cloudflare, leave these records **DNS only** (grey cloud) until the
> managed certificate below has been issued. Azure validates by reaching the
> origin directly, and a proxied record hides it.

Then add the hostname and a free managed certificate:

```bash
az webapp config hostname add --resource-group $RG --webapp-name $APP --hostname onlinecolorpage.com
```

```bash
az webapp config ssl create --resource-group $RG --name $APP --hostname onlinecolorpage.com
```

```bash
az webapp update --resource-group $RG --name $APP --https-only true
```

Finally set `NEXT_PUBLIC_SITE_URL=https://onlinecolorpage.com` as a repository
variable and **rebuild** — it is baked into the bundle and used for canonical
URLs, the sitemap and OG tags.

---

## 4. Push-to-deploy with GitHub Actions

`.github/workflows/azure-deploy.yml` builds the bundle on every push to `main`,
uploads it, deploys it, then polls `/api/health` until the new build answers.
The deploy job is skipped while `AZURE_WEBAPP_NAME` is unset, so the build still
runs — and still catches broken code — before Azure exists.

Download the publish profile:

```bash
az webapp deployment list-publishing-profiles -g $RG -n $APP --xml
```

Then, under **Settings → Secrets and variables → Actions**:

**Secrets**

| Secret | Value |
| ------ | ----- |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | the XML above |

**Variables** — all public, all inlined into the browser bundle:

| Variable | Example |
| -------- | ------- |
| `AZURE_WEBAPP_NAME` | `onlinecolorpage` |
| `NEXT_PUBLIC_SITE_URL` | `https://onlinecolorpage.com` |
| `NEXT_PUBLIC_SITE_NAME` | `Online Color Page` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_…` |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | `ca-pub-…` (optional) |
| `NEXT_PUBLIC_GA_ID` | `G-…` (optional) |
| `R2_PUBLIC_BASE_URL` | `https://cdn.onlinecolorpage.com` (optional) |

Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, the `R2_*` credentials) stay in
Azure app settings and are deliberately **not** GitHub secrets — nothing in the
build needs them.

---

## Notes specific to this app

**Scaling past one instance.** Next.js writes its ISR cache to the instance's
own disk. With several instances they each keep their own copy, so a published
page can appear on one before another. Everything still works; pages just
refresh at slightly different times. If that matters, set `revalidate = 0` on
the listing pages, or front the app with Azure Front Door.

**Uploads are synchronous.** `/api/admin/upload` runs sharp and pdf-lib inline
and declares `maxDuration = 120`. On B1, a 20 MB source image takes a few
seconds. The bulk uploader sends three at a time, which B1 handles; raise the
tier before raising that number.

**File size limits.** Azure's front end caps request bodies well above our 20 MB
upload limit, so nothing extra is needed. The limit is enforced in the route.

**Logs:**

```bash
az webapp log tail --resource-group $RG --name $APP
```

---

## Other hosts

Any Node 22 host runs the same bundle: build with `npm run build`, copy `public`
and `.next/static` into `.next/standalone`, and run `node server.js` there with
the server-side environment variables set.

Any container host runs the `Dockerfile` unchanged — pass the `NEXT_PUBLIC_*`
values as `--build-arg`, and the rest as runtime environment variables.
