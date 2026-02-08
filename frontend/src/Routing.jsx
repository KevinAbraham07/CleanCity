import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";

function Routing() {
  const map = useMap();
  const routeLineRef = useRef(null);
  const routeOutlineRef = useRef(null);
  const markersRef = useRef([]);
  const routingControlsRef = useRef([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch route data from API
    const fetchRoute = async () => {
      try {
        setLoading(true);
        
        // Try multiple URL options (direct and proxied)
        const apiUrls = [
          "/api/route", // Use Vite proxy (recommended for development)
          "http://localhost:5000/route", // Direct connection
          "https://localhost:5000/route", // HTTPS direct connection
        ];
        
        let response;
        let lastError;
        
        // Try each URL
        for (const apiUrl of apiUrls) {
          try {
            console.log(`Attempting to fetch from: ${apiUrl}`);
            
            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            response = await fetch(apiUrl, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
              signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              break; // Success, exit loop
            } else {
              lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
          } catch (fetchError) {
            console.error(`Failed to fetch from ${apiUrl}:`, fetchError);
            
            // Provide more specific error messages
            if (fetchError.name === "AbortError") {
              lastError = new Error("Request timeout - server took too long to respond");
            } else if (fetchError.message.includes("Failed to fetch") || fetchError.message.includes("NetworkError")) {
              lastError = new Error(`Network error: Cannot connect to ${apiUrl}. Is the server running?`);
            } else {
              lastError = fetchError;
            }
            // Continue to next URL
            continue;
          }
        }
        
        if (!response || !response.ok) {
          const errorMsg = lastError?.message || "Failed to connect to server";
          throw new Error(`${errorMsg}. Make sure the backend server is running on port 5000.`);
        }
        
        const data = await response.json();
        console.log("Route data received:", data);
        
        if (!data.route || !Array.isArray(data.route)) {
          throw new Error(`Invalid route data format. Expected array in 'route' field, got: ${JSON.stringify(data)}`);
        }
        
        if (data.route.length === 0) {
          throw new Error("Route data is empty. No coordinates to display.");
        }

        // Extract coordinates from route points
        const coordinates = data.route.map((point) => [point.lat, point.lng]);

        // Clear existing markers and routes
        clearMap();

        // Create markers for each point in the route
        const defaultIcon = L.icon({
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
        });

        // Create markers for each point
        coordinates.forEach((coord, index) => {
          const isDepot = index === 0 || index === coordinates.length - 1;
          const label = isDepot
            ? `Depot ${index === 0 ? "(Start)" : "(End)"}`
            : `Stop ${index}`;

          const marker = L.marker(coord, { icon: defaultIcon })
            .addTo(map)
            .bindPopup(label);

          markersRef.current.push(marker);
        });

        // Draw route path connecting points sequentially
        if (coordinates.length > 1) {
          // Remove existing route lines
          if (routeLineRef.current) {
            map.removeLayer(routeLineRef.current);
          }
          if (routeOutlineRef.current) {
            map.removeLayer(routeOutlineRef.current);
          }

          // Draw white outline for better visibility
          routeOutlineRef.current = L.polyline(coordinates, {
            color: "white",
            weight: 10,
            opacity: 0.7,
            smoothFactor: 1,
          }).addTo(map);
          routeOutlineRef.current.bringToBack();

          // Draw main route path (blue line)
          routeLineRef.current = L.polyline(coordinates, {
            color: "#3388ff",
            weight: 6,
            opacity: 1,
            smoothFactor: 1,
          }).addTo(map);

          // Use OSRM routing to get actual road paths for the entire route
          // Convert coordinates to waypoints for routing
          const waypoints = coordinates.map((coord) => L.latLng(coord[0], coord[1]));

          const routingControl = L.Routing.control({
            waypoints: waypoints,
            routeWhileDragging: false,
            addWaypoints: false,
            draggableWaypoints: false,
            show: false,
            router: L.Routing.osrmv1({
              serviceUrl: "https://router.project-osrm.org/route/v1",
            }),
            lineOptions: {
              styles: [{ color: "#3388ff", weight: 6, opacity: 0.9 }],
            },
            createMarker: () => null,
          }).addTo(map);

          routingControlsRef.current.push(routingControl);

          // Listen for route calculation to enhance with actual road paths
          routingControl.on("routesfound", (e) => {
            try {
              const routes = e.routes;
              if (routes && routes.length > 0) {
                const route = routes[0];
                let routeCoordinates = [];

                // Try to get coordinates from the calculated route
                if (route.coordinates && Array.isArray(route.coordinates)) {
                  routeCoordinates = route.coordinates;
                } else if (route.geometry && route.geometry.coordinates) {
                  routeCoordinates = route.geometry.coordinates.map((coord) => [
                    coord[1],
                    coord[0],
                  ]);
                }

                // If we got route coordinates, update the polyline
                if (routeCoordinates.length > 0) {
                  // Remove existing simple polyline
                  if (routeLineRef.current) {
                    map.removeLayer(routeLineRef.current);
                  }
                  if (routeOutlineRef.current) {
                    map.removeLayer(routeOutlineRef.current);
                  }

                  // Draw enhanced route with actual road paths
                  routeOutlineRef.current = L.polyline(routeCoordinates, {
                    color: "white",
                    weight: 10,
                    opacity: 0.7,
                    smoothFactor: 1,
                  }).addTo(map);
                  routeOutlineRef.current.bringToBack();

                  routeLineRef.current = L.polyline(routeCoordinates, {
                    color: "#3388ff",
                    weight: 6,
                    opacity: 1,
                    smoothFactor: 1,
                  }).addTo(map);

                  // Fit bounds to show entire route
                  const bounds = L.latLngBounds(routeCoordinates);
                  map.fitBounds(bounds, { padding: [50, 50] });
                }
              }
            } catch (error) {
              console.error("Error processing route:", error);
            }
          });

          // Fit bounds to show entire route
          const bounds = L.latLngBounds(coordinates);
          map.fitBounds(bounds, { padding: [50, 50] });
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching route:", error);
        setLoading(false);
        
        // Show detailed error message
        const errorMessage = error.message || "Unknown error occurred";
        const detailedError = `
          <div style="padding: 10px;">
            <h3 style="margin: 0 0 10px 0; color: #d32f2f;">⚠️ Error Loading Route</h3>
            <p style="margin: 5px 0;"><strong>Error:</strong> ${errorMessage}</p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">
              Please check:<br/>
              • Backend server is running on port 5000<br/>
              • CORS is enabled in backend<br/>
              • Network connection is active<br/>
              • Check browser console for details
            </p>
          </div>
        `;
        
        L.popup()
          .setLatLng([12.975, 77.602])
          .setContent(detailedError)
          .openOn(map);
      }
    };

    // Helper function to clear map
    const clearMap = () => {
      // Remove markers
      markersRef.current.forEach((marker) => {
        if (marker && map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      });
      markersRef.current = [];

      // Remove route lines
      if (routeLineRef.current && map.hasLayer(routeLineRef.current)) {
        map.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }

      if (routeOutlineRef.current && map.hasLayer(routeOutlineRef.current)) {
        map.removeLayer(routeOutlineRef.current);
        routeOutlineRef.current = null;
      }

      // Remove routing controls
      routingControlsRef.current.forEach((control) => {
        if (control && map.hasLayer(control)) {
          map.removeControl(control);
        }
      });
      routingControlsRef.current = [];
    };

    fetchRoute();

    // Cleanup on unmount
    return () => {
      clearMap();
    };
  }, [map]);

  return null;
}

export default Routing;
