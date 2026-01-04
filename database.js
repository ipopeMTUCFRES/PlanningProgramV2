const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const { app } = require('electron');

let db;

function initDatabase() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'tree_inventory.db');

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  createTables();
  return db;
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS headquarters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      abbreviation TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS substations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      headquarters_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      number TEXT NOT NULL,
      FOREIGN KEY (headquarters_id) REFERENCES headquarters(id),
      UNIQUE(headquarters_id, number)
    );

    CREATE TABLE IF NOT EXISTS circuits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      substation_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      number TEXT NOT NULL,
      FOREIGN KEY (substation_id) REFERENCES substations(id),
      UNIQUE(substation_id, number)
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      headquarters_id INTEGER NOT NULL,
      substation_id INTEGER NOT NULL,
      circuit_id INTEGER NOT NULL,
      planning_mode TEXT CHECK(planning_mode IN ('individual-tree', 'work-location')) DEFAULT 'individual-tree',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (headquarters_id) REFERENCES headquarters(id),
      FOREIGN KEY (substation_id) REFERENCES substations(id),
      FOREIGN KEY (circuit_id) REFERENCES circuits(id)
    );

    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      distance REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS species (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS work_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_id INTEGER NOT NULL,
      number TEXT,
      address TEXT NOT NULL,
      comments TEXT,
      ownership_type TEXT CHECK(ownership_type IN ('Rural Electric', 'Government', 'DNR', 'National Forest', 'Private - Residential', 'Private - Vacant', 'MDOT')),
      notification_type TEXT CHECK(notification_type IN ('Verbal', 'Door-card', 'Postcard', 'Refusal', 'Special Conditions')),
      clearing_equipment_1 TEXT CHECK(clearing_equipment_1 IN ('No Listing', 'No Selection', 'Bucket Truck', 'Manual Crew', 'Backyard Machine', 'Puddle Jumper', 'Side-trimmer')) DEFAULT 'No Listing',
      clearing_equipment_2 TEXT CHECK(clearing_equipment_2 IN ('No Listing', 'No Selection', 'Bucket Truck', 'Manual Crew', 'Backyard Machine', 'Puddle Jumper', 'Side-trimmer')) DEFAULT 'No Listing',
      clearing_equipment_3 TEXT CHECK(clearing_equipment_3 IN ('No Listing', 'No Selection', 'Bucket Truck', 'Manual Crew', 'Backyard Machine', 'Puddle Jumper', 'Side-trimmer')) DEFAULT 'No Listing',
      cleanup_code_1 TEXT CHECK(cleanup_code_1 IN ('No Listing', 'No Selection', 'Chip and haul', 'Chip and blow', 'Windrow', 'Mower')) DEFAULT 'No Listing',
      cleanup_code_2 TEXT CHECK(cleanup_code_2 IN ('No Listing', 'No Selection', 'Chip and haul', 'Chip and blow', 'Windrow', 'Mower')) DEFAULT 'No Listing',
      brush_quarter_spans INTEGER,
      primary_trims INTEGER DEFAULT 0,
      primary_removals INTEGER DEFAULT 0,
      primary_hazards INTEGER DEFAULT 0,
      secondary_trims INTEGER DEFAULT 0,
      secondary_removals INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS trees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_location_id INTEGER NOT NULL,
      latitude REAL,
      longitude REAL,
      diameter REAL NOT NULL,
      species TEXT NOT NULL,
      power_line_type TEXT CHECK(power_line_type IN ('Primary', 'Secondary', 'None')),
      action_type TEXT NOT NULL CHECK(action_type IN ('Trim', 'Removal', 'Hazard')),
      canopy_removal BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (work_location_id) REFERENCES work_locations(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_substations_headquarters ON substations(headquarters_id);
    CREATE INDEX IF NOT EXISTS idx_circuits_substation ON circuits(substation_id);
    CREATE INDEX IF NOT EXISTS idx_projects_headquarters ON projects(headquarters_id);
    CREATE INDEX IF NOT EXISTS idx_projects_substation ON projects(substation_id);
    CREATE INDEX IF NOT EXISTS idx_projects_circuit ON projects(circuit_id);
    CREATE INDEX IF NOT EXISTS idx_sections_project ON sections(project_id);
    CREATE INDEX IF NOT EXISTS idx_work_locations_section ON work_locations(section_id);
    CREATE INDEX IF NOT EXISTS idx_trees_work_location ON trees(work_location_id);
  `);

  // Add brush_quarter_spans column to existing tables (migration)
  try {
    db.exec(`ALTER TABLE work_locations ADD COLUMN brush_quarter_spans INTEGER;`);
  } catch (error) {
    // Column already exists, ignore error
  }

  // Add distance column to sections table (migration)
  try {
    db.exec(`ALTER TABLE sections ADD COLUMN distance REAL DEFAULT 0;`);
  } catch (error) {
    // Column already exists, ignore error
  }

  // Add canopy_removal column to trees table (migration)
  try {
    db.exec(`ALTER TABLE trees ADD COLUMN canopy_removal BOOLEAN DEFAULT 0;`);
  } catch (error) {
    // Column already exists, ignore error
  }

  // Add tree count columns to work_locations table (migration)
  const countColumns = [
    'primary_trims',
    'primary_removals',
    'primary_hazards',
    'secondary_trims',
    'secondary_removals'
  ];

  countColumns.forEach(column => {
    try {
      db.exec(`ALTER TABLE work_locations ADD COLUMN ${column} INTEGER DEFAULT 0;`);
    } catch (error) {
      // Column already exists, ignore error
    }
  });

  // Add planning_mode column to projects table (migration)
  try {
    db.exec(`ALTER TABLE projects ADD COLUMN planning_mode TEXT CHECK(planning_mode IN ('individual-tree', 'work-location')) DEFAULT 'individual-tree';`);
  } catch (error) {
    // Column already exists, ignore error
  }

  // Migrate 'NA' to 'No Listing' in existing data
  try {
    db.exec(`
      UPDATE work_locations
      SET clearing_equipment_1 = 'No Listing'
      WHERE clearing_equipment_1 = 'NA';

      UPDATE work_locations
      SET clearing_equipment_2 = 'No Listing'
      WHERE clearing_equipment_2 = 'NA';

      UPDATE work_locations
      SET clearing_equipment_3 = 'No Listing'
      WHERE clearing_equipment_3 = 'NA';

      UPDATE work_locations
      SET cleanup_code_1 = 'No Listing'
      WHERE cleanup_code_1 = 'NA';

      UPDATE work_locations
      SET cleanup_code_2 = 'No Listing'
      WHERE cleanup_code_2 = 'NA';
    `);
  } catch (error) {
    // Migration already applied or table doesn't exist yet
  }

  // Recreate work_locations table with new CHECK constraints if needed
  // This is necessary because SQLite doesn't allow modifying CHECK constraints
  try {
    // Check if we need to migrate (if old constraint exists)
    const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='work_locations'").get();

    if (tableInfo && tableInfo.sql && (tableInfo.sql.includes("'NA'") || !tableInfo.sql.includes("'No Selection'"))) {
      // Old schema detected, need to migrate
      db.exec(`
        -- Create new table with updated constraints
        CREATE TABLE work_locations_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          section_id INTEGER NOT NULL,
          number TEXT,
          address TEXT NOT NULL,
          comments TEXT,
          ownership_type TEXT CHECK(ownership_type IN ('Rural Electric', 'Government', 'DNR', 'National Forest', 'Private - Residential', 'Private - Vacant', 'MDOT')),
          notification_type TEXT CHECK(notification_type IN ('Verbal', 'Door-card', 'Postcard', 'Refusal', 'Special Conditions')),
          clearing_equipment_1 TEXT CHECK(clearing_equipment_1 IN ('No Listing', 'No Selection', 'Bucket Truck', 'Manual Crew', 'Backyard Machine', 'Puddle Jumper', 'Side-trimmer')) DEFAULT 'No Listing',
          clearing_equipment_2 TEXT CHECK(clearing_equipment_2 IN ('No Listing', 'No Selection', 'Bucket Truck', 'Manual Crew', 'Backyard Machine', 'Puddle Jumper', 'Side-trimmer')) DEFAULT 'No Listing',
          clearing_equipment_3 TEXT CHECK(clearing_equipment_3 IN ('No Listing', 'No Selection', 'Bucket Truck', 'Manual Crew', 'Backyard Machine', 'Puddle Jumper', 'Side-trimmer')) DEFAULT 'No Listing',
          cleanup_code_1 TEXT CHECK(cleanup_code_1 IN ('No Listing', 'No Selection', 'Chip and haul', 'Chip and blow', 'Windrow', 'Mower')) DEFAULT 'No Listing',
          cleanup_code_2 TEXT CHECK(cleanup_code_2 IN ('No Listing', 'No Selection', 'Chip and haul', 'Chip and blow', 'Windrow', 'Mower')) DEFAULT 'No Listing',
          brush_quarter_spans INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
        );

        -- Copy data from old table to new table (converting 'NA' to 'No Listing')
        INSERT INTO work_locations_new
        SELECT
          id, section_id, number, address, comments, ownership_type, notification_type,
          CASE WHEN clearing_equipment_1 = 'NA' THEN 'No Listing' ELSE clearing_equipment_1 END,
          CASE WHEN clearing_equipment_2 = 'NA' THEN 'No Listing' ELSE clearing_equipment_2 END,
          CASE WHEN clearing_equipment_3 = 'NA' THEN 'No Listing' ELSE clearing_equipment_3 END,
          CASE WHEN cleanup_code_1 = 'NA' THEN 'No Listing' ELSE cleanup_code_1 END,
          CASE WHEN cleanup_code_2 = 'NA' THEN 'No Listing' ELSE cleanup_code_2 END,
          brush_quarter_spans, created_at
        FROM work_locations;

        -- Drop old table
        DROP TABLE work_locations;

        -- Rename new table
        ALTER TABLE work_locations_new RENAME TO work_locations;

        -- Recreate index
        CREATE INDEX idx_work_locations_section ON work_locations(section_id);
      `);
    }
  } catch (error) {
    // Migration failed or not needed
    console.log('Work locations migration status:', error.message);
  }
}

function importCSVData() {
  const headquartersData = fs.readFileSync(path.join(__dirname, 'HeadquarterList.csv'), 'utf-8');
  const circuitData = fs.readFileSync(path.join(__dirname, 'CircuitList.csv'), 'utf-8');

  const headquartersLines = headquartersData.trim().split(/\r\n|\r|\n/).slice(1);
  const circuitLines = circuitData.trim().split(/\r\n|\r|\n/).slice(1);

  const insertHQ = db.prepare('INSERT OR IGNORE INTO headquarters (abbreviation, name) VALUES (?, ?)');
  const insertSubstation = db.prepare('INSERT OR IGNORE INTO substations (headquarters_id, name, number) VALUES (?, ?, ?)');
  const insertCircuit = db.prepare('INSERT OR IGNORE INTO circuits (substation_id, name, number) VALUES (?, ?, ?)');

  const hqMap = {};

  db.transaction(() => {
    headquartersLines.forEach(line => {
      const [abbr, name] = line.split(',').map(s => s.trim());
      if (abbr && name) {
        insertHQ.run(abbr, name);
        const hq = db.prepare('SELECT id FROM headquarters WHERE abbreviation = ?').get(abbr);
        hqMap[abbr] = hq.id;
      }
    });

    const substationMap = {};

    circuitLines.forEach(line => {
      const [hqAbbr, substationName, substationNumber, circuitName, circuitNumber] = line.split(',').map(s => s.trim());

      if (hqAbbr && substationName && substationNumber && circuitName && circuitNumber) {
        const hqId = hqMap[hqAbbr];

        if (hqId) {
          const substationKey = `${hqId}-${substationNumber}`;

          if (!substationMap[substationKey]) {
            insertSubstation.run(hqId, substationName, substationNumber);
            const substation = db.prepare('SELECT id FROM substations WHERE headquarters_id = ? AND number = ?').get(hqId, substationNumber);
            substationMap[substationKey] = substation.id;
          }

          const substationId = substationMap[substationKey];
          insertCircuit.run(substationId, circuitName, circuitNumber);
        }
      }
    });
  })();
}

function importSpeciesData() {
  const workbook = XLSX.readFile(path.join(__dirname, 'TreeCodes.xlsx'));
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const insertSpecies = db.prepare('INSERT OR IGNORE INTO species (code, name) VALUES (?, ?)');

  db.transaction(() => {
    data.slice(1).forEach(row => {
      const [code, name] = row;
      if (code && name) {
        insertSpecies.run(code.toString().trim(), name.toString().trim());
      }
    });
  })();
}

function getDatabase() {
  return db;
}

module.exports = {
  initDatabase,
  getDatabase,
  importCSVData,
  importSpeciesData
};
