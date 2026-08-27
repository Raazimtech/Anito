<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { computeWalkingRoute, loadGoogleMaps } from './googleMaps'

const screen = ref('home')
const coords = ref({ lat: null, lng: null })
const locationStatus = ref('idle')
const permissionOpen = ref(false)
const precision = ref('exact')
const label = ref('')
const saved = ref(JSON.parse(localStorage.getItem('ciwaan_places') || '[]'))
const active = ref(null)
const guideDistance = ref(null)
const guideDuration = ref(null)
const mapError = ref('')
const mapReady = ref(false)
const findCode = ref('')
const findResult = ref(null)
const mapsConfigured = ref(Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY))

const navOpen = computed(() => ['home', 'find', 'explore', 'saved', 'address', 'created'].includes(screen.value))

let createMap
let createMarker
let guideMap
let guideMarker
let destinationMarker
let routePolylines = []
let watchId = null
let lastRouteAt = 0
let lastRoutePoint = null

function openCreate() { screen.value = 'create'; mapError.value = '' }
function goHome() { stopGuide(); screen.value = 'home'; mapError.value = '' }
function askLocation() { permissionOpen.value = true }
function closePermission() { permissionOpen.value = false }

function requestLocation() {
  permissionOpen.value = false
  if (!navigator.geolocation) { locationStatus.value = 'unsupported'; return }
  locationStatus.value = 'requesting'
  navigator.geolocation.getCurrentPosition(({ coords: c }) => {
    coords.value = { lat: c.latitude, lng: c.longitude }
    locationStatus.value = 'granted'
    screen.value = 'confirm'
  }, () => { locationStatus.value = 'denied' }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 })
}

function chooseGeneral() { precision.value = 'general'; askLocation() }
function formatCoords(item) { return item?.lat != null ? `${Number(item.lat).toFixed(6)}°, ${Number(item.lng).toFixed(6)}°` : 'Location unavailable' }
function makeCode() { return `CW-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 4).toUpperCase()}` }

function savePlace() {
  if (coords.value.lat === null) { locationStatus.value = 'denied'; return }
  const place = { code: makeCode(), label: label.value.trim() || 'Unnamed place', lat: coords.value.lat, lng: coords.value.lng, precision: precision.value, createdAt: Date.now() }
  saved.value = [place, ...saved.value].slice(0, 50)
  localStorage.setItem('ciwaan_places', JSON.stringify(saved.value))
  active.value = place
  screen.value = 'created'
}

function shareWhatsApp(place = active.value) {
  if (!place) return
  const text = `Ciwaan: ${place.label}\nCode: ${place.code}\nLocation: https://www.google.com/maps?q=${place.lat},${place.lng}`
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
}

async function copyCiwaan() {
  if (!active.value) return
  await navigator.clipboard?.writeText(active.value.code)
  locationStatus.value = 'copied'
}

function showSaved(place) { active.value = place; screen.value = 'address' }

async function setupMap(container, center, zoom = 17) {
  if (!container) return null
  mapError.value = ''
  try {
    const maps = await loadGoogleMaps()
    const { Map } = maps
    const map = new Map(container, { center, zoom, mapId: 'DEMO_MAP_ID', streetViewControl: false, fullscreenControl: false, mapTypeControl: false, clickableIcons: false })
    mapReady.value = true
    return map
  } catch (error) {
    mapReady.value = false
    mapsConfigured.value = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)
    mapError.value = error.message
    return null
  }
}

async function initCreateMap() {
  await nextTick()
  const container = document.getElementById('create-map')
  if (!container || coords.value.lat == null) return
  createMap = await setupMap(container, coords.value, 18)
  if (!createMap) return
  const maps = await loadGoogleMaps()
  const { AdvancedMarkerElement } = await maps.importLibrary('marker')
  createMarker = new AdvancedMarkerElement({ map: createMap, position: coords.value, title: 'Your Ciwaan location' })
  createMap.addListener('click', event => {
    if (!event.latLng) return
    coords.value = { lat: event.latLng.lat(), lng: event.latLng.lng() }
    if (createMarker) createMarker.position = coords.value
  })
}

async function initGuideMap() {
  await nextTick()
  const container = document.getElementById('guide-map')
  if (!container || !active.value) return
  guideMap = await setupMap(container, { lat: active.value.lat, lng: active.value.lng }, 17)
  if (!guideMap) return
  const maps = await loadGoogleMaps()
  const { AdvancedMarkerElement } = await maps.importLibrary('marker')
  destinationMarker = new AdvancedMarkerElement({ map: guideMap, position: { lat: active.value.lat, lng: active.value.lng }, title: active.value.label })
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => updateGuidePosition(position), () => {}, { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 })
    watchId = navigator.geolocation.watchPosition(updateGuidePosition, () => {}, { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 })
  }
}

async function updateGuidePosition(position) {
  if (!guideMap || !active.value) return
  const current = { lat: position.coords.latitude, lng: position.coords.longitude }
  coords.value = current
  try {
    const maps = await loadGoogleMaps()
    const { AdvancedMarkerElement } = await maps.importLibrary('marker')
    if (!guideMarker) guideMarker = new AdvancedMarkerElement({ map: guideMap, position: current, title: 'You' })
    else guideMarker.position = current
    guideMap.panTo(current)

    const movedEnough = !lastRoutePoint || distanceMeters(lastRoutePoint.lat, lastRoutePoint.lng, current.lat, current.lng) > 15
    if (Date.now() - lastRouteAt < 5000 && !movedEnough) return
    lastRouteAt = Date.now()
    lastRoutePoint = current
    const route = await computeWalkingRoute(current, { lat: active.value.lat, lng: active.value.lng })
    routePolylines.forEach(poly => poly.setMap(null))
    routePolylines = route ? route.createPolylines({ polylineOptions: { strokeColor: '#0052FF', strokeWeight: 6, strokeOpacity: 0.9 } }) : []
    routePolylines.forEach(poly => poly.setMap(guideMap))
    if (route) {
      guideDistance.value = route.distanceMeters != null ? route.distanceMeters / 1000 : null
      guideDuration.value = route.durationMillis != null ? Math.round(route.durationMillis / 60000) : null
    }
  } catch (error) {
    mapError.value = error.message
  }
}

function distanceMeters(a, b, c, d) {
  const R = 6371000, x = (c - a) * Math.PI / 180, y = (d - b) * Math.PI / 180
  const q = Math.sin(x / 2) ** 2 + Math.cos(a * Math.PI / 180) * Math.cos(c * Math.PI / 180) * Math.sin(y / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q))
}

function stopGuide() {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId)
  watchId = null
  guideMarker = null
  destinationMarker = null
  routePolylines.forEach(poly => poly.setMap(null))
  routePolylines = []
  lastRoutePoint = null
  lastRouteAt = 0
}

async function guideTo(place) {
  if (!place) return
  active.value = place
  mapError.value = ''
  screen.value = 'guide'
  await initGuideMap()
}

function searchCiwaan() {
  const query = findCode.value.trim().toUpperCase()
  findResult.value = saved.value.find(place => place.code.toUpperCase() === query) || null
}

function useFindResult() { if (findResult.value) showSaved(findResult.value) }

function handleScreenMap() {
  if (screen.value === 'guide') initGuideMap()
  if (screen.value === 'confirm') initCreateMap()
}

onBeforeUnmount(stopGuide)
</script>

<template>
  <div class="app-shell">
    <header v-if="screen !== 'guide'" class="topbar">
      <button class="brand" @click="goHome"><span class="brand-mark"><span></span></span><strong>Ciwaan</strong></button>
      <button class="top-link" @click="screen = 'explore'">Explore</button>
    </header>

    <main class="content">
      <section v-if="screen === 'home'" class="hero">
        <div><div class="eyebrow"><span class="live-dot"></span> DIGITAL ADDRESSING</div><h1>Give every place<br><em>an address.</em></h1><p class="lead">Create a precise Ciwaan for a home, business, meeting point, or anywhere else — then share it instantly.</p><button class="primary-cta" @click="openCreate"><span>＋</span>Create Ciwaan</button></div>
        <div class="hero-map"><div class="map-grid"></div><div class="map-pin">⌖</div><div class="map-label">Google Maps powered</div></div>
      </section>

      <section v-else-if="screen === 'create'" class="flow-card">
        <button class="back" @click="goHome">← Back</button><div class="section-kicker">NEW CIWAAN</div><h2>Where should we<br>place it?</h2><p>Choose how precisely you want your location represented.</p>
        <div v-if="locationStatus === 'denied'" class="notice">Location permission was denied. Enable it in device settings and try again.</div>
        <div v-if="locationStatus === 'unsupported'" class="notice">This device doesn't provide location services.</div>
        <button class="location-option exact" :disabled="locationStatus === 'requesting'" @click="precision = 'exact'; askLocation()"><span class="option-icon">⌖</span><span><b>{{ locationStatus === 'requesting' ? 'Finding your location…' : 'Exact location' }}</b><small>Pinpoint this place using GPS</small></span><span class="arrow">→</span></button>
        <button class="location-option general" @click="chooseGeneral"><span class="option-icon">◌</span><span><b>General location</b><small>Use an approximate area</small></span><span class="arrow">→</span></button>
        <p class="privacy-note">No account required. Your location is requested only after you choose a location option.</p>
      </section>

      <section v-else-if="screen === 'confirm'" class="flow-card wide">
        <button class="back" @click="screen = 'create'">← Back</button><div class="section-kicker">CONFIRM LOCATION</div><h2>Pin the exact spot.</h2><p>Drag your location by tapping the map. Google Maps provides the map and road data.</p>
        <div v-if="mapError" class="notice">{{ mapError }}</div><div id="create-map" class="real-map"></div>
        <div class="coordinate-card"><span>⌖</span><div><b>{{ formatCoords(coords) }}</b><small>{{ precision === 'exact' ? 'Exact location' : 'General location' }}</small></div></div><input v-model="label" class="name-input" maxlength="60" placeholder="Name this place (e.g. My Home)"><button class="primary-cta full" @click="savePlace">Create my Ciwaan <span>→</span></button>
      </section>

      <section v-else-if="screen === 'created'" class="flow-card"><div class="section-kicker">ADDRESS READY</div><h2>Your Ciwaan<br>is ready.</h2><p>Share this location directly with someone who needs to find you.</p><div class="address-card"><small>CIWAAN</small><strong>{{ active?.code }}</strong><b>{{ active?.label }}</b><span>{{ formatCoords(active) }}</span></div><button class="primary-cta full" @click="shareWhatsApp()">Share on WhatsApp</button><div class="action-row"><button @click="copyCiwaan">{{ locationStatus === 'copied' ? 'Copied' : 'Copy code' }}</button><button @click="guideTo(active)">Guide Me</button></div><button class="back" @click="goHome">Done</button></section>

      <section v-else-if="screen === 'find'" class="flow-card wide"><div class="section-kicker">FIND</div><h2>Find a Ciwaan.</h2><p>Enter a Ciwaan code to open a saved location.</p><div class="search-box input-search"><input v-model="findCode" @keyup.enter="searchCiwaan" placeholder="e.g. CW-A7K2-QP"><button @click="searchCiwaan">Find</button></div><div v-if="findResult" class="address-card result-card"><small>FOUND</small><strong>{{ findResult.code }}</strong><b>{{ findResult.label }}</b><span>{{ formatCoords(findResult) }}</span><button class="primary-cta full" @click="useFindResult">Open location</button></div><div v-else-if="findCode" class="empty">No saved Ciwaan with that code.</div></section>

      <section v-else-if="screen === 'explore'" class="flow-card wide"><button class="back" @click="goHome">← Back</button><div class="section-kicker">EXPLORE</div><h2>Discover places.</h2><p>Open a Ciwaan you've received or search your saved places.</p><div class="search-box" @click="screen = 'find'">⌕ <span>Search a Ciwaan</span></div><button class="primary-cta full" @click="screen = 'saved'">Browse saved places <span>→</span></button></section>

      <section v-else-if="screen === 'saved'" class="flow-card wide"><button class="back" @click="screen = 'find'">← Back</button><div class="section-kicker">SAVED</div><h2>Your places.</h2><div v-if="saved.length" class="saved-list"><button v-for="place in saved" :key="place.code" class="saved-row" @click="showSaved(place)"><span class="option-icon">⌖</span><span><b>{{ place.label }}</b><small>{{ place.code }} · {{ place.precision }}</small></span><span>→</span></button></div><div v-else class="empty">No saved places yet.</div></section>

      <section v-else-if="screen === 'address'" class="flow-card"><button class="back" @click="screen = 'saved'">← Back</button><div class="section-kicker">CIWAAN</div><h2>{{ active?.label }}</h2><div class="address-card"><small>{{ active?.code }}</small><strong>{{ formatCoords(active) }}</strong><span>{{ active?.precision === 'exact' ? 'Exact location' : 'General location' }}</span></div><button class="primary-cta full" @click="shareWhatsApp(active)">Share on WhatsApp</button><button class="primary-cta full secondary-cta" @click="guideTo(active)">Guide Me</button></section>

      <section v-else-if="screen === 'guide'" class="guide-screen"><div id="guide-map" class="guide-map"></div><div class="guide-overlay"><button class="guide-exit" @click="goHome">← Exit</button><div v-if="mapError" class="notice">{{ mapError }}</div></div><div class="guide-panel"><div class="section-kicker">LIVE NAVIGATION</div><h2>{{ active?.label }}</h2><p v-if="guideDistance !== null"><strong>{{ guideDistance < 1 ? (guideDistance * 1000).toFixed(0) + ' m' : guideDistance.toFixed(2) + ' km' }}</strong> remaining<span v-if="guideDuration !== null"> · about {{ guideDuration }} min walking</span></p><p v-else>Waiting for your live location…</p><button class="primary-cta full" @click="shareWhatsApp(active)">Share destination</button></div></section>
    </main>

    <nav v-if="navOpen" class="bottom-dock" aria-label="Main navigation"><button :class="{ active: screen === 'home' }" @click="goHome"><span>⌂</span><small>Home</small></button><button :class="{ active: screen === 'find' }" @click="screen = 'find'"><span>⌕</span><small>Find</small></button><button class="create-fab" @click="openCreate" aria-label="Create Ciwaan">＋</button><button :class="{ active: screen === 'explore' || screen === 'saved' }" @click="screen = 'explore'"><span>⌖</span><small>Explore</small></button></nav>
    <footer v-if="navOpen" class="credit">Made by Raazim Tech</footer>

    <div v-if="permissionOpen" class="modal-backdrop" @click.self="closePermission"><div class="permission-modal"><div class="permission-icon">⌖</div><h3>Allow location for Ciwaan?</h3><p>Ciwaan needs your location to place your address on the map. Guide Me also uses your live position while navigating.</p><p class="modal-note">You can deny this permission and still use features that don't need your current location.</p><div class="modal-actions"><button @click="closePermission">Not now</button><button class="primary-cta" @click="requestLocation">Continue</button></div></div></div>
  </div>
</template>

<script>
export default { async mounted() { await nextTick(); if (this.screen === 'guide') this.handleScreenMap() } }
</script>
