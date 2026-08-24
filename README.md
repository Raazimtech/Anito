<div align="center">

# NUVIO

### Private conversations. Shared files. One quiet workspace.

A mobile-first private chat and file-sharing web app built for fast conversations between trusted people.

**Built by Raazim Tech**

</div>

---

## ✦ What is Nuvio?

Nuvio is a lightweight private workspace where people can find each other by **unique username**, send chat requests, create one-to-one conversations, and share the files they actually need — images, documents, code, ZIPs and more.

The goal is simple: **move something from your laptop to your phone without turning your life into a folder of random cloud links.**

## Features

| Feature | What it does |
|---|---|
| 🔐 Authentication | Email/password accounts through Supabase Auth |
| @ Unique usernames | Every username is enforced as unique at database level |
| 🔎 People search | Find users by username |
| 🤝 Chat requests | Request, accept or decline conversations |
| 💬 Private chat | One-to-one conversations with real-time messages |
| 📎 File sharing | Send images, documents, code, ZIPs and other files |
| 🖼️ File previews | Image-aware attachments with secure signed downloads |
| 📱 Responsive UI | Designed for phone and desktop |
| ⚡ Realtime | Messages and requests update without manual refresh |
| 🛡️ RLS security | Database access is restricted by authenticated membership |
| 📦 PWA | Install Nuvio like an app |

## Security model

Nuvio does **not** trust the frontend to keep conversations private.

```text
                         SUPABASE AUTH
                              │
                              ▼
                       authenticated user
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
        conversation membership       username identity
                 │                         │
                 ▼                         ▼
          RLS-protected data        unique database index
                 │
        ┌────────┼─────────┐
        ▼        ▼         ▼
     messages  files   attachments
```

Every conversation is backed by membership rows. Message reads/writes require membership, and storage access is restricted to files belonging to conversations the authenticated user belongs to.

The browser only receives the **publishable** Supabase client key. No service-role secret is shipped to the frontend.

## Data model

```text
profiles
   │
   ├── chat_requests
   │
   └── conversation_members
              │
              ▼
        conversations
              │
              ├── messages
              │      └── attachments
              │
              └── private storage
```

## Tech stack

- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Auth:** Supabase Auth
- **Database:** PostgreSQL via Supabase
- **Realtime:** Supabase Realtime
- **Files:** Supabase Storage
- **Security:** PostgreSQL Row Level Security
- **PWA:** Web App Manifest + Service Worker

## Run locally

```bash
git clone https://github.com/Raazimtech/nuvio.git
cd nuvio
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

The production Supabase project is already configured with the required Nuvio schema, RLS policies, storage bucket and realtime tables.

## Supabase schema

The Nuvio backend contains:

- `nuvio_profiles`
- `nuvio_chat_requests`
- `nuvio_conversations`
- `nuvio_conversation_members`
- `nuvio_messages`
- `nuvio_attachments`
- private `nuvio-files` Storage bucket

The account trigger creates a profile automatically after registration. Username uniqueness is enforced with a case-insensitive database index, not just a client-side check.

## Project structure

```text
nuvio/
├── index.html       # App shell and auth UI
├── styles.css       # Responsive Nuvio design system
├── app.js           # Auth, search, requests, chat and files
├── manifest.json    # PWA metadata
├── sw.js            # Offline app shell caching
├── favicon.svg      # Nuvio icon
└── README.md
```

## Product principles

**Private by default.** Access should come from authentication and database policies, not hidden buttons.

**Fast to understand.** Nuvio should feel like a tool, not an admin dashboard.

**Useful on a phone.** The original purpose is practical file transfer between devices, so mobile is a first-class experience.

**No unnecessary complexity.** A small, focused product beats a giant unfinished feature list.

## Roadmap

- [x] Account registration and login
- [x] Unique usernames
- [x] Username search
- [x] Chat requests
- [x] Private one-to-one conversations
- [x] Realtime messaging
- [x] File uploads
- [x] Secure signed file access
- [x] Row-level security
- [x] PWA shell
- [ ] Message reactions
- [ ] Drag-and-drop desktop uploads
- [ ] Image gallery inside conversations
- [ ] Message search
- [ ] Optional profile avatars

## License

This project is maintained for personal use and experimentation by **Raazim Tech**.

---

<div align="center">

**Nuvio** · Private by design.

</div>
