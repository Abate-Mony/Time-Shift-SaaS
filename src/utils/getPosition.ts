// utils/getPosition.ts
export function getCurrentPosition(): Promise<{
  lat: number
  lng: number
  accuracy: number
} | null> {
  return new Promise(resolve => {
    if (!navigator.geolocation) return resolve(null)

    navigator.geolocation.getCurrentPosition(
      pos =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      // Denied, unavailable, or timed out — clock in anyway, unflagged
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 }
    )
  })
}