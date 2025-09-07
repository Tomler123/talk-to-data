// src/components/Sidebar.tsx
import { NavLink, useNavigate } from 'react-router-dom';
import { getUserRole, isAuthenticated } from '../utils/auth';
import '../styles/Sidebar.css';
import {
  FaTachometerAlt,
  FaUpload,
  FaMicrophone,
  FaMicrophoneAlt,
  FaWpforms
} from 'react-icons/fa';

export default function Sidebar() {
  const role = getUserRole();
  const loggedIn = isAuthenticated();
  const navigate = useNavigate();

  const handleLogout = () => {  
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <nav>
        
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
          <FaTachometerAlt className="icon" /> Dashboard
        </NavLink>
        
        {loggedIn && (
        <NavLink to="/upload" className={({ isActive }) => isActive ? 'active' : ''}>
          <FaUpload className="icon" /> Upload
        </NavLink>
        )}

        {loggedIn && (
          <NavLink to="/my-voices" className={({ isActive }) => isActive ? 'active' : ''}>
            <FaMicrophone className="icon" /> My Voices
          </NavLink>
        )}

        {['admin','data analyst','business user'].includes(role || '') && (
        <NavLink to="/enroll" className={({ isActive }) => isActive ? 'active' : ''}>
          <FaMicrophoneAlt className="icon" /> Enroll
        </NavLink>
        )}

        {role === 'admin' && (
        <>
        <NavLink to="/admin/audit-logs" className={({ isActive }) => isActive ? 'active' : ''}>
          <FaWpforms className="icon" /> Audit Logs
        </NavLink>
        
        <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'active' : ''}>
          <FaWpforms className="icon" /> Users
        </NavLink>

        <NavLink to="/voices" className={({ isActive }) => isActive ? 'active' : ''}>
          <FaMicrophone className="icon" /> Voices
        </NavLink>

        <NavLink to="/register" className={({ isActive }) => isActive ? 'active' : ''}>
          <FaWpforms className="icon" />Register
        </NavLink>
        </>
        )}
        
        {loggedIn && (
        <button
          className="nav-logout"
          onClick={handleLogout}
        >
          Logout
        </button>
        )}
      </nav>
    </aside>
  );
}
