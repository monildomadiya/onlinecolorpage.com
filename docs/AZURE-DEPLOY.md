# Deploying to Azure

The app ships as a Docker image (`output: 'standalone'`), so any container host
works. These steps use **Azure Web App for Containers** backed by **Azure
Container Registry**, which is the cheapest reliable combination for this shape
of app.

---

## Before you start

- An Azure subscription, and the `az` CLI signed in (`az login`).
- Supabase and R2 already configured — see [SETUP.md](./SETUP.md).
- Your repo on GitHub if you want the push-to-deploy workflow.

Pick names once and reuse them:

```bash
RG=onlinecolorpage-rg
LOCATION=centralindia          # or whichever region is closest to your visitors
ACR=onlinecolorpageacr         # must be globally unique, lowercase, no dashes
PLAN=onlinecolorpage-plan
APP=onlinecolorpage            # becomes https://onlinecolorpage.azurewebsites.net
```

---

## 1. Create the Azure resources

```bash
az group create --name $RG --location $LOCATION
```

```bash
az acr create --resource-group $RG --name $ACR --sku Basic --admin-enabled true
```

```bash
az appservice plan create --resource-group $RG --name $PLAN --is-linux --sku B1
```

> **B1 (~$13/month) is the realistic floor.** The free F1 tier has no always-on
> and only 60 CPU-minutes a day, which the sharp + pdf-lib work in the upload
> route will exhaust quickly. Move to P1v3 when traffic justifies it.

```bash
az webapp create --resource-group $RG --plan $PLAN --name $APP --deployment-container-image-name nginx
```

---

## 2. Build and push the first image

```bash
az acr login --name $ACR
```

The `NEXT_PUBLIC_*` values are compiled into the JavaScript bundle, so they must
be passed at **build** time, not just set on the Web App:

```bash
docker build -t $ACR.azurecr.io/onlinecolorpage:latest --build-arg NEXT_PUBLIC_SITE_URL=https://onlinecolorpage.com --build-arg NEXT_PUBLIC_SITE_NAME="Online Color Page" --build-arg NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_... --build-arg R2_PUBLIC_BASE_URL=https://cdn.onlinecolorpage.com .
```

```bash
docker push $ACR.azurecr.io/onlinecolorpage:latest
```

---

## 3. Point the Web App at the image

```bash
az webapp config container set --resource-group $RG --name $APP --container-image-name $ACR.azurecr.io/onlinecolorpage:latest --container-registry-url https://$ACR.azurecr.io
```

Let the Web App pull from ACR with its own managed identity:

```bash
az webapp identity assign --resource-group $RG --name $APP
```

```bash
az role assignment create --assignee $(az webapp identity show -g $RG -n $APP --query principalId -o tsv) --role AcrPull --scope $(az acr show -n $ACR --query id -o tsv)
```

```bash
az webapp config set --resource-group $RG --name $APP --generic-configurations '{"acrUseManagedIdentityCreds": true}'
```

---

## 4. Application settings

Server-side secrets go here (they are read at run time, so no rebuild needed):

```bash
az webapp config appsettings set --resource-group $RG --name $APP --settings WEBSITES_PORT=3000 NODE_ENV=production SUPABASE_SERVICE_ROLE_KEY="sb_secret_..." R2_ACCOUNT_ID="..." R2_ACCESS_KEY_ID="..." R2_SECRET_ACCESS_KEY="..." R2_BUCKET="onlinecolorpage" R2_PUBLIC_BASE_URL="https://cdn.onlinecolorpage.com" ADMIN_BOOTSTRAP_EMAIL="you@example.com"
```

`WEBSITES_PORT=3000` matters — without it Azure probes the wrong port and the
container looks dead.

Turn on Always On so the first visitor of the day does not wait for a cold start:

```bash
az webapp config set --resource-group $RG --name $APP --always-on true
```

Check it came up:

```bash
curl https://$APP.azurewebsites.net/api/health
```

That returns `{"ok":true,"supabase":true,"r2":true,…}` when both services are
wired up correctly.

---

## 5. Custom domain and HTTPS

```bash
az webapp config hostname add --resource-group $RG --webapp-name $APP --hostname onlinecolorpage.com
```

At your DNS provider, before running that command:

| Type    | Name  | Value                            |
| ------- | ----- | -------------------------------- |
| `A`     | `@`   | the Web App's inbound IP         |
| `TXT`   | `asuid` | the domain verification id     |
| `CNAME` | `www` | `onlinecolorpage.azurewebsites.net` |

Get both values with:

```bash
az webapp show -g $RG -n $APP --query "{ip:inboundIpAddress,asuid:customDomainVerificationId}" -o table
```

Then a free managed certificate:

```bash
az webapp config ssl create --resource-group $RG --name $APP --hostname onlinecolorpage.com
```

```bash
az webapp update --resource-group $RG --name $APP --https-only true
```

Finally set `NEXT_PUBLIC_SITE_URL=https://onlinecolorpage.com` and **rebuild** —
it is baked into the bundle and used for canonical URLs, the sitemap and OG tags.

---

## 6. Push-to-deploy with GitHub Actions

`.github/workflows/azure-deploy.yml` builds, pushes and restarts on every push to
`main`, then polls `/api/health` until the new container answers.

Create the service principal:

```bash
az ad sp create-for-rbac --name onlinecolorpage-deploy --role contributor --scopes /subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RG --sdk-auth
```

Add the JSON it prints as the `AZURE_CREDENTIALS` secret, then these
repository secrets (Settings → Secrets and variables → Actions):

| Secret | Example |
| ------ | ------- |
| `AZURE_CREDENTIALS` | the JSON above |
| `ACR_NAME` | `onlinecolorpageacr` |
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

**Scaling past one instance.** Next.js writes its ISR cache to the container's
own disk. With several instances they each keep their own copy, so a published
page can appear on one instance before another. Everything still works; pages
just refresh at slightly different times. If that matters, set
`revalidate = 0` on the listing pages, or front the app with Azure Front Door.

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

**Deploy a specific build by tag:**

```bash
az webapp config container set --resource-group $RG --name $APP --container-image-name $ACR.azurecr.io/onlinecolorpage:<sha>
```

---

## Other hosts

Nothing here is Azure-specific apart from this document. The image listens on
`$PORT`, keeps all state in Supabase and R2, and exposes `/api/health`. The same
container runs unchanged on Azure Container Apps, Google Cloud Run, AWS App
Runner, Fly.io or a plain VPS with Docker.
