import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbarr';
import { FaUserPlus, FaUserCheck, FaUserTimes, FaTrashAlt, FaEye, FaTimes, FaEnvelope } from 'react-icons/fa'; // Import icons

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendUsername, setFriendUsername] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [username, setUsername] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [message, setMessage] = useState(''); // State for displaying messages
  const [selectedFriend, setSelectedFriend] = useState(null); // State for selected friend
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showMessages, setShowMessages] = useState(false);
  const [showPopup, setShowPopup] = useState(false); // State for controlling popup visibility

  useEffect(() => {
    const storedUsername = localStorage.getItem('username'); // Retrieve stored username

    const fetchFriends = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/friends', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Friends fetched:', response.data); // Debug log
        setFriends(response.data);
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
    };

    setUsername(storedUsername); // Set the username state

    const fetchFriendRequests = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/friend-requests', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Friend requests fetched:', response.data); // Debug log
        setFriendRequests(response.data);
      } catch (error) {
        console.error('Error fetching friend requests:', error);
      }
    };

    // Fetch user profile information
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Profile fetched:', response.data); // Debug log
        setProfilePicture(response.data.profile_picture);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchFriends();
    fetchFriendRequests();
    fetchProfile();
  }, []);

  const handleSendMessage = async (receiverId) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Sending message to receiverId:', receiverId); // Debug log
      console.log('Message content:', newMessage); // Debug log
      const response = await axios.post('http://localhost:5000/send-message', { receiverId, content: newMessage }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Message sent response:', response.data); // Debug log
      setNewMessage('');
      setMessage('Message sent successfully'); // Display message
      setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
      fetchMessages(receiverId); // Refresh messages after sending a new one
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  const fetchMessages = async (receiverId) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching messages for receiverId:', receiverId); // Debug log
      const response = await axios.get(`http://localhost:5000/messages?receiverId=${receiverId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Messages fetched response:', response.data); // Debug log
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleMarkMessageRead = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/mark-message-read', { messageId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Message marked as read:', response.data); // Debug log
      fetchMessages(selectedFriend.id); // Refresh messages
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleSearch = async (e) => {
    const searchTerm = e.target.value;
    setFriendUsername(searchTerm);

    if (searchTerm.length > 1) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/search-users?q=${searchTerm}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Search results:', response.data); // Debug log
        setSearchResults(response.data);
      } catch (error) {
        console.error('Error searching users:', error);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleAddFriend = async (username) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/add-friend', { friendUsername: username }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Add friend response:', response.data); // Debug log
      setFriendUsername('');
      setSearchResults([]);
      setMessage('Friend request sent'); // Display message
      setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  };

  const handleAcceptFriend = async (friendId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/accept-friend', { friendId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Accept friend response:', response.data); // Debug log
      setFriendRequests(friendRequests.filter(request => request.id !== friendId));
      setFriends([...friends, { id: friendId, username: friendRequests.find(request => request.id === friendId).username, profile_picture: friendRequests.find(request => request.id === friendId).profile_picture }]);
    } catch (error) {
      console.error('Error accepting friend:', error);
    }
  };

  const handleDeclineFriend = async (friendId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/decline-friend', { friendId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Decline friend response:', response.data); // Debug log
      setFriendRequests(friendRequests.filter(request => request.id !== friendId));
    } catch (error) {
      console.error('Error declining friend:', error);
    }
  };

  const handleDeleteFriend = async (friendId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete('http://localhost:5000/delete-friend', {
        headers: { Authorization: `Bearer ${token}` },
        data: { friendId }
      });
      console.log('Delete friend response:', response.data); // Debug log
      setFriends(friends.filter(friend => friend.id !== friendId));
    } catch (error) {
      console.error('Error deleting friend:', error);
    }
  };

  const handleViewProfile = async (friendId) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching profile for friendId:', friendId); // Debug log
      const response = await axios.get(`http://localhost:5000/api/profile/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Friend profile fetched response:', response.data); // Debug log
      setSelectedFriend(response.data);
    } catch (error) {
      console.error('Error fetching friend profile:', error);
    }
  };

  const handleCloseProfile = () => {
    setSelectedFriend(null);
    setShowMessages(false);
    setShowPopup(false); // Close popup when closing profile
  };

  const handleCloseMessages = () => {
    setShowMessages(false);
    setSelectedFriend(null);
    setShowPopup(false); // Close popup when closing messages
  };

  const handleOpenMessages = (friend) => {
    setSelectedFriend(friend);
    setShowMessages(true);
    setShowPopup(true); // Open popup when opening messages
    fetchMessages(friend.id);
  };

  const calculateLevel = (points) => {
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

  const renderLevelIcons = (level) => {
    const icons = [];
    for (let i = 1; i <= Math.min(level, 5); i++) {
      icons.push(<img key={i} src={getLevelIcon(i)} alt={`Level ${i}`} className="level-icon" />);
    }
    if (level >= 6) {
      icons.push(<img key={6} src={getLevelIcon(6)} alt={`Level ${level}`} className="level-icon" />);
    }
    return icons;
  };

  return (
    <div>
      <Navbar username={username} profilePicture={profilePicture} onLogout={() => {}} />
      
      <div className="friends-page">
        <div className="friends-container">
          <div className="section-container">
            <h2>Find Friend</h2>
            <div className="section-content">
              <input
                type="text"
                value={friendUsername}
                onChange={handleSearch}
                placeholder="Friend Username"
              />
              {searchResults.length > 0 && (
                <ul className="search-results">
                  {searchResults.map((user) => {
                    const profilePictureUrl = user.profile_picture ? `http://localhost:5000${user.profile_picture}` : 'http://localhost:5000/uploads/default.jpg';
                    return (
                      <li key={user.id} onClick={() => handleAddFriend(user.username)}>
                        <img src={profilePictureUrl} alt="Profile" className="friends-profile-picture" /> {user.username} <FaUserPlus />
                      </li>
                    );
                  })}
                </ul>
              )}
              {friendUsername && (
                <button onClick={() => handleAddFriend(friendUsername)}>Add Friend</button>
              )}
              {message && <p className="message">{message}</p>}
            </div>
          </div>
  
          <div className="section-container">
            <h2>Friend Requests</h2>
            <div className="section-content">
              <ul>
                {friendRequests.map((request, index) => {
                  const profilePictureUrl = request.profile_picture ? `http://localhost:5000${request.profile_picture}` : 'http://localhost:5000/uploads/default.jpg';
                  return (
                    <li key={index}>
                      <img src={profilePictureUrl} alt="Profile" className="friends-profile-picture" /> {request.username}
                      <button className="accept-button" onClick={() => handleAcceptFriend(request.id)}><FaUserCheck /> Accept</button>
                      <button className="decline-button" onClick={() => handleDeclineFriend(request.id)}><FaUserTimes /> Decline</button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
  
        <div className="friends-list-container">
          <h2>Friends List</h2>
          <table>
            <thead>
              <tr>
                <th>Profile</th>
                <th>Username</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {friends.map((friend, index) => {
                const profilePictureUrl = friend.profile_picture ? `http://localhost:5000${friend.profile_picture}` : 'http://localhost:5000/uploads/default.jpg';
                console.log('Friend profile picture URL:', profilePictureUrl); // Debug log
                return (
                  <tr key={index}>
                    <td><img src={profilePictureUrl} alt="Profile" className="friends-profile-picture" /></td>
                    <td>{friend.username}</td>
                    <td>
                      <button className="view-button" onClick={() => handleViewProfile(friend.id)}><FaEye /> View Profile</button>
                      <button className="delete-button" onClick={() => handleDeleteFriend(friend.id)}><FaTrashAlt /> Delete</button>
                      <button className="message-button" onClick={() => handleOpenMessages(friend)}><FaEnvelope /> Messages</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
  
        {showPopup && (
  <div className="messages-container">
  {/* Status bar */}
  <div className="status-bar">
    <div className="left">
      <span className="signal-icon">📶</span>
      <span className="wifi-icon">📡</span>
    </div>
    <div className="center">
      <span className="time">16:57</span>
    </div>
    <div className="right">
      <span className="battery-icon">🔋 80%</span>
    </div>
  </div>

  {/* Sadržaj */}
  <ul>
    {messages.map((message) => (
      <li
        key={message.id}
        className={message.is_read ? "read" : "unread"}
        style={{
          backgroundColor: message.sender === username ? "#e0f7fa" : "#ffe3b5",
        }}
      >
        <p>
          <strong>{message.sender}:</strong> {message.content}
        </p>
        <p>{new Date(message.timestamp).toLocaleString()}</p>
      </li>
    ))}
  </ul>

  {/* Unos poruke */}
  <textarea
    value={newMessage}
    onChange={(e) => setNewMessage(e.target.value)}
    placeholder="Type your message here..."
  />
  <button onClick={() => handleSendMessage(selectedFriend.id)}>Send</button>

  {/* Home button */}
  <div className="bottom-bar">
    <div className="home-button" onClick={handleCloseMessages}></div>
  </div>
</div>
        )}


  
        {selectedFriend && !showMessages && (
          <div className="friend-profile">
            <button className="close-button" onClick={handleCloseProfile}><FaTimes /> Close Profile</button>
            <h2>Friend Profile</h2>
            <img src={`http://localhost:5000${selectedFriend.profile_picture}`} alt="Profile" className="profile-picture" />
            <p><span className="profile-label">Username:</span> {selectedFriend.username}</p>
            <p><span className="profile-label">Points:</span> {selectedFriend.points}</p>
            <p><span className="profile-label">Level:</span> {calculateLevel(selectedFriend.points)}</p>
            <div className="level-icons">
              {renderLevelIcons(calculateLevel(selectedFriend.points))}
            </div>
            <div className="achievements-section">
              <h3>Achievements:</h3>
              <div className="achievements-listt">
                {selectedFriend.achievements && selectedFriend.achievements.length > 0 ? (
                  selectedFriend.achievements.map((achievement) => (
                    <div key={achievement.id} className="achievement-itemm">
                      <img src={`http://localhost:5000/icons/${achievement.icon}`} alt="Achievement" className="achievement-icon" />
                    </div>
                  ))
                ) : (
                  <p>No achievements unlocked yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;