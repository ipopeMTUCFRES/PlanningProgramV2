import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom icon for work locations (purple marker)
const workLocationIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: #8e44ad; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15]
});

// Component to fit map bounds
function MapBounds({ workLocations }) {
  const map = useMap();

  useEffect(() => {
    if (workLocations.length > 0) {
      const bounds = workLocations.map(loc => [loc.latitude, loc.longitude]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [workLocations, map]);

  return null;
}

function WorkLocationMap({ workLocations, onLocationClick }) {
  if (workLocations.length === 0) {
    return (
      <div className="map-container empty-map">
        <p>No work locations with GPS coordinates to display on map.</p>
      </div>
    );
  }

  // Calculate center
  const avgLat = workLocations.reduce((sum, loc) => sum + loc.latitude, 0) / workLocations.length;
  const avgLon = workLocations.reduce((sum, loc) => sum + loc.longitude, 0) / workLocations.length;

  return (
    <div className="map-container">
      <MapContainer
        center={[avgLat, avgLon]}
        zoom={14}
        style={{ height: '500px', width: '100%', borderRadius: '8px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBounds workLocations={workLocations} />
        {workLocations.map((location) => (
          <Marker
            key={location.id}
            position={[location.latitude, location.longitude]}
            icon={workLocationIcon}
            eventHandlers={{
              click: () => {
                if (onLocationClick) {
                  onLocationClick(location);
                }
              }
            }}
          >
            <Popup>
              <div className="work-location-popup">
                <h4>
                  {location.number && `#${location.number} - `}
                  {location.address}
                </h4>
                <p><strong>Trees:</strong> {location.treeCount || 0}</p>
                {location.comments && <p><strong>Comments:</strong> {location.comments}</p>}
                <p className="gps-coords-popup">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#8e44ad' }}></span>
          <span>Work Location</span>
        </div>
      </div>
    </div>
  );
}

export default WorkLocationMap;
