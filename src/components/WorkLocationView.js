import React, { useState, useEffect } from 'react';
import TreeForm from './TreeForm';
import TreeList from './TreeList';
import TreeMap from './TreeMap';

function WorkLocationView({ workLocation, planningMode, onBack }) {
  const [trees, setTrees] = useState([]);
  const [showTreeForm, setShowTreeForm] = useState(false);
  const [editingTree, setEditingTree] = useState(null);

  useEffect(() => {
    if (planningMode !== 'work-location') {
      loadTrees();
    }
  }, [workLocation.id, planningMode]);

  const loadTrees = async () => {
    const treeList = await window.api.getTrees(workLocation.id);
    setTrees(treeList);
  };

  const handleTreeCreated = async () => {
    setShowTreeForm(false);
    setEditingTree(null);
    await loadTrees();
  };

  const handleEditTree = (tree) => {
    setEditingTree(tree);
    setShowTreeForm(true);
  };

  const handleDeleteTree = async (treeId) => {
    if (window.confirm('Are you sure you want to delete this tree record?')) {
      await window.api.deleteTree(treeId);
      await loadTrees();
    }
  };

  const handleCancelForm = () => {
    setShowTreeForm(false);
    setEditingTree(null);
  };

  // Calculate tree counts by power line type and action type
  let primaryTrimCount, primaryRemovalCount, primaryHazardCount, secondaryTrimCount, secondaryRemovalCount;

  if (planningMode === 'work-location') {
    // Use counts from work location data
    primaryTrimCount = workLocation.primary_trims || 0;
    primaryRemovalCount = workLocation.primary_removals || 0;
    primaryHazardCount = workLocation.primary_hazards || 0;
    secondaryTrimCount = workLocation.secondary_trims || 0;
    secondaryRemovalCount = workLocation.secondary_removals || 0;
  } else {
    // Count individual trees
    primaryTrimCount = trees.filter(t => t.power_line_type === 'Primary' && t.action_type === 'Trim').length;
    primaryRemovalCount = trees.filter(t => t.power_line_type === 'Primary' && t.action_type === 'Removal').length;
    primaryHazardCount = trees.filter(t => t.power_line_type === 'Primary' && t.action_type === 'Hazard').length;
    secondaryTrimCount = trees.filter(t => t.power_line_type === 'Secondary' && t.action_type === 'Trim').length;
    secondaryRemovalCount = trees.filter(t => t.power_line_type === 'Secondary' && t.action_type === 'Removal').length;
  }

  // Group trees by power line type and action type
  const primaryTrimTrees = trees.filter(t => t.power_line_type === 'Primary' && t.action_type === 'Trim');
  const primaryRemovalTrees = trees.filter(t => t.power_line_type === 'Primary' && t.action_type === 'Removal');
  const primaryHazardTrees = trees.filter(t => t.power_line_type === 'Primary' && t.action_type === 'Hazard');

  const secondaryTrimTrees = trees.filter(t => t.power_line_type === 'Secondary' && t.action_type === 'Trim');
  const secondaryRemovalTrees = trees.filter(t => t.power_line_type === 'Secondary' && t.action_type === 'Removal');

  return (
    <div className="work-location-view">
      <div className="view-header">
        <button onClick={onBack} className="btn btn-secondary">Back to Work Locations</button>
        <h2>
          {workLocation.number && `#${workLocation.number} - `}
          {workLocation.address}
        </h2>
      </div>

      <div className="location-info">
        {workLocation.comments && (
          <p><strong>Comments:</strong> {workLocation.comments}</p>
        )}
        {workLocation.ownership_type && (
          <p><strong>Ownership Type:</strong> {workLocation.ownership_type}</p>
        )}
        {workLocation.notification_type && (
          <p><strong>Notification Type:</strong> {workLocation.notification_type}</p>
        )}
        {(workLocation.clearing_equipment_1 || workLocation.clearing_equipment_2 || workLocation.clearing_equipment_3) && (
          <p><strong>Clearing Equipment:</strong>{' '}
            {[workLocation.clearing_equipment_1, workLocation.clearing_equipment_2, workLocation.clearing_equipment_3]
              .filter(item => item && item !== 'NA')
              .join(', ')}
          </p>
        )}
        {(workLocation.cleanup_code_1 || workLocation.cleanup_code_2) && (
          <p><strong>Clean-up Codes:</strong>{' '}
            {[workLocation.cleanup_code_1, workLocation.cleanup_code_2]
              .filter(item => item && item !== 'NA')
              .join(', ')}
          </p>
        )}
        {workLocation.brush_quarter_spans && (
          <p><strong>Brush (Quarter Spans):</strong> {workLocation.brush_quarter_spans}</p>
        )}
      </div>

      <div className="tree-summary-container">
        <h3>Primary Power Lines</h3>
        <div className="tree-summary">
          <div className="summary-box trim-box">
            <span className="summary-label">Trims:</span>
            <span className="summary-count">{primaryTrimCount}</span>
          </div>
          <div className="summary-box removal-box">
            <span className="summary-label">Removals:</span>
            <span className="summary-count">{primaryRemovalCount}</span>
          </div>
          <div className="summary-box hazard-box">
            <span className="summary-label">Hazards:</span>
            <span className="summary-count">{primaryHazardCount}</span>
          </div>
        </div>

        <h3>Secondary Power Lines</h3>
        <div className="tree-summary">
          <div className="summary-box trim-box">
            <span className="summary-label">Trims:</span>
            <span className="summary-count">{secondaryTrimCount}</span>
          </div>
          <div className="summary-box removal-box">
            <span className="summary-label">Removals:</span>
            <span className="summary-count">{secondaryRemovalCount}</span>
          </div>
        </div>
      </div>

      {planningMode === 'work-location' && (
        <div className="info-message" style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#e3f2fd', borderRadius: '8px', color: '#1976d2' }}>
          <p style={{ margin: 0 }}>
            <strong>Work Location Mode:</strong> This work location uses aggregate tree counts. Individual tree details are not recorded in this planning mode.
          </p>
        </div>
      )}

      {planningMode !== 'work-location' && (
        <div className="trees-container">
          <div className="toolbar">
            <h3>Trees ({trees.length})</h3>
            {!showTreeForm && (
              <button onClick={() => setShowTreeForm(true)} className="btn btn-primary">
                Add Tree
              </button>
            )}
          </div>

          {showTreeForm && (
            <TreeForm
              workLocationId={workLocation.id}
              editingTree={editingTree}
              onTreeSaved={handleTreeCreated}
              onCancel={handleCancelForm}
            />
          )}

          {trees.length > 0 && <TreeMap trees={trees} />}

        {/* Primary Power Lines Trees */}
        {(primaryTrimCount > 0 || primaryRemovalCount > 0 || primaryHazardCount > 0) && (
          <div className="power-line-group">
            <h3 className="power-line-header primary-header">Primary Power Lines</h3>

            {primaryTrimCount > 0 && (
              <div className="tree-section trim-section">
                <h4 className="tree-section-header">Trims ({primaryTrimCount})</h4>
                <TreeList
                  trees={primaryTrimTrees}
                  onEdit={handleEditTree}
                  onDelete={handleDeleteTree}
                />
              </div>
            )}

            {primaryRemovalCount > 0 && (
              <div className="tree-section removal-section">
                <h4 className="tree-section-header">Removals ({primaryRemovalCount})</h4>
                <TreeList
                  trees={primaryRemovalTrees}
                  onEdit={handleEditTree}
                  onDelete={handleDeleteTree}
                />
              </div>
            )}

            {primaryHazardCount > 0 && (
              <div className="tree-section hazard-section">
                <h4 className="tree-section-header">Hazards ({primaryHazardCount})</h4>
                <TreeList
                  trees={primaryHazardTrees}
                  onEdit={handleEditTree}
                  onDelete={handleDeleteTree}
                />
              </div>
            )}
          </div>
        )}

        {/* Secondary Power Lines Trees */}
        {(secondaryTrimCount > 0 || secondaryRemovalCount > 0) && (
          <div className="power-line-group">
            <h3 className="power-line-header secondary-header">Secondary Power Lines</h3>

            {secondaryTrimCount > 0 && (
              <div className="tree-section trim-section">
                <h4 className="tree-section-header">Trims ({secondaryTrimCount})</h4>
                <TreeList
                  trees={secondaryTrimTrees}
                  onEdit={handleEditTree}
                  onDelete={handleDeleteTree}
                />
              </div>
            )}

            {secondaryRemovalCount > 0 && (
              <div className="tree-section removal-section">
                <h4 className="tree-section-header">Removals ({secondaryRemovalCount})</h4>
                <TreeList
                  trees={secondaryRemovalTrees}
                  onEdit={handleEditTree}
                  onDelete={handleDeleteTree}
                />
              </div>
            )}
          </div>
        )}

          {trees.length === 0 && !showTreeForm && (
            <div className="empty-state">
              <p>No trees recorded yet. Add your first tree to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default WorkLocationView;
