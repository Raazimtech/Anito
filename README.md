<div align="center">

# A N I T O

### Anime, without the clutter.

A polished anime discovery and streaming interface built around the unofficial **HiAnime API** — search, discover, bookmark, browse full episode lists, choose SUB/DUB, and play available streams in a fast, app-like UI.

**Built by Raazim Tech**

</div>

---

## ✦ What is Anito?

**Anito** is the complete replacement for the old Movied project in this repository. The repository is now dedicated to an anime-first experience rather than movies.

The goal is simple:

> **Open Anito → find anime → open the show → choose an episode → choose SUB/DUB → watch.**

No paper-like dashboard. No bloated UI. No random feature soup.

### Core experience

- **Discover** trending, popular, airing, recently updated, completed and dubbed anime.
- **Search** anime by title.
- **Anime details** with synopsis, score, genres, type, duration and episode counts.
- **Full episode browser** with individual episode selection.
- **SUB / DUB switching** when a dub source exists.
- **Streaming source selection** through HiAnime episode-server and stream endpoints.
- **HLS playback** using HLS.js where supported by the browser.
- **Bookmarks** stored locally for instant access.
- **Watch history** with episode and playback progress.
- **Continue watching** from the home screen.
- **PWA support** for an app-like install experience.
- **Responsive mobile UI** with bottom navigation.

## Architecture

```text
                    ┌──────────────────────┐
                    │        ANITO         │
                    │  HTML · CSS · JS      │
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

Anito is designed around the community-maintained **HiAnime API**. The API exposes anime home data, search, details, episode lists, episode servers and streaming links, including SUB/DUB sources.

The HiAnime API project recommends **personal-use deployments** rather than relying on a shared public instance. Anito is intended as a private/personal project, and its API layer should therefore be deployed and controlled by the project owner.

### API configuration

The frontend is designed to connect to the project's own HiAnime API deployment. There is intentionally no requirement for users to obtain an API key or configure third-party credentials.

The API exposes endpoints such as:

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
| Video | HLS.js |
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

Anito uses a **dark, restrained interface** with strong typography, compact cards, deliberate spacing and app-style navigation. The interface is built around the anime artwork and watching experience rather than decorative panels.

The mobile experience uses a persistent bottom navigation bar, while larger screens use a compact navigation layout.

## Important note

The HiAnime API used by Anito is an **unofficial API** that scrapes third-party sources. Its maintainers state that it is intended for personal use and recommend deploying your own instance. Anito does not host or claim ownership of anime content or third-party streams.

Use Anito only where you have the right to access the content and follow the laws and terms applicable to your location.

## Development

Because the frontend is static, you can run it with any local static server:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

The application connects to the project's configured HiAnime API deployment.

## Roadmap

- [ ] User accounts and cloud-synced library
- [ ] Multi-device watch progress
- [ ] Advanced anime filters
- [ ] Schedule / airing calendar
- [ ] Recommendations based on viewing history
- [ ] Better player controls and source fallback
- [ ] Character and voice-actor pages
- [ ] Watch-party experience

## Credits

**Anito** is a Raazim Tech project.

Built by **Raazim Tech** — software and digital systems.
