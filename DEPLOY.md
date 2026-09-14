# Deploying benjamingarcia.cl

The site is fully static: `index.html`, `favicon.svg`, and `assets/portrait.jpg`. Any static host works. Two free options below; GitHub Pages is the simplest if you don't already use Cloudflare.

## Option A: GitHub Pages (recommended)

1. Create a GitHub account (if needed) and a new public repository, e.g. `website`.
2. Upload the contents of this folder to the repository (`index.html`, `favicon.svg`, `CNAME`, `assets/`). The `CNAME` file is already set to `benjamingarcia.cl`.
3. In the repository: Settings, then Pages. Under "Build and deployment" choose "Deploy from a branch", branch `main`, folder `/ (root)`. Save.
4. Still under Pages, in "Custom domain" enter `benjamingarcia.cl` and save.
5. Configure DNS where you manage the domain (NIC Chile's DNS admin, or your DNS provider). Add four A records for the bare domain (`@`):
   - 185.199.108.153
   - 185.199.109.153
   - 185.199.110.153
   - 185.199.111.153

   Optionally add a `www` CNAME record pointing to `<your-github-username>.github.io`.
6. DNS can take up to a day to propagate (usually under an hour). Once GitHub verifies the domain, tick "Enforce HTTPS" in the Pages settings.

Updating the site afterwards is just editing `index.html` in the repository (the pencil icon in the GitHub web interface works fine).

## Option B: Cloudflare Pages

1. Create a Cloudflare account and add `benjamingarcia.cl` as a site (this moves DNS to Cloudflare; NIC Chile lets you change nameservers at nic.cl).
2. In the dashboard: Workers & Pages, Create, Pages, "Upload assets". Upload this folder's contents.
3. Add `benjamingarcia.cl` as a custom domain for the Pages project. Since DNS is on Cloudflare, the record is created automatically and HTTPS is immediate.

## Images

The page uses three files in `assets/`, all generated from your originals so the site loads fast:

- `banner.jpg` (1800px wide, ~255 KB) and `banner-small.jpg` (1100px, ~110 KB) — cropped and compressed from `banner-DSC02566.jpg`. The browser picks whichever fits the screen.
- `avatar.jpg` (360px, ~30 KB) — resized from `headshot.jpg`.

Your originals (`banner-DSC02566.jpg`, `headshot.jpg`) stay in the folder untouched and are not loaded by the page; `portrait.jpg` is the old placeholder and is no longer used. All three can be deleted from the deployed copy if you want to keep it lean.

To swap in a different photo later, replace the generated file of the same name (or ask me to regenerate them from a new original).

The CV is self-hosted as `cv.pdf` next to `index.html`; to update it later, just overwrite that file.
