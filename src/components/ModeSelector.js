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
            <div className="mode-card-simple" onClick={() => onSelectMode('individual-tree-planning')}>
              <h3>Individual Tree - Planning</h3>
              <p>Record individual trees with detailed data for each tree at work locations</p>
              <button className="btn btn-primary">Enter Individual Tree Mode</button>
            </div>

            <div className="mode-card-simple" onClick={() => onSelectMode('work-location-planning')}>
              <h3>Work Location - Planning</h3>
              <p>Record tree counts by work location without individual tree details</p>
              <button className="btn btn-primary">Enter Work Location Mode</button>
            </div>

            <div className="mode-card-simple" onClick={() => onSelectMode('administration')}>
              <h3>Administration Mode</h3>
              <p>Manage species codes, headquarters, circuits, and system settings</p>
              <button className="btn btn-primary">Enter Administration Mode</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ModeSelector;
