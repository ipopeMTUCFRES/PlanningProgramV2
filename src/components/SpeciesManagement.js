import React, { useState, useEffect } from 'react';

function SpeciesManagement({ onBack }) {
  const [species, setSpecies] = useState([]);
  const [filteredSpecies, setFilteredSpecies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSpecies, setEditingSpecies] = useState(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');

  useEffect(() => {
    loadSpecies();
  }, []);

  useEffect(() => {
    // Filter species based on search term
    if (searchTerm.trim() === '') {
      setFilteredSpecies(species);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = species.filter(s =>
        s.code.toLowerCase().includes(term) ||
        s.name.toLowerCase().includes(term)
      );
      setFilteredSpecies(filtered);
    }
  }, [searchTerm, species]);

  const loadSpecies = async () => {
    const speciesList = await window.api.getSpecies();
    setSpecies(speciesList);
    setFilteredSpecies(speciesList);
  };

  const handleAddNew = () => {
    setEditingSpecies(null);
    setFormCode('');
    setFormName('');
    setShowForm(true);
  };

  const handleEdit = (speciesItem) => {
    setEditingSpecies(speciesItem);
    setFormCode(speciesItem.code);
    setFormName(speciesItem.name);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingSpecies(null);
    setFormCode('');
    setFormName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const code = formCode.trim().toUpperCase();
    const name = formName.trim();

    if (!code || !name) {
      alert('Please enter both species code and name');
      return;
    }

    // Check for duplicate code (only if creating new or changing code)
    if (!editingSpecies || editingSpecies.code !== code) {
      const duplicate = species.find(s => s.code === code);
      if (duplicate) {
        alert(`Species code "${code}" already exists for "${duplicate.name}"`);
        return;
      }
    }

    try {
      if (editingSpecies) {
        await window.api.updateSpecies(editingSpecies.id, { code, name });
      } else {
        await window.api.createSpecies({ code, name });
      }

      handleCancelForm();
      await loadSpecies();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleDelete = async (speciesItem) => {
    if (!window.confirm(`Are you sure you want to delete "${speciesItem.code} - ${speciesItem.name}"?\n\nThis will fail if the species is currently in use.`)) {
      return;
    }

    try {
      const result = await window.api.deleteSpecies(speciesItem.id);
      if (result.success) {
        await loadSpecies();
      }
    } catch (error) {
      alert(error.message || 'Cannot delete species - it is currently in use by existing trees.');
    }
  };

  return (
    <div className="species-management">
      <div className="view-header">
        <button onClick={onBack} className="btn btn-secondary">Back to Mode Selection</button>
        <h2>Species Management</h2>
      </div>

      <div className="species-container">
        <div className="toolbar">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by code or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button onClick={handleAddNew} className="btn btn-primary">
            Add Species
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="species-form">
            <h3>{editingSpecies ? 'Edit Species' : 'Add New Species'}</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="speciesCode">Species Code (Abbreviation):</label>
                <input
                  type="text"
                  id="speciesCode"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="e.g., ACRU"
                  maxLength="10"
                  required
                  autoFocus
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="speciesName">Species Name:</label>
                <input
                  type="text"
                  id="speciesName"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Red Maple"
                  required
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" onClick={handleCancelForm} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingSpecies ? 'Update Species' : 'Create Species'}
              </button>
            </div>
          </form>
        )}

        <div className="species-list">
          <div className="species-count">
            Showing {filteredSpecies.length} of {species.length} species
          </div>

          <table className="species-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSpecies.length === 0 ? (
                <tr>
                  <td colSpan="3" className="empty-state">
                    {searchTerm ? 'No species found matching your search' : 'No species yet. Add your first species to get started.'}
                  </td>
                </tr>
              ) : (
                filteredSpecies.map(speciesItem => (
                  <tr key={speciesItem.id}>
                    <td><strong>{speciesItem.code}</strong></td>
                    <td>{speciesItem.name}</td>
                    <td>
                      <button
                        onClick={() => handleEdit(speciesItem)}
                        className="btn-small btn-primary"
                        style={{ marginRight: '0.5rem' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(speciesItem)}
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

export default SpeciesManagement;
