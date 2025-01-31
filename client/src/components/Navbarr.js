import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const Navbar = ({ username, profilePicture, onLogout, showLogoutOnly }) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [playMenuVisible, setPlayMenuVisible] = useState(false);
  const navigate = useNavigate();

  console.log('Navbar props:', { username, profilePicture }); // Debug log

  useEffect(() => {
    console.log('Profile picture URL:', profilePicture); // Debug log
  }, [profilePicture]);

  const toggleDropdown = () => {
    setDropdownVisible((prev) => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    onLogout();
    navigate('/');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const togglePlayMenu = () => {
    setPlayMenuVisible((prev) => !prev);
  };

  const handleMenuClick = (route) => {
    navigate(route);
    setPlayMenuVisible(false);
  };

  return (
    <div className="navbar">
      <div className="navbar-left">
        <h2>Quiz App</h2>
      </div>
      <div className="navbar-right">
        {!showLogoutOnly && (
          <div className="nav-links">
            <div className="nav-link" onClick={() => navigate('/shop')}>
              <i className="fas fa-shopping-cart"></i> Shop
            </div>
            <div className="nav-linkk" onClick={togglePlayMenu}>
              <i className="fas fa-play"></i> Play
              {playMenuVisible && (
                <div className="dropdown-menuu">
                <div className="dropdown-item" onClick={() => handleMenuClick('/quiz')}>
                  <i className="fas fa-puzzle-piece"></i> Play with friend!
                </div>
                <div className="dropdown-item" onClick={() => handleMenuClick('/trening')}>
                  <i className="fas fa-dumbbell"></i> Trening!
                </div>
                <div className="dropdown-item" onClick={() => handleMenuClick('/matchmaking')}>
                  <i className="fas fa-gamepad"></i> Play online!
                </div>
              </div>
              )}
            </div>
            <div className="nav-link" onClick={() => navigate('/friends')}>
              <i className="fas fa-user-friends"></i> Friends
            </div>
            <div className="nav-link" onClick={() => navigate('/achievements')}>
              <i className="fas fa-trophy"></i> Achievements
            </div>
            <div className="nav-link" onClick={() => navigate('/leaderboard')}>
              <i className="fas fa-chart-line"></i> Leaderboard
            </div>
            <div className="nav-link" onClick={() => navigate('/help')}>
              <i className="fas fa-question-circle"></i> Help
            </div>
            <div className="nav-link" onClick={() => navigate('/about')}>
              <i className="fas fa-info-circle"></i> About
            </div>
          </div>
        )}
        <div className="user-info" onClick={toggleDropdown}>
          <img src={`http://localhost:5000${profilePicture}` || 'default-profile.png'} alt="Profile" className="navbar-profile-picture" />
          <button className="dropdown-toggle">{username} ▼</button>
        </div>
        {dropdownVisible && (
          <div className="dropdown-menu">
            <button onClick={handleProfile}>Profile</button>
            <button onClick={handleLogout}>Log Out</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;