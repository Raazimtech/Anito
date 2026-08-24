<div align="center">

# NUVIO

### Private conversations. Shared files. One quiet workspace.

A clean, username-first chat and file-sharing app for moving conversations and files between the devices you actually use.

**Built by Raazim Tech**

</div>

---

## What is Nuvio?

Nuvio is a private one-to-one messaging workspace. Users create an account with a **unique username and password**, find other people by username, send chat requests, and share messages and files after a request is accepted.

No email field. No email confirmation. No Gmail dependency.

## Core features

- **Username + password accounts** — simple registration and login
- **Unique usernames** — enforced by the backend
- **People search** — search usernames quickly
- **Chat requests** — request, accept, or decline
- **Private one-to-one chat** — membership controls access
- **Realtime messages** — conversations update without refresh
- **File sharing** — images, documents, code, ZIPs, and other files
- **Private storage** — attachments are protected and served with short-lived signed URLs
- **Responsive UI** — designed for phones first, with a desktop layout
- **PWA** — install Nuvio as an app
- **Install button** — appears when the browser exposes the install prompt

## Authentication

The user-facing authentication flow is intentionally:

```text
Create account
    ↓
Username + Password
    ↓
Account created
    ↓
Logged in
```

And returning users simply use:

```text
Username + Password
    ↓
Logged in
```

Nuvio does not ask for an email address or run email confirmation. A small server-side authentication function handles the username-to-auth-identity bridge so the browser never needs an email field.

## Security

The frontend is **not** the security boundary.

```text
Authenticated user
       │
       ▼
Conversation membership
       │
   ┌───┼─────────┐
   ▼   ▼         ▼
messages     attachments   files
   │             │           │
   └──────── RLS ────────────┘
```

PostgreSQL Row Level Security controls access to conversations, members, messages, requests and attachments. Storage access is restricted to authorized conversation members.

The browser uses only the Supabase publishable key. Sensitive server credentials remain server-side.

## Architecture

```text
Nuvio Web / PWA
      │
      ├── Supabase Auth gateway
      │
      ├── PostgreSQL
      │     ├── profiles
      │     ├── requests
      │     ├── conversations
      │     ├── members
      │     ├── messages
      │     └── attachments
      │
      ├── Supabase Realtime
      │
      └── Supabase Storage
             └── private files
```

## Tech stack

- HTML5
- Modern CSS
- Vanilla JavaScript
- Supabase Auth
- PostgreSQL
- Supabase Realtime
- Supabase Storage
- PostgreSQL RLS
- Web App Manifest
- Service Worker

## Run locally

```bash
git clone https://github.com/Raazimtech/nuvio.git
cd nuvio
python -m http.server 8080
```

Open `http://localhost:8080`.

## Project structure

```text
nuvio/
├── index.html       # Nuvio application shell
├── styles.css       # New responsive visual system
├── app.js           # Authentication, chat, search and file logic
├── manifest.json    # PWA configuration
├── sw.js            # Versioned service-worker cache
├── favicon.svg      # Nuvio brand mark
└── README.md
```

## Design direction

The rebuilt interface intentionally avoids the old dashboard/document look. It uses a darker product-style interface, new **Manrope** and **Plus Jakarta Sans** typography, compact controls, restrained borders, large touch targets, and a focused conversation layout.

The existing Nuvio logo/favicon is preserved instead of replacing the identity with a generic generated icon.

## Roadmap

- [x] Username/password registration
- [x] Username/password login
- [x] Unique username enforcement
- [x] Username search
- [x] Chat requests
- [x] Private conversations
- [x] Realtime messages
- [x] File uploads
- [x] Signed downloads
- [x] PWA install flow
- [x] Versioned service-worker cache
- [ ] Message reactions
- [ ] Drag-and-drop uploads
- [ ] Image gallery
- [ ] Message search
- [ ] Profile avatars

## License

Maintained for personal use and experimentation by **Raazim Tech**.

---

<div align="center">

**Nuvio** · Private by design.

</div>
