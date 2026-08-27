<template>
  <div class="app" :class="{ 'is-map-mode': mapMode }">
    <header v-if="!mapMode" class="topbar">
      <button v-if="canBack" class="plain-icon" aria-label="Go back" @click="goBack">←</button>
      <button class="brand" aria-label="Ciwaan home" @click="goHome">
        <span class="brand-mark"><span></span></span>
        <span>Ciwaan</span>
      </button>
      <button class="plain-icon" aria-label="Settings" @click="openSettings">⚙</button>
    </header>

    <main class="viewport">
      <section v-if="screen==='home'" class="home page-pad">
        <div class="hero-grid">
          <div class="hero-copy-wrap">
            <div class="eyebrow"><span class="eyebrow-dot"></span> DIGITAL ADDRESSING</div>
            <h1>Give every place<br><em>a simple address.</em></h1>
            <p class="lead">Create a precise location, share it in one tap, and guide anyone straight to it.</p>
            <div class="home-actions">
              <button class="btn primary btn-xl" @click="startCreate"><span class="btn-icon">+</span> Create Ciwaan <span>→</span></button>
              <button class="btn secondary btn-xl" @click="openFind"><span class="btn-icon search-icon">⌕</span> Find a Ciwaan</button>
            </div>
            <div class="trust-line"><span class="shield-dot">✓</span><span>No account required. Your location is requested only when you choose to use a location feature.</span></div>
          </div>
          <div class="hero-visual" aria-hidden="true">
            <div class="hero-map-lines"></div>
            <div class="hero-address-card">
              <div class="mini-mark"><span></span></div>
              <div><small>CIWAAN</small><strong>CW-8K4P-29</strong><span>Hargeisa · Exact location</span></div>
            </div>
            <div class="hero-route"><i></i><i></i><i></i></div>
            <div class="hero-pin"><span></span></div>
          </div>
        </div>
        <div class="feature-strip">
          <div><span>01</span><b>Create</b><small>Make an address in seconds.</small></div>
          <div><span>02</span><b>Share</b><small>Send it directly through WhatsApp.</small></div>
          <div><span>03</span><b>Guide</b><small>Walk there with live navigation.</small></div>
        </div>
      </section>

      <section v-else-if="screen==='find'" class="page-pad narrow-page">
        <div class="section-heading"><div class="eyebrow">FIND A PLACE</div><h2>Where are you going?</h2><p>Enter a Ciwaan code or scan a QR code to open its location.</p></div>
        <div class="find-box">
          <span class="find-symbol">⌕</span>
          <input v-model="searchCode" inputmode="text" autocomplete="off" placeholder="CW-8K4P-29" @keyup.enter="lookup">
          <button @click="lookup">Find</button>
        </div>
        <button class="scan-btn" @click="showToast('QR scanning will use your camera in the native app.')"><span>▣</span><div><b>Scan QR code</b><small>Point your camera at a Ciwaan</small></div><span>›</span></button>
        <div v-if="error" class="alert error">{{ error }}</div>
        <div v-if="recent.length" class="list-section"><div class="list-title">RECENT</div><button v-for="item in recent" :key="item.code" class="place-row" @click="showAddress(item)"><span class="row-icon">⌖</span><span><b>{{item.label}}</b><small>{{item.code}}</small></span><span>›</span></button></div>
      </section>

      <section v-else-if="screen==='saved'" class="page-pad narrow-page">
        <div class="section-heading"><div class="eyebrow">YOUR PLACES</div><h2>Saved</h2><p>Addresses you've created or saved on this device.</p></div>
        <div v-if="saved.length" class="place-list"><button v-for="item in saved" :key="item.code" class="place-row" @click="showAddress(item)"><span class="row-icon">⌖</span><span><b>{{item.label}}</b><small>{{item.code}} · {{item.precision==='exact'?'Exact':'General'}}</small></span><span>›</span></button></div>
        <div v-else class="empty-state"><div class="empty-mark"><span></span></div><h3>No saved places yet</h3><p>Create your first Ciwaan and it'll appear here automatically.</p><button class="btn primary" @click="startCreate">Create Ciwaan</button></div>
      </section>

      <section v-else-if="screen==='explore'" class="page-pad explore-page">
        <div class="section-heading"><div class="eyebrow">EXPLORE</div><h2>Places around you</h2><p>Explore the map and discover public Ciwaans nearby.</p></div>
        <div id="explore-map" class="large-map"></div>
        <div class="map-caption"><span class="live-dot"></span><span>Map centered on your current area when location is available.</span></div>
      </section>

      <section v-else-if="screen==='settings'" class="page-pad narrow-page">
        <div class="section-heading"><div class="eyebrow">APP</div><h2>Settings</h2><p>Control location, privacy and your local Ciwaan data.</p></div>
        <div class="settings-list">
          <div class="setting-row"><div class="setting-icon">⌖</div><div><b>Location access</b><small>Needed for creating an address and Guide Me.</small></div><button @click="requestLocation">Allow</button></div>
          <button class="setting-row clickable" @click="screen='privacy'"><div class="setting-icon">✓</div><div><b>Privacy Policy</b><small>See exactly how location and address data are handled.</small></div><span>›</span></button>
          <button class="setting-row clickable" @click="screen='saved'"><div class="setting-icon">♡</div><div><b>My Ciwaans</b><small>View addresses saved on this device.</small></div><span>›</span></button>
        </div>
        <div class="about-card"><span>CIWAAN</span><b>Every place has an address.</b><small>Version 1.0</small></div>
      </section>

      <section v-else-if="screen==='privacy'" class="page-pad narrow-page privacy-page">
        <div class="section-heading"><div class="eyebrow">PRIVACY</div><h2>Privacy Policy</h2><p>Effective August 27, 2026</p></div>
        <article class="policy-card">
          <h3>1. About Ciwaan</h3><p>Ciwaan is a digital addressing service that creates shareable identifiers for physical locations and provides map-based navigation. Ciwaan can be used without creating an account.</p>
          <h3>2. Location permission</h3><p>When you tap <strong>Create Ciwaan</strong> or use a feature that needs your position, the app explains why location is needed and then asks your device for permission. You can deny permission. If you deny it, you can still use features that do not require your current position, such as looking up a known Ciwaan.</p>
          <h3>3. Location data we process</h3><p>For an address you create, Ciwaan processes the latitude and longitude you select on the map and the precision you choose. During <strong>Guide Me</strong>, the app uses your live device position to display your movement, calculate progress and provide navigation. Live navigation location is used for the active navigation session and is not intended to become a permanent movement history.</p>
          <h3>4. What we store</h3><p>A created address may include its Ciwaan code, place label, selected coordinates, precision setting and creation timestamp. Ciwaan does not require your name, email address, phone number or password. The app may store your recent/saved addresses locally on your device.</p>
          <h3>5. Public Ciwaan addresses</h3><p>A Ciwaan is designed to be shareable. Anyone who receives a valid public Ciwaan code or link can retrieve the location associated with that address. An exact residential Ciwaan can therefore reveal a precise location. Choose <strong>General location</strong> when you do not want to publish the precise point.</p>
          <h3>6. General location</h3><p>General location reduces the precision of the location you publish. It does not guarantee anonymity and should not be treated as a security boundary. Do not publish any location that you are not comfortable sharing.</p>
          <h3>7. Navigation and third parties</h3><p>Ciwaan uses third-party map and routing infrastructure to display maps and calculate routes. When routing is requested, geographic route information may be sent to the routing provider. Those providers process requests under their own terms and privacy policies. Ciwaan does not control their independent processing.</p>
          <h3>8. Security</h3><p>Ciwaan uses server-side controls and database access policies to protect stored address records. The service does not expose its privileged database credentials to the client application. Because public addresses are intentionally shareable, no public address should be treated as secret.</p>
          <h3>9. Retention and deletion</h3><p>Created addresses can remain available so that their shareable links continue to work. Operational security information may be retained for a limited period for abuse prevention. If address management/deletion is available for an address, deletion removes the address from the active service; backups may persist for a limited operational period.</p>
          <h3>10. Permissions and choices</h3><p>You can deny or revoke device location permission through your device settings. You can stop Guide Me at any time. You can choose General rather than Exact location when creating an address. You can also choose not to create an address at all.</p>
          <h3>11. Children</h3><p>Ciwaan is not directed to children under 13 and does not knowingly request personal information from children under 13.</p>
          <h3>12. Changes to this policy</h3><p>This policy may change when the product, infrastructure or applicable legal requirements change. The effective date above will be updated when material changes are made.</p>
          <h3>13. Contact</h3><p>Privacy requests and questions should be directed through the current contact information published on the official Ciwaan service or its app-store listing. This policy is a product privacy notice and is not a substitute for jurisdiction-specific legal advice.</p>
        </article>
      </section>

      <section v-else-if="screen==='choose'" class="full-map-screen">
        <div id="create-map" class="full-map"></div>
        <div class="map-topbar"><button class="map-back" @click="goBack">←</button><div class="map-title"><b>Choose location</b><small>Place the center point where you want your Ciwaan</small></div><button class="locate-btn" @click="useCurrentLocation">⌖</button></div>
        <div class="center-target"><div class="target-ring"></div><div class="target-dot"></div></div>
        <div class="bottom-sheet create-sheet">
          <div class="grabber"></div><div class="step-label">STEP 1 OF 3</div><h2>Choose your location</h2><p>Move the map beneath the center point, or use your current location.</p>
          <div class="precision-options">
            <button :class="['precision-card', {selected:precision==='exact'}]" @click="precision='exact'"><span class="option-radio"></span><div><b>Exact location</b><small>Pinpoint the precise place</small></div><strong>Recommended</strong></button>
            <button :class="['precision-card compact-option', {selected:precision==='general'}]" @click="precision='general'"><span class="option-radio"></span><div><b>General location</b><small>Share the nearby area only</small></div></button>
          </div>
          <button class="btn primary btn-block" @click="confirmLocation">Continue <span>→</span></button>
        </div>
      </section>

      <section v-else-if="screen==='confirm'" class="full-map-screen">
        <div id="confirm-map" class="full-map"></div>
        <div class="map-topbar"><button class="map-back" @click="screen='choose';nextTick(initCreateMap)">←</button><div class="map-title"><b>Confirm location</b><small>Check the pin before continuing</small></div></div>
        <div class="bottom-sheet confirm-sheet"><div class="grabber"></div><div class="step-label">STEP 2 OF 3</div><h2>Is this the right place?</h2><div class="coordinate-card"><span>⌖</span><div><b>{{coords.lat.toFixed(6)}°, {{coords.lng.toFixed(6)}}°</b><small>{{precision==='exact'?'Exact location':'General location'}}</small></div></div><button class="btn primary btn-block" @click="screen='name'">Confirm location <span>→</span></button><button class="text-link" @click="screen='choose';nextTick(initCreateMap)">Adjust location</button></div>
      </section>

      <section v-else-if="screen==='name'" class="page-pad form-page">
        <div class="step-progress"><span class="done"></span><span class="done"></span><span class="active"></span></div><div class="eyebrow">FINAL STEP</div><h2>Name this place.</h2><p>Give it a name you'll recognize when you share it later.</p>
        <label class="input-label">PLACE NAME<input v-model="label" maxlength="60" autofocus placeholder="My Home" @keyup.enter="createCiwaan"><span>{{label.length}}/60</span></label>
        <div class="quick-labels"><button @click="label='My Home'">Home</button><button @click="label='My Office'">Office</button><button @click="label='Meeting Point'">Meeting point</button><button @click="label='My Shop'">Shop</button></div>
        <button class="btn primary btn-block btn-xl" :disabled="!label.trim()||creating" @click="createCiwaan">{{creating?'Creating…':'Create my Ciwaan'}} <span>→</span></button>
        <p class="form-note">By creating a Ciwaan, you acknowledge the <button class="inline-link" @click="screen='privacy'">Privacy Policy</button>.</p>
      </section>

      <section v-else-if="screen==='created'" class="page-pad result-page">
        <div class="success-mark"><span>✓</span></div><div class="eyebrow">ADDRESS READY</div><h2>Your Ciwaan is ready.</h2><p>Send this address to anyone who needs to find you.</p>
        <div class="address-card"><div class="address-card-top"><span class="mini-mark"><i></i></span><span>{{created.precision==='exact'?'EXACT LOCATION':'GENERAL LOCATION'}}</span></div><strong>{{created.code}}</strong><small>{{created.label}}</small><div class="address-place">📍 {{formatCoords(created.latitude,created.longitude)}}</div></div>
        <div class="result-actions"><button class="btn whatsapp btn-block btn-xl" @click="shareWhatsApp(created)"><span>◉</span> Share on WhatsApp</button><div class="two-actions"><button class="btn secondary" @click="copyCiwaan">Copy Ciwaan</button><button class="btn secondary" @click="openQr">Show QR</button></div><button class="btn primary btn-block btn-xl" @click="guideTo(created)"><span>⌖</span> Guide Me</button></div>
        <button class="text-link" @click="goHome">Done</button>
      </section>

      <section v-else-if="screen==='address'" class="address-view">
        <div id="address-map" class="address-map"></div>
        <div class="address-floating"><button class="map-back" @click="goBack">←</button><button class="map-back" @click="shareWhatsApp(activeAddress)">↗</button></div>
        <div class="address-panel"><div class="address-heading"><div class="big-address-mark"><span></span></div><div><div class="eyebrow">CIWAAN</div><h2>{{activeAddress.label}}</h2><strong>{{activeAddress.code}}</strong></div></div><div class="address-meta"><span>⌖ {{activeAddress.precision==='exact'?'Exact location':'General location'}}</span><span>{{formatCoords(activeAddress.latitude,activeAddress.longitude)}}</span></div><button class="btn primary btn-block btn-xl" @click="guideTo(activeAddress)">⌖ Guide Me</button><div class="two-actions"><button class="btn secondary" @click="shareWhatsApp(activeAddress)">◉ WhatsApp</button><button class="btn secondary" @click="copyAddress(activeAddress)">Copy address</button></div></div>
      </section>

      <section v-else-if="screen==='guide'" class="guide-view">
        <div id="guide-map" class="guide-map"></div>
        <div class="guide-controls"><button class="map-back" @click="stopGuide">×</button><div class="nav-pill"><span class="live-dot"></span>{{navStatus}}</div></div>
        <div class="recenter"><button class="map-back" @click="recenterGuide">⌖</button></div>
        <div class="guide-panel">
          <div v-if="routing" class="route-loading"><span class="spinner"></span><div><b>Finding your route</b><small>Calculating the easiest walking route…</small></div></div>
          <template v-else><div class="nav-stats"><div><b>{{distanceText}}</b><small>remaining</small></div><div><b>{{etaText}}</b><small>estimated</small></div><div><b>🚶</b><small>walking</small></div></div><div class="turn-card"><span class="turn-arrow">↑</span><div><b>{{instruction}}</b><small>{{nextTurnDistance}}</small></div></div><button class="end-guide" @click="stopGuide">End Guide</button></template>
        </div>
      </section>
    </main>

    <nav v-if="!mapMode && !['privacy','choose','confirm','name','created','address'].includes(screen)" class="bottom-nav">
      <button :class="{active:screen==='home'}" @click="goHome"><span>⌂</span><small>Home</small></button>
      <button :class="{active:screen==='explore'}" @click="openExplore"><span>⌖</span><small>Explore</small></button>
      <button :class="{active:screen==='saved'}" @click="screen='saved'"><span>♡</span><small>Saved</small></button>
    </nav>

    <footer v-if="!mapMode" class="made-by">Made by Raazim Tech</footer>

    <div v-if="locationPrompt" class="modal-backdrop" @click.self="locationPrompt=false">
      <div class="permission-modal">
        <div class="permission-icon">⌖</div><div class="eyebrow">LOCATION ACCESS</div><h3>Allow Ciwaan to use your location?</h3><p>Ciwaan needs your location to place your address accurately and to provide live Guide Me navigation. Your device will show the official location permission request next.</p><div class="permission-points"><div><span>✓</span><b>Only when needed</b></div><div><span>✓</span><b>You control the permission</b></div><div><span>✓</span><b>Choose Exact or General</b></div></div><button class="btn primary btn-block btn-xl" @click="acceptLocation">Continue</button><button class="text-link" @click="locationPrompt=false">Not now</button></div>
    </div>

    <div v-if="showQr" class="modal-backdrop" @click.self="showQr=false"><div class="qr-modal"><button class="modal-close" @click="showQr=false">×</button><div class="eyebrow">SCAN TO FIND</div><h3>{{created?.code}}</h3><canvas ref="qrCanvas" class="qr"></canvas><p>Scan this code to open the Ciwaan location.</p></div></div>
    <div v-if="toast" class="toast">{{toast}}</div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import L from 'leaflet'
import QRCode from 'qrcode'
import 'leaflet/dist/leaflet.css'

const API='https://dpiwdhtbhwjgatvcfkcb.supabase.co/functions/v1/ciwaan-api'
const SUPABASE_KEY='sb_publishable_PSZnTEo74jObih_6TTpXVQ_tJwzTnXY'
const PUBLIC_BASE_URL='https://raazimtech.github.io/ciwaan/'
const screen=ref('home'), locationPrompt=ref(false), precision=ref('exact'), label=ref(''), creating=ref(false), error=ref(''), toast=ref(''), searchCode=ref(''), created=ref(null), activeAddress=ref(null), showQr=ref(false), qrCanvas=ref(null), recent=ref(load('ciwaan_recent')), saved=ref(load('ciwaan_saved')), coords=ref({lat:9.56,lng:44.06}), routing=ref(true), navStatus=ref('Finding your route'), distanceText=ref('—'), etaText=ref('—'), instruction=ref('Follow the route'), nextTurnDistance=ref('')
let createMap,confirmMap,addressMap,guideMap,exploreMap,routeLine,userMarker,watchId,currentDestination
const mapMode=computed(()=>['choose','confirm','address','guide'].includes(screen.value)),canBack=computed(()=>!['home','find','explore','saved','settings'].includes(screen.value))
function load(key){try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return []}}
function persist(key,value){localStorage.setItem(key,JSON.stringify(value))}
function goHome(){stopGuide(false);screen.value='home'}
function goBack(){if(screen.value==='guide')return stopGuide();if(screen.value==='address')screen.value='find';else screen.value='home'}
function openSettings(){screen.value='settings'}
function openFind(){error.value='';searchCode.value='';screen.value='find'}
function openExplore(){screen.value='explore';nextTick(initExploreMap)}
function showToast(msg){toast.value=msg;setTimeout(()=>toast.value='',3000)}
function startCreate(){locationPrompt.value=true}
function acceptLocation(){locationPrompt.value=false;requestLocation(true)}
function requestLocation(continueToCreate=false){if(!navigator.geolocation){showToast('Location is not supported on this device.');return}navigator.geolocation.getCurrentPosition(p=>{coords.value={lat:p.coords.latitude,lng:p.coords.longitude};if(continueToCreate){screen.value='choose';nextTick(initCreateMap)}},()=>showToast('Location permission was not granted. You can still browse Ciwaans.'),{enableHighAccuracy:true,timeout:12000,maximumAge:15000})}
function useCurrentLocation(){requestLocation(false);if(screen.value==='choose')navigator.geolocation.getCurrentPosition(p=>{coords.value={lat:p.coords.latitude,lng:p.coords.longitude};createMap?.setView([coords.value.lat,coords.value.lng],18)},()=>{}, {enableHighAccuracy:true})}
function baseMap(id,lat,lng,z=16){const m=L.map(id,{zoomControl:false,attributionControl:false}).setView([lat,lng],z);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(m);L.control.zoom({position:'bottomright'}).addTo(m);L.control.attribution({position:'bottomright',prefix:false}).addAttribution('© OpenStreetMap contributors').addTo(m);return m}
function initCreateMap(){if(createMap)createMap.remove();createMap=baseMap('create-map',coords.value.lat,coords.value.lng,18);createMap.on('moveend',()=>{const c=createMap.getCenter();coords.value={lat:c.lat,lng:c.lng}})}
function initConfirmMap(){if(confirmMap)confirmMap.remove();confirmMap=baseMap('confirm-map',coords.value.lat,coords.value.lng,18);L.circleMarker([coords.value.lat,coords.value.lng],{radius:9,color:'#087f5b',weight:4,fillColor:'#fff',fillOpacity:1}).addTo(confirmMap)}
function initAddressMap(){if(addressMap)addressMap.remove();addressMap=baseMap('address-map',activeAddress.value.latitude,activeAddress.value.longitude,17);L.circleMarker([activeAddress.value.latitude,activeAddress.value.longitude],{radius:10,color:'#087f5b',weight:4,fillColor:'#fff',fillOpacity:1}).addTo(addressMap)}
function initExploreMap(){if(exploreMap)exploreMap.remove();exploreMap=baseMap('explore-map',coords.value.lat,coords.value.lng,14)}
function confirmLocation(){screen.value='confirm';nextTick(initConfirmMap)}
async function api(payload){const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY},body:JSON.stringify(payload)});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Something went wrong.');return d}
async function createCiwaan(){if(!label.value.trim()||creating.value)return;creating.value=true;error.value='';try{const d=await api({action:'create',label:label.value,latitude:coords.value.lat,longitude:coords.value.lng,precision:precision.value});created.value={...d.address,managementToken:d.managementToken};const item={...d.address,managementToken:d.managementToken};saved.value=[item,...saved.value.filter(x=>x.code!==item.code)].slice(0,30);recent.value=[item,...recent.value.filter(x=>x.code!==item.code)].slice(0,15);persist('ciwaan_saved',saved.value);persist('ciwaan_recent',recent.value);screen.value='created'}catch(e){error.value=e.message||'Could not create your Ciwaan.'}finally{creating.value=false}}
async function lookup(){error.value='';const code=searchCode.value.trim().toUpperCase();if(!code){error.value='Enter a Ciwaan code.';return}try{const d=await api({action:'lookup',code});showAddress(d.address)}catch(e){error.value=e.message}}
function showAddress(item){activeAddress.value=item;recent.value=[item,...recent.value.filter(x=>x.code!==item.code)].slice(0,15);persist('ciwaan_recent',recent.value);screen.value='address';nextTick(initAddressMap)}
function shareWhatsApp(item){const url=`${PUBLIC_BASE_URL}?ciwaan=${encodeURIComponent(item.code)}`;const msg=`📍 My Ciwaan\n${item.code}\n${item.label}\n\nFind me here:\n${url}`;window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,'_blank','noopener,noreferrer')}
async function copyCiwaan(){try{await navigator.clipboard.writeText(created.value.code);showToast('Ciwaan copied.')}catch{showToast(created.value.code)}}
async function copyAddress(item){const url=`${PUBLIC_BASE_URL}?ciwaan=${encodeURIComponent(item.code)}`;try{await navigator.clipboard.writeText(`${item.label} · ${item.code}\n${url}`);showToast('Address copied.')}catch{showToast(item.code)}}
async function openQr(){showQr.value=true;await nextTick();if(qrCanvas.value&&created.value)QRCode.toCanvas(qrCanvas.value,`${PUBLIC_BASE_URL}?ciwaan=${created.value.code}`,{width:210,margin:2,color:{dark:'#101817',light:'#ffffff'}})}
function formatCoords(lat,lng){return `${Number(lat).toFixed(5)}°, ${Number(lng).toFixed(5)}°`}
function guideTo(item){currentDestination=item;screen.value='guide';routing.value=true;navStatus.value='Finding your route';nextTick(()=>{initGuideMap();startLiveLocation()})}
function initGuideMap(){if(guideMap)guideMap.remove();guideMap=baseMap('guide-map',currentDestination.latitude,currentDestination.longitude,16);L.circleMarker([currentDestination.latitude,currentDestination.longitude],{radius:11,color:'#087f5b',weight:4,fillColor:'#fff',fillOpacity:1}).addTo(guideMap)}
function startLiveLocation(){if(!navigator.geolocation){navStatus.value='GPS unavailable';return}if(watchId)navigator.geolocation.clearWatch(watchId);watchId=navigator.geolocation.watchPosition(async p=>{const here=[p.coords.latitude,p.coords.longitude];if(!userMarker)userMarker=L.circleMarker(here,{radius:7,color:'#fff',weight:3,fillColor:'#1877f2',fillOpacity:1}).addTo(guideMap);else userMarker.setLatLng(here);guideMap.setView(here,17,{animate:true});await routeFrom(here,currentDestination.latitude,currentDestination.longitude)},()=>{navStatus.value='GPS unavailable';routing.value=false},{enableHighAccuracy:true,maximumAge:3000,timeout:10000})}
async function routeFrom(here,lat,lng){try{const url=`https://router.project-osrm.org/route/v1/walking/${here[1]},${here[0]};${lng},${lat}?overview=full&steps=true`;const r=await fetch(url);const d=await r.json();if(!d.routes?.length)throw new Error('No route');const route=d.routes[0];if(routeLine)routeLine.remove();routeLine=L.geoJSON({type:'Feature',geometry:route.geometry}).addTo(guideMap);distanceText.value=route.distance<1000?`${Math.round(route.distance)} m`:`${(route.distance/1000).toFixed(1)} km`;etaText.value=`${Math.max(1,Math.round(route.duration/60))} min`;const step=route.legs?.[0]?.steps?.[0];instruction.value=step?.maneuver?.instruction||'Continue along the route';nextTurnDistance.value=step?`${Math.round(step.distance)} m`:'Follow the route';navStatus.value='Live navigation';routing.value=false}catch{routing.value=false;navStatus.value='Route unavailable';instruction.value='Follow the map';nextTurnDistance.value=''} }
function recenterGuide(){if(!navigator.geolocation||!guideMap)return;navigator.geolocation.getCurrentPosition(p=>guideMap.setView([p.coords.latitude,p.coords.longitude],18,{animate:true}))}
function stopGuide(goHomeAfter=true){if(watchId){navigator.geolocation.clearWatch(watchId);watchId=null}if(routeLine){routeLine.remove();routeLine=null}if(userMarker){userMarker.remove();userMarker=null}if(goHomeAfter)screen.value='address'}
onMounted(()=>{const params=new URLSearchParams(location.search);const code=params.get('ciwaan');if(code){searchCode.value=code;lookup()}})
</script>
