import React, { useState } from 'react';
import './App.css';

function App() {
  const [hoveredFeature, setHoveredFeature] = useState(null);

  const features = [
    {
      id: 1,
      icon: '📊',
      title: 'Real-time Tracking',
      description: 'Monitor your pipeline deployments in real-time with live updates'
    },
    {
      id: 2,
      icon: '⚡',
      title: 'Fast Performance',
      description: 'Optimized for speed with instant feedback and minimal latency'
    },
    {
      id: 3,
      icon: '🔒',
      title: 'Secure',
      description: 'Enterprise-grade security with encrypted connections'
    },
    {
      id: 4,
      icon: '📈',
      title: 'Analytics',
      description: 'Comprehensive insights into your deployment history'
    }
  ];

  return (
    <div className="App">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🚀</span>
            <h2>Pipeline Checker</h2>
          </div>
          <nav className="nav">
            <a href="#features">Features</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Welcome to Pipeline Checker</h1>
            <p className="hero-subtitle">
              Deploy with confidence. Track every step of your pipeline in real-time.
            </p>
            <p className="hero-description">
              A comprehensive deployment tracking system designed for modern development teams. 
              Monitor your CI/CD pipelines, track deployments, and gain actionable insights.
            </p>
            <div className="buttons">
              <button className="btn btn-primary btn-large">Start Tracking</button>
              <button className="btn btn-secondary btn-large">View Demo</button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-box box-1">
              <span>📦</span>
            </div>
            <div className="hero-box box-2">
              <span>✅</span>
            </div>
            <div className="hero-box box-3">
              <span>🔄</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="features-header">
          <h2>Powerful Features</h2>
          <p>Everything you need for seamless pipeline management</p>
        </div>
        <div className="features-grid">
          {features.map((feature) => (
            <div 
              key={feature.id} 
              className="feature-card"
              onMouseEnter={() => setHoveredFeature(feature.id)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <div className={`feature-icon ${hoveredFeature === feature.id ? 'active' : ''}`}>
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <div className="feature-arrow">→</div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="stat-item">
          <div className="stat-number">10K+</div>
          <div className="stat-label">Deployments Tracked</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">99.9%</div>
          <div className="stat-label">Uptime SLA</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">500+</div>
          <div className="stat-label">Active Teams</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">24/7</div>
          <div className="stat-label">Support Available</div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-content">
          <h2>Ready to streamline your deployments?</h2>
          <p>Join thousands of teams using Pipeline Checker to manage their deployments</p>
          <button className="btn btn-primary btn-large">Get Started Now</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Pipeline Checker</h4>
            <p>Modern deployment tracking for development teams</p>
          </div>
          <div className="footer-section">
            <h4>Product</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#docs">Documentation</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Company</h4>
            <ul>
              <li><a href="#about">About</a></li>
              <li><a href="#blog">Blog</a></li>
              <li><a href="#careers">Careers</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Connect</h4>
            <ul>
              <li><a href="#twitter">Twitter</a></li>
              <li><a href="#github">GitHub</a></li>
              <li><a href="#linkedin">LinkedIn</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Pipeline Checker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
