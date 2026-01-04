import React, { useState, useEffect } from 'react';
import SectionList from './SectionList';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

function ProjectView({ project, planningMode, onBack }) {
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

  const handleExportSectionPDF = async (sectionId) => {
    try {
      const result = await window.api.exportSectionPDF(sectionId);

      if (!result.success) {
        alert(`Export failed: ${result.message}`);
        return;
      }

      const { section, totals, locationSummaries } = result.data;
      const filePath = result.filePath;

      // Create PDF
      const doc = new jsPDF();
      let yPos = 20;

      // Title
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text('Section Report', 105, yPos, { align: 'center' });
      yPos += 10;

      // Section name and distance
      doc.setFontSize(14);
      doc.text(section.name, 105, yPos, { align: 'center' });
      yPos += 8;

      if (section.distance > 0) {
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Distance: ${section.distance} miles`, 105, yPos, { align: 'center' });
        yPos += 10;
      } else {
        yPos += 5;
      }

      // Section Summary
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Section Summary', 14, yPos);
      yPos += 8;

      // Primary Line Summary Table
      doc.autoTable({
        startY: yPos,
        head: [['Primary Line', 'Count']],
        body: [
          ['Trims', totals.primaryTrims.toString()],
          ['Removals', totals.primaryRemovals.toString()],
          ['Hazards', totals.primaryHazards.toString()],
          ['Primary Units (Total)', (totals.primaryTrims + totals.primaryRemovals + totals.primaryHazards).toString()],
          ...(section.distance > 0 ? [['Trees per Mile', ((totals.primaryTrims + totals.primaryRemovals + totals.primaryHazards) / section.distance).toFixed(2)]] : [])
        ],
        theme: 'striped',
        headStyles: { fillColor: [52, 152, 219] },
        margin: { left: 14 },
        tableWidth: 85
      });

      yPos = doc.lastAutoTable.finalY + 10;

      // Secondary Line Summary Table
      doc.autoTable({
        startY: yPos,
        head: [['Secondary Line', 'Count']],
        body: [
          ['Trims', totals.secondaryTrims.toString()],
          ['Removals', totals.secondaryRemovals.toString()],
          ['Total', (totals.secondaryTrims + totals.secondaryRemovals).toString()]
        ],
        theme: 'striped',
        headStyles: { fillColor: [155, 89, 182] },
        margin: { left: 14 },
        tableWidth: 85
      });

      yPos = doc.lastAutoTable.finalY + 10;

      // Brush Summary
      doc.autoTable({
        startY: yPos,
        head: [['Brush', 'Quarter Spans']],
        body: [
          ['Total Brush', totals.totalBrush.toString()]
        ],
        theme: 'striped',
        headStyles: { fillColor: [46, 204, 113] },
        margin: { left: 14 },
        tableWidth: 85
      });

      // Work Locations - Start on new page
      doc.addPage();

      locationSummaries.forEach((locSummary, index) => {
        const location = locSummary.location;
        const trees = locSummary.trees;
        const counts = locSummary.counts;

        // Determine if we need a new page
        if (index === 0) {
          // First work location on the new page
          yPos = 20;
        } else {
          // Check if we need a new page for subsequent locations
          let currentY = doc.lastAutoTable.finalY || yPos;
          if (currentY > 240) {
            doc.addPage();
            yPos = 20;
          } else {
            yPos = currentY + 15;
          }
        }

        // Work Location Header
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Work Location: ${location.number || location.address}`, 14, yPos);
        yPos += 8;

        // Location Details in a structured way
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');

        const locationDetails = [];
        if (location.address) locationDetails.push(`Address: ${location.address}`);
        if (location.comments) locationDetails.push(`Comments: ${location.comments}`);
        if (location.ownership_type) locationDetails.push(`Ownership: ${location.ownership_type}`);
        if (location.notification_type) locationDetails.push(`Notification: ${location.notification_type}`);
        if (location.brush_quarter_spans) locationDetails.push(`Brush: ${location.brush_quarter_spans} quarter spans`);

        const equipment = [location.clearing_equipment_1, location.clearing_equipment_2, location.clearing_equipment_3]
          .filter(e => e && e !== 'No Listing');
        if (equipment.length > 0) locationDetails.push(`Equipment: ${equipment.join(', ')}`);

        const cleanup = [location.cleanup_code_1, location.cleanup_code_2]
          .filter(c => c && c !== 'No Listing');
        if (cleanup.length > 0) locationDetails.push(`Cleanup: ${cleanup.join(', ')}`);

        // Draw location details
        locationDetails.forEach(detail => {
          doc.text(detail, 14, yPos);
          yPos += 5;
        });

        // Add spacing after location details
        yPos += 3;

        // Tree Summary for this location
        const locationPrimaryUnits = counts.primaryTrims + counts.primaryRemovals + counts.primaryHazards;
        const locationSecondaryUnits = counts.secondaryTrims + counts.secondaryRemovals;

        if (locationPrimaryUnits > 0 || locationSecondaryUnits > 0) {
          doc.setFontSize(10);
          doc.setFont(undefined, 'bold');
          doc.text('Tree Summary:', 14, yPos);
          yPos += 6;

          doc.setFont(undefined, 'normal');
          doc.setFontSize(9);
          if (locationPrimaryUnits > 0) {
            doc.text(`Primary - Trims: ${counts.primaryTrims}, Removals: ${counts.primaryRemovals}, Hazards: ${counts.primaryHazards} (Total: ${locationPrimaryUnits})`, 14, yPos);
            yPos += 5;
          }
          if (locationSecondaryUnits > 0) {
            doc.text(`Secondary - Trims: ${counts.secondaryTrims}, Removals: ${counts.secondaryRemovals} (Total: ${locationSecondaryUnits})`, 14, yPos);
            yPos += 5;
          }
          yPos += 5;
        }

        // Check if there's enough space for table header, otherwise add new page
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }

        // Trees Table
        if (trees.length > 0) {
          const treeRows = trees.map(tree => [
            tree.species || '',
            tree.diameter || '',
            tree.power_line_type || '',
            tree.action_type || '',
            tree.canopy_removal ? 'Yes' : 'No',
            tree.latitude && tree.longitude ? `${tree.latitude.toFixed(6)}, ${tree.longitude.toFixed(6)}` : ''
          ]);

          doc.autoTable({
            startY: yPos,
            head: [['Species', 'Diameter (in)', 'Power Line', 'Action', 'Canopy Removal', 'GPS']],
            body: treeRows,
            theme: 'grid',
            headStyles: { fillColor: [52, 73, 94], fontSize: 8 },
            bodyStyles: { fontSize: 8 },
            margin: { left: 14, right: 14 },
            styles: { cellPadding: 2 },
            didDrawPage: function(data) {
              // Add a small footer space
              yPos = data.cursor.y;
            }
          });
        } else {
          doc.setFontSize(9);
          doc.setFont(undefined, 'italic');
          doc.text('No trees recorded for this location', 14, yPos);
          yPos += 10;
        }
      });

      // Save PDF file
      const pdfOutput = doc.output('arraybuffer');
      const saveResult = await window.api.savePDFFile(filePath, pdfOutput);

      if (saveResult.success) {
        alert(`PDF exported successfully to ${filePath}`);
      } else {
        alert(`Failed to save PDF: ${saveResult.message}`);
      }
    } catch (error) {
      console.error('PDF export error:', error);
      alert(`PDF export failed: ${error.message}`);
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
        planningMode={planningMode}
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
                    Excel
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleExportSectionPDF(section.id); }} className="btn-small btn-secondary">
                    PDF
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
