import React, { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDeployment, setSelectedDeployment] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchDeployments();
  }, []);

  const fetchDeployments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/deployments`);
      if (!response.ok) {
        throw new Error('Failed to fetch deployments');
      }
      const data = await response.json();
      setDeployments(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#10b981';
      case 'failed': return '#ef4444';
      case 'in_progress': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading deployments...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">Error: {error}</div>
        <button className="btn btn-primary" onClick={fetchDeployments}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="title">Deployment Tracking System</h1>
      
      <div className="deployments-list">
        {deployments.map((deployment) => (
          <div 
            key={deployment._id} 
            className="deployment-card"
            onClick={() => setSelectedDeployment(deployment)}
          >
            <div className="deployment-header">
              <h3>{deployment.project_id} - {deployment.version}</h3>
              <span 
                className="status-badge" 
                style={{ backgroundColor: getStatusColor(deployment.status) }}
              >
                {deployment.status}
              </span>
            </div>
            <p className="commit-message">{deployment.commit_message}</p>
            <div className="deployment-meta">
              <span>Branch: {deployment.branch}</span>
              <span>Author: {deployment.commit_author}</span>
              <span>Started: {formatDate(deployment.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>

      {selectedDeployment && (
        <div className="deployment-details">
          <h2>Deployment Details</h2>
          <div className="details-grid">
            <div className="detail-item">
              <label>Project ID:</label>
              <span>{selectedDeployment.project_id}</span>
            </div>
            <div className="detail-item">
              <label>Environment ID:</label>
              <span>{selectedDeployment.environment_id}</span>
            </div>
            <div className="detail-item">
              <label>Pipeline ID:</label>
              <span>{selectedDeployment.pipeline_id}</span>
            </div>
            <div className="detail-item">
              <label>Version:</label>
              <span>{selectedDeployment.version}</span>
            </div>
            <div className="detail-item">
              <label>Branch:</label>
              <span>{selectedDeployment.branch}</span>
            </div>
            <div className="detail-item">
              <label>Commit Author:</label>
              <span>{selectedDeployment.commit_author}</span>
            </div>
            <div className="detail-item">
              <label>Public URL:</label>
              <a href={selectedDeployment.public_url} target="_blank" rel="noopener noreferrer">
                {selectedDeployment.public_url}
              </a>
            </div>
            <div className="detail-item">
              <label>Triggered By:</label>
              <span>{selectedDeployment.triggered_by.username} ({selectedDeployment.triggered_by.source})</span>
            </div>
          </div>

          <h3>Timeline</h3>
          <div className="timeline">
            {selectedDeployment.stages.map((stage, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-marker" style={{ backgroundColor: getStatusColor(stage.status) }}></div>
                <div className="timeline-content">
                  <h4>{stage.name}</h4>
                  <p>Status: {stage.status}</p>
                  {stage.startTime && <p>Started: {formatDate(stage.startTime)}</p>}
                  {stage.endTime && <p>Ended: {formatDate(stage.endTime)}</p>}
                </div>
              </div>
            ))}
          </div>
          <h1>Nagasundharam</h1>

          <button className="btn btn-secondary" onClick={() => setSelectedDeployment(null)}>
            Close Details
          </button>
        </div>
      )}

      <div className="footer">
        DEPLOYMENT TRACKING SYSTEM • V1.0.0
      </div>
    </div>
  );
}

export default App;
