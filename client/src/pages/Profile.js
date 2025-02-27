import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbarr';  // Import the Navbar component

const Profile = () => {
  const [userInfo, setUserInfo] = useState({});
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [username, setUsername] = useState(''); // Define the username state
  const [statistics, setStatistics] = useState([]);
  const [groups, setGroups] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found in localStorage');
          throw new Error('No token found');
        }
        console.log('Fetching profile with token:', token); // Debug log
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Profile data:', response.data); // Debug log
        setUserInfo(response.data);
        setProfilePicture(response.data.profile_picture || '/uploads/default.jpg');
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    const fetchStatistics = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/user-statistics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Statistics data:', response.data); // Debug log
        setStatistics(response.data.statistics);
        setGroups(response.data.groups);
      } catch (error) {
        console.error('Error fetching user statistics:', error);
      }
    };

    const storedUsername = localStorage.getItem('username'); // Retrieve the username
    setUsername(storedUsername); // Set the username state
  
    fetchProfile();
    fetchStatistics();
  }, []);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.REACT_APP_API_URL}/change-password`, { password: newPassword }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage('Error changing password.');
    }
  };

  const handleProfilePictureChange = (e) => {
    setProfilePicture(e.target.files[0]);
  };

  const handleUploadProfilePicture = async () => {
    const formData = new FormData();
    formData.append('profilePicture', profilePicture);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/upload-profile-picture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      setUserInfo({ ...userInfo, profile_picture: response.data.profile_picture });
      setMessage('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setMessage('Error uploading profile picture.');
    }
  };

  const calculateLevel = (points) => {
    console.log('Calculating level for points:', points); // Debug log
    return Math.floor(points / 10) + 1;
  };

  const getLevelIcon = (level) => {
    if (level >= 6) return '/ikone/level6-Photoroom.png';
    if (level === 5) return '/ikone/level5-Photoroom.png';
    if (level === 4) return '/ikone/level4-Photoroom.png';
    if (level === 3) return '/ikone/level3-Photoroom.png';
    if (level === 2) return '/ikone/level2-Photoroom.png';
    return '/ikone/level1-Photoroom.png';
  };

  const renderGroupBars = (category, group) => {
    const bars = [];
    for (let i = 1; i <= 5; i++) {
      bars.push(
        <div key={i} className={`group-bar ${i <= group ? `filled-${i}` : ''}`}></div>
      );
    }
    return (
      <div className="group-bar-container">
        <span>{category}</span>
        {bars}
      </div>
    );
  };

  const renderStatistics = () => {
    return statistics.map((stat) => {
      const group = groups[`${stat.category}_group`];
      const avgCorrectAnswers = parseFloat(stat.avg_correct_answers);
      const avgIncorrectAnswers = parseFloat(stat.avg_incorrect_answers);
      const totalAnswers = avgCorrectAnswers + avgIncorrectAnswers;
      const correctPercentage = totalAnswers ? (avgCorrectAnswers / totalAnswers) * 100 : 0;
      const incorrectPercentage = totalAnswers ? (avgIncorrectAnswers / totalAnswers) * 100 : 0;
      console.log(`Category: ${stat.category}, Correct: ${correctPercentage}, Incorrect: ${incorrectPercentage}`); // Debug log
      return (
        <div key={stat.category} className="category-statistics bordered-section">
          {renderGroupBars(stat.category, group)}
          <p>Average Time: {stat.avg_time ? stat.avg_time.toFixed(2) : 'N/A'} seconds</p>
          <p>Correct Answers: {correctPercentage.toFixed(2)}%</p>
          <p>Incorrect Answers: {incorrectPercentage.toFixed(2)}%</p>
          <div className="progress-bar">
            <div
              className="progress-correct"
              style={{ width: `${correctPercentage}%` }}
            ></div>
            <div
              className="progress-incorrect"
              style={{ width: `${incorrectPercentage}%` }}
            ></div>
          </div>
        </div>
      );
    });
  };

  console.log('User info:', userInfo); // Debug log
  const userLevel = calculateLevel(userInfo.points);
  console.log('User level:', userLevel); // Debug log
  const levelIconUrl = getLevelIcon(userLevel);

  const handleLogout = () => {
    alert('Logging out...');
    setUsername('');
    setProfilePicture('');
  };

  return (
    <>
    <Navbar username={username} profilePicture={profilePicture} onLogout={handleLogout} /> {/* Add Navbar */}
    <div className="profile-container">
      <h2>Profile</h2>
      <div className="profile-info">
        <img
          src={`${process.env.REACT_APP_API_URL}${profilePicture}`}
          alt="Profile"
          className="profile-picture"
        /><img src={levelIconUrl} alt={`Level ${userLevel}`} className="level-iconn" />
        <p><span className="profile-label">Username:</span> {userInfo.username}</p>
        <p><span className="profile-label">Email:</span> {userInfo.email}</p>
        <p><span className="profile-label">Points:</span> {userInfo.points}</p>
        <p><span className="profile-label">Level:</span> 
          
          <span className="level-number">{userLevel}</span>
        </p>
        <div className="achievements-section">
          <h3>Achievements:</h3>
          <div className="profile-achievements-list">
            {userInfo.achievements && userInfo.achievements.length > 0 ? (
              userInfo.achievements.map((achievement) => (
                <div key={achievement.id} className="profile-achievement-item">
                  <img src={`${process.env.REACT_APP_API_URL}/icons/${achievement.icon}`} alt={achievement.name} className="profile-icon" />
                  <p>{achievement.name}</p>
                </div>
              ))
            ) : (
              <p>No achievements unlocked yet.</p>
            )}
          </div>
        </div>
      </div>
      <div className="profile-section">
        <h3>Change Password</h3>
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button onClick={handleChangePassword}>Change Password</button>
        {message && <p className="message">{message}</p>}
      </div>
      <div className="profile-section">
        <h3>Change Profile Picture</h3>
        <input type="file" onChange={handleProfilePictureChange} />
        <button onClick={handleUploadProfilePicture}>Upload Profile Picture</button>
      </div>
      <div className="statistics-section">
        <h3>Statistics</h3>
        {renderStatistics()}
      </div>
    </div>
    </>
  );
};

export default Profile;