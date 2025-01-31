import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Quiz from './pages/Quiz';
import Achievements from './pages/Achievements';
import Leaderboard from './pages/Leaderboard';
import Help from './pages/Help';
import About from './pages/About';
import Navbar from './components/Navbar';
import Navbarr from './components/Navbarr'; // Import the logged-in Navbar component
import AdminDashboard from './pages/Admin-dashboard'; // Import the AdminDashboard component
import ProtectedRoute from './components/ProtectedRoute'; // Import the ProtectedRoute component
import Shop from './pages/Shop';
import Friends from './pages/Friends';
import Profile from './pages/Profile';
import PrivateRoute from './components/PrivateRoute';
import Trening from './pages/Trening';
import Matchmaking from './pages/Matchmaking';

function App() {
  const [profilePicture, setProfilePicture] = useState('');
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hints, setHints] = useState(0);

  useEffect(() => {
    // Fetch user profile information
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          console.log('Fetching profile with token:', token); // Debug log
          const response = await axios.get('http://localhost:5000/api/profile', {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('Profile fetched:', response.data); // Debug log
          setProfilePicture(response.data.profile_picture);
          setUsername(response.data.username);
          setIsLoggedIn(true);
          console.log('Profile picture set to:', response.data.profile_picture); // Debug log
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    alert('Logging out...');
  };

  return (
    <Router>
      {isLoggedIn ? (
        <Navbarr username={username} profilePicture={profilePicture} onLogout={handleLogout} />
      ) : (
        <Navbar />
      )}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/trening" element={<Trening />} />
        <Route path="/matchmaking" element={<Matchmaking />} />
        <Route path="/quiz" element={<Quiz hints={hints} setHints={setHints} />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/help" element={<Help />} />
        <Route path="/about" element={<About />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/shop" element={<Shop setHints={setHints} />} />
        <Route path="/admin-dashboard" element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;