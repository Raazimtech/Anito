<div align="center">

# A N I K I

### Anime, without the clutter.

A polished anime discovery and streaming interface built around the unofficial **HiAnime API** — search, discover, bookmark, browse full episode lists, choose SUB/DUB, and play HLS streams in a fast app-like UI.

**Built by Raazim Tech**

</div>

---

## ✦ What is Aniki?

Aniki is the complete replacement for the old Movied project in this repository. The repository is now dedicated to an anime-first experience rather than movies.

The product goal is simple:

> **Open Aniki → find anime → open the show → choose an episode → choose SUB/DUB → watch.**

No paper-like dashboard. No bloated UI. No random feature soup.

### Core experience

- **Discover** trending, popular, airing, recently updated, completed and dubbed anime.
- **Search** anime by title with HiAnime's search endpoint.
- **Anime details** with synopsis, score, genres, type, duration and episode counts.
- **Full episode browser** with individual episode selection.
- **SUB / DUB switching** when a dub source exists.
- **Streaming source selection** through HiAnime episode-server and stream endpoints.
- **HLS playback** using HLS.js where supported by the browser.
- **Bookmarks** stored locally for instant access.
- **Watch history** with episode and playback progress.
- **Continue watching** from the home screen.
- **PWA support** for an app-like install experience.
- **Responsive mobile UI** with a bottom navigation bar.

## Architecture

```text
                    ┌──────────────────────┐
                    │        ANIKI          │
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

Aniki is designed around the community-maintained **HiAnime API**. The API exposes anime home data, search, details, episode lists, episode servers and streaming links, including SUB/DUB sources.

The recommended setup is to deploy your own API instance and point Aniki at it. The frontend stores the endpoint locally and does not require an API secret.

### Configure the API

1. Deploy a HiAnime API instance.
2. Open **Aniki → More → Settings**.
3. Enter the base URL ending in `/api/v1`.
4. Save it.
5. Reload Home.

For example:

```text
https://your-api.example.com/api/v1
```

The frontend expects endpoints such as:

```text
GET /home
GET /search?keyword=naruto&page=1
GET /anime/:id
GET /episodes/:id
GET /servers?id=:episodeId
GET /stream?id=:episodeId&server=:server&type=sub
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
Movied/
├── index.html       # Aniki application shell
├── styles.css       # Responsive visual system
├── app.js           # Routing, API, library, details and player logic
├── manifest.json    # PWA metadata
├── sw.js            # Offline app-shell caching
├── favicon.svg      # Aniki mark
├── robots.txt
├── sitemap.xml
└── README.md
```

## Design direction

Aniki intentionally uses a **dark, restrained interface** with strong typography, compact cards, real spacing and an app-style navigation system. The UI is designed around the content rather than decorative panels.

The mobile experience uses a persistent bottom navigation bar, while larger screens use a compact top navigation.

## Important note

The HiAnime API used by Aniki is an **unofficial API** that scrapes third-party sources. The API maintainers recommend personal use and deploying your own instance. Aniki does not host or claim ownership of anime content or third-party streams.

Use the project only where you have the right to access the content and follow the laws and terms applicable to your location.

## Development

Because the frontend is static, you can run it with any local static server:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

Configure the HiAnime API endpoint from Aniki's Settings page.

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

**Aniki** is a Raazim Tech project.

Built by **Raazim Tech** — software and digital systems.
