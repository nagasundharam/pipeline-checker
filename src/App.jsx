import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <div className="welcome-container">
        <div className="welcome-content">
          <h1>Welcome!</h1>
          <p className="subtitle">to Pipeline Checker</p>
          <p className="description">
            A simple and elegant welcome page
          </p>
          <div className="buttons">
            <button className="btn btn-primary">Get Started</button>
            <button className="btn btn-secondary">Learn More</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
