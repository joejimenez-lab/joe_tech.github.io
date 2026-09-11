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

The interactive iPhone 12 teardown is embedded in the page using Sketchfab’s viewer. Model by [Peter_D](https://sketchfab.com/3d-models/iphone-12-teardown-708eaa5d195544918e5f70b69eedcdfa), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The viewer requires an internet connection to Sketchfab. The previous iPhone 15 study remains in source history and is no longer included in the published build.
