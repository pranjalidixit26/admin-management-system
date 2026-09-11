import { Link } from 'react-router-dom';
import './Home.css';
import NetworkBackground from '../components/NetworkBackground';

const features = [
  {
    title: 'Users',
    desc: 'Create accounts, assign roles, and control who has access.',
  },
  {
    title: 'Roles & Permissions',
    desc: 'Define exactly what each role can view, edit, or delete.',
  },
  {
    title: 'Categories',
    desc: 'Organize your product catalog into clear, searchable groups.',
  },
  {
    title: 'Products',
    desc: 'Track inventory, pricing, and status in one shared view.',
  },
];

export default function Home() {
  return (
    <div className="home">
        <div className="home-bg">
            <NetworkBackground />
        </div>
      <nav className="home-nav">
        <span className="home-logo">Admin Panel</span>
        <Link to="/login" className="home-nav-login">Login</Link>
      </nav>

      <main className="home-main">
        <section className="home-hero">
          <div>
            <h1 className="home-hero-title">Run your team and catalog from one place.</h1>
            <p className="home-hero-subtitle">
              Manage users, roles, permissions, and your product catalog with
              fine-grained control over who can do what.
            </p>
            <Link to="/login" className="home-hero-cta">Log in to your workspace</Link>
          </div>

          <div className="home-mockup">
            <div className="home-mockup-bar">
              <span className="home-mockup-dot" />
              <span className="home-mockup-dot" />
              <span className="home-mockup-dot" />
            </div>
            <div className="home-mockup-body">
              <div className="home-mockup-sidebar">
                <span className="active" />
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="home-mockup-content">
                <div className="home-mockup-row" style={{ width: '70%' }} />
                <div className="home-mockup-row" style={{ width: '45%' }} />
                <div className="home-mockup-row" style={{ width: '85%' }} />
                <div className="home-mockup-chart">
                  <div style={{ height: '40%' }} />
                  <div style={{ height: '70%' }} />
                  <div style={{ height: '55%' }} />
                  <div style={{ height: '90%' }} />
                  <div style={{ height: '65%' }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="home-features">
          {features.map((f) => (
            <div className="home-feature-card" key={f.title}>
              <h3 className="home-feature-title">{f.title}</h3>
              <p className="home-feature-desc">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="home-footer">
        © {new Date().getFullYear()} Admin Panel
      </footer>
    </div>
  );
}