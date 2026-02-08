import { MapContainer, TileLayer } from "react-leaflet";
import "./App.css";
import Routing from "./Routing.jsx";
import L from "leaflet";

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function App() {
  // Center map around the waypoints (depot, toxicBin, fullBin)
  const center = [12.975, 77.602];
  
  return (
    <div className="map-container">
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: "100vh", width: "100%" }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Routing />
      </MapContainer>
    </div>
  );
}

export default App;
