import React, { useState, useEffect } from 'react';

function CircuitManagement({ onBack }) {
  const [headquarters, setHeadquarters] = useState([]);
  const [substations, setSubstations] = useState([]);
  const [circuits, setCircuits] = useState([]);
  const [filteredCircuits, setFilteredCircuits] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCircuit, setEditingCircuit] = useState(null);
  const [selectedHQ, setSelectedHQ] = useState('');
  const [selectedSubstation, setSelectedSubstation] = useState('');
  const [formCircuitName, setFormCircuitName] = useState('');
  const [formCircuitNumber, setFormCircuitNumber] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCircuits(circuits);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = circuits.filter(c =>
        c.circuit_name.toLowerCase().includes(term) ||
        c.circuit_number.toLowerCase().includes(term) ||
        c.substation_name.toLowerCase().includes(term) ||
        c.hq_name.toLowerCase().includes(term)
      );
      setFilteredCircuits(filtered);
    }
  }, [searchTerm, circuits]);

  const loadData = async () => {
    const hqList = await window.api.getHeadquarters();
    setHeadquarters(hqList);
    await loadCircuits();
  };

  const loadCircuits = async () => {
    const circuitList = await window.api.getAllCircuits();
    setCircuits(circuitList);
    setFilteredCircuits(circuitList);
  };

  const handleHQChange = async (hqId) => {
    setSelectedHQ(hqId);
    setSelectedSubstation('');
    if (hqId) {
      const subs = await window.api.getSubstations(hqId);
      setSubstations(subs);
    } else {
      setSubstations([]);
    }
  };

  const handleAddNew = () => {
    setEditingCircuit(null);
    setSelectedHQ('');
    setSelectedSubstation('');
    setFormCircuitName('');
    setFormCircuitNumber('');
    setSubstations([]);
    setShowForm(true);
  };

  const handleEdit = async (circuit) => {
    setEditingCircuit(circuit);
    setSelectedHQ(circuit.headquarters_id);
    const subs = await window.api.getSubstations(circuit.headquarters_id);
    setSubstations(subs);
    setSelectedSubstation(circuit.substation_id);
    setFormCircuitName(circuit.circuit_name);
    setFormCircuitNumber(circuit.circuit_number);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingCircuit(null);
    setSelectedHQ('');
    setSelectedSubstation('');
    setFormCircuitName('');
    setFormCircuitNumber('');
    setSubstations([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = formCircuitName.trim();
    const number = formCircuitNumber.trim();

    if (!selectedSubstation || !name || !number) {
      alert('Please fill in all fields');
      return;
    }

    try {
      if (editingCircuit) {
        await window.api.updateCircuit(editingCircuit.circuit_id, {
          substationId: selectedSubstation,
          name,
          number
        });
      } else {
        await window.api.createCircuit({
          substationId: selectedSubstation,
          name,
          number
        });
      }

      handleCancelForm();
      await loadCircuits();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleDelete = async (circuit) => {
    if (!window.confirm(`Are you sure you want to delete circuit "${circuit.circuit_number} - ${circuit.circuit_name}"?`)) {
      return;
    }

    try {
      await window.api.deleteCircuit(circuit.circuit_id);
      await loadCircuits();
    } catch (error) {
      alert(error.message || 'Cannot delete circuit - it may be in use.');
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <button onClick={onBack} className="btn btn-secondary">Back</button>
        <h2>Circuit Management</h2>
      </div>

      <div className="admin-container">
        <div className="toolbar">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search circuits, substations, or headquarters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button onClick={handleAddNew} className="btn btn-primary">
            Add Circuit
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="admin-form">
            <h3>{editingCircuit ? 'Edit Circuit' : 'Add New Circuit'}</h3>
            <div className="form-grid-3">
              <div className="form-group">
                <label htmlFor="hqSelect">Headquarters:</label>
                <select
                  id="hqSelect"
                  value={selectedHQ}
                  onChange={(e) => handleHQChange(e.target.value)}
                  required
                >
                  <option value="">Select Headquarters</option>
                  {headquarters.map(hq => (
                    <option key={hq.id} value={hq.id}>
                      {hq.abbreviation} - {hq.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="substationSelect">Substation:</label>
                <select
                  id="substationSelect"
                  value={selectedSubstation}
                  onChange={(e) => setSelectedSubstation(e.target.value)}
                  required
                  disabled={!selectedHQ}
                >
                  <option value="">Select Substation</option>
                  {substations.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.number} - {sub.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="circuitNumber">Circuit Number:</label>
                <input
                  type="text"
                  id="circuitNumber"
                  value={formCircuitNumber}
                  onChange={(e) => setFormCircuitNumber(e.target.value)}
                  placeholder="e.g., 101"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="circuitName">Circuit Name:</label>
              <input
                type="text"
                id="circuitName"
                value={formCircuitName}
                onChange={(e) => setFormCircuitName(e.target.value)}
                placeholder="e.g., Main Street Circuit"
                required
              />
            </div>
            <div className="form-actions">
              <button type="button" onClick={handleCancelForm} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingCircuit ? 'Update Circuit' : 'Create Circuit'}
              </button>
            </div>
          </form>
        )}

        <div className="admin-list">
          <div className="admin-count">
            Showing {filteredCircuits.length} of {circuits.length} circuits
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>HQ</th>
                <th>Substation</th>
                <th>Circuit Number</th>
                <th>Circuit Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCircuits.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state">
                    {searchTerm ? 'No circuits found matching your search' : 'No circuits yet. Add your first circuit to get started.'}
                  </td>
                </tr>
              ) : (
                filteredCircuits.map(circuit => (
                  <tr key={circuit.circuit_id}>
                    <td>{circuit.hq_abbr}</td>
                    <td>{circuit.substation_number} - {circuit.substation_name}</td>
                    <td><strong>{circuit.circuit_number}</strong></td>
                    <td>{circuit.circuit_name}</td>
                    <td>
                      <button
                        onClick={() => handleEdit(circuit)}
                        className="btn-small btn-primary"
                        style={{ marginRight: '0.5rem' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(circuit)}
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

export default CircuitManagement;
