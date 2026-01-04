import React, { useState, useEffect } from 'react';

function TreeForm({ workLocationId, editingTree, onTreeSaved, onCancel }) {
  const [useGPS, setUseGPS] = useState(false);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [diameter, setDiameter] = useState('');
  const [species, setSpecies] = useState('');
  const [powerLineType, setPowerLineType] = useState('None');
  const [actionType, setActionType] = useState('Trim');
  const [canopyRemoval, setCanopyRemoval] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [speciesList, setSpeciesList] = useState([]);

  useEffect(() => {
    loadSpecies();
  }, []);

  useEffect(() => {
    if (editingTree) {
      setUseGPS(editingTree.latitude !== null && editingTree.longitude !== null);
      setLatitude(editingTree.latitude || '');
      setLongitude(editingTree.longitude || '');
      setDiameter(editingTree.diameter || '');
      setSpecies(editingTree.species || '');
      setPowerLineType(editingTree.power_line_type || 'None');
      setActionType(editingTree.action_type || 'Trim');
      setCanopyRemoval(editingTree.canopy_removal === 1);
    }
  }, [editingTree]);

  const loadSpecies = async () => {
    const species = await window.api.getSpecies();
    setSpeciesList(species);
  };

  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setGpsLoading(false);
      },
      (error) => {
        alert('Unable to retrieve your location: ' + error.message);
        setGpsLoading(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!diameter || !species) {
      alert('Please fill in required fields');
      return;
    }

    // Validate: Hazards can only be on Primary lines
    if (actionType === 'Hazard' && powerLineType === 'Secondary') {
      alert('Hazards can only be associated with Primary power lines, not Secondary lines.');
      return;
    }

    const treeData = {
      workLocationId,
      latitude: useGPS && latitude ? parseFloat(latitude) : null,
      longitude: useGPS && longitude ? parseFloat(longitude) : null,
      diameter: parseFloat(diameter),
      species,
      powerLineType,
      actionType,
      canopyRemoval
    };

    if (editingTree) {
      await window.api.updateTree(editingTree.id, treeData);
    } else {
      await window.api.createTree(treeData);
    }

    onTreeSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="form-container tree-form">
      <h3>{editingTree ? 'Edit Tree' : 'Add New Tree'}</h3>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={useGPS}
            onChange={(e) => setUseGPS(e.target.checked)}
          />
          Record GPS Location
        </label>
      </div>

      {useGPS && (
        <div className="gps-section">
          <div className="form-group">
            <label htmlFor="latitude">Latitude:</label>
            <input
              type="number"
              id="latitude"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="e.g., 42.123456"
            />
          </div>

          <div className="form-group">
            <label htmlFor="longitude">Longitude:</label>
            <input
              type="number"
              id="longitude"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="e.g., -83.123456"
            />
          </div>

          <button
            type="button"
            onClick={handleGetGPS}
            className="btn btn-secondary"
            disabled={gpsLoading}
          >
            {gpsLoading ? 'Getting Location...' : 'Get Current Location'}
          </button>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="diameter">Diameter (inches): *</label>
        <input
          type="number"
          id="diameter"
          step="0.1"
          value={diameter}
          onChange={(e) => setDiameter(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="species">Species: *</label>
        <select
          id="species"
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          required
        >
          <option value="">Select Species</option>
          {speciesList.map(s => (
            <option key={s.id} value={s.code}>
              {s.code} - {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="powerLineType">Power Line Association:</label>
        <select
          id="powerLineType"
          value={powerLineType}
          onChange={(e) => setPowerLineType(e.target.value)}
        >
          <option value="None">None</option>
          <option value="Primary">Primary</option>
          <option value="Secondary">Secondary</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="actionType">Action Type:</label>
        <select
          id="actionType"
          value={actionType}
          onChange={(e) => setActionType(e.target.value)}
        >
          <option value="Trim">Trim</option>
          <option value="Removal">Removal</option>
          <option value="Hazard">Hazard</option>
        </select>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={canopyRemoval}
            onChange={(e) => setCanopyRemoval(e.target.checked)}
          />
          Canopy Removal
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {editingTree ? 'Update Tree' : 'Add Tree'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default TreeForm;
