import React from 'react';

function ProjectList({ projects, onSelectProject, onEditProject, onDeleteProject }) {
  if (projects.length === 0) {
    return (
      <div className="empty-state">
        <p>No projects yet. Create your first project to get started.</p>
      </div>
    );
  }

  return (
    <div className="project-list">
      <h2>Projects</h2>
      <div className="card-grid">
        {projects.map(project => (
          <div key={project.id} className="card">
            <div onClick={() => onSelectProject(project)}>
              <h3>{project.name}</h3>
              <div className="card-details">
                <p><strong>Headquarters:</strong> {project.headquarters_name}</p>
                <p><strong>Substation:</strong> {project.substation_name} ({project.substation_number})</p>
                <p><strong>Circuit:</strong> {project.circuit_name} ({project.circuit_number})</p>
                <p className="date">Created: {new Date(project.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="card-actions">
              <button onClick={(e) => { e.stopPropagation(); onEditProject(project); }} className="btn-small btn-primary">
                Edit
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }} className="btn-small btn-danger">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProjectList;
