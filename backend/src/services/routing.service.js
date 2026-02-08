import {
  haversineDistance,
  distancePointToSegment,
} from "../utils/distance.js";

/**
 * Collect NORMAL bins that lie close to the planned route
 */
function collectNormalBinsOnRoute(routePoints, normalBins) {
  const COLLECT_RADIUS_KM = 0.3; // 300 meters
  const collected = new Set();

  for (let i = 0; i < routePoints.length - 1; i++) {
    const start = routePoints[i];
    const end = routePoints[i + 1];

    for (const bin of normalBins) {
      if (collected.has(bin.bin_id)) continue;

      const d = distancePointToSegment(bin.location, start, end);

      if (d <= COLLECT_RADIUS_KM) {
        collected.add(bin.bin_id);
        console.log(
          `🟢 Opportunistically collecting NORMAL bin ${bin.bin_id} (≈ ${(d * 1000).toFixed(0)} m from route)`,
        );
      }
    }
  }

  return Array.from(collected);
}

/**
 * Core routing logic (console version)
 */
export function computeRouteConsole(depot, urgentBins, normalBins = []) {
  let current = depot;
  let remaining = [...urgentBins];

  const visitOrder = [];
  const routePoints = [depot];
  let totalDistance = 0;

  console.log("🚛 Route starting from DEPOT\n");

  while (remaining.length > 0) {
    let nearest = null;
    let minDist = Infinity;

    for (const bin of remaining) {
      const d = haversineDistance(current, bin.location);
      if (d < minDist) {
        minDist = d;
        nearest = bin;
      }
    }

    console.log(
      `➡️  ${current.name || "DEPOT"} → ${nearest.bin_id} (${nearest.status}) | ≈ ${minDist.toFixed(2)} km`,
    );

    totalDistance += minDist;
    visitOrder.push(nearest.bin_id);

    current = {
      ...nearest.location,
      name: nearest.bin_id,
    };

    routePoints.push({
      lat: nearest.location.lat,
      lng: nearest.location.lng,
    });

    remaining = remaining.filter((b) => b.bin_id !== nearest.bin_id);
  }

  // Return to depot
  const returnDist = haversineDistance(current, depot);
  totalDistance += returnDist;

  console.log(`↩️  Returning to DEPOT | ≈ ${returnDist.toFixed(2)} km`);

  routePoints.push(depot);

  console.log("\n🗺️  Visit order:", ["DEPOT", ...visitOrder, "DEPOT"]);
  console.log(`📏 Total distance ≈ ${totalDistance.toFixed(2)} km`);

  // Collect NORMAL bins on the way
  if (normalBins.length > 0) {
    console.log("\n🔍 Checking for NORMAL bins on the route...\n");

    const collectedNormals = collectNormalBinsOnRoute(routePoints, normalBins);

    console.log(
      "\n♻️ Normal bins collected on the way:",
      collectedNormals.length > 0 ? collectedNormals : "None",
    );
  }

  return {
    routePoints,
    visitOrder,
    totalDistance,
  };
}
