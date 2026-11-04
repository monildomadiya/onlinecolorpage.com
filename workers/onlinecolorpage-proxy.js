/**
 * Fronts the Azure App Service origin for onlinecolorpage.com.
 *
 * App Service on the Free (F1) tier accepts no custom hostnames, so requests
 * have to arrive bearing its own *.azurewebsites.net name. Rewriting the URL
 * here does that - a Worker sets Host from the request URL - and the visitor
 * only ever sees onlinecolorpage.com.
 *
 * Deployed to the Cloudflare zone on the routes `onlinecolorpage.com/*` and
 * `www.onlinecolorpage.com/*`. `cdn.onlinecolorpage.com` is deliberately not
 * routed here - it is R2, and goes straight to the bucket.
 *
 * See docs/AZURE-DEPLOY.md section 3a for why this exists and when to delete it.
 */
const ORIGIN = 'onlinecolorpage-a5exfehkcqdqehdh.centralindia-01.azurewebsites.net';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const publicHost = url.hostname;

    url.hostname = ORIGIN;
    url.protocol = 'https:';
    url.port = '';

    const response = await fetch(new Request(url, request), { redirect: 'manual' });

    // The origin builds absolute redirects from the Host it was given, which
    // would walk visitors onto the azurewebsites.net name. Put them back.
    const location = response.headers.get('location');
    if (!location) return response;

    const headers = new Headers(response.headers);
    try {
      const target = new URL(location, 'https://' + ORIGIN);
      if (target.hostname === ORIGIN) {
        target.hostname = publicHost;
        headers.set('location', target.toString());
      }
    } catch {
      // A malformed Location is the origin's business, not ours.
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
