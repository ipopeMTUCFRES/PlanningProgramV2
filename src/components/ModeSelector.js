import React from 'react';

function ModeSelector({ onSelectMode }) {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Tree Inventory Management System</h1>
      </header>

      <main className="app-main">
        <div className="mode-selector-content">
          <h2>Select Mode</h2>
          <p className="mode-subtitle">Choose how you would like to use the system</p>

          <div className="mode-grid">
            <div className="mode-card-simple" onClick={() => onSelectMode('planning')}>
              <h3>Planning Mode</h3>
              <p>Manage projects, sections, work locations, and tree inventory data</p>
              <button className="btn btn-primary">Enter Planning Mode</button>
            </div>

            <div className="mode-card-simple" onClick={() => onSelectMode('administration')}>
              <h3>Administration Mode</h3>
              <p>Manage species codes, headquarters, circuits, and system settings</p>
              <button className="btn btn-secondary">Enter Administration Mode</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ModeSelector;
