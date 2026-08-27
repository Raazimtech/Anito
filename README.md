# Ciwaan

Ciwaan gives physical places a simple shareable digital address and live walking navigation.

### Stack
Vue 3 + Vite + Capacitor + Google Maps JavaScript API + Google Routes Library.

### Google Maps setup

Google Maps Platform requires an API key and billing for production use. Enable:

- Maps JavaScript API
- Routes API

Create a browser-restricted key and put it in a local `.env` file:

```bash
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

See `.env.example` for the variable name. Do not commit your real `.env` file.

### Web

```bash
npm install
npm run dev
```

Vite is configured to expose the dev server on the local network, so the terminal also shows a `Network:` URL for testing on a phone connected to the same Wi-Fi.

### Android

```bash
npm install
npm run cap:add
npm run cap:sync
npm run cap:open
```

Capacitor generates the Android Studio project locally; Android Studio then builds the APK/AAB. Location is requested only when the user chooses a location feature. No account is required.

### Core behavior

- Create: asks for location permission in context, then opens a real Google map.
- Exact location: uses high-accuracy device GPS and allows map pin adjustment.
- General location: uses the device location flow but labels the saved Ciwaan as general.
- Find: looks up locally saved Ciwaan codes.
- Explore: opens the Find/saved-place flow.
- Share: creates a WhatsApp message containing the Ciwaan code and Google Maps location link.
- Guide Me: watches live device location and recalculates a walking route with Google Routes.

### Privacy

See `PRIVACY.md` and the in-app Privacy Policy. Exact Ciwaans are intentionally shareable to anyone holding the code/link.

Made by Raazim Tech
