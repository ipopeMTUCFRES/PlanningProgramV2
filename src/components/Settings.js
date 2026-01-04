import React, { useState, useEffect } from 'react';

function Settings({ isOpen, onClose }) {
  const [fontSize, setFontSize] = useState('medium');
  const [theme, setTheme] = useState('light');

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedFontSize = localStorage.getItem('fontSize') || 'medium';
    const savedTheme = localStorage.getItem('theme') || 'light';
    setFontSize(savedFontSize);
    setTheme(savedTheme);

    // Apply settings
    applyFontSize(savedFontSize);
    applyTheme(savedTheme);
  }, []);

  const applyFontSize = (size) => {
    document.documentElement.setAttribute('data-font-size', size);
  };

  const applyTheme = (themeName) => {
    document.documentElement.setAttribute('data-theme', themeName);
  };

  const handleFontSizeChange = (e) => {
    const newSize = e.target.value;
    setFontSize(newSize);
    localStorage.setItem('fontSize', newSize);
    applyFontSize(newSize);
  };

  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="settings-section">
            <h3>Appearance</h3>

            <div className="form-group">
              <label htmlFor="theme">Theme</label>
              <select id="theme" value={theme} onChange={handleThemeChange}>
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="fontSize">Font Size</label>
              <select id="fontSize" value={fontSize} onChange={handleFontSizeChange}>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="extra-large">Extra Large</option>
              </select>
            </div>

            <div className="settings-preview">
              <p className="preview-text">Preview: This is how text will appear in the application.</p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
