import React, { useState, useEffect } from 'react';
import WorkLocationView from './WorkLocationView';
import WorkLocationMap from './WorkLocationMap';

function SectionList({ section, onBack }) {
  const [workLocations, setWorkLocations] = useState([]);
  const [workLocationsWithGPS, setWorkLocationsWithGPS] = useState([]);
  const [showCreateLocation, setShowCreateLocation] = useState(false);
  const [newLocationNumber, setNewLocationNumber] = useState('');
  const [newLocationAddress, setNewLocationAddress] = useState('');
  const [newLocationComments, setNewLocationComments] = useState('');
  const [ownershipType, setOwnershipType] = useState('');
  const [notificationType, setNotificationType] = useState('');
  const [clearingEquipment1, setClearingEquipment1] = useState('No Listing');
  const [clearingEquipment2, setClearingEquipment2] = useState('No Listing');
  const [clearingEquipment3, setClearingEquipment3] = useState('No Listing');
  const [cleanupCode1, setCleanupCode1] = useState('No Listing');
  const [cleanupCode2, setCleanupCode2] = useState('No Listing');
  const [brushQuarterSpans, setBrushQuarterSpans] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);
  const [sectionTotals, setSectionTotals] = useState({
    primaryTrims: 0,
    primaryRemovals: 0,
    primaryHazards: 0,
    secondaryTrims: 0,
    secondaryRemovals: 0,
    totalBrush: 0
  });

  useEffect(() => {
    loadWorkLocations();
  }, [section.id]);

  const loadWorkLocations = async () => {
    const locationList = await window.api.getWorkLocations(section.id);
    setWorkLocations(locationList);

    // Get all trees for this section to calculate average GPS coordinates and totals
    const trees = await window.api.getSectionTrees(section.id);

    // Calculate section totals
    const totals = {
      primaryTrims: 0,
      primaryRemovals: 0,
      primaryHazards: 0,
      secondaryTrims: 0,
      secondaryRemovals: 0,
      totalBrush: 0
    };

    trees.forEach(tree => {
      if (tree.power_line_type === 'Primary') {
        if (tree.action_type === 'Trim') totals.primaryTrims++;
        else if (tree.action_type === 'Removal') totals.primaryRemovals++;
        else if (tree.action_type === 'Hazard') totals.primaryHazards++;
      } else if (tree.power_line_type === 'Secondary') {
        if (tree.action_type === 'Trim') totals.secondaryTrims++;
        else if (tree.action_type === 'Removal') totals.secondaryRemovals++;
      }
    });

    // Calculate total brush from work locations
    locationList.forEach(location => {
      if (location.brush_quarter_spans) {
        totals.totalBrush += location.brush_quarter_spans;
      }
    });

    setSectionTotals(totals);

    // Group trees by work location and calculate average GPS coordinates
    const locationGPSMap = new Map();

    trees.forEach(tree => {
      if (tree.latitude && tree.longitude) {
        if (!locationGPSMap.has(tree.work_location_id)) {
          locationGPSMap.set(tree.work_location_id, {
            latSum: 0,
            lonSum: 0,
            count: 0
          });
        }
        const data = locationGPSMap.get(tree.work_location_id);
        data.latSum += tree.latitude;
        data.lonSum += tree.longitude;
        data.count += 1;
      }
    });

    // Create array of work locations with GPS coordinates
    const locationsWithGPS = locationList
      .map(location => {
        const gpsData = locationGPSMap.get(location.id);
        if (gpsData) {
          return {
            ...location,
            latitude: gpsData.latSum / gpsData.count,
            longitude: gpsData.lonSum / gpsData.count,
            treeCount: gpsData.count
          };
        }
        return null;
      })
      .filter(loc => loc !== null);

    setWorkLocationsWithGPS(locationsWithGPS);
  };

  const handleCreateLocation = async (e) => {
    e.preventDefault();

    if (!newLocationAddress) {
      alert('Please enter an address');
      return;
    }

    if (editingLocation) {
      await window.api.updateWorkLocation(editingLocation.id, {
        number: newLocationNumber,
        address: newLocationAddress,
        comments: newLocationComments,
        ownershipType,
        notificationType,
        clearingEquipment1,
        clearingEquipment2,
        clearingEquipment3,
        cleanupCode1,
        cleanupCode2,
        brushQuarterSpans: brushQuarterSpans ? parseFloat(brushQuarterSpans) : null
      });
    } else {
      await window.api.createWorkLocation({
        sectionId: section.id,
        number: newLocationNumber,
        address: newLocationAddress,
        comments: newLocationComments,
        ownershipType,
        notificationType,
        clearingEquipment1,
        clearingEquipment2,
        clearingEquipment3,
        cleanupCode1,
        cleanupCode2,
        brushQuarterSpans: brushQuarterSpans ? parseFloat(brushQuarterSpans) : null
      });
    }

    setNewLocationNumber('');
    setNewLocationAddress('');
    setNewLocationComments('');
    setOwnershipType('');
    setNotificationType('');
    setClearingEquipment1('No Listing');
    setClearingEquipment2('No Listing');
    setClearingEquipment3('No Listing');
    setCleanupCode1('No Listing');
    setCleanupCode2('No Listing');
    setBrushQuarterSpans('');
    setShowCreateLocation(false);
    setEditingLocation(null);
    await loadWorkLocations();
  };

  const handleEditLocation = (location) => {
    setEditingLocation(location);
    setNewLocationNumber(location.number || '');
    setNewLocationAddress(location.address);
    setNewLocationComments(location.comments || '');
    setOwnershipType(location.ownership_type || '');
    setNotificationType(location.notification_type || '');
    setClearingEquipment1(location.clearing_equipment_1 || 'No Listing');
    setClearingEquipment2(location.clearing_equipment_2 || 'No Listing');
    setClearingEquipment3(location.clearing_equipment_3 || 'No Listing');
    setCleanupCode1(location.cleanup_code_1 || 'No Listing');
    setCleanupCode2(location.cleanup_code_2 || 'No Listing');
    setBrushQuarterSpans(location.brush_quarter_spans || '');
    setShowCreateLocation(true);
  };

  const handleDeleteLocation = async (locationId) => {
    if (window.confirm('Are you sure you want to delete this work location? All trees in this location will also be deleted.')) {
      await window.api.deleteWorkLocation(locationId);
      await loadWorkLocations();
    }
  };

  const handleLocationClick = (location) => {
    setSelectedLocation(location);
  };

  const handleBackToLocations = () => {
    setSelectedLocation(null);
  };

  if (selectedLocation) {
    return (
      <WorkLocationView
        workLocation={selectedLocation}
        onBack={handleBackToLocations}
      />
    );
  }

  return (
    <div className="section-view">
      <div className="view-header">
        <button onClick={onBack} className="btn btn-secondary">Back to Sections</button>
        <h2>{section.name}</h2>
      </div>

      <div className="work-locations-container">
        <div className="toolbar">
          <h3>Work Locations</h3>
          <button onClick={() => setShowCreateLocation(!showCreateLocation)} className="btn btn-primary">
            {showCreateLocation ? 'Cancel' : 'Add Work Location'}
          </button>
        </div>

        {showCreateLocation && (
          <form onSubmit={handleCreateLocation} className="form-container">
            <div className="form-group">
              <label htmlFor="number">Work Location Number:</label>
              <input
                type="text"
                id="number"
                value={newLocationNumber}
                onChange={(e) => setNewLocationNumber(e.target.value)}
                placeholder="Optional"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="address">Address:</label>
              <input
                type="text"
                id="address"
                value={newLocationAddress}
                onChange={(e) => setNewLocationAddress(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="comments">Comments:</label>
              <textarea
                id="comments"
                value={newLocationComments}
                onChange={(e) => setNewLocationComments(e.target.value)}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="ownershipType">Ownership Type:</label>
              <select
                id="ownershipType"
                value={ownershipType}
                onChange={(e) => setOwnershipType(e.target.value)}
              >
                <option value="">Select Ownership Type</option>
                <option value="Rural Electric">Rural Electric</option>
                <option value="Government">Government</option>
                <option value="DNR">DNR</option>
                <option value="National Forest">National Forest</option>
                <option value="Private - Residential">Private - Residential</option>
                <option value="Private - Vacant">Private - Vacant</option>
                <option value="MDOT">MDOT</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="notificationType">Notification Type:</label>
              <select
                id="notificationType"
                value={notificationType}
                onChange={(e) => setNotificationType(e.target.value)}
              >
                <option value="">Select Notification Type</option>
                <option value="Verbal">Verbal</option>
                <option value="Door-card">Door-card</option>
                <option value="Postcard">Postcard</option>
                <option value="Refusal">Refusal</option>
                <option value="Special Conditions">Special Conditions</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="clearingEquipment1">Clearing Equipment 1:</label>
              <select
                id="clearingEquipment1"
                value={clearingEquipment1}
                onChange={(e) => setClearingEquipment1(e.target.value)}
              >
                <option value="">Select Clearing Equipment</option>
                <option value="No Listing">No Listing</option>
                <option value="No Selection">No Selection</option>
                <option value="Bucket Truck">Bucket Truck</option>
                <option value="Manual Crew">Manual Crew</option>
                <option value="Backyard Machine">Backyard Machine</option>
                <option value="Puddle Jumper">Puddle Jumper</option>
                <option value="Side-trimmer">Side-trimmer</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="clearingEquipment2">Clearing Equipment 2:</label>
              <select
                id="clearingEquipment2"
                value={clearingEquipment2}
                onChange={(e) => setClearingEquipment2(e.target.value)}
              >
                <option value="">Select Clearing Equipment</option>
                <option value="No Listing">No Listing</option>
                <option value="No Selection">No Selection</option>
                <option value="Bucket Truck">Bucket Truck</option>
                <option value="Manual Crew">Manual Crew</option>
                <option value="Backyard Machine">Backyard Machine</option>
                <option value="Puddle Jumper">Puddle Jumper</option>
                <option value="Side-trimmer">Side-trimmer</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="clearingEquipment3">Clearing Equipment 3:</label>
              <select
                id="clearingEquipment3"
                value={clearingEquipment3}
                onChange={(e) => setClearingEquipment3(e.target.value)}
              >
                <option value="">Select Clearing Equipment</option>
                <option value="No Listing">No Listing</option>
                <option value="No Selection">No Selection</option>
                <option value="Bucket Truck">Bucket Truck</option>
                <option value="Manual Crew">Manual Crew</option>
                <option value="Backyard Machine">Backyard Machine</option>
                <option value="Puddle Jumper">Puddle Jumper</option>
                <option value="Side-trimmer">Side-trimmer</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="cleanupCode1">Clean-up Code 1:</label>
              <select
                id="cleanupCode1"
                value={cleanupCode1}
                onChange={(e) => setCleanupCode1(e.target.value)}
              >
                <option value="">Select Clean-up Code</option>
                <option value="No Listing">No Listing</option>
                <option value="No Selection">No Selection</option>
                <option value="Chip and haul">Chip and haul</option>
                <option value="Chip and blow">Chip and blow</option>
                <option value="Windrow">Windrow</option>
                <option value="Mower">Mower</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="cleanupCode2">Clean-up Code 2:</label>
              <select
                id="cleanupCode2"
                value={cleanupCode2}
                onChange={(e) => setCleanupCode2(e.target.value)}
              >
                <option value="">Select Clean-up Code</option>
                <option value="No Listing">No Listing</option>
                <option value="No Selection">No Selection</option>
                <option value="Chip and haul">Chip and haul</option>
                <option value="Chip and blow">Chip and blow</option>
                <option value="Windrow">Windrow</option>
                <option value="Mower">Mower</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="brushQuarterSpans">Brush (Quarter Spans):</label>
              <input
                type="number"
                id="brushQuarterSpans"
                value={brushQuarterSpans}
                onChange={(e) => setBrushQuarterSpans(e.target.value)}
                min="0"
                step="1"
                placeholder="Enter whole number"
              />
            </div>

            <button type="submit" className="btn btn-primary">
              {editingLocation ? 'Update Work Location' : 'Create Work Location'}
            </button>
          </form>
        )}

{workLocations.length === 0 ? (
          <div className="empty-state">
            <p>No work locations yet. Add your first work location to start recording trees.</p>
          </div>
        ) : (
          <>
            {/* Section Totals Summary */}
            <div className="section-totals-container">
              <h3>Section Summary{section.distance > 0 && ` - ${section.distance} miles`}</h3>

              <div className="totals-grid">
                {/* Primary Line Totals */}
                <div className="totals-section primary-totals">
                  <h4>Primary Line</h4>
                  <div className="totals-row">
                    <span className="total-label">Trims:</span>
                    <span className="total-value">{sectionTotals.primaryTrims}</span>
                  </div>
                  <div className="totals-row">
                    <span className="total-label">Removals:</span>
                    <span className="total-value">{sectionTotals.primaryRemovals}</span>
                  </div>
                  <div className="totals-row">
                    <span className="total-label">Hazards:</span>
                    <span className="total-value">{sectionTotals.primaryHazards}</span>
                  </div>
                  <div className="totals-row total-row-highlight">
                    <span className="total-label"><strong>Primary Units:</strong></span>
                    <span className="total-value"><strong>{sectionTotals.primaryTrims + sectionTotals.primaryRemovals + sectionTotals.primaryHazards}</strong></span>
                  </div>
                  {section.distance > 0 && (
                    <div className="totals-row total-row-metric">
                      <span className="total-label">Trees per Mile:</span>
                      <span className="total-value">
                        {((sectionTotals.primaryTrims + sectionTotals.primaryRemovals + sectionTotals.primaryHazards) / section.distance).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Secondary Line Totals */}
                <div className="totals-section secondary-totals">
                  <h4>Secondary Line</h4>
                  <div className="totals-row">
                    <span className="total-label">Trims:</span>
                    <span className="total-value">{sectionTotals.secondaryTrims}</span>
                  </div>
                  <div className="totals-row">
                    <span className="total-label">Removals:</span>
                    <span className="total-value">{sectionTotals.secondaryRemovals}</span>
                  </div>
                  <div className="totals-row total-row-highlight">
                    <span className="total-label"><strong>Secondary Units:</strong></span>
                    <span className="total-value"><strong>{sectionTotals.secondaryTrims + sectionTotals.secondaryRemovals}</strong></span>
                  </div>
                </div>

                {/* Brush Totals */}
                <div className="totals-section brush-totals">
                  <h4>Brush</h4>
                  <div className="totals-row">
                    <span className="total-label">Total Quarter Spans:</span>
                    <span className="total-value">{sectionTotals.totalBrush}</span>
                  </div>
                </div>
              </div>
            </div>

            {workLocationsWithGPS.length > 0 && (
              <WorkLocationMap
                workLocations={workLocationsWithGPS}
                onLocationClick={handleLocationClick}
              />
            )}

            <div className="work-location-list">
              <h3>Work Locations List</h3>
              <div className="list-view">
                <table className="work-location-table">
                  <thead>
                    <tr>
                      <th>Number</th>
                      <th>Address</th>
                      <th>Trees</th>
                      <th>Comments</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workLocations.map(location => {
                      const locationGPS = workLocationsWithGPS.find(l => l.id === location.id);
                      return (
                        <tr key={location.id} onClick={() => handleLocationClick(location)} style={{ cursor: 'pointer' }}>
                          <td>{location.number || '-'}</td>
                          <td>{location.address}</td>
                          <td>{locationGPS?.treeCount || 0}</td>
                          <td>{location.comments || '-'}</td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => handleEditLocation(location)} className="btn-small btn-primary" style={{ marginRight: '0.5rem' }}>
                              Edit
                            </button>
                            <button onClick={() => handleDeleteLocation(location.id)} className="btn-small btn-danger">
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SectionList;
