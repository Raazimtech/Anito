<div align="center">

# A N I T O

### Anime, without the clutter.

A polished anime discovery and watching experience built around the unofficial **HiAnime API** — discover anime, search, bookmark shows, browse full episode lists, choose SUB/DUB, and play available streams in a fast, app-like interface.

**Built by Raazim Tech**

</div>

---

## ✦ What is Anito?

**Anito** is the anime-first successor to the old Movied project. The repository is now dedicated entirely to anime discovery and watching.

The product flow is intentionally simple:

> **Open Anito → find anime → open the show → choose an episode → choose SUB/DUB → watch.**

No movie catalog. No paper-like dashboard. No bloated feature soup.

### Core experience

- **Discover** trending, popular, airing, recently updated, completed and dubbed anime.
- **Search** anime by title with pagination-ready API support.
- **Anime details** with synopsis, score, genres, type, duration and episode counts.
- **Full episode browser** with individual episode selection.
- **SUB / DUB switching** when a dub source exists.
- **Streaming source discovery** through HiAnime episode-server and stream endpoints.
- **HLS playback** with subtitle-track support where available.
- **Bookmarks** for quickly saving anime.
- **Watch history** with episode and playback progress.
- **Continue watching** from the home experience.
- **PWA support** for an app-like install experience.
- **Responsive mobile UI** with bottom navigation.

## Architecture

```text
                    ┌──────────────────────┐
                    │        ANITO         │
                    │     HTML · CSS · JS  │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
         Discovery          Details         Search
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                     ┌─────────────────┐
                     │  HiAnime API    │
                     └────────┬────────┘
                              │
                 ┌────────────┼────────────┐
                 ▼            ▼            ▼
              Episodes      Servers      Stream
                 │            │            │
                 └────────────┼────────────┘
                              ▼
                         HLS Player
```

## HiAnime API

Anito is designed around the community-maintained **HiAnime API**. Its documented API provides anime home data, search, detailed information, episode lists, episode servers, streaming links, subtitles, and SUB/DUB sources.

The API maintainers explicitly recommend **deploying your own instance for personal use** rather than depending on a shared public endpoint. Anito follows that model: the application is intended as a private/personal project, and the API layer should be controlled by the project owner.

### No API setup for Anito users

Anito is **not** designed to ask the user for an API key or API URL. The application should connect to its configured project-owned API deployment automatically.

Typical API routes include:

```text
GET /api/v1/home
GET /api/v1/search?keyword=naruto&page=1
GET /api/v1/anime/:id
GET /api/v1/episodes/:id
GET /api/v1/servers?id=:episodeId
GET /api/v1/stream?id=:episodeId&server=:server&type=sub
```

## Tech stack

| Layer | Technology |
|---|---|
| UI | HTML5 + CSS3 |
| Application | Vanilla JavaScript |
| Anime data | HiAnime API |
| Video | HTML5 Video + HLS.js |
| Storage | Browser LocalStorage |
| PWA | Web App Manifest + Service Worker |
| Hosting | Static hosting compatible |

## Project structure

```text
Anito/
├── index.html       # Anito application shell
├── styles.css       # Responsive visual system
├── app.js           # Routing, API, library, details and player logic
├── manifest.json    # PWA metadata
├── sw.js            # Offline app-shell caching
├── favicon.svg      # Anito mark
├── robots.txt
├── sitemap.xml
└── README.md
```

## Design direction

Anito is designed to feel like a **real streaming application**, not a website template.

The visual system focuses on:

- Dark, restrained surfaces
- Strong typography
- Large, high-quality anime artwork
- Compact but readable cards
- Consistent spacing and hierarchy
- Minimal visual noise
- Fast interactions
- Mobile-first navigation
- A dedicated watching experience

The mobile experience uses a persistent bottom navigation bar, while larger screens make better use of available width without turning the interface into a dashboard.

## Important note

The HiAnime API used by Anito is an **unofficial API** that scrapes third-party sources. Its maintainers state that it is intended for personal use and recommend deploying your own instance. Anito does not host or claim ownership of anime content or third-party streams.

Use Anito only where you have the right to access the content and follow the laws and terms applicable to your location.

## Development

The frontend is static and can be served with any local static server:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

The application connects to the project's configured HiAnime API deployment.

## Roadmap

- [ ] Project-owned HiAnime API deployment
- [ ] User accounts and cloud-synced library
- [ ] Multi-device watch progress
- [ ] Advanced anime filters
- [ ] Airing schedule / calendar
- [ ] Recommendations based on viewing history
- [ ] Smarter streaming-source fallback
- [ ] Character and voice-actor pages
- [ ] Watch-party experience

## Credits

**Anito** is a Raazim Tech project.

Built by **Raazim Tech** — software and digital systems.
