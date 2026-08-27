import { Map, Marker, NavigationControl, GeolocateControl, setWorkerUrl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

setWorkerUrl(workerUrl)

export const DEFAULT_CENTER = [45.34, 2.04]
const TILE_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors'
    }
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
}

export function createMap(container, center = DEFAULT_CENTER, zoom = 15) {
  const map = new Map({ container, style: TILE_STYLE, center, zoom, attributionControl: true })
  map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
  return map
}

export function createMarker(map, lngLat, options = {}) {
  return new Marker({ color: options.color || '#0052FF', draggable: Boolean(options.draggable) }).setLngLat(lngLat).addTo(map)
}

export function addLiveLocation(map) {
  const control = new GeolocateControl({ positionOptions: { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 }, trackUserLocation: true, showAccuracyCircle: true })
  map.addControl(control, 'top-right')
  return control
}

export async function computeWalkingRoute(origin, destination) {
  const body = {
    locations: [
      { lat: origin.lat, lon: origin.lng },
      { lat: destination.lat, lon: destination.lng }
    ],
    costing: 'pedestrian',
    units: 'kilometers',
    directions_options: { units: 'kilometers' },
    shape_format: 'geojson'
  }
  const response = await fetch('https://valhalla1.openstreetmap.de/route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Client-Id': 'ciwaan' },
    body: JSON.stringify(body)
  })
  if (!response.ok) throw new Error(`Routing service returned ${response.status}`)
  const data = await response.json()
  const summary = data.trip?.summary || {}
  const shape = data.trip?.legs?.[0]?.shape || data.trip?.shape
  return {
    distanceKm: Number(summary.length || 0),
    durationMin: Math.max(1, Math.round(Number(summary.time || 0) / 60)),
    geojson: decodeShape(shape, data.trip?.legs?.[0]?.shape_format || 'geojson')
  }
}

function decodeShape(shape, format) {
  if (!shape) return []
  if (format === 'geojson' && Array.isArray(shape.coordinates)) return shape.coordinates
  return decodePolyline6(shape)
}

function decodePolyline6(encoded) {
  const coordinates = []
  let index = 0, lat = 0, lng = 0
  while (index < encoded.length) {
    let result = 0, shift = 0, byte
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5 } while (byte >= 0x20)
    lat += (result & 1) ? ~(result >> 1) : result >> 1
    result = 0; shift = 0
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5 } while (byte >= 0x20)
    lng += (result & 1) ? ~(result >> 1) : result >> 1
    coordinates.push([lng / 1e6, lat / 1e6])
  }
  return coordinates
}

export function drawRoute(map, coordinates) {
  if (!coordinates?.length) return
  const sourceId = 'ciwaan-route'
  const layerId = 'ciwaan-route-line'
  if (map.getLayer(layerId)) map.removeLayer(layerId)
  if (map.getSource(sourceId)) map.removeSource(sourceId)
  map.addSource(sourceId, { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates } } })
  map.addLayer({ id: layerId, type: 'line', source: sourceId, paint: { 'line-color': '#0052FF', 'line-width': 6, 'line-opacity': 0.9, 'line-cap': 'round', 'line-join': 'round' } })
}

export function clearRoute(map) {
  if (!map) return
  if (map.getLayer('ciwaan-route-line')) map.removeLayer('ciwaan-route-line')
  if (map.getSource('ciwaan-route')) map.removeSource('ciwaan-route')
}
