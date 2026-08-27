<script setup>
import { computed, nextTick, ref } from 'vue'

const screen = ref('home')
const coords = ref({ lat: 0, lng: 0 })
const locationStatus = ref('idle')
const navOpen = computed(() => ['home', 'explore'].includes(screen.value))

function requestLocation() {
  if (!navigator.geolocation) {
    locationStatus.value = 'unsupported'
    return
  }
  locationStatus.value = 'requesting'
  navigator.geolocation.getCurrentPosition(
    ({ coords: c }) => {
      coords.value = { lat: c.latitude, lng: c.longitude }
      locationStatus.value = 'granted'
      screen.value = 'confirm'
      nextTick(() => {})
    },
    () => { locationStatus.value = 'denied' },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  )
}

function openCreate() {
  screen.value = 'create'
}
function goHome() { screen.value = 'home' }
</script>

<template>
  <div class="app-shell">
    <header v-if="screen !== 'confirm'" class="topbar">
      <button class="brand" aria-label="Ciwaan home" @click="goHome">
        <span class="brand-mark"><span></span></span><strong>Ciwaan</strong>
      </button>
      <button class="top-link" @click="screen = 'explore'">Explore</button>
    </header>

    <main class="content">
      <section v-if="screen === 'home'" class="hero">
        <div class="eyebrow"><span class="live-dot"></span> Location made simple</div>
        <h1>Give every place<br><em>an address.</em></h1>
        <p class="lead">Create a precise Ciwaan for a home, business, meeting point, or anywhere else — then share it instantly.</p>
        <button class="primary-cta" @click="openCreate"><span>＋</span>Create Ciwaan</button>
        <div class="hero-map" aria-hidden="true"><div class="map-grid"></div><div class="map-pin">⌖</div><div class="map-label">Your place</div></div>
      </section>

      <section v-else-if="screen === 'create'" class="flow-card">
        <button class="back" @click="goHome">← Back</button>
        <div class="section-kicker">NEW CIWAAN</div>
        <h2>Where should we<br>place it?</h2>
        <p>We'll use your location to position the address on the map.</p>
        <div v-if="locationStatus === 'denied'" class="notice">Location permission was denied. You can enable it in your device settings and try again.</div>
        <div v-if="locationStatus === 'unsupported'" class="notice">This device doesn't provide location services.</div>
        <button class="location-option exact" :disabled="locationStatus === 'requesting'" @click="requestLocation">
          <span class="option-icon">⌖</span><span><b>{{ locationStatus === 'requesting' ? 'Finding you…' : 'Exact location' }}</b><small>Pinpoint this place using GPS</small></span><span class="arrow">→</span>
        </button>
        <button class="location-option general" @click="screen = 'confirm'">
          <span class="option-icon">◌</span><span><b>General location</b><small>Use an approximate area</small></span><span class="arrow">→</span>
        </button>
        <p class="privacy-note">Your location is only requested when you choose this feature. See our Privacy Policy for details.</p>
      </section>

      <section v-else-if="screen === 'confirm'" class="confirm-screen">
        <button class="back" @click="screen = 'create'">← Back</button>
        <div class="section-kicker">CONFIRM LOCATION</div>
        <h2>Your Ciwaan is ready.</h2>
        <div class="coordinate-card"><span>⌖</span><div><b>{{ coords.lat.toFixed(6) }}°, {{ coords.lng.toFixed(6) }}°</b><small>Selected coordinates</small></div></div>
        <button class="primary-cta" @click="goHome">Save Ciwaan</button>
      </section>

      <section v-else class="flow-card">
        <button class="back" @click="goHome">← Back</button>
        <div class="section-kicker">EXPLORE</div><h2>Find places<br>by Ciwaan.</h2><p>Search and open shared locations without needing an account.</p>
        <div class="search-box">⌕ <span>Search a Ciwaan</span></div>
      </section>
    </main>

    <nav v-if="navOpen" class="bottom-dock" aria-label="Main navigation">
      <button :class="{active: screen === 'home'}" @click="goHome"><span>⌂</span><small>Home</small></button>
      <button class="create-fab" aria-label="Create Ciwaan" @click="openCreate">＋</button>
      <button :class="{active: screen === 'explore'}" @click="screen = 'explore'"><span>⌖</span><small>Explore</small></button>
    </nav>
    <footer v-if="navOpen" class="credit">Made by Raazim Tech</footer>
  </div>
</template>
