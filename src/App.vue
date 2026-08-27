<script setup>
import { computed, ref, watch } from 'vue'

const screen = ref('home')
const coords = ref({ lat: null, lng: null })
const locationStatus = ref('idle')
const permissionOpen = ref(false)
const precision = ref('exact')
const label = ref('')
const saved = ref(JSON.parse(localStorage.getItem('ciwaan_places') || '[]'))
const active = ref(null)
const guideDistance = ref(null)
let watchId = null

const navOpen = computed(() => ['home', 'find', 'explore', 'saved'].includes(screen.value))

function openCreate(){ screen.value='create' }
function goHome(){ stopGuide(); screen.value='home' }
function askLocation(){ permissionOpen.value=true }
function closePermission(){ permissionOpen.value=false }
function requestLocation(){
  permissionOpen.value=false
  if(!navigator.geolocation){ locationStatus.value='unsupported'; return }
  locationStatus.value='requesting'
  navigator.geolocation.getCurrentPosition(({coords:c})=>{
    coords.value={lat:c.latitude,lng:c.longitude}
    locationStatus.value='granted'
    screen.value='confirm'
  },()=>{ locationStatus.value='denied' },{enableHighAccuracy:true,timeout:15000,maximumAge:0})
}
function chooseGeneral(){ precision.value='general'; askLocation() }
function formatCoords(item){ return item?.lat != null ? `${item.lat.toFixed(6)}°, ${item.lng.toFixed(6)}°` : 'Location unavailable' }
function makeCode(){ return `CW-${Math.random().toString(36).slice(2,6).toUpperCase()}-${Math.random().toString(36).slice(2,4).toUpperCase()}` }
function savePlace(){
  if(coords.value.lat===null){ locationStatus.value='denied'; return }
  const place={code:makeCode(),label:label.value.trim()||'Unnamed place',lat:coords.value.lat,lng:coords.value.lng,precision:precision.value,createdAt:Date.now()}
  saved.value=[place,...saved.value].slice(0,50); localStorage.setItem('ciwaan_places',JSON.stringify(saved.value)); active.value=place; screen.value='created'
}
function shareWhatsApp(place=active.value){ if(!place)return; const text=`Ciwaan: ${place.label}\nCode: ${place.code}\nLocation: https://www.google.com/maps?q=${place.lat},${place.lng}`; window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,'_blank','noopener,noreferrer') }
async function copyCiwaan(){ if(!active.value)return; await navigator.clipboard?.writeText(active.value.code); locationStatus.value='copied' }
function showSaved(place){ active.value=place; screen.value='address' }
function guideTo(place){
  active.value=place; screen.value='guide'; guideDistance.value=null
  if(!navigator.geolocation)return
  watchId=navigator.geolocation.watchPosition(({coords:c})=>{ guideDistance.value=distanceKm(c.latitude,c.longitude,place.lat,place.lng) },()=>{}, {enableHighAccuracy:true,maximumAge:2000})
}
function stopGuide(){ if(watchId!==null){navigator.geolocation.clearWatch(watchId);watchId=null} }
function distanceKm(a,b,c,d){const r=6371,x=(c-a)*Math.PI/180,y=(d-b)*Math.PI/180,q=Math.sin(x/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(y/2)**2;return r*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q))}
watch(screen,v=>{if(v!=='guide')stopGuide()})
</script>

<template>
  <div class="app-shell">
    <header v-if="screen!=='guide'" class="topbar">
      <button class="brand" aria-label="Ciwaan home" @click="goHome"><span class="brand-mark"><span></span></span><strong>Ciwaan</strong></button>
      <button class="top-link" @click="screen='explore'">Explore</button>
    </header>

    <main class="content">
      <section v-if="screen==='home'" class="hero">
        <div><div class="eyebrow"><span class="live-dot"></span> DIGITAL ADDRESSING</div><h1>Give every place<br><em>an address.</em></h1><p class="lead">Create a precise Ciwaan for a home, business, meeting point, or anywhere else — then share it instantly.</p><button class="primary-cta" @click="openCreate"><span>＋</span>Create Ciwaan</button></div>
        <div class="hero-map"><div class="map-grid"></div><div class="map-pin">⌖</div><div class="map-label">Your place</div></div>
      </section>

      <section v-else-if="screen==='create'" class="flow-card">
        <button class="back" @click="goHome">← Back</button><div class="section-kicker">NEW CIWAAN</div><h2>Where should we<br>place it?</h2><p>Choose how precisely you want your location represented.</p>
        <div v-if="locationStatus==='denied'" class="notice">Location permission was denied. Enable it in device settings and try again.</div>
        <div v-if="locationStatus==='unsupported'" class="notice">This device doesn't provide location services.</div>
        <button class="location-option exact" :disabled="locationStatus==='requesting'" @click="precision='exact';askLocation"><span class="option-icon">⌖</span><span><b>{{locationStatus==='requesting'?'Finding your location…':'Exact location'}}</b><small>Pinpoint this place using GPS</small></span><span class="arrow">→</span></button>
        <button class="location-option general" @click="chooseGeneral"><span class="option-icon">◌</span><span><b>General location</b><small>Use an approximate area</small></span><span class="arrow">→</span></button>
        <p class="privacy-note">No account required. Your location is requested only after you choose a location option.</p>
      </section>

      <section v-else-if="screen==='confirm'" class="flow-card">
        <button class="back" @click="screen='create'">← Back</button><div class="section-kicker">CONFIRM LOCATION</div><h2>Is this the right place?</h2><div class="coordinate-card"><span>⌖</span><div><b>{{formatCoords(coords)}}</b><small>{{precision==='exact'?'Exact location':'General location'}}</small></div></div><input v-model="label" class="name-input" maxlength="60" placeholder="Name this place (e.g. My Home)"><button class="primary-cta full" @click="savePlace">Create my Ciwaan <span>→</span></button>
      </section>

      <section v-else-if="screen==='created'" class="flow-card">
        <div class="section-kicker">ADDRESS READY</div><h2>Your Ciwaan<br>is ready.</h2><p>Share this location directly with someone who needs to find you.</p><div class="address-card"><small>CIWAAN</small><strong>{{active?.code}}</strong><b>{{active?.label}}</b><span>{{formatCoords(active)}}</span></div><button class="primary-cta full" @click="shareWhatsApp()">Share on WhatsApp</button><div class="action-row"><button @click="copyCiwaan">{{locationStatus==='copied'?'Copied':'Copy code'}}</button><button @click="guideTo(active)">Guide Me</button></div><button class="back" @click="goHome">Done</button>
      </section>

      <section v-else-if="screen==='find'" class="flow-card wide"><div class="section-kicker">FIND</div><h2>Find a Ciwaan.</h2><p>Enter a Ciwaan code to quickly open a saved location.</p><div class="search-box">⌕ <span>Search by Ciwaan code</span></div><button class="primary-cta full" @click="screen='saved'">Browse my saved places <span>→</span></button></section>

      <section v-else-if="screen==='explore'" class="flow-card wide"><button class="back" @click="goHome">← Back</button><div class="section-kicker">EXPLORE</div><h2>Discover places.</h2><p>Explore shared locations and open any Ciwaan you receive.</p><div class="search-box">⌕ <span>Search a place or Ciwaan</span></div></section>

      <section v-else-if="screen==='saved'" class="flow-card wide"><button class="back" @click="screen='find'">← Back</button><div class="section-kicker">SAVED</div><h2>Your places.</h2><div v-if="saved.length" class="saved-list"><button v-for="place in saved" :key="place.code" class="saved-row" @click="showSaved(place)"><span class="option-icon">⌖</span><span><b>{{place.label}}</b><small>{{place.code}} · {{place.precision}}</small></span><span>→</span></button></div><div v-else class="empty">No saved places yet.</div></section>

      <section v-else-if="screen==='address'" class="flow-card"><button class="back" @click="screen='saved'">← Back</button><div class="section-kicker">CIWAAN</div><h2>{{active?.label}}</h2><div class="address-card"><small>{{active?.code}}</small><strong>{{formatCoords(active)}}</strong><span>{{active?.precision==='exact'?'Exact location':'General location'}}</span></div><button class="primary-cta full" @click="shareWhatsApp(active)">Share on WhatsApp</button><button class="primary-cta full secondary-cta" @click="guideTo(active)">Guide Me</button></section>

      <section v-else-if="screen==='guide'" class="guide-screen"><div class="guide-map"><div class="guide-grid"></div><div class="guide-target">⌖</div><div class="guide-route"></div></div><div class="guide-panel"><button class="back" @click="goHome">← Exit Guide Me</button><div class="section-kicker">LIVE NAVIGATION</div><h2>{{active?.label}}</h2><p v-if="guideDistance!==null"><strong>{{guideDistance<1?(guideDistance*1000).toFixed(0)+' m':guideDistance.toFixed(2)+' km'}}</strong> remaining</p><p v-else>Waiting for your live location…</p><button class="primary-cta full" @click="shareWhatsApp(active)">Share destination</button></div></section>
    </main>

    <nav v-if="navOpen" class="bottom-dock" aria-label="Main navigation">
      <button :class="{active:screen==='home'}" @click="goHome"><span>⌂</span><small>Home</small></button>
      <button :class="{active:screen==='find'}" class="dock-find" @click="screen='find'"><span>⌕</span><small>Find</small></button>
      <button class="create-fab" @click="openCreate" aria-label="Create Ciwaan">＋</button>
      <button :class="{active:screen==='explore'||screen==='saved'}" @click="screen='explore'"><span>⌖</span><small>Explore</small></button>
    </nav>
    <footer v-if="navOpen" class="credit">Made by Raazim Tech</footer>

    <div v-if="permissionOpen" class="modal-backdrop" @click.self="closePermission"><div class="permission-modal"><div class="permission-icon">⌖</div><h3>Allow location for Ciwaan?</h3><p>Ciwaan needs your location to place your address on the map. During Guide Me, your live position is used for navigation.</p><p class="modal-note">You can deny this permission and still use features that don't need your current location.</p><div class="modal-actions"><button @click="closePermission">Not now</button><button class="primary-cta" @click="requestLocation">Continue</button></div></div></div>
  </div>
</template>
