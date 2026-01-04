import React, { useState, useEffect } from 'react';

function CreateProject({ editingProject, onProjectCreated, onCancel }) {
  const [name, setName] = useState('');
  const [headquarters, setHeadquarters] = useState([]);
  const [substations, setSubstations] = useState([]);
  const [circuits, setCircuits] = useState([]);

  const [selectedHQ, setSelectedHQ] = useState('');
  const [selectedSubstation, setSelectedSubstation] = useState('');
  const [selectedCircuit, setSelectedCircuit] = useState('');

  useEffect(() => {
    loadHeadquarters();
  }, []);

  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name);
      setSelectedHQ(editingProject.headquarters_id.toString());
      setSelectedSubstation(editingProject.substation_id.toString());
      setSelectedCircuit(editingProject.circuit_id.toString());

      // Load substations and circuits for the editing project
      const loadEditData = async () => {
        const substationList = await window.api.getSubstations(editingProject.headquarters_id);
        setSubstations(substationList);

        const circuitList = await window.api.getCircuits(editingProject.substation_id);
        setCircuits(circuitList);
      };

      loadEditData();
    }
  }, [editingProject]);

  const loadHeadquarters = async () => {
    const hqList = await window.api.getHeadquarters();
    setHeadquarters(hqList);
  };

  const handleHQChange = async (hqId) => {
    setSelectedHQ(hqId);
    setSelectedSubstation('');
    setSelectedCircuit('');
    setCircuits([]);

    if (hqId) {
      const substationList = await window.api.getSubstations(parseInt(hqId));
      setSubstations(substationList);
    } else {
      setSubstations([]);
    }
  };

  const handleSubstationChange = async (substationId) => {
    setSelectedSubstation(substationId);
    setSelectedCircuit('');

    if (substationId) {
      const circuitList = await window.api.getCircuits(parseInt(substationId));
      setCircuits(circuitList);
    } else {
      setCircuits([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !selectedHQ || !selectedSubstation || !selectedCircuit) {
      alert('Please fill in all fields');
      return;
    }

    if (editingProject) {
      await window.api.updateProject(editingProject.id, {
        name,
        headquartersId: parseInt(selectedHQ),
        substationId: parseInt(selectedSubstation),
        circuitId: parseInt(selectedCircuit)
      });
    } else {
      await window.api.createProject({
        name,
        headquartersId: parseInt(selectedHQ),
        substationId: parseInt(selectedSubstation),
        circuitId: parseInt(selectedCircuit)
      });
    }

    onProjectCreated();
  };

  return (
    <div className="form-container">
      <h2>{editingProject ? 'Edit Project' : 'Create New Project'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Project Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="headquarters">Headquarters:</label>
          <select
            id="headquarters"
            value={selectedHQ}
            onChange={(e) => handleHQChange(e.target.value)}
            required
          >
            <option value="">Select Headquarters</option>
            {headquarters.map(hq => (
              <option key={hq.id} value={hq.id}>
                {hq.name} ({hq.abbreviation})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="substation">Substation:</label>
          <select
            id="substation"
            value={selectedSubstation}
            onChange={(e) => handleSubstationChange(e.target.value)}
            disabled={!selectedHQ}
            required
          >
            <option value="">Select Substation</option>
            {substations.map(sub => (
              <option key={sub.id} value={sub.id}>
                {sub.name} ({sub.number})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="circuit">Circuit:</label>
          <select
            id="circuit"
            value={selectedCircuit}
            onChange={(e) => setSelectedCircuit(e.target.value)}
            disabled={!selectedSubstation}
            required
          >
            <option value="">Select Circuit</option>
            {circuits.map(circuit => (
              <option key={circuit.id} value={circuit.id}>
                {circuit.name} ({circuit.number})
              </option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {editingProject ? 'Update Project' : 'Create Project'}
          </button>
          <button type="button" onClick={onCancel} className="btn btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default CreateProject;
