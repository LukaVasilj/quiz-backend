import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Navbar from '../components/Navbarr';  // Import the Navbar component
import '../App.css';
import '../Matchmaking.css'; // Import the CSS file for Trening component

let matchmakingSocket; // Define socket outside of the component
let matchmakingAnswerTimeout; // Define timeout variable outside of the component
let matchmakingCountdownInterval; // Define interval variable outside of the component

const Matchmaking = () => {
  const [matchmakingUsername, setMatchmakingUsername] = useState(''); // Define the username state
  const [matchmakingProfilePicture, setMatchmakingProfilePicture] = useState('');
  const [matchmakingCategory, setMatchmakingCategory] = useState(''); // Define the category state
  const [matchmakingStatus, setMatchmakingStatus] = useState(''); // Define the status state
  const [matchmakingRoomUsers, setMatchmakingRoomUsers] = useState([]); // Define the room users state
  const [matchmakingQuizStarted, setMatchmakingQuizStarted] = useState(false); // Define the quiz started state
  const [matchmakingCurrentQuestion, setMatchmakingCurrentQuestion] = useState(null); // Define the current question state
  const [matchmakingUserAnswer, setMatchmakingUserAnswer] = useState(''); // Define the user answer state
  const [matchmakingResults, setMatchmakingResults] = useState(null); // Define the results state
  const [matchmakingRoomId, setMatchmakingRoomId] = useState(null); // Define the room ID state
  const [matchmakingQuizEnd, setMatchmakingQuizEnd] = useState(null); // Define the quiz end state
  const [matchmakingQuestionNumber, setMatchmakingQuestionNumber] = useState(0); // Define the question number state
  const [matchmakingInputDisabled, setMatchmakingInputDisabled] = useState(false); // Define the input disabled state
  const [matchmakingButtonDisabled, setMatchmakingButtonDisabled] = useState(false); // Define the button disabled state
  const [matchmakingRemainingTime, setMatchmakingRemainingTime] = useState(20); // Define the remaining time state
  const [showCategorySelect, setShowCategorySelect] = useState(true); // Define the state to show/hide category select and play button
  const [answerClasses, setAnswerClasses] = useState([]); // Define the answer classes state
  const [userCorrectAnswers, setUserCorrectAnswers] = useState({}); // Define the state to store correct answers for each user

  useEffect(() => {
    // Retrieve the token and username from local storage or any other state management solution
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username'); // Retrieve the username
    setMatchmakingUsername(storedUsername); // Set the username state
  
    // Fetch user profile information
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setMatchmakingProfilePicture(data.profile_picture);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
  
    fetchProfile();

    console.log('Connecting to socket.io with token:', token); // Debug log

    // Connect to the server with token
    matchmakingSocket = io(`${process.env.REACT_APP_API_URL}`, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'] // Ensure both transports are allowed
    });

    matchmakingSocket.on('connect_error', (err) => {
      console.error('Connection error:', err); // Debug log
    });

    // Handle matchmaking response
    matchmakingSocket.on('matchFound', ({ roomId, users }) => {
      setMatchmakingStatus('Kviz počinje za par sekundi...');
      setMatchmakingRoomUsers(users); // Set the room users
      setMatchmakingRoomId(roomId); // Set the room ID
      setMatchmakingQuizStarted(false); // Ensure quiz does not start until question is received
      setMatchmakingQuestionNumber(0); // Reset question number
      setUserCorrectAnswers(users.reduce((acc, user) => ({ ...acc, [user.id]: 0 }), {})); // Initialize correct answers count for each user
      console.log(`Match found! Room ID: ${roomId}, Users: ${JSON.stringify(users)}`); // Debug log

      // Hide status message after 5 seconds
      setTimeout(() => {
        setMatchmakingStatus('');
      }, 10000);
    });

    matchmakingSocket.on('findingOpponent', () => {
      setMatchmakingStatus('Finding opponent...');
      console.log('Finding opponent...'); // Debug log
    });

    matchmakingSocket.on('noOpponentFound', () => {
      setMatchmakingStatus('No opponent found. Please try again.');
      console.log('No opponent found. Please try again.'); // Debug log
    });

    matchmakingSocket.on('newQuestion', (data) => {
      setMatchmakingCurrentQuestion(data);
      setMatchmakingUserAnswer(''); // Reset user answer
      setMatchmakingResults(null); // Reset results
      setMatchmakingQuestionNumber(prev => prev + 1); // Increment question number
      setMatchmakingInputDisabled(false); // Enable input
      setMatchmakingButtonDisabled(false); // Enable button
      setMatchmakingRemainingTime(20); // Reset remaining time
      setMatchmakingQuizStarted(true); // Start the quiz when the first question is received
      setAnswerClasses(data.type === 'multiple-choice' ? new Array(data.options.length).fill('option-button3') : []); // Reset answer classes
      console.log(`New question received: ${JSON.stringify(data)}`); // Debug log

      // Clear any existing timeout and interval
      clearTimeout(matchmakingAnswerTimeout);
      clearInterval(matchmakingCountdownInterval);

      // Set a new timeout for 20 seconds
      matchmakingAnswerTimeout = setTimeout(() => {
        handleMatchmakingAnswer(''); // Send empty answer if time runs out
      }, 20000);

      // Set a new interval to update the remaining time every second
      matchmakingCountdownInterval = setInterval(() => {
        setMatchmakingRemainingTime(prev => {
          if (prev > 0) {
            return prev - 1;
          } else {
            clearInterval(matchmakingCountdownInterval);
            if (!matchmakingButtonDisabled) {
              console.log('Time expired! Sending empty answer.');
              handleMatchmakingAnswer(''); // Ensure it sends only if not already sent
            }
            return 0;
          }
        });
      }, 1000);
    });

    matchmakingSocket.on('results', (data) => {
      setMatchmakingResults(data);
      setMatchmakingRoomUsers(data.roomUsers); // Update room users with points
      console.log(`Results received: ${JSON.stringify(data)}`); // Debug log

      if (matchmakingCurrentQuestion && matchmakingCurrentQuestion.type === 'multiple-choice') {
        const newAnswerClasses = matchmakingCurrentQuestion.options.map((option) => {
          if (option === matchmakingCurrentQuestion.correctAnswer) {
            return 'option-button3 correct';
          } else {
            return 'option-button3 incorrect';
          }
        });
        setAnswerClasses(newAnswerClasses);
      }

      // Update correct answers count for each user
      const updatedCorrectAnswers = { ...userCorrectAnswers };
      data.userAnswers.forEach(answer => {
        if (answer.answer === data.correctAnswer) {
          updatedCorrectAnswers[answer.id] = (updatedCorrectAnswers[answer.id] || 0) + 1;
        }
      });
      console.log('Updated correct answers:', updatedCorrectAnswers); // Debug log
      setUserCorrectAnswers(updatedCorrectAnswers);
    });

    matchmakingSocket.on('quizEnd', (data) => {
      setMatchmakingQuizEnd(data);
      setMatchmakingQuizStarted(false);
      setMatchmakingResults(null); // Reset results before displaying final results
      console.log(`Quiz ended. Final data: ${JSON.stringify(data)}`); // Debug log
      console.log('Final correct answers:', userCorrectAnswers); // Debug log
    });

    return () => {
      matchmakingSocket.off('matchFound');
      matchmakingSocket.off('findingOpponent');
      matchmakingSocket.off('noOpponentFound');
      matchmakingSocket.off('newQuestion');
      matchmakingSocket.off('results');
      matchmakingSocket.off('quizEnd');
      clearTimeout(matchmakingAnswerTimeout); // Clear timeout on component unmount
      clearInterval(matchmakingCountdownInterval); // Clear interval on component unmount
    };
  }, []); // Add an empty dependency array to run the effect only once

  useEffect(() => {
    if (matchmakingQuizStarted && matchmakingCurrentQuestion) {
      // Clear any existing timeout and interval
      clearTimeout(matchmakingAnswerTimeout);
      clearInterval(matchmakingCountdownInterval);

      // Set a new timeout for 20 seconds
      matchmakingAnswerTimeout = setTimeout(() => {
        handleMatchmakingAnswer(''); // Send empty answer if time runs out
      }, 20000);

      // Set a new interval to update the remaining time every second
      matchmakingCountdownInterval = setInterval(() => {
        setMatchmakingRemainingTime(prev => {
          if (prev > 0) {
            return prev - 1;
          } else {
            clearInterval(matchmakingCountdownInterval);
            if (!matchmakingButtonDisabled) {
              console.log('Time expired! Sending empty answer.');
              handleMatchmakingAnswer(''); // Ensure it sends only if not already sent
            }
            return 0;
          }
        });
      }, 1000);
    }
  }, [matchmakingQuizStarted, matchmakingCurrentQuestion]);

  const handleCategorySelect = (e) => {
    setMatchmakingCategory(e.target.value);
    console.log(`Category selected: ${e.target.value}`); // Debug log
  };

  const handlePlay = () => {
    if (matchmakingCategory) {
      setMatchmakingStatus('Finding opponent...');
      setShowCategorySelect(false); // Hide category select and play button
      console.log('Emitting findMatch with:', { username: matchmakingUsername, category: matchmakingCategory }); // Debug log
      matchmakingSocket.emit('findMatch', { username: matchmakingUsername, category: matchmakingCategory });
    } else {
      setMatchmakingStatus('Please select a category.');
      console.log('Please select a category.'); // Debug log
    }
  };

  const handleMatchmakingAnswer = (answer) => {
    console.log('Submitting answer with room ID:', matchmakingRoomId, 'and answer:', answer); // Debug log
    if (matchmakingRoomId) {
      matchmakingSocket.emit('submitMatchmakingAnswer', matchmakingRoomId, answer);
      setMatchmakingButtonDisabled(true); // Disable button after submitting answer
      clearTimeout(matchmakingAnswerTimeout); // Clear the timeout when answer is submitted
      clearInterval(matchmakingCountdownInterval); // Clear the interval when answer is submitted
    } else {
      console.error('Room ID is null'); // Debug log
    }
  };

  const handleInputAnswer = (e) => {
    setMatchmakingUserAnswer(e.target.value);
    console.log(`Input answer changed: ${e.target.value}`); // Debug log
  };

  const submitInputAnswer = () => {
    handleMatchmakingAnswer(matchmakingUserAnswer);
    setMatchmakingInputDisabled(true); // Disable input after submitting answer
    console.log('Input answer submitted'); // Debug log
  };

  const handleLogout = () => {
    alert('Logging out...');
    setMatchmakingUsername('');
    setMatchmakingProfilePicture('');
    console.log('Logging out...'); // Debug log
  };

  return (
    <>
      <Navbar username={matchmakingUsername} profilePicture={matchmakingProfilePicture} onLogout={handleLogout} />
      <div className="quiz-container2">
        <div className="background-image2"></div>
        <div className="quiz-content2">
          <h1>{matchmakingRoomId ? `Room ID: ${matchmakingRoomId}` : 'Matchmaking'}</h1>
          {!matchmakingQuizStarted && !matchmakingQuizEnd && (
            <div className="start-section2">
              <h3>Select a category and level to start the quiz</h3>
              {showCategorySelect && (
                <>
                  <select onChange={handleCategorySelect} className="category-select2" value={matchmakingCategory}>
                    <option value="">Select Category</option>
                    <option value="animals">🐘 Animals</option>
                    <option value="movies">🎬 Movies</option>
                    <option value="science">🔬 Science</option>
                    <option value="history">📜 History</option>
                    <option value="geography">🌍 Geography</option>
                    <option value="general">❓ General</option>
                  </select>
                  {matchmakingCategory && (
                    <button onClick={handlePlay} className="level-button2">Play</button>
                  )}
                </>
              )}
            </div>
          )}
          
          {!matchmakingQuizStarted && !matchmakingQuizEnd && matchmakingRoomUsers && matchmakingRoomUsers.length > 0 && (
            <div className="statistics-container3">
              <h2>Users in Room:</h2>
              <ul>
                {matchmakingRoomUsers.map((user, index) => (
                  <li key={index}>
                    <span className="username">{user.username}</span>
                    <span className="checkmark">✔️</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {matchmakingQuizStarted && matchmakingCurrentQuestion && (
            <div className="question-section2">
              <div className="timer-container">
                <span className="timer-text">Time remaining: {matchmakingRemainingTime} s</span>
              </div>
              <div className="question-box">
                <h3>{matchmakingQuestionNumber}/5</h3>
                <h3>{matchmakingCurrentQuestion.question}</h3>
              </div>
              {matchmakingCurrentQuestion.type === 'multiple-choice' ? (
                <div className="options-grid2">
                  {matchmakingCurrentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleMatchmakingAnswer(option)}
                      disabled={matchmakingButtonDisabled}
                      className={`option-button3 ${matchmakingResults && option === matchmakingCurrentQuestion.correctAnswer ? 'correct' : matchmakingResults && matchmakingResults.correctAnswer && option !== matchmakingCurrentQuestion.correctAnswer ? 'incorrect' : ''}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : matchmakingCurrentQuestion.type === 'input' ? (
                <div className="input-section2">
                  <input
                    type="text"
                    value={matchmakingUserAnswer}
                    onChange={handleInputAnswer}
                    disabled={matchmakingInputDisabled}
                    className="answer-input2"
                  />
                  <button onClick={submitInputAnswer} disabled={matchmakingInputDisabled} className="submit-button2">Submit</button>
                </div>
              ) : (
                <p>Unknown question type</p>
              )}
              {matchmakingResults && matchmakingResults.userAnswers && (
                <div className="correct-answer-section2">
                  <h3 className="slova">Results:</h3>
                  <p className="correct-answer-box">Correct answer: {matchmakingResults.correctAnswer}</p>
                  <ul>
                    {matchmakingResults.userAnswers.map((answer, index) => (
                      <li key={index} className={`answer-box ${answer.answer === matchmakingResults.correctAnswer ? 'correct-answer-box' : 'your-answer-box incorrect'}`}>
                        {matchmakingRoomUsers.find(user => user.id === answer.id)?.username || 'Unknown'}: {answer.answer}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {matchmakingQuizEnd && (
            <div className="end-results-container2">
              <h3>Quiz Ended</h3>
              {matchmakingQuizEnd.message ? (
                <p>{matchmakingQuizEnd.message}</p>
              ) : (
                <div>
                  <p className="result-font">Winner: {matchmakingQuizEnd.winner}</p>
                  <p className="result-font">Loser: {matchmakingQuizEnd.loser}</p>
                </div>
              )}
              <div className="final-statistics">
                {matchmakingQuizEnd.roomUsers.map((user, index) => (
                  <div key={index} className="player-stats">
                    <h3>{user.username}</h3>
                    <p>Correct answers: {user.points}</p>
                    <p>Incorrect answers: {5-user.points}</p>

                  </div>
                ))}
              </div>
            </div>
          )}
          {matchmakingStatus && (
            <div className="status-message">
              <p>{matchmakingStatus}</p>
              {matchmakingStatus === 'Finding opponent...' && (
                <div className="loading-dots">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Matchmaking;