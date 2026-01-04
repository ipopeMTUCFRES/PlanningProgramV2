import React, { useState, useEffect } from 'react';

function HeadquartersManagement({ onBack }) {
  const [headquarters, setHeadquarters] = useState([]);
  const [filteredHQ, setFilteredHQ] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingHQ, setEditingHQ] = useState(null);
  const [formAbbr, setFormAbbr] = useState('');
  const [formName, setFormName] = useState('');

  useEffect(() => {
    loadHeadquarters();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredHQ(headquarters);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = headquarters.filter(hq =>
        hq.abbreviation.toLowerCase().includes(term) ||
        hq.name.toLowerCase().includes(term)
      );
      setFilteredHQ(filtered);
    }
  }, [searchTerm, headquarters]);

  const loadHeadquarters = async () => {
    const hqList = await window.api.getHeadquarters();
    setHeadquarters(hqList);
    setFilteredHQ(hqList);
  };

  const handleAddNew = () => {
    setEditingHQ(null);
    setFormAbbr('');
    setFormName('');
    setShowForm(true);
  };

  const handleEdit = (hq) => {
    setEditingHQ(hq);
    setFormAbbr(hq.abbreviation);
    setFormName(hq.name);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingHQ(null);
    setFormAbbr('');
    setFormName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const abbreviation = formAbbr.trim().toUpperCase();
    const name = formName.trim();

    if (!abbreviation || !name) {
      alert('Please enter both abbreviation and name');
      return;
    }

    try {
      if (editingHQ) {
        await window.api.updateHeadquarter(editingHQ.id, { abbreviation, name });
      } else {
        await window.api.createHeadquarter({ abbreviation, name });
      }

      handleCancelForm();
      await loadHeadquarters();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleDelete = async (hq) => {
    if (!window.confirm(`Are you sure you want to delete "${hq.abbreviation} - ${hq.name}"?\n\nThis will also delete all associated substations and circuits.`)) {
      return;
    }

    try {
      await window.api.deleteHeadquarter(hq.id);
      await loadHeadquarters();
    } catch (error) {
      alert(error.message || 'Cannot delete headquarters - it may be in use.');
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <button onClick={onBack} className="btn btn-secondary">Back</button>
        <h2>Headquarters Management</h2>
      </div>

      <div className="admin-container">
        <div className="toolbar">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by abbreviation or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button onClick={handleAddNew} className="btn btn-primary">
            Add Headquarters
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="admin-form">
            <h3>{editingHQ ? 'Edit Headquarters' : 'Add New Headquarters'}</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="hqAbbr">Abbreviation:</label>
                <input
                  type="text"
                  id="hqAbbr"
                  value={formAbbr}
                  onChange={(e) => setFormAbbr(e.target.value)}
                  placeholder="e.g., GRE"
                  maxLength="10"
                  required
                  autoFocus
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="hqName">Name:</label>
                <input
                  type="text"
                  id="hqName"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Great Lakes Energy"
                  required
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" onClick={handleCancelForm} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingHQ ? 'Update Headquarters' : 'Create Headquarters'}
              </button>
            </div>
          </form>
        )}

        <div className="admin-list">
          <div className="admin-count">
            Showing {filteredHQ.length} of {headquarters.length} headquarters
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Abbreviation</th>
                <th>Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHQ.length === 0 ? (
                <tr>
                  <td colSpan="3" className="empty-state">
                    {searchTerm ? 'No headquarters found matching your search' : 'No headquarters yet. Add your first headquarters to get started.'}
                  </td>
                </tr>
              ) : (
                filteredHQ.map(hq => (
                  <tr key={hq.id}>
                    <td><strong>{hq.abbreviation}</strong></td>
                    <td>{hq.name}</td>
                    <td>
                      <button
                        onClick={() => handleEdit(hq)}
                        className="btn-small btn-primary"
                        style={{ marginRight: '0.5rem' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(hq)}
                        className="btn-small btn-danger"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default HeadquartersManagement;
