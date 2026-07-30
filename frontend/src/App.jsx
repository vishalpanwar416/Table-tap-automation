import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Settings, Utensils, MessageSquareText } from 'lucide-react';
import DashboardView from './components/Dashboard';
import ActivityView from './components/Activity';
import SettingsView from './components/Settings';

function App() {
  return <Router><div className="app-container">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Utensils size={18} /></div><span>tabletap</span></div>
      <p className="nav-label">Workspace</p>
      <nav className="nav-links">
        <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><LayoutDashboard size={19}/><span>Dashboard</span></NavLink>
        <NavLink to="/activity" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><MessageSquareText size={19}/><span>Activity</span></NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><Settings size={19}/><span>Automation setup</span></NavLink>
      </nav>
    </aside>
    <main className="main-content"><Routes><Route path="/" element={<DashboardView />} /><Route path="/activity" element={<ActivityView />} /><Route path="/settings" element={<SettingsView />} /></Routes></main>
  </div></Router>;
}
export default App;
