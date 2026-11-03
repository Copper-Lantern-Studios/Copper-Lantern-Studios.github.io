# Cloudflare migration

Status: prepared and locally validated; Cloudflare account sign-in and hosted acceptance tests remain required. DNS and GitHub Pages have not been changed.

## Source and deployment

Repository: https://github.com/Copper-Lantern-Studios/Copper-Lantern-Studios.github.io
Baseline: 73d027abb903ab5729840303768223e6203c8ee3 (main).
There was no checked-in Actions workflow or site build configuration. The site consists of plain HTML with inline CSS and images. CNAME specifies copperlanternstudios.com.

Use Workers Static Assets and Workers Builds GitHub integration. Existing HTML, images, canonical URLs, sitemap and mail links remain unchanged. The build copies public files into dist, excluding configuration and repository metadata. No custom domain or route is included in Wrangler, so initial deployments cannot take over production traffic.

After merging the migration PR, in Cloudflare Workers & Pages create/import a Worker from the existing GitHub repository:

- Authorize the Cloudflare GitHub app for this repository only (organization-owner approval may be required).
- Worker name: copper-lantern-studios
- Production branch: main
- Root directory: repository root
- Install: npm ci (or the dashboard's lockfile-based automatic install)
- Build command: npm run build
- Deploy command: npx wrangler deploy
- Keep workers.dev enabled. Do not add a custom domain yet.

Cloudflare will deploy subsequent pushes to main. No Cloudflare token needs to be stored in GitHub. Local commands: npm ci, npm run dev, npm run deploy (the latter requires Cloudflare authorization).

## Acceptance gate before DNS

On the actual workers.dev URL test /, /support/, /privacy/, /lantern-canvas/, /logo.png, all favicon/manifest icons, /site.webmanifest, /robots.txt and /sitemap.xml. Compare page and asset response bytes to the existing site. Check desktop and mobile appearance, navigation, mail links and a nonexistent URL (must return 404). Confirm /support redirects to /support/ and /support/index.html resolves to the same content (a canonical redirect is acceptable). Confirm /README.md, /package.json, /.git/config and /wrangler.jsonc are not served. Save the deployed commit ID and successful test results before proceeding.

## DNS snapshot (public queries, 2026-11-03 UTC)

- Nameservers: ns1.dyna-ns.net, ns2.dyna-ns.net
- Apex A: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
- www CNAME: copper-lantern-studios.github.io
- MX priority 0: parkmail.dynadot.com
- TXT: v=spf1 mx ~all
- Queried records had TTL 300 seconds. No apex AAAA answer was returned.

This is not a full zone export. Export/review the authoritative DNS zone in Dynadot, including any DKIM, DMARC, verification, subdomain, CAA and DNSSEC/DS records. Public queries cannot discover all record names. Preserve mail forwarding and all non-web records.

## Cutover, only after hosted acceptance passes

1. Add copperlanternstudios.com to Cloudflare using the Free plan. Review the imported DNS against the complete Dynadot zone. Keep the existing GitHub web records unchanged and DNS-only initially.
2. Check DNSSEC at the registrar. If an old DS record exists, follow Cloudflare's DNSSEC migration procedure before changing nameservers; do not leave a stale DS record.
3. At the registrar, replace the nameservers with the exact pair assigned by Cloudflare. Do not guess them. This transfers DNS management while the copied web records continue serving GitHub Pages. Verify the domain and mail still work and wait until Cloudflare shows the zone as active.
4. With approval for production cutover, add copperlanternstudios.com as the Worker's Custom Domain. Cloudflare creates the associated DNS and certificate. An existing conflicting A/CNAME record may need removal as part of this step; never remove it before the replacement is tested and ready. Add www as a Custom Domain too, or configure a redirect preserving path and query to the apex. Preserve the current www behavior where practical.
5. Verify HTTPS, both hostnames, all pages/assets, redirects, mail DNS and a fresh deployment from GitHub. Record final settings. Keep GitHub Pages and CNAME enabled during a rollback window.

## Rollback

If cutover fails, remove the Worker's affected custom-domain mapping and restore the original apex A records and www CNAME in the now-authoritative DNS provider, DNS-only, then retest GitHub Pages. Keep all mail records untouched. Prefer restoring web records over changing nameservers again. Allow DNS caches time to expire. Do not disable GitHub Pages until Cloudflare has been stable and rollback is no longer needed.

References:
- https://developers.cloudflare.com/workers/static-assets/
- https://developers.cloudflare.com/workers/ci-cd/builds/
- https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
