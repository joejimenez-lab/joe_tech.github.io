# Joe’s Tech Repair

Repair services in Baldwin Park, California, with an interactive iPhone teardown, display options, repair photos, and Joe’s portfolio.

## Run locally

```sh
python3 -m http.server 8891 --directory frontend/public
```

Open http://localhost:8891.

## Validate and build

```sh
python3 scripts/build-repair.py
node scripts/check-teardown-viewer.mjs
```

The build validates the six site pages and packages their assets into `dist`. GitHub Pages publishes that build when changes are pushed to `main`.

The contact form prepares an email for the customer to send. It does not require the older backend included in this repository.

The iPhone 12 teardown runs in the site’s own Three.js renderer with local geometry, textures, and decoder files. No embedded player or third-party viewer connection is used.

Model by Peter_D, licensed under CC BY 4.0; see `frontend/public/assets/models/IPHONE12-CREDITS.txt`. Original component geometry is preserved, with compact web textures and Meshopt compression. Three.js and Meshoptimizer licenses are included with the libraries.
