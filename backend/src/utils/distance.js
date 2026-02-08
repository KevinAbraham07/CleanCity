// Haversine distance between two lat/lng points (km)
export function haversineDistance(a, b) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

// Distance from point P to line segment AB (km)
export function distancePointToSegment(p, a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;

  const x = toRad(p.lng);
  const y = toRad(p.lat);
  const x1 = toRad(a.lng);
  const y1 = toRad(a.lat);
  const x2 = toRad(b.lng);
  const y2 = toRad(b.lat);

  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    return Math.sqrt((x - x1) ** 2 + (y - y1) ** 2) * 6371;
  }

  const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
  const clampedT = Math.max(0, Math.min(1, t));

  const closestX = x1 + clampedT * dx;
  const closestY = y1 + clampedT * dy;

  return Math.sqrt((x - closestX) ** 2 + (y - closestY) ** 2) * 6371;
}
