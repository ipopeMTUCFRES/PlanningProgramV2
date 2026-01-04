import React, { useEffect, useRef } from 'react';
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

// Custom icons for different tree types
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 25px; height: 25px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

const trimIcon = createCustomIcon('#27ae60');
const removalIcon = createCustomIcon('#e74c3c');
const hazardIcon = createCustomIcon('#f39c12');

// Component to fit map bounds
function MapBounds({ trees }) {
  const map = useMap();

  useEffect(() => {
    const validCoords = trees.filter(t => t.latitude && t.longitude);
    if (validCoords.length > 0) {
      const bounds = validCoords.map(t => [t.latitude, t.longitude]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [trees, map]);

  return null;
}

function TreeMap({ trees }) {
  const treesWithGPS = trees.filter(t => t.latitude && t.longitude);

  if (treesWithGPS.length === 0) {
    return (
      <div className="map-container empty-map">
        <p>No trees with GPS coordinates to display on map.</p>
      </div>
    );
  }

  // Calculate center
  const avgLat = treesWithGPS.reduce((sum, t) => sum + t.latitude, 0) / treesWithGPS.length;
  const avgLon = treesWithGPS.reduce((sum, t) => sum + t.longitude, 0) / treesWithGPS.length;

  const getIcon = (actionType) => {
    switch (actionType) {
      case 'Trim': return trimIcon;
      case 'Removal': return removalIcon;
      case 'Hazard': return hazardIcon;
      default: return null;
    }
  };

  return (
    <div className="map-container">
      <MapContainer
        center={[avgLat, avgLon]}
        zoom={16}
        style={{ height: '400px', width: '100%', borderRadius: '8px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBounds trees={treesWithGPS} />
        {treesWithGPS.map((tree) => (
          <Marker
            key={tree.id}
            position={[tree.latitude, tree.longitude]}
            icon={getIcon(tree.action_type)}
          >
            <Popup>
              <div className="tree-popup">
                <h4>
                  {tree.species_name ? (
                    <>
                      <strong>{tree.species}</strong> - {tree.species_name}
                    </>
                  ) : (
                    tree.species
                  )}
                </h4>
                <p><strong>Diameter:</strong> {tree.diameter} inches</p>
                <p><strong>Action:</strong> {tree.action_type}</p>
                <p><strong>Power Line:</strong> {tree.power_line_type}</p>
                <p className="gps-coords-popup">
                  {tree.latitude.toFixed(6)}, {tree.longitude.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#27ae60' }}></span>
          <span>Trim</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#e74c3c' }}></span>
          <span>Removal</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#f39c12' }}></span>
          <span>Hazard</span>
        </div>
      </div>
    </div>
  );
}

export default TreeMap;
