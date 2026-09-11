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
node scripts/check-phone-model.mjs
```

The build validates the six site pages and packages their assets into `dist`. GitHub Pages publishes that build when changes are pushed to `main`.

The contact form prepares an email for the customer to send. It does not require the older backend included in this repository.

Third-party model credits are in `frontend/public/assets/models/CREDITS.txt`; the bundled Three.js license is in `frontend/public/assets/vendor/three/LICENSE`.
