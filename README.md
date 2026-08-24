<div align="center">

# ANITO

### Anime, without the clutter.

A sleek, mobile-first anime discovery and watching app built around the unofficial HiAnime API, with a project-owned Supabase gateway.

**Built by Raazim Tech**

</div>

---

## What Anito does

**Open Anito → discover anime → open the show → choose an episode → choose SUB/DUB → watch.**

- Trending, popular and latest anime cards
- Search and discovery filters
- Anime detail pages with synopsis, genres, score and episode count
- Full episode selector
- SUB / DUB switching
- HLS video playback
- Subtitle tracks when available
- Episode sidebar while watching
- Bookmarks
- Local watch history and playback progress
- Continue watching
- PWA install support
- Mobile bottom navigation
- No user API-key or API-URL setup

## Architecture

```text
                 ANITO
                   │
             Vanilla Web App
                   │
                   ▼
        Supabase Edge Function
              anito-api
                   │
                   ▼
              HiAnime API
                   │
       ┌───────────┼───────────┐
       ▼           ▼           ▼
    Details     Episodes    Servers
                               │
                               ▼
                            Stream
                               │
                               ▼
                         HLS.js Player
```

The frontend uses the project-owned Supabase Edge Function at:

```text
https://dpiwdhtbhwjgatvcfkcb.supabase.co/functions/v1/anito-api
```

The gateway keeps the browser away from a public scraper endpoint and provides the CORS/proxy layer needed by the player.

## HiAnime API

Anito uses the community-maintained **HiAnime API**. Its documented endpoints include anime discovery, search, details, episode lists, episode servers, streaming links, subtitles and an HLS-capable embedded player.

The upstream project recommends deploying your own instance for personal use. Anito follows that model through its own API layer. citehttps://github.com/MSMods-Pro/hianime-api

## Design

Anito is deliberately **not** a dashboard or paper-like website. The UI is built as a streaming product:

- Dark, restrained surfaces
- Strong typography
- Large artwork
- Compact poster cards
- Clear episode controls
- Dedicated watch screen
- Mobile-first bottom navigation
- No gradients
- No generic movie branding

## Tech stack

| Layer | Technology |
|---|---|
| UI | HTML5 + CSS3 |
| App logic | Vanilla JavaScript |
| Anime data | HiAnime API |
| API gateway | Supabase Edge Functions |
| Video | HTML5 Video + HLS.js |
| Personal library | LocalStorage |
| PWA | Manifest + Service Worker |
| Hosting | GitHub Pages / static hosting |

## Project structure

```text
Anito/
├── index.html
├── styles.css
├── app.js
├── enhance.js
├── manifest.json
├── sw.js
├── favicon.svg
├── robots.txt
├── sitemap.xml
└── README.md
```

## Development

```bash
python -m http.server 8080
```

Open `http://localhost:8080`.

No API key needs to be entered into the frontend.

## Personal-use notice

The HiAnime API is unofficial and retrieves information/streams from third-party sources. Anito does not claim ownership of that content. Use the application only where you have the right to access the material and follow applicable laws and service terms.

## Branding

The custom **Anito** logo is maintained as an editable Canva design alongside the project brand work.

## Credits

**Anito** — a Raazim Tech project.
