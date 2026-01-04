# Tree Inventory Management System

A desktop application for managing tree inventory data with GPS tracking, project organization, and comprehensive reporting capabilities.

## Features

- **Project Management**: Organize tree inventory data into projects and sections
- **GPS Integration**: Automatically capture GPS coordinates for trees and work locations
- **Comprehensive Tree Data**: Track species, diameter, power line types, actions, and canopy removal
- **Work Location Management**: Record brush removal, equipment, cleanup codes, and special conditions
- **Interactive Maps**: Visualize trees and work locations on interactive maps
- **Excel Import/Export**: Import sections from Excel and export complete project data
- **Species Management**: Maintain a database of tree species codes and names
- **Circuit & Headquarters**: Track circuits, substations, and headquarters information
- **Section Analytics**: Automatic calculation of primary/secondary units, trees per mile, and brush totals
- **Dark Mode**: Full dark mode support with customizable font sizes
- **Dual Mode Interface**: Separate Planning and Administration modes for different workflows

## System Requirements

### macOS
- macOS 10.13 (High Sierra) or later
- 100 MB free disk space
- Location Services enabled (for GPS functionality)

### Windows
- Windows 10 or later (64-bit)
- 100 MB free disk space
- Location Services enabled (for GPS functionality)

## Installation

### macOS

1. **Download the installer**
   - Download `Tree-Inventory-1.0.0.dmg` from the [Releases](../../releases) page

2. **Install the application**
   - Double-click the downloaded `.dmg` file
   - Drag the "Tree Inventory" app to your Applications folder
   - Eject the disk image

3. **First launch**
   - Open the application from your Applications folder
   - If you see a security warning, right-click the app and select "Open"
   - Click "Open" in the dialog to confirm
   - Grant location permissions when prompted

### Windows

1. **Download the installer**
   - Download `Tree-Inventory-Setup-1.0.0.exe` from the [Releases](../../releases) page

2. **Install the application**
   - Double-click the downloaded `.exe` file
   - If Windows SmartScreen appears, click "More info" then "Run anyway"
   - Follow the installation wizard prompts
   - Choose installation location (default is recommended)
   - Click "Install"

3. **First launch**
   - The application will launch automatically after installation
   - Grant location permissions when prompted
   - You can also launch from the Start Menu or desktop shortcut

## Getting Started

### Initial Setup

1. **Choose Your Mode**
   - **Planning Mode**: For field work and data entry
   - **Administration Mode**: For managing species, headquarters, and circuits

2. **Administration Setup** (First Time)
   - Select Administration mode
   - Add tree species codes and names
   - Add headquarters locations
   - Add circuits and substations

3. **Create Your First Project**
   - Switch to Planning mode
   - Click "Create New Project"
   - Enter project details (name, headquarters, circuit, substation)
   - Click "Create Project"

### Working with Projects

#### Creating Sections
1. Open a project
2. Click "Create New Section"
3. Enter section name and distance (in miles)
4. Click "Create Section"

#### Adding Work Locations
1. Open a section
2. Click "Add Work Location"
3. Enter pole number or location name
4. Optionally capture GPS coordinates
5. Add brush quarter spans, equipment, and cleanup codes
6. Click "Add Work Location"

#### Recording Trees
1. Open a work location
2. Click "Add Tree"
3. Capture GPS or enter manually
4. Enter tree details:
   - Species (from your database)
   - Diameter (inches)
   - Power Line Type (Primary, Secondary, or None)
   - Action Type (Trim, Removal, or Hazard)
   - Canopy Removal (if applicable)
5. Click "Add Tree"

### Importing and Exporting Data

#### Import Sections from Excel
1. Prepare an Excel file with columns: Section Name, Distance
2. Open your project
3. Click "Import Sections from Excel"
4. Select your Excel file
5. Sections will be created automatically

#### Export Project to Excel
1. Open your project
2. Click "Export to Excel"
3. Choose save location
4. Excel file will contain all project data organized by sections

### Understanding Section Totals

The section summary displays:
- **Primary Line Totals**: Trims, Removals, and Hazards
- **Primary Units**: Sum of all primary line actions
- **Trees per Mile**: Primary Units divided by section distance
- **Secondary Line Totals**: Trims and Removals
- **Total Brush**: Sum of all brush quarter spans

## Settings

Access settings via the three-dot menu in the top-right corner:

- **Theme**: Switch between Light and Dark mode
- **Font Size**: Choose from Small, Medium, Large, or Extra Large

Settings are saved automatically and persist between sessions.

## Data Storage

All data is stored locally in a SQLite database in your user directory:
- **macOS**: `~/Library/Application Support/tree-inventory-app/`
- **Windows**: `%APPDATA%/tree-inventory-app/`

### Backing Up Your Data

To back up your data:
1. Close the application
2. Navigate to the data directory above
3. Copy the `database.sqlite` file to a safe location
4. To restore, replace the file with your backup

## Troubleshooting

### GPS Not Working

**macOS:**
- Go to System Preferences > Security & Privacy > Privacy > Location Services
- Ensure Location Services is enabled
- Find "Tree Inventory" and ensure it has permission

**Windows:**
- Go to Settings > Privacy > Location
- Ensure Location services is turned on
- Find "Tree Inventory" and turn on access

### Application Won't Open (macOS)

If you see "App can't be opened because it is from an unidentified developer":
1. Right-click the app in Applications
2. Select "Open"
3. Click "Open" in the dialog

### Application Won't Install (Windows)

If Windows SmartScreen blocks installation:
1. Click "More info" on the warning
2. Click "Run anyway"

### Data Not Saving

1. Check disk space (need at least 50MB free)
2. Ensure you have write permissions to the application data folder
3. Try running the application as administrator (Windows)

## Support

For issues, questions, or feature requests, please visit the [Issues](../../issues) page on GitHub.

## Version History

### v1.0.0 (Initial Release)
- Project and section management
- Tree and work location data entry
- GPS integration
- Interactive maps
- Excel import/export
- Species, headquarters, and circuit management
- Section analytics and totals
- Dark mode support
- Customizable font sizes

## Developer Information

### Technology Stack
- Electron 28.1.0 - Desktop application framework
- React 18.2.0 - UI library
- SQLite (better-sqlite3) - Local database
- Leaflet - Interactive maps
- XLSX - Excel file handling
- Webpack 5 - Module bundler

### Development Setup

For developers who want to contribute or modify the application:

1. **Prerequisites**
   - Node.js (v16 or higher)
   - npm (comes with Node.js)

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm start
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Package installers**
   ```bash
   npm run package        # Build for current platform
   npm run package:mac    # Build for macOS
   npm run package:win    # Build for Windows
   ```

### Project Structure
```
.
├── main.js              # Electron main process
├── preload.js           # Electron preload script
├── database.js          # Database initialization and queries
├── package.json         # Project dependencies
├── webpack.config.js    # Webpack configuration
├── src/
│   ├── index.html       # HTML template
│   ├── index.js         # React entry point
│   ├── App.js           # Main React component
│   ├── styles.css       # Application styles
│   └── components/      # React components
└── dist/                # Build output (generated)
```

### Database Schema

The SQLite database includes tables for:
- Projects
- Sections (with distance tracking)
- Work Locations (with brush, equipment, cleanup codes)
- Trees (with GPS, species, power line type, action, canopy removal)
- Species (codes and names)
- Headquarters
- Circuits and Substations

## License

ISC License - See LICENSE file for details

## Privacy

This application:
- Stores all data locally on your device
- Only accesses location services when you actively use GPS features
- Does not transmit any data over the internet
- Does not collect analytics or usage data
