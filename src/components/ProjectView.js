import React, { useState, useEffect } from 'react';
import SectionList from './SectionList';

function ProjectView({ project, onBack }) {
  const [sections, setSections] = useState([]);
  const [showCreateSection, setShowCreateSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionDistance, setNewSectionDistance] = useState('');
  const [selectedSection, setSelectedSection] = useState(null);
  const [editingSection, setEditingSection] = useState(null);

  useEffect(() => {
    loadSections();
  }, [project.id]);

  const loadSections = async () => {
    const sectionList = await window.api.getSections(project.id);
    setSections(sectionList);
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();

    if (!newSectionName) {
      alert('Please enter a section name');
      return;
    }

    if (editingSection) {
      await window.api.updateSection(editingSection.id, {
        name: newSectionName,
        distance: newSectionDistance ? parseFloat(newSectionDistance) : 0
      });
    } else {
      await window.api.createSection({
        projectId: project.id,
        name: newSectionName,
        distance: newSectionDistance ? parseFloat(newSectionDistance) : 0
      });
    }

    setNewSectionName('');
    setNewSectionDistance('');
    setShowCreateSection(false);
    setEditingSection(null);
    await loadSections();
  };

  const handleEditSection = (section) => {
    setEditingSection(section);
    setNewSectionName(section.name);
    setNewSectionDistance(section.distance || '');
    setShowCreateSection(true);
  };

  const handleDeleteSection = async (sectionId) => {
    if (window.confirm('Are you sure you want to delete this section? All work locations and trees in this section will also be deleted.')) {
      await window.api.deleteSection(sectionId);
      await loadSections();
    }
  };

  const handleSectionClick = (section) => {
    setSelectedSection(section);
  };

  const handleBackToSections = () => {
    setSelectedSection(null);
  };

  const handleExportSection = async (sectionId) => {
    const result = await window.api.exportSection(sectionId);
    if (result.success) {
      alert(`Section exported successfully to ${result.filePath}`);
    } else {
      alert(`Export failed: ${result.message}`);
    }
  };

  const handleImportSection = async () => {
    const result = await window.api.importSection(project.id);
    if (result.success) {
      alert(result.message);
      await loadSections();
    } else if (result.message !== 'Import canceled') {
      alert(`Import failed: ${result.message}`);
    }
  };

  if (selectedSection) {
    return (
      <SectionList
        section={selectedSection}
        onBack={handleBackToSections}
      />
    );
  }

  return (
    <div className="project-view">
      <div className="view-header">
        <button onClick={onBack} className="btn btn-secondary">Back to Projects</button>
        <h2>{project.name}</h2>
      </div>

      <div className="project-info">
        <p><strong>Headquarters:</strong> {project.headquarters_name}</p>
        <p><strong>Substation:</strong> {project.substation_name} ({project.substation_number})</p>
        <p><strong>Circuit:</strong> {project.circuit_name} ({project.circuit_number})</p>
      </div>

      <div className="sections-container">
        <div className="toolbar">
          <h3>Sections</h3>
          <div>
            <button onClick={handleImportSection} className="btn btn-secondary" style={{ marginRight: '10px' }}>
              Import Section
            </button>
            <button onClick={() => setShowCreateSection(!showCreateSection)} className="btn btn-primary">
              {showCreateSection ? 'Cancel' : 'Add Section'}
            </button>
          </div>
        </div>

        {showCreateSection && (
          <form onSubmit={handleCreateSection} className="form-container">
            <h3>{editingSection ? 'Edit Section' : 'Create Section'}</h3>
            <div className="form-group">
              <label htmlFor="sectionName">Section Name</label>
              <input
                id="sectionName"
                type="text"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="Section name"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="sectionDistance">Distance (miles)</label>
              <input
                id="sectionDistance"
                type="number"
                step="0.01"
                value={newSectionDistance}
                onChange={(e) => setNewSectionDistance(e.target.value)}
                placeholder="Enter distance in miles"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingSection ? 'Update Section' : 'Create Section'}
              </button>
              <button type="button" onClick={() => { setShowCreateSection(false); setEditingSection(null); setNewSectionName(''); setNewSectionDistance(''); }} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        )}

        {sections.length === 0 ? (
          <div className="empty-state">
            <p>No sections yet. Add your first section to organize work locations.</p>
          </div>
        ) : (
          <div className="card-grid">
            {sections.map(section => (
              <div key={section.id} className="card">
                <div onClick={() => handleSectionClick(section)}>
                  <h4>{section.name}</h4>
                  <p className="date">Created: {new Date(section.created_at).toLocaleDateString()}</p>
                </div>
                <div className="card-actions">
                  <button onClick={(e) => { e.stopPropagation(); handleExportSection(section.id); }} className="btn-small btn-secondary">
                    Export
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleEditSection(section); }} className="btn-small btn-primary">
                    Edit
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }} className="btn-small btn-danger">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectView;
