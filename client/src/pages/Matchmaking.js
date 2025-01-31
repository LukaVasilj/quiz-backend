import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Navbar from '../components/Navbarr';  // Import the Navbar component
import '../App.css';

let socket; // Define socket outside of the component

const Matchmaking = () => {
  const [username, setUsername] = useState(''); // Define the username state
  const [profilePicture, setProfilePicture] = useState('');
  const [category, setCategory] = useState(''); // Define the category state
  const [status, setStatus] = useState(''); // Define the status state
  const [roomUsers, setRoomUsers] = useState([]); // Define the room users state
  const [quizStarted, setQuizStarted] = useState(false); // Define the quiz started state
  const [currentQuestion, setCurrentQuestion] = useState(null); // Define the current question state
  const [userAnswer, setUserAnswer] = useState(''); // Define the user answer state
  const [results, setResults] = useState(null); // Define the results state
  const [roomId, setRoomId] = useState(null); // Define the room ID state
  const [quizEnd, setQuizEnd] = useState(null); // Define the quiz end state
  const [questionNumber, setQuestionNumber] = useState(0); // Define the question number state
  const [inputDisabled, setInputDisabled] = useState(false); // Define the input disabled state
  const [buttonDisabled, setButtonDisabled] = useState(false); // Define the button disabled state

  useEffect(() => {
    // Retrieve the token and username from local storage or any other state management solution
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username'); // Retrieve the username
    setUsername(storedUsername); // Set the username state
  
    // Fetch user profile information
    const fetchProfile = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setProfilePicture(data.profile_picture);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
  
    fetchProfile();

    console.log('Connecting to socket.io with token:', token); // Debug log

    // Connect to the server with token
    socket = io('http://localhost:5000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'] // Ensure both transports are allowed
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err); // Debug log
    });

    // Handle matchmaking response
    socket.on('matchFound', ({ roomId, users }) => {
      setStatus('Kviz počinje za 5 sekundi...');
      setRoomUsers(users); // Set the room users
      setRoomId(roomId); // Set the room ID
      setQuizStarted(true); // Automatically start the quiz
      setQuestionNumber(0); // Reset question number
      console.log(`Match found! Room ID: ${roomId}, Users: ${JSON.stringify(users)}`); // Debug log

      // Hide status message after 5 seconds
      setTimeout(() => {
        setStatus('');
      }, 10000);
    });

    socket.on('findingOpponent', () => {
      setStatus('Finding opponent...');
      console.log('Finding opponent...'); // Debug log
    });

    socket.on('noOpponentFound', () => {
      setStatus('No opponent found. Please try again.');
      console.log('No opponent found. Please try again.'); // Debug log
    });

    socket.on('newQuestion', (data) => {
      setCurrentQuestion(data);
      setUserAnswer(''); // Reset user answer
      setResults(null); // Reset results
      setQuestionNumber(prev => prev + 1); // Increment question number
      setInputDisabled(false); // Enable input
      setButtonDisabled(false); // Enable button
      console.log(`New question received: ${JSON.stringify(data)}`); // Debug log
    });

    socket.on('results', (data) => {
      setResults(data);
      setRoomUsers(data.roomUsers); // Update room users with points
      console.log(`Results received: ${JSON.stringify(data)}`); // Debug log
    });

    socket.on('quizEnd', (data) => {
      setQuizEnd(data);
      setQuizStarted(false);
      setResults(null); // Reset results before displaying final results
      console.log(`Quiz ended. Final data: ${JSON.stringify(data)}`); // Debug log
    });

    return () => {
      socket.off('matchFound');
      socket.off('findingOpponent');
      socket.off('noOpponentFound');
      socket.off('newQuestion');
      socket.off('results');
      socket.off('quizEnd');
    };
  }, []); // Add an empty dependency array to run the effect only once

  const handleCategorySelect = (e) => {
    setCategory(e.target.value);
    console.log(`Category selected: ${e.target.value}`); // Debug log
  };

  const handlePlay = () => {
    if (category) {
      setStatus('Finding opponent...');
      console.log('Emitting findMatch with:', { username, category }); // Debug log
      socket.emit('findMatch', { username, category });
    } else {
      setStatus('Please select a category.');
      console.log('Please select a category.'); // Debug log
    }
  };

  const handleAnswer = (answer) => {
    console.log('Submitting answer with room ID:', roomId, 'and answer:', answer); // Debug log
    if (roomId) {
      socket.emit('submitMatchmakingAnswer', roomId, answer);
      setButtonDisabled(true); // Disable button after submitting answer
    } else {
      console.error('Room ID is null'); // Debug log
    }
  };

  const handleInputAnswer = (e) => {
    setUserAnswer(e.target.value);
    console.log(`Input answer changed: ${e.target.value}`); // Debug log
  };

  const submitInputAnswer = () => {
    handleAnswer(userAnswer);
    setInputDisabled(true); // Disable input after submitting answer
    console.log('Input answer submitted'); // Debug log
  };

  const handleLogout = () => {
    alert('Logging out...');
    setUsername('');
    setProfilePicture('');
    console.log('Logging out...'); // Debug log
  };

  return (
    <>
      <Navbar username={username} profilePicture={profilePicture} onLogout={handleLogout} />
      <div className="matchmaking-container">
        <div className="background-image"></div>
        <div className="matchmaking-content">
          <h1>{roomId ? `Room ID: ${roomId}` : 'Matchmaking'}</h1>
          {!quizStarted && !quizEnd && (
            <div className="category-selection">
              <select onChange={handleCategorySelect}>
                <option value="">Select Category</option>
                <option value="animals">Animals</option>
                <option value="movies">Movies</option>
                <option value="science">Science</option>
                <option value="history">History</option>
                <option value="geography">Geography</option>
                <option value="general">General</option>
              </select>
              <button onClick={handlePlay}>Play</button>
            </div>
          )}
          
          {roomUsers && roomUsers.length > 0 && (
            <div>
              <h2>Users in Room:</h2>
              <ul>
                {roomUsers.map((user, index) => (
                  <li key={index}>{user.username} - Points: {user.points}</li>
                ))}
              </ul>
            </div>
          )}
          {quizStarted && currentQuestion && (
            <div>
              <h3>{questionNumber}/5</h3>
              <h3>{currentQuestion.question}</h3>
              {currentQuestion.type === 'multiple-choice' ? (
                currentQuestion.options.map((option, index) => (
                  <button key={index} onClick={() => handleAnswer(option)} disabled={buttonDisabled}>
                    {option}
                  </button>
                ))
              ) : currentQuestion.type === 'input' ? (
                <div>
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={handleInputAnswer}
                    disabled={inputDisabled}
                  />
                  <button onClick={submitInputAnswer} disabled={inputDisabled}>Submit</button>
                </div>
              ) : (
                <p>Unknown question type</p>
              )}
              {results && results.userAnswers && (
                <div>
                  <h3>Results:</h3>
                  <p>Correct answer: {results.correctAnswer}</p>
                  <ul>
                    {results.userAnswers.map((answer, index) => (
                      <li key={index}>{roomUsers.find(user => user.id === answer.id)?.username || 'Unknown'}: {answer.answer}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {quizEnd && (
            <div>
              <h3>Quiz Ended</h3>
              {quizEnd.message ? (
                <p>{quizEnd.message}</p>
              ) : (
                <div>
                  <p>Winner: {quizEnd.winner}</p>
                  <p>Loser: {quizEnd.loser}</p>
                </div>
              )}
              
            </div>
          )}
        </div>
        <div className="status-message-bottom">
          {status && <p>{status}</p>}
        </div>
      </div>
    </>
  );
};

export default Matchmaking;