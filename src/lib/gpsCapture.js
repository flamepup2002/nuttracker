// Captures the device GPS coordinates for transmission to local law enforcement
// when criminal charges are filed. Returns null if geolocation is unavailable
// or permission is denied (charges are still filed without location).

export function captureGps() {
  return new Promise((resolve) => {
    if (!navigator?.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        resolve({
          gps_latitude: latitude,
          gps_longitude: longitude,
          gps_accuracy: accuracy,
          gps_captured_at: new Date().toISOString(),
          gps_maps_url: `https://www.google.com/maps?q=${latitude},${longitude}`,
        });
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  });
}