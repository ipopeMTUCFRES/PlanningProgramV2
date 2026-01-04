import React from 'react';

function TreeList({ trees, onEdit, onDelete }) {
  if (trees.length === 0) {
    return (
      <div className="empty-state">
        <p>No trees recorded yet. Add your first tree to get started.</p>
      </div>
    );
  }

  return (
    <div className="tree-list">
      <table className="data-table">
        <thead>
          <tr>
            <th>Species</th>
            <th>Diameter (in)</th>
            <th>Power Line</th>
            <th>Action</th>
            <th>Canopy Removal</th>
            <th>GPS</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {trees.map(tree => (
            <tr key={tree.id}>
              <td>
                {tree.species_name ? (
                  <span>
                    <strong>{tree.species}</strong> - {tree.species_name}
                  </span>
                ) : (
                  <span>{tree.species}</span>
                )}
              </td>
              <td>{tree.diameter}</td>
              <td>{tree.power_line_type}</td>
              <td>{tree.action_type}</td>
              <td>{tree.canopy_removal ? 'Yes' : 'No'}</td>
              <td>
                {tree.latitude && tree.longitude ? (
                  <span className="gps-coords">
                    {tree.latitude.toFixed(6)}, {tree.longitude.toFixed(6)}
                  </span>
                ) : (
                  <span className="no-gps">No GPS</span>
                )}
              </td>
              <td>
                <button onClick={() => onEdit(tree)} className="btn-small btn-primary">
                  Edit
                </button>
                <button onClick={() => onDelete(tree.id)} className="btn-small btn-danger">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TreeList;
