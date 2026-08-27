# Ciwaan

Ciwaan gives physical places a simple shareable digital address and adds live walking navigation.

### Stack
Vue 3 + Vite + Capacitor + Leaflet + OpenStreetMap + Supabase Edge Functions/Postgres.

### Web
```bash
npm install
npm run dev
```

### Android
```bash
npm install
npm run cap:add
npm run cap:sync
npm run cap:open
```

Capacitor generates the Android Studio project locally; Android Studio then builds the APK/AAB. The app requests location only when location features need it. No account is required.

### Privacy
See `PRIVACY.md` and the in-app Privacy Policy. Exact Ciwaans are intentionally public to anyone holding the code/link.

### Production note
The MVP uses public OpenStreetMap tiles and routing infrastructure. Before large-scale commercial traffic, use an appropriate production map/routing provider or infrastructure and follow its usage policies.

Made by Rising Tech
