let loaderPromise

export function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google.maps)
  if (loaderPromise) return loaderPromise

  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (!key) return Promise.reject(new Error('Missing VITE_GOOGLE_MAPS_API_KEY'))

  loaderPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-ciwaan-google-maps]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google.maps), { once: true })
      existing.addEventListener('error', () => reject(new Error('Google Maps failed to load')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.dataset.ciwaanGoogleMaps = 'true'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&libraries=places,marker`
    script.async = true
    script.defer = true
    script.onload = () => resolve(window.google.maps)
    script.onerror = () => reject(new Error('Google Maps failed to load. Check the API key, billing, and enabled APIs.'))
    document.head.appendChild(script)
  })

  return loaderPromise
}

export async function computeWalkingRoute(origin, destination) {
  const maps = await loadGoogleMaps()
  const { Route } = await maps.importLibrary('routes')
  const result = await Route.computeRoutes({
    origin,
    destination,
    travelMode: 'WALKING',
    fields: ['*']
  })
  return result.routes?.[0] ?? null
}
