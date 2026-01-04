const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getHeadquarters: () => ipcRenderer.invoke('get-headquarters'),
  createHeadquarter: (hqData) => ipcRenderer.invoke('create-headquarter', hqData),
  updateHeadquarter: (hqId, hqData) => ipcRenderer.invoke('update-headquarter', hqId, hqData),
  deleteHeadquarter: (hqId) => ipcRenderer.invoke('delete-headquarter', hqId),

  getSubstations: (headquartersId) => ipcRenderer.invoke('get-substations', headquartersId),

  getCircuits: (substationId) => ipcRenderer.invoke('get-circuits', substationId),
  getAllCircuits: () => ipcRenderer.invoke('get-all-circuits'),
  createCircuit: (circuitData) => ipcRenderer.invoke('create-circuit', circuitData),
  updateCircuit: (circuitId, circuitData) => ipcRenderer.invoke('update-circuit', circuitId, circuitData),
  deleteCircuit: (circuitId) => ipcRenderer.invoke('delete-circuit', circuitId),

  createProject: (projectData) => ipcRenderer.invoke('create-project', projectData),
  getProjects: () => ipcRenderer.invoke('get-projects'),
  getProject: (projectId) => ipcRenderer.invoke('get-project', projectId),
  updateProject: (projectId, projectData) => ipcRenderer.invoke('update-project', projectId, projectData),
  deleteProject: (projectId) => ipcRenderer.invoke('delete-project', projectId),

  createSection: (sectionData) => ipcRenderer.invoke('create-section', sectionData),
  getSections: (projectId) => ipcRenderer.invoke('get-sections', projectId),
  updateSection: (sectionId, sectionData) => ipcRenderer.invoke('update-section', sectionId, sectionData),
  deleteSection: (sectionId) => ipcRenderer.invoke('delete-section', sectionId),

  createWorkLocation: (workLocationData) => ipcRenderer.invoke('create-work-location', workLocationData),
  getWorkLocations: (sectionId) => ipcRenderer.invoke('get-work-locations', sectionId),
  updateWorkLocation: (workLocationId, workLocationData) => ipcRenderer.invoke('update-work-location', workLocationId, workLocationData),
  deleteWorkLocation: (workLocationId) => ipcRenderer.invoke('delete-work-location', workLocationId),

  createTree: (treeData) => ipcRenderer.invoke('create-tree', treeData),
  getTrees: (workLocationId) => ipcRenderer.invoke('get-trees', workLocationId),
  deleteTree: (treeId) => ipcRenderer.invoke('delete-tree', treeId),
  updateTree: (treeId, treeData) => ipcRenderer.invoke('update-tree', treeId, treeData),

  getSpecies: () => ipcRenderer.invoke('get-species'),
  createSpecies: (speciesData) => ipcRenderer.invoke('create-species', speciesData),
  updateSpecies: (speciesId, speciesData) => ipcRenderer.invoke('update-species', speciesId, speciesData),
  deleteSpecies: (speciesId) => ipcRenderer.invoke('delete-species', speciesId),
  getSectionTrees: (sectionId) => ipcRenderer.invoke('get-section-trees', sectionId),

  exportSection: (sectionId) => ipcRenderer.invoke('export-section', sectionId),
  importSection: (projectId) => ipcRenderer.invoke('import-section', projectId)
});
