import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const Navbar = () => {
  const navigate = useNavigate();
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <h2>QuizApp</h2>
      </div>
      <div className="nav-links">
        <div className="nav-link" onClick={() => navigate('/login')}>Login</div>
        <div className="nav-link" onClick={() => navigate('/register')}>Register</div>
      </div>
    </nav>
  );
};

export default Navbar;