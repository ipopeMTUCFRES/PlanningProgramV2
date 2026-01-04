const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const { initDatabase, getDatabase, importCSVData, importSpeciesData } = require('./database');

let mainWindow;
let db;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  db = initDatabase();

  const hqCount = db.prepare('SELECT COUNT(*) as count FROM headquarters').get();
  if (hqCount.count === 0) {
    importCSVData();
  }

  const speciesCount = db.prepare('SELECT COUNT(*) as count FROM species').get();
  if (speciesCount.count === 0) {
    importSpeciesData();
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('get-headquarters', () => {
  return db.prepare('SELECT * FROM headquarters ORDER BY name').all();
});

ipcMain.handle('get-substations', (event, headquartersId) => {
  return db.prepare('SELECT * FROM substations WHERE headquarters_id = ? ORDER BY name').all(headquartersId);
});

ipcMain.handle('get-circuits', (event, substationId) => {
  return db.prepare('SELECT * FROM circuits WHERE substation_id = ? ORDER BY name').all(substationId);
});

ipcMain.handle('create-project', (event, projectData) => {
  const stmt = db.prepare('INSERT INTO projects (name, headquarters_id, substation_id, circuit_id) VALUES (?, ?, ?, ?)');
  const result = stmt.run(projectData.name, projectData.headquartersId, projectData.substationId, projectData.circuitId);
  return { id: result.lastInsertRowid };
});

ipcMain.handle('get-projects', () => {
  return db.prepare(`
    SELECT p.*,
           h.name as headquarters_name,
           s.name as substation_name,
           s.number as substation_number,
           c.name as circuit_name,
           c.number as circuit_number
    FROM projects p
    JOIN headquarters h ON p.headquarters_id = h.id
    JOIN substations s ON p.substation_id = s.id
    JOIN circuits c ON p.circuit_id = c.id
    ORDER BY p.created_at DESC
  `).all();
});

ipcMain.handle('get-project', (event, projectId) => {
  return db.prepare(`
    SELECT p.*,
           h.name as headquarters_name,
           s.name as substation_name,
           s.number as substation_number,
           c.name as circuit_name,
           c.number as circuit_number
    FROM projects p
    JOIN headquarters h ON p.headquarters_id = h.id
    JOIN substations s ON p.substation_id = s.id
    JOIN circuits c ON p.circuit_id = c.id
    WHERE p.id = ?
  `).get(projectId);
});

ipcMain.handle('create-section', (event, sectionData) => {
  const stmt = db.prepare('INSERT INTO sections (project_id, name, distance) VALUES (?, ?, ?)');
  const result = stmt.run(sectionData.projectId, sectionData.name, sectionData.distance || 0);
  return { id: result.lastInsertRowid };
});

ipcMain.handle('get-sections', (event, projectId) => {
  return db.prepare('SELECT * FROM sections WHERE project_id = ? ORDER BY created_at').all(projectId);
});

ipcMain.handle('create-work-location', (event, workLocationData) => {
  const stmt = db.prepare(`
    INSERT INTO work_locations
    (section_id, number, address, comments, ownership_type, notification_type,
     clearing_equipment_1, clearing_equipment_2, clearing_equipment_3, cleanup_code_1, cleanup_code_2, brush_quarter_spans)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    workLocationData.sectionId,
    workLocationData.number,
    workLocationData.address,
    workLocationData.comments,
    workLocationData.ownershipType || null,
    workLocationData.notificationType || null,
    workLocationData.clearingEquipment1 || 'No Listing',
    workLocationData.clearingEquipment2 || 'No Listing',
    workLocationData.clearingEquipment3 || 'No Listing',
    workLocationData.cleanupCode1 || 'No Listing',
    workLocationData.cleanupCode2 || 'No Listing',
    workLocationData.brushQuarterSpans ? Math.ceil(workLocationData.brushQuarterSpans) : null
  );
  return { id: result.lastInsertRowid };
});

ipcMain.handle('get-work-locations', (event, sectionId) => {
  return db.prepare('SELECT * FROM work_locations WHERE section_id = ? ORDER BY created_at').all(sectionId);
});

ipcMain.handle('create-tree', (event, treeData) => {
  const stmt = db.prepare(`
    INSERT INTO trees (work_location_id, latitude, longitude, diameter, species, power_line_type, action_type, canopy_removal)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    treeData.workLocationId,
    treeData.latitude,
    treeData.longitude,
    treeData.diameter,
    treeData.species,
    treeData.powerLineType,
    treeData.actionType,
    treeData.canopyRemoval ? 1 : 0
  );
  return { id: result.lastInsertRowid };
});

ipcMain.handle('get-trees', (event, workLocationId) => {
  return db.prepare(`
    SELECT t.*, s.name as species_name
    FROM trees t
    LEFT JOIN species s ON t.species = s.code
    WHERE t.work_location_id = ?
    ORDER BY t.created_at
  `).all(workLocationId);
});

ipcMain.handle('delete-tree', (event, treeId) => {
  const stmt = db.prepare('DELETE FROM trees WHERE id = ?');
  stmt.run(treeId);
  return { success: true };
});

ipcMain.handle('update-tree', (event, treeId, treeData) => {
  const stmt = db.prepare(`
    UPDATE trees
    SET latitude = ?, longitude = ?, diameter = ?, species = ?, power_line_type = ?, action_type = ?
    WHERE id = ?
  `);
  stmt.run(
    treeData.latitude,
    treeData.longitude,
    treeData.diameter,
    treeData.species,
    treeData.powerLineType,
    treeData.actionType,
    treeId
  );
  return { success: true };
});

ipcMain.handle('get-species', () => {
  return db.prepare('SELECT * FROM species ORDER BY name').all();
});

ipcMain.handle('get-section-trees', (event, sectionId) => {
  return db.prepare(`
    SELECT t.*, wl.address, wl.number as work_location_number, wl.id as work_location_id
    FROM trees t
    JOIN work_locations wl ON t.work_location_id = wl.id
    WHERE wl.section_id = ?
    ORDER BY wl.created_at, t.created_at
  `).all(sectionId);
});

// Species management handlers
ipcMain.handle('create-species', (event, speciesData) => {
  try {
    const stmt = db.prepare('INSERT INTO species (code, name) VALUES (?, ?)');
    const result = stmt.run(speciesData.code, speciesData.name);
    return { success: true, id: result.lastInsertRowid };
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error(`Species code "${speciesData.code}" already exists`);
    }
    throw error;
  }
});

ipcMain.handle('update-species', (event, speciesId, speciesData) => {
  try {
    const oldSpecies = db.prepare('SELECT code FROM species WHERE id = ?').get(speciesId);

    if (!oldSpecies) {
      throw new Error('Species not found');
    }

    // If code is changing, update all tree records
    if (oldSpecies.code !== speciesData.code) {
      db.transaction(() => {
        // Update species table
        db.prepare('UPDATE species SET code = ?, name = ? WHERE id = ?')
          .run(speciesData.code, speciesData.name, speciesId);

        // Update all trees that reference this species
        db.prepare('UPDATE trees SET species = ? WHERE species = ?')
          .run(speciesData.code, oldSpecies.code);
      })();
    } else {
      // Just update the name
      db.prepare('UPDATE species SET name = ? WHERE id = ?')
        .run(speciesData.name, speciesId);
    }

    return { success: true };
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error(`Species code "${speciesData.code}" already exists`);
    }
    throw error;
  }
});

ipcMain.handle('delete-species', (event, speciesId) => {
  try {
    const species = db.prepare('SELECT code, name FROM species WHERE id = ?').get(speciesId);

    if (!species) {
      throw new Error('Species not found');
    }

    // Check if species is in use
    const treeCount = db.prepare('SELECT COUNT(*) as count FROM trees WHERE species = ?')
      .get(species.code).count;

    if (treeCount > 0) {
      throw new Error(`Cannot delete "${species.code} - ${species.name}" because it is used by ${treeCount} tree(s)`);
    }

    // Safe to delete
    db.prepare('DELETE FROM species WHERE id = ?').run(speciesId);
    return { success: true };
  } catch (error) {
    throw error;
  }
});

// Headquarters management handlers
ipcMain.handle('create-headquarter', (event, hqData) => {
  try {
    const stmt = db.prepare('INSERT INTO headquarters (abbreviation, name) VALUES (?, ?)');
    const result = stmt.run(hqData.abbreviation, hqData.name);
    return { success: true, id: result.lastInsertRowid };
  } catch (error) {
    throw new Error(`Cannot create headquarters: ${error.message}`);
  }
});

ipcMain.handle('update-headquarter', (event, hqId, hqData) => {
  try {
    const stmt = db.prepare('UPDATE headquarters SET abbreviation = ?, name = ? WHERE id = ?');
    stmt.run(hqData.abbreviation, hqData.name, hqId);
    return { success: true };
  } catch (error) {
    throw new Error(`Cannot update headquarters: ${error.message}`);
  }
});

ipcMain.handle('delete-headquarter', (event, hqId) => {
  try {
    const stmt = db.prepare('DELETE FROM headquarters WHERE id = ?');
    stmt.run(hqId);
    return { success: true };
  } catch (error) {
    throw new Error(`Cannot delete headquarters: ${error.message}`);
  }
});

// Circuit management handlers
ipcMain.handle('get-all-circuits', () => {
  return db.prepare(`
    SELECT
      c.id as circuit_id,
      c.name as circuit_name,
      c.number as circuit_number,
      s.id as substation_id,
      s.name as substation_name,
      s.number as substation_number,
      h.id as headquarters_id,
      h.abbreviation as hq_abbr,
      h.name as hq_name
    FROM circuits c
    JOIN substations s ON c.substation_id = s.id
    JOIN headquarters h ON s.headquarters_id = h.id
    ORDER BY h.abbreviation, s.number, c.number
  `).all();
});

ipcMain.handle('create-circuit', (event, circuitData) => {
  try {
    const stmt = db.prepare('INSERT INTO circuits (substation_id, name, number) VALUES (?, ?, ?)');
    const result = stmt.run(circuitData.substationId, circuitData.name, circuitData.number);
    return { success: true, id: result.lastInsertRowid };
  } catch (error) {
    throw new Error(`Cannot create circuit: ${error.message}`);
  }
});

ipcMain.handle('update-circuit', (event, circuitId, circuitData) => {
  try {
    const stmt = db.prepare('UPDATE circuits SET substation_id = ?, name = ?, number = ? WHERE id = ?');
    stmt.run(circuitData.substationId, circuitData.name, circuitData.number, circuitId);
    return { success: true };
  } catch (error) {
    throw new Error(`Cannot update circuit: ${error.message}`);
  }
});

ipcMain.handle('delete-circuit', (event, circuitId) => {
  try {
    const stmt = db.prepare('DELETE FROM circuits WHERE id = ?');
    stmt.run(circuitId);
    return { success: true };
  } catch (error) {
    throw new Error(`Cannot delete circuit: ${error.message}`);
  }
});

// Delete handlers
ipcMain.handle('delete-project', (event, projectId) => {
  const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
  stmt.run(projectId);
  return { success: true };
});

ipcMain.handle('delete-section', (event, sectionId) => {
  const stmt = db.prepare('DELETE FROM sections WHERE id = ?');
  stmt.run(sectionId);
  return { success: true };
});

ipcMain.handle('delete-work-location', (event, workLocationId) => {
  const stmt = db.prepare('DELETE FROM work_locations WHERE id = ?');
  stmt.run(workLocationId);
  return { success: true };
});

// Update handlers
ipcMain.handle('update-project', (event, projectId, projectData) => {
  const stmt = db.prepare(`
    UPDATE projects
    SET name = ?, headquarters_id = ?, substation_id = ?, circuit_id = ?
    WHERE id = ?
  `);
  stmt.run(
    projectData.name,
    projectData.headquartersId,
    projectData.substationId,
    projectData.circuitId,
    projectId
  );
  return { success: true };
});

ipcMain.handle('update-section', (event, sectionId, sectionData) => {
  const stmt = db.prepare('UPDATE sections SET name = ?, distance = ? WHERE id = ?');
  stmt.run(sectionData.name, sectionData.distance || 0, sectionId);
  return { success: true };
});

ipcMain.handle('update-work-location', (event, workLocationId, workLocationData) => {
  const stmt = db.prepare(`
    UPDATE work_locations
    SET number = ?, address = ?, comments = ?, ownership_type = ?, notification_type = ?,
        clearing_equipment_1 = ?, clearing_equipment_2 = ?, clearing_equipment_3 = ?,
        cleanup_code_1 = ?, cleanup_code_2 = ?, brush_quarter_spans = ?
    WHERE id = ?
  `);
  stmt.run(
    workLocationData.number,
    workLocationData.address,
    workLocationData.comments,
    workLocationData.ownershipType || null,
    workLocationData.notificationType || null,
    workLocationData.clearingEquipment1 || 'No Listing',
    workLocationData.clearingEquipment2 || 'No Listing',
    workLocationData.clearingEquipment3 || 'No Listing',
    workLocationData.cleanupCode1 || 'No Listing',
    workLocationData.cleanupCode2 || 'No Listing',
    workLocationData.brushQuarterSpans ? Math.ceil(workLocationData.brushQuarterSpans) : null,
    workLocationId
  );
  return { success: true };
});

// Export section to Excel
ipcMain.handle('export-section', async (event, sectionId) => {
  try {
    // Get section info
    const section = db.prepare('SELECT * FROM sections WHERE id = ?').get(sectionId);

    // Get all work locations for this section
    const workLocations = db.prepare('SELECT * FROM work_locations WHERE section_id = ?').all(sectionId);

    // Get all trees for each work location
    const trees = db.prepare(`
      SELECT t.*, wl.id as work_location_id
      FROM trees t
      JOIN work_locations wl ON t.work_location_id = wl.id
      WHERE wl.section_id = ?
    `).all(sectionId);

    // Prepare data for Excel export
    const excelData = [];

    for (const location of workLocations) {
      const locationTrees = trees.filter(t => t.work_location_id === location.id);

      if (locationTrees.length === 0) {
        // If no trees, add one row for the work location
        excelData.push({
          'Section Name': section.name,
          'Work Location Number': location.number || '',
          'Address': location.address,
          'Comments': location.comments || '',
          'Ownership Type': location.ownership_type || '',
          'Notification Type': location.notification_type || '',
          'Clearing Equipment 1': location.clearing_equipment_1 || '',
          'Clearing Equipment 2': location.clearing_equipment_2 || '',
          'Clearing Equipment 3': location.clearing_equipment_3 || '',
          'Cleanup Code 1': location.cleanup_code_1 || '',
          'Cleanup Code 2': location.cleanup_code_2 || '',
          'Brush (Quarter Spans)': location.brush_quarter_spans || '',
          'Tree Diameter (in)': '',
          'Tree Species': '',
          'Power Line Type': '',
          'Action Type': '',
          'Latitude': '',
          'Longitude': '',
          'Tree Created At': ''
        });
      } else {
        // Add a row for each tree
        for (const tree of locationTrees) {
          excelData.push({
            'Section Name': section.name,
            'Work Location Number': location.number || '',
            'Address': location.address,
            'Comments': location.comments || '',
            'Ownership Type': location.ownership_type || '',
            'Notification Type': location.notification_type || '',
            'Clearing Equipment 1': location.clearing_equipment_1 || '',
            'Clearing Equipment 2': location.clearing_equipment_2 || '',
            'Clearing Equipment 3': location.clearing_equipment_3 || '',
            'Cleanup Code 1': location.cleanup_code_1 || '',
            'Cleanup Code 2': location.cleanup_code_2 || '',
            'Brush (Quarter Spans)': location.brush_quarter_spans || '',
            'Tree Diameter (in)': tree.diameter || '',
            'Tree Species': tree.species || '',
            'Power Line Type': tree.power_line_type || '',
            'Action Type': tree.action_type || '',
            'Latitude': tree.latitude || '',
            'Longitude': tree.longitude || '',
            'Tree Created At': tree.created_at || ''
          });
        }
      }
    }

    // Show save dialog
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Section to Excel',
      defaultPath: `${section.name.replace(/[^a-z0-9]/gi, '_')}_export.xlsx`,
      filters: [
        { name: 'Excel Files', extensions: ['xlsx'] }
      ]
    });

    if (result.canceled) {
      return { success: false, message: 'Export canceled' };
    }

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Section Data');

    // Write file
    XLSX.writeFile(workbook, result.filePath);

    return { success: true, filePath: result.filePath };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, message: error.message };
  }
});

// Import section from Excel
ipcMain.handle('import-section', async (event, projectId) => {
  try {
    // Show open dialog
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Section from Excel',
      filters: [
        { name: 'Excel Files', extensions: ['xlsx', 'xls'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, message: 'Import canceled' };
    }

    const filePath = result.filePaths[0];

    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return { success: false, message: 'Excel file is empty' };
    }

    // Get section name from first row
    const sectionName = data[0]['Section Name'];
    if (!sectionName) {
      return { success: false, message: 'Section Name is required in the first column' };
    }

    // Create section
    const sectionStmt = db.prepare('INSERT INTO sections (project_id, name) VALUES (?, ?)');
    const sectionResult = sectionStmt.run(projectId, sectionName);
    const sectionId = sectionResult.lastInsertRowid;

    // Track work locations by address to avoid duplicates
    const workLocationMap = new Map();

    // Process each row
    for (const row of data) {
      const address = row['Address'];
      if (!address) continue;

      let workLocationId;

      // Check if we've already created this work location
      if (workLocationMap.has(address)) {
        workLocationId = workLocationMap.get(address);
      } else {
        // Create new work location
        const locationStmt = db.prepare(`
          INSERT INTO work_locations
          (section_id, number, address, comments, ownership_type, notification_type,
           clearing_equipment_1, clearing_equipment_2, clearing_equipment_3, cleanup_code_1, cleanup_code_2, brush_quarter_spans)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const brushValue = row['Brush (Quarter Spans)'];
        const locationResult = locationStmt.run(
          sectionId,
          row['Work Location Number'] || null,
          address,
          row['Comments'] || null,
          row['Ownership Type'] || null,
          row['Notification Type'] || null,
          row['Clearing Equipment 1'] || 'NA',
          row['Clearing Equipment 2'] || 'NA',
          row['Clearing Equipment 3'] || 'NA',
          row['Cleanup Code 1'] || 'NA',
          row['Cleanup Code 2'] || 'NA',
          brushValue ? Math.ceil(Number(brushValue)) : null
        );
        workLocationId = locationResult.lastInsertRowid;
        workLocationMap.set(address, workLocationId);
      }

      // Create tree if tree data exists
      const species = row['Tree Species'];
      const diameter = row['Tree Diameter (in)'];

      if (species || diameter) {
        const treeStmt = db.prepare(`
          INSERT INTO trees (work_location_id, latitude, longitude, diameter, species, power_line_type, action_type)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        treeStmt.run(
          workLocationId,
          row['Latitude'] || null,
          row['Longitude'] || null,
          diameter || null,
          species || null,
          row['Power Line Type'] || null,
          row['Action Type'] || null
        );
      }
    }

    return {
      success: true,
      sectionId: sectionId,
      message: `Imported section "${sectionName}" with ${workLocationMap.size} work locations and ${data.length} trees`
    };
  } catch (error) {
    console.error('Import error:', error);
    return { success: false, message: error.message };
  }
});
