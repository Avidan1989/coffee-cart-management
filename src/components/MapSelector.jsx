// MapSelector.jsx
import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "../assets/styles/MapSelector.css";
import L from "leaflet";


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

function LocationMarker({ setLatLng }) {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      setLatLng({ lat, lng });
    },
  });

  return position === null ? null : <Marker position={position} />;
}

function MapSelector({ onLocationSelect }) {
  const [latLng, setLatLng] = useState(null);

  const handleConfirm = () => {
    if (latLng) {
      const link = `https://www.google.com/maps?q=${latLng.lat},${latLng.lng}`;
      onLocationSelect(link);
    }
  };

  return (
    <div className="map-selector">
      <h3>בחר מיקום בלחיצה על המפה</h3>
      <MapContainer
        center={[32.0853, 34.7818]}
        zoom={13}
        scrollWheelZoom={true}
        className="map-container" // 🟢 זה נותן שליטה מלאה דרך CSS
      >
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker setLatLng={setLatLng} />
      </MapContainer>
      <button onClick={handleConfirm} disabled={!latLng}>
        📍 אשר מיקום זה
      </button>
      {latLng && (
        <p>
          לינק נבחר:{" "}
          <a
            href={`https://www.google.com/maps?q=${latLng.lat},${latLng.lng}`}
            target="_blank"
            rel="noreferrer"
          >
            הצג במפה
          </a>
        </p>
      )}
    </div>
  );
}

export default MapSelector;
