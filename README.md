# Movied

Movied is a mobile-first free movie discovery and streaming PWA built for Raazim Tech.

## Stack

- Static HTML, CSS and JavaScript
- Internet Archive Advanced Search + item metadata for the movie catalogue and available media
- Supabase Auth for accounts
- Supabase Postgres with RLS for per-user viewing history and watchlist
- Service worker + manifest for PWA installation

## Supabase

The frontend uses the project's publishable key only. The database includes:

- `public.movied_history` — one progress record per user/movie
- `public.movied_watchlist` — saved movies per user

Both tables have Row Level Security policies so signed-in users can only access their own records.

## Deploy

The repository is ready for GitHub Pages. Set GitHub Pages to deploy the `main` branch root.

Production URL:

`https://raazimtech.github.io/Movied/`

## Branding

The Movied logo concept was created in Canva and adapted into the app icon/favicon for a lightweight web implementation.

Raazim Tech: https://raazimtech.github.io/Raazim-tech/
