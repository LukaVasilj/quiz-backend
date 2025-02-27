import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbarr';  // Import the Navbar component
import '../App.css';

const Help = () => {
  const [username, setUsername] = useState(''); // Define the username state
  const [profilePicture, setProfilePicture] = useState('');

  useEffect(() => {
    // Retrieve the token and username from local storage or any other state management solution
    const storedUsername = localStorage.getItem('username'); // Retrieve the username
    setUsername(storedUsername); // Set the username state
  
    // Fetch user profile information
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setProfilePicture(data.profile_picture);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
  
    fetchProfile();
  }, []); // Add an empty dependency array to run the effect only once

  const handleLogout = () => {
    alert('Logging out...');
    setUsername('');
    setProfilePicture('');
  };

  return (
    <>
      <Navbar username={username} profilePicture={profilePicture} onLogout={handleLogout} />
      <div className="help-container">
        <div className="background-image"></div>
        <div className="help-content">
          <h1>Help & Support</h1>
          <div className="help-section">
            <h2>Frequently Asked Questions (FAQs)</h2>
            <ul>
              <li><strong>How do I sign up?</strong> Click on the "Sign Up" button on the homepage and fill in your details.</li>
              <li><strong>How do I join a quiz?</strong> After logging in, you can join a quiz room or create your own.</li>
              <li><strong>How are points calculated?</strong> Points are awarded based on the number of correct answers and the time taken to answer.</li>
              <li><strong>How do I view my achievements?</strong> Go to the "Achievements" page to see your unlocked achievements.</li>
              <li><strong>How do I contact support?</strong> You can contact support by emailing us at support@quizapp.com.</li>
            </ul>
          </div>
          <div className="help-section">
            <h2>Contact Information</h2>
            <p>If you need further assistance, please reach out to us:</p>
            <ul>
              <li><i className="fas fa-envelope"></i> Email: support@quizapp.com</li>
              <li><i className="fas fa-phone"></i> Phone: +123 456 7890</li>
              <li><i className="fas fa-map-marker-alt"></i> Address: 123 Quiz Street, Knowledge City, QC 12345</li>
            </ul>
          </div>
          <div className="help-section">
            <h2>Troubleshooting Tips</h2>
            <ul>
              <li><strong>Issue:</strong> I can't log in. <br /><strong>Solution:</strong> Ensure that you are using the correct username and password. If you forgot your password, use the "Forgot Password" link to reset it.</li>
              <li><strong>Issue:</strong> The quiz is not loading. <br /><strong>Solution:</strong> Check your internet connection and try refreshing the page. If the issue persists, contact support.</li>
              <li><strong>Issue:</strong> I didn't receive my points. <br /><strong>Solution:</strong> Points may take a few minutes to update. If you still don't see your points, contact support.</li>
            </ul>
          </div>
          <div className="help-section">
            <h2>Community Guidelines</h2>
            <p>We strive to create a friendly and competitive environment. Please adhere to the following guidelines:</p>
            <ul>
              <li><i className="fas fa-users"></i> Be respectful to other players.</li>
              <li><i className="fas fa-ban"></i> No cheating or use of unfair advantages.</li>
              <li><i className="fas fa-flag"></i> Report any suspicious activity to support.</li>
            </ul>
          </div>
          <div className="help-section">
            <h2>Join Our Community</h2>
            <p>Connect with other quiz enthusiasts and stay updated with the latest news:</p>
            <ul>
              <li><i className="fab fa-twitter"></i> Follow us on Twitter: <a href="https://twitter.com/quizapp">@quizapp</a></li>
              <li><i className="fab fa-facebook"></i> Like our Facebook page: <a href="https://facebook.com/quizapp">QuizApp</a></li>
              <li><i className="fab fa-discord"></i> Join our Discord server: <a href="https://discord.gg/quizapp">QuizApp Community</a></li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default Help;