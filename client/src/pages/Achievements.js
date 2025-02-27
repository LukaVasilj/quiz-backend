import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbarr';  // Import the Navbar component
import '../App.css';

const Achievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [username, setUsername] = useState('');
  const [profilePicture, setProfilePicture] = useState('');

  useEffect(() => {
    // Retrieve the token and username from local storage or any other state management solution
    const token = localStorage.getItem('token'); // Replace with your token retrieval logic
    const storedUsername = localStorage.getItem('username'); // Retrieve the username

    setUsername(storedUsername); // Set the username state

    console.log('API URL:', process.env.REACT_APP_API_URL); // Debug log

    const fetchAchievements = async () => {
      try {
        console.log('Fetching achievements...'); // Debug log
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/achievements`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('Achievements fetched:', response.data); // Debug log
        setAchievements(response.data);
      } catch (error) {
        console.error('Error fetching achievements:', error);
      }
    };
    
    // Fetch user profile information
    const fetchProfile = async () => {
      try {
        console.log('Fetching profile...'); // Debug log
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('Profile fetched:', response.data); // Debug log
        setProfilePicture(response.data.profile_picture);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchAchievements();
    fetchProfile();
  }, []);

  return (
    <>
      <Navbar username={username} profilePicture={profilePicture} onLogout={() => {}} /> {/* Add Navbar */}

      <div className='quiz-container'>
        <div className="achievements-container">
          <h1>Achievements</h1>
          <div className="achievements-description">
            <p>Unlock achievements by completing quizzes and reaching milestones. Track your progress and strive to achieve them all!</p>
          </div>
          <div className="achievements-list">
            {achievements.length > 0 ? (
              achievements.map((achievement, index) => (
                <div key={index} className={`achievement-item ${achievement.completed ? 'completed' : 'incomplete'}`}>
                  <div className="achievement-item-inner">
                    <div className="achievement-item-front">
                      <div className="achievement-icon">{achievement.completed ? '🏆' : '🔒'}</div>
                      <h3>{achievement.name}</h3>
                    </div>
                    <div className="achievement-item-back">
                      <p>{achievement.description}</p>
                      <p className={`status ${achievement.completed ? 'completed' : 'incomplete'}`}>
                        Status: {achievement.completed ? 'Completed' : 'Incomplete'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>No achievements found.</p>
            )}
          </div>
          <div className="motivational-quote">
            <p>"The journey of a thousand miles begins with one step." - Lao Tzu</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Achievements;