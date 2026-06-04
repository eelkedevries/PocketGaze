# Troubleshooting

Common issues when building or deploying PocketGaze.

## Blank GitHub Pages screen

A blank deployed page is usually a base-path problem. PocketGaze is a project Pages site
served from `https://eelkedevries.github.io/PocketGaze/`, so the Vite base path must match
the repository name. It is configured in `vite.config.ts`:

```ts
base: '/PocketGaze/'
```

Check the browser console for asset 404s after deployment.

## Deep links or refresh show a 404

PocketGaze uses `HashRouter`, so routes look like `/PocketGaze/#/step-3`. This keeps deep
links and refreshes working on GitHub Pages without server-side rewrites. If you switch to
a history-based router later, you will also need a Pages SPA fallback.

## Camera option is unavailable or the button is missing

The camera demos require a **secure context** (`https://` or `localhost`). If the page is
served over plain HTTP from a non-localhost origin, `getUserMedia` is blocked by the
browser; the demo shows "Camera unavailable" instead of the Start camera button. Serve the
site over HTTPS, or run it locally with `npm run dev`.

## Camera permission denied

If you dismissed the browser permission prompt, the demo shows an error message and a
**Try again** button. To re-enable the camera, use the browser's site-settings or
address-bar camera icon to allow access, then click **Try again**.

## Face tracking does not start

The MediaPipe WASM and model files are self-hosted under `public/`. If those assets fail
to load (for example, because the base path is wrong or the files are missing from
`dist/`), the demo shows: "The face-tracking model could not be loaded — the explanatory
content above still applies." Check the browser console for 404s and confirm the Vite
base path matches the repository name (`/PocketGaze/`).

## Development server will not start

- Confirm Node.js 22+ is installed.
- Remove `node_modules/` and reinstall with `npm install`.

## Build succeeds but assets are missing online

- Verify the base path matches the public repository name (`/PocketGaze/`).
- Confirm GitHub Pages is set to deploy from GitHub Actions
  (Settings → Pages → Source: GitHub Actions).
