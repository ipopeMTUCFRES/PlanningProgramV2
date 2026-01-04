# Distribution Guide

## Building Distribution Packages

This guide explains how to build distribution packages for Mac and Windows.

### Prerequisites

- Node.js 16 or higher
- npm or yarn

### Build Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build for Mac**
   ```bash
   npm run build
   npx electron-builder --mac --dir
   ```
   This creates `dist/mac/Tree Inventory.app`

3. **Build for Windows**
   ```bash
   npm run build
   npx electron-builder --win --dir
   ```
   This creates `dist/win-unpacked/`

4. **Create Distribution Zips**
   ```bash
   # For Mac
   cd dist
   zip -r TreeInventory-Mac.zip mac/

   # For Windows
   zip -r TreeInventory-Windows.zip win-unpacked/
   ```

### Distribution via GitHub Releases

The recommended way to distribute this application is through GitHub Releases:

1. Create distribution packages using the steps above
2. Create a new release on GitHub
3. Upload the zip files as release assets
4. Users can download directly from the Releases page

### File Sizes

- Mac package: ~396 MB (zipped)
- Windows package: ~431 MB (zipped)

### Notes

- Distribution packages are not committed to the repository
- Source code is available in the repository
- Users can build from source or download pre-built packages from Releases
