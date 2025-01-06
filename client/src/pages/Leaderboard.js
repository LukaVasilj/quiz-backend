import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbarr';
import '../App.css'; // Make sure to create and import a CSS file for styling

const Leaderboard = () => {
  const [username, setUsername] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [players, setPlayers] = useState([]);
  const [seasonEndTime] = useState(new Date('2025-03-01T23:59:59')); // Example end time
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    // Fetch leaderboard data
    fetch('http://localhost:5000/leaderboard')
      .then(response => response.json())
      .then(data => setPlayers(data))
      .catch(error => console.error('Error fetching leaderboard data:', error));

    // Fetch user profile information
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setUsername(data.username);
        setProfilePicture(data.profile_picture);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();

    // Update time left every second
    const timer = setInterval(() => {
      const now = new Date();
      const distance = seasonEndTime - now;

      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else {
        clearInterval(timer);
        setTimeLeft('Season ended');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [seasonEndTime]);

  const handleLogout = () => {
    alert('Logging out...');
    setUsername('');
    setProfilePicture('');
  };

  const getLevelIcon = (level) => {
    if (level >= 6) return '/ikone/level6-Photoroom.png';
    if (level === 5) return '/ikone/level5-Photoroom.png';
    if (level === 4) return '/ikone/level4-Photoroom.png';
    if (level === 3) return '/ikone/level3-Photoroom.png';
    if (level === 2) return '/ikone/level2-Photoroom.png';
    return '/ikone/level1-Photoroom.png';
  };

  return (
    <div className="leaderboard-page">
      <Navbar username={username} profilePicture={profilePicture} onLogout={handleLogout} />
      <div className="main-content">
      <div className="season-timer">
  <img src="/animacije/animacija.png" alt="Sticker" style={{ height: '110px', width: '300px', marginLeft: '20px',marginRight: '100px' }} />
  <div className="timer-content">
    <h2>Season Ends In:</h2>
    <p>{timeLeft}</p>
  </div>
</div>
        <div className="leaderboard-container">
          <div className="leaderboard-content">
          <h1 style={{ color: 'white' }}>Leaderboard</h1>
          <p style={{ color: 'white' }}>Here you can see the top players and their scores. Compete with others and strive to reach the top!</p>
          <table className="leaderboard-table">
  <thead>
    <tr>
      <th>Rank</th>
      <th>Profile</th>
      <th>Name</th>
      <th>Level</th> {/* New column for level icons */}
      <th>Score</th>
    </tr>
  </thead>
  <tbody>
    {players.map((player, index) => {
      let className = '';
      let trophy = '';
      if (index === 0) {
        className = 'gold';
        trophy = '🥇';
      } else if (index === 1) {
        className = 'silver';
        trophy = '🥈';
      } else if (index === 2) {
        className = 'bronze';
        trophy = '🥉';
      }
      const profilePictureUrl = player.profile_picture ? `http://localhost:5000${player.profile_picture}` : 'http://localhost:5000/uploads/default.jpg';
      const levelIconUrl = getLevelIcon(player.level);
      return (
        <tr key={index} className={`animated-row ${className}`}>
          <td>{trophy} {index + 1}</td>
          <td><img src={profilePictureUrl} alt="Profile" className="leaderboard-profile-picture" /></td>
          <td>{player.username}</td>
          <td>
            <img src={levelIconUrl} alt={`Level ${player.level}`} className="level-icon" />
          </td>
          <td>{player.points}</td>
        </tr>
      );
    })}
  </tbody>
</table>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;