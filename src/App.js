import React, { useState, useEffect } from 'react';
import ModeSelector from './components/ModeSelector';
import ProjectList from './components/ProjectList';
import ProjectView from './components/ProjectView';
import CreateProject from './components/CreateProject';
import SpeciesManagement from './components/SpeciesManagement';
import HeadquartersManagement from './components/HeadquartersManagement';
import CircuitManagement from './components/CircuitManagement';
import Settings from './components/Settings';

function App() {
  const [mode, setMode] = useState(null); // 'individual-tree-planning', 'work-location-planning', or 'administration'
  const [view, setView] = useState('projects');
  const [adminView, setAdminView] = useState('menu'); // 'menu', 'species', 'headquarters', 'circuits'
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const projectList = await window.api.getProjects();
    setProjects(projectList);
  };

  const handleProjectCreated = async () => {
    await loadProjects();
    setView('projects');
    setEditingProject(null);
  };

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setView('project-view');
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setView('create-project');
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project? All sections, work locations, and trees in this project will also be deleted.')) {
      await window.api.deleteProject(projectId);
      await loadProjects();
    }
  };

  const handleBack = () => {
    setView('projects');
    setSelectedProject(null);
  };

  const handleCancelCreate = () => {
    setView('projects');
    setEditingProject(null);
  };

  const handleSelectMode = (selectedMode) => {
    setMode(selectedMode);
  };

  const handleBackToModeSelector = () => {
    setMode(null);
    setView('projects');
    setAdminView('menu');
    setSelectedProject(null);
    setEditingProject(null);
  };

  // Show mode selector if no mode is selected
  if (!mode) {
    return <ModeSelector onSelectMode={handleSelectMode} />;
  }

  // Administration mode
  if (mode === 'administration') {
    return (
      <div className="app">
        <header className="app-header">
          <h1>Tree Inventory Management - Administration <span className="version-badge">v1.0.0</span></h1>
          <button className="settings-icon-btn" onClick={() => setShowSettings(true)} title="Settings">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2"></circle>
              <circle cx="12" cy="12" r="2"></circle>
              <circle cx="12" cy="19" r="2"></circle>
            </svg>
          </button>
        </header>
        <main className="app-main">
          {adminView === 'menu' && (
            <div className="admin-menu">
              <h2>Administration</h2>
              <p className="admin-subtitle">Select what you would like to manage</p>
              <div className="admin-menu-grid">
                <div className="admin-menu-card" onClick={() => setAdminView('species')}>
                  <h3>Species Management</h3>
                  <p>Add, edit, or remove tree species codes and names</p>
                  <button className="btn btn-primary">Manage Species</button>
                </div>
                <div className="admin-menu-card" onClick={() => setAdminView('headquarters')}>
                  <h3>Headquarters Management</h3>
                  <p>Add, edit, or remove headquarters locations</p>
                  <button className="btn btn-primary">Manage Headquarters</button>
                </div>
                <div className="admin-menu-card" onClick={() => setAdminView('circuits')}>
                  <h3>Circuit Management</h3>
                  <p>Add, edit, or remove circuits and substations</p>
                  <button className="btn btn-primary">Manage Circuits</button>
                </div>
              </div>
              <div style={{ marginTop: '2rem' }}>
                <button onClick={handleBackToModeSelector} className="btn btn-secondary">
                  Back to Mode Selection
                </button>
              </div>
            </div>
          )}
          {adminView === 'species' && (
            <SpeciesManagement onBack={() => setAdminView('menu')} />
          )}
          {adminView === 'headquarters' && (
            <HeadquartersManagement onBack={() => setAdminView('menu')} />
          )}
          {adminView === 'circuits' && (
            <CircuitManagement onBack={() => setAdminView('menu')} />
          )}
        </main>
        <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
      </div>
    );
  }

  // Planning modes
  const planningModeTitle = mode === 'individual-tree-planning'
    ? 'Individual Tree - Planning'
    : 'Work Location - Planning';

  const planningModeType = mode === 'individual-tree-planning'
    ? 'individual-tree'
    : 'work-location';

  // Filter projects by planning mode
  const filteredProjects = projects.filter(p => p.planning_mode === planningModeType);

  return (
    <div className="app">
      <header className="app-header">
        <h1>{planningModeTitle} <span className="version-badge">v1.0.0</span></h1>
        <div className="header-buttons">
          <button className="settings-icon-btn" onClick={() => setShowSettings(true)} title="Settings">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2"></circle>
              <circle cx="12" cy="12" r="2"></circle>
              <circle cx="12" cy="19" r="2"></circle>
            </svg>
          </button>
          <button onClick={handleBackToModeSelector} className="btn btn-secondary mode-switch-btn">
            Change Mode
          </button>
        </div>
      </header>

      <main className="app-main">
        {view === 'projects' && (
          <div>
            <div className="toolbar">
              <button onClick={() => setView('create-project')} className="btn btn-primary">
                Create New Project
              </button>
            </div>
            <ProjectList
              projects={filteredProjects}
              onSelectProject={handleProjectSelect}
              onEditProject={handleEditProject}
              onDeleteProject={handleDeleteProject}
            />
          </div>
        )}

        {view === 'create-project' && (
          <CreateProject
            editingProject={editingProject}
            planningMode={planningModeType}
            onProjectCreated={handleProjectCreated}
            onCancel={handleCancelCreate}
          />
        )}

        {view === 'project-view' && selectedProject && (
          <ProjectView project={selectedProject} planningMode={selectedProject.planning_mode} onBack={handleBack} />
        )}
      </main>
      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}

export default App;
