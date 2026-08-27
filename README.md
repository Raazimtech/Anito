# Ciwaan

Ciwaan gives physical places a simple shareable digital address and live walking navigation.

### Stack
Vue 3 + Vite + Capacitor + MapLibre GL JS + OpenStreetMap map tiles + Valhalla pedestrian routing.

### Map and routing

Ciwaan does not require a Google Maps API key. MapLibre renders the map, OpenStreetMap supplies the map tiles, and the public Valhalla OpenStreetMap routing service calculates pedestrian routes during development/testing.

The public routing service has fair-use limits. Before a high-traffic production launch, use a dedicated routing/tile provider or self-host the services rather than relying on public infrastructure.

### Web

```bash
npm install
npm run dev
```

Vite exposes the dev server on the local network, so the terminal shows a `Network:` URL for testing on a phone connected to the same Wi-Fi.

### Android

```bash
npm install
npm run cap:add
npm run cap:sync
npm run cap:open
```

Capacitor generates the Android Studio project locally; Android Studio then builds the APK/AAB. Location is requested only when the user chooses a location feature. No account is required.

### Core behavior

- Create: explains location use before requesting the device permission.
- Exact location: uses high-accuracy device GPS and opens a real MapLibre map with a draggable pin.
- General location: uses the location flow and records the chosen precision as general.
- Find: looks up locally saved Ciwaan codes.
- Explore: opens Find and saved-place flows.
- Share: creates a WhatsApp message containing the Ciwaan code and an OpenStreetMap location link.
- Guide Me: watches live device location and recalculates a pedestrian route through Valhalla while navigation is active.
- Responsive UI: adapts between phone, tablet and desktop layouts.

### Privacy

See `PRIVACY.md` and the in-app Privacy Policy. Ciwaan currently stores created addresses locally in the browser/device; it does not require an account or a cloud database for the current MVP. Exact Ciwaans are intentionally shareable to anyone holding the code/link.

Made by Raazim Tech
