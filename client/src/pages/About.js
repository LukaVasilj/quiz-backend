import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbarr';  // Import the Navbar component
import '../App.css';

const About = () => {
  const [username, setUsername] = useState(''); // Define the username state

  useEffect(() => {
    // Retrieve the token and username from local storage or any other state management solution
    const storedUsername = localStorage.getItem('username'); // Retrieve the username
    setUsername(storedUsername); // Set the username state
  }, []); // Add an empty dependency array to run the effect only once

  const getLevelIcon = (level) => {
    if (level >= 6) return '/ikone/level6-Photoroom.png';
    if (level === 5) return '/ikone/level5-Photoroom.png';
    if (level === 4) return '/ikone/level4-Photoroom.png';
    if (level === 3) return '/ikone/level3-Photoroom.png';
    if (level === 2) return '/ikone/level2-Photoroom.png';
    return '/ikone/level1-Photoroom.png';
  };

  return (
    <>
      <Navbar username={username} onLogout={() => {}} /> {/* Add Navbar */}
      <div className="about-container">
        <div className="background-image"></div>
        
        <div className="about-content">
          <h1>About Our Quiz</h1>
          <div className="about-section">
            <h2>How It Works</h2>
            <p>Our quiz platform is designed to challenge your knowledge and help you learn new things. Here's how it works:</p>
            <ul>
              <li><span className="icon">📝</span>Sign up or log in to start playing.</li>
              <li><span className="icon">🏠</span>Join a quiz room or create your own.</li>
              <li><span className="icon">⏱️</span>Answer multiple-choice questions within the time limit.</li>
              <li><span className="icon">🏆</span>Earn points for each correct answer.</li>
              <li><span className="icon">📈</span>Compete with others and climb the leaderboard!</li>
            </ul>
          </div>
          
          <div className="about-section">
            <h2>Features</h2>
            <ul>
              <li><span className="icon">👥</span>Real-time multiplayer quizzes</li>
              <li><span className="icon">📚</span>Wide range of topics</li>
              <li><span className="icon">🎖️</span>Achievements and rewards</li>
              <li><span className="icon">📊</span>Leaderboard to track your progress</li>
              <li><span className="icon">🤝</span>Friendly and competitive environment</li>
            </ul>
          </div>
          <div className="about-section">
            <h2>Badges and Levels</h2>
            <p>As you progress through the quiz, you will earn points and unlock new badges. Here's how it works:</p>
            <table className="levels-table">
              <thead>
                <tr>
                  <th>Level</th>
                  <th>Badge</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Level 1</td>
                  <td><img src={getLevelIcon(1)} alt="Level 1 Badge" className="leaderboard-profile-picture" /></td>
                  <td>Beginner: Earn 0-10 points.</td>
                </tr>
                <tr>
                  <td>Level 2</td>
                  <td><img src={getLevelIcon(2)} alt="Level 2 Badge" className="leaderboard-profile-picture" /></td>
                  <td>Novice: Earn 11-20 points.</td>
                </tr>
                <tr>
                  <td>Level 3</td>
                  <td><img src={getLevelIcon(3)} alt="Level 3 Badge" className="leaderboard-profile-picture" /></td>
                  <td>Intermediate: Earn 21-30 points.</td>
                </tr>
                <tr>
                  <td>Level 4</td>
                  <td><img src={getLevelIcon(4)} alt="Level 4 Badge" className="leaderboard-profile-picture" /></td>
                  <td>Advanced: Earn 31-40 points.</td>
                </tr>
                <tr>
                  <td>Level 5</td>
                  <td><img src={getLevelIcon(5)} alt="Level 5 Badge" className="leaderboard-profile-picture" /></td>
                  <td>Expert: Earn 41-50 points.</td>
                </tr>
                <tr>
                  <td>Level 6</td>
                  <td><img src={getLevelIcon(6)} alt="Level 6 Badge" className="leaderboard-profile-picture" /></td>
                  <td>Master: Earn 51+ points.</td>
                </tr>
              </tbody>
            </table>
            <p>Keep playing to earn more points and unlock higher levels and better badges!</p>
          </div>
          <div className="about-section">
            <h2>Join Us</h2>
            <p>Ready to test your knowledge and have fun? Join us today and become a quiz master!</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;