# Joe's Tech Repair

This repo is now split into a dedicated frontend (static site) and backend (Node/Express API) so you can iterate on each independently.

## Project Structure

```
frontend/
  public/
    index.html, about.html, ...
    assets/css, assets/js, images...
backend/
  server.js
  package.json
README.md
CNAME (GitHub Pages / custom domain reference)
```

## Frontend

The frontend remains a static Tailwind + vanilla JS site, organized under `frontend/public`. Update the HTML/CSS/JS there. If you still deploy via GitHub Pages, point the build to that folder.

## Backend

Simple Express server that:

- exposes `/api/health`, `/api/contact`, and `/api/bookings`
- logs contact/booking submissions in the console for now
- serves the static frontend for local testing

### Run locally

```bash
cd backend
npm install
npm run dev   # or `npm start`
```

Visit [http://localhost:3000](http://localhost:3000) to view the site through the backend.

Contact form + hero booking form both post to the backend endpoints.
