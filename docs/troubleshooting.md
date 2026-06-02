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

## Development server will not start

- Confirm Node.js 22+ is installed.
- Remove `node_modules/` and reinstall with `npm install`.

## Build succeeds but assets are missing online

- Verify the base path matches the public repository name (`/PocketGaze/`).
- Confirm GitHub Pages is set to deploy from GitHub Actions
  (Settings → Pages → Source: GitHub Actions).
