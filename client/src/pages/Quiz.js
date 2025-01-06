import React, { useEffect, useState, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import Navbar from '../components/Navbarr';  // Import the Navbar component
import '../App.css';

const Quiz = ({ hints, setHints }) => {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [roomMessage, setRoomMessage] = useState(''); 
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [username, setUsername] = useState('');  // State to store username
  const [profilePicture, setProfilePicture] = useState(''); // State to store profile picture
  const [isReady, setIsReady] = useState(false); // State to track if the user is ready
  const [roomUsers, setRoomUsers] = useState([]); // State for users in the room
  const [quizEnded, setQuizEnded] = useState(false); // State for quiz end
  const [results, setResults] = useState(null); // State for results
  const [questionCount, setQuestionCount] = useState(0); // State for current question count
  const [chatMessages, setChatMessages] = useState([]); // State for chat messages
  const [currentMessage, setCurrentMessage] = useState(''); // State for current message
  const [timeLeft, setTimeLeft] = useState(20); // State for timer
  const [friendUsername, setFriendUsername] = useState(''); // State for friend's username
  const [friends, setFriends] = useState([]); // State for friends list
  const [filteredFriends, setFilteredFriends] = useState([]); // State for filtered friends
  const [users, setUsers] = useState([]); // State for users
  

  const timerRef = useRef(null); // Ref to keep track of the interval timer

  const joinRoom = useCallback((room) => {
    if (socket) {
      console.log(`Pridruživanje sobi: ${room}`);
      socket.emit('joinRoom', room);
      setRoomId(room);
      setWaitingForOpponent(true);
      setRoomMessage('Čekamo protivnika, ljudi u sobi 1/2');
    }
  }, [socket]);

  const leaveRoom = () => {
    if (socket && roomId) {
      socket.emit('leaveRoom', roomId);
      resetQuiz();
    }
  };

  const submitAnswer = useCallback(() => {
    console.log('Submitting answer:', userAnswer);
    socket.emit('submitAnswer', roomId, userAnswer);
    setIsAnswered(true);
  }, [socket, roomId, userAnswer]);

  useEffect(() => {
    // Retrieve the token and username from local storage or any other state management solution
    const token = localStorage.getItem('token'); // Replace with your token retrieval logic
    const storedUsername = localStorage.getItem('username'); // Retrieve the username

    setUsername(storedUsername); // Set the username state

    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
  
    fetchUsers();
  

    const fetchProfile = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfilePicture(response.data.profile_picture);
        setHints(response.data.hints); // Set the hints state

      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();

    const fetchFriends = async () => {
      try {
        const response = await axios.get('http://localhost:5000/friends', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFriends(response.data);
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
    };

    fetchFriends();

    const socketConnection = io('http://localhost:5000', {
      transports: ['websocket'],
      auth: {
        token: token
      }
    });
    setSocket(socketConnection);

    socketConnection.on('connect', () => {
      console.log('Connected to server, ID:', socketConnection.id);
    });

    socketConnection.on('hint', (hint) => {
      setUserAnswer(hint); // Update the input field with the hint
    });

    socketConnection.on('startQuiz', () => {
      setQuizStarted(true);
      setQuestionCount(1); // Set current question count to 1 when the quiz starts
    });

    socketConnection.on('roomMessage', (message) => {
      console.log('Room message:', message);
      setRoomMessage(message);
    });

    socketConnection.on('userJoinedRoom', (message) => {
      setRoomMessage(prevMessage => `${prevMessage}\n${message}`);
    });

    // When the server sends data about users in the room
    socketConnection.on('roomUsers', (users) => {
      setRoomUsers(users);  // Update users in the room
      if (users.length === 2) {
        setWaitingForOpponent(false);
        setRoomMessage('Oba korisnika su u sobi. Kliknite "Spreman" kada budete spremni za početak kviza.');
      }
    });

    socketConnection.on('newQuestion', (data) => {
      setCurrentQuestion(data.question);
      setIsAnswered(false);
      setUserAnswer('');  // Reset input field each time a new question arrives
      setResults(null); // Reset results for a new round
      setQuestionCount(prevCount => prevCount + 1); // Increase current question count
      setTimeLeft(20); // Reset timer for a new question
    });

    socketConnection.on('results', (data) => {
      setResults(data); // Set results
      setRoomUsers(data.roomUsers); // Update user points
    });

    socketConnection.on('quizEnd', (users) => {
      setRoomUsers(users);
      setQuizEnded(true);
      setResults(null); // Reset results before displaying final results
    });

    socketConnection.on('chatMessage', (message) => {
      setChatMessages(prevMessages => [...prevMessages, message]);
    });

    return () => {
      if (socketConnection) {
        socketConnection.disconnect();
      }
    };
  }, [setHints]);

  useEffect(() => {
    if (quizEnded) {
      const timer = setTimeout(() => {
        window.location.reload();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [quizEnded]);

  useEffect(() => {
    if (socket) {
      socket.on('receiveChallenge', (challengerUsername) => {
        console.log(`Primljen izazov od: ${challengerUsername}`);
        if (window.confirm(`${challengerUsername} vas je izazvao na kviz. Prihvatiti?`)) {
          console.log(`Prihvaćanje izazova od: ${challengerUsername}`);
          socket.emit('acceptChallenge', challengerUsername);
        } else {
          console.log(`Odbijanje izazova od: ${challengerUsername}`);
        }
      });
  
      socket.on('challengeAccepted', (roomId) => {
        console.log(`Izazov prihvaćen, soba: ${roomId}`);
        joinRoom(roomId);
      });
    }
  }, [socket, joinRoom]);

  useEffect(() => {
    if (quizStarted && currentQuestion && !isAnswered) {
      console.log('Starting timer...');
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          console.log('Timer tick:', prevTime);
          if (prevTime <= 1) {
            clearInterval(timerRef.current);
            submitAnswer();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => {
      console.log('Clearing timer...');
      clearInterval(timerRef.current);
    };
  }, [quizStarted, currentQuestion, isAnswered, submitAnswer]);

  const handleLogout = () => {
    // Implement logout functionality, such as clearing user data, etc.
    alert('Logging out...');
    setUsername('');  // Clear username
    localStorage.removeItem('token'); // Clear token from local storage
    localStorage.removeItem('username'); // Clear username from local storage
  };

  const resetQuiz = () => {
    setRoomId(null);
    setWaitingForOpponent(false);
    setRoomMessage('');
    setQuizStarted(false);
    setCurrentQuestion('');
    setUserAnswer('');
    setIsAnswered(false);
    setRoomUsers([]);
    setQuizEnded(false);
    setResults(null);
    setQuestionCount(0); // Reset current question count
    setTimeLeft(20); // Reset timer
  };

  const useHint = () => {
    if (socket && roomId) {
      socket.emit('useHint', roomId);
      setHints(hints - 1); // Decrease the hints state
    }
  };

  const sendMessage = () => {
    if (socket && currentMessage.trim() !== '') {
      socket.emit('chatMessage', currentMessage);
      setCurrentMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const handleReadyClick = () => {
    setIsReady(!isReady);
    socket.emit('ready', roomId, !isReady);
  };

  const getResultMessage = () => {
    if (roomUsers.length < 2) return '';
    const [user1, user2] = roomUsers;
    if (user1.points === user2.points) {
      return 'Rezultat: Neriješeno';
    }
    const winner = user1.points > user2.points ? user1.username : user2.username;
    return `Rezultat: Korisnik ${winner} je pobijedio`;
  };

  const getWinnerClass = (user) => {
    const maxPoints = Math.max(...roomUsers.map(u => u.points));
    return user.points === maxPoints ? 'winner' : '';
  };

  const challengeFriend = () => {
    if (socket) {
      console.log(`Izazivanje prijatelja: ${friendUsername}`);
      socket.emit('challengeFriend', friendUsername);
    }
  };

  const handleFriendUsernameChange = (e) => {
    const value = e.target.value;
    setFriendUsername(value);
    if (value) {
      const filtered = friends.filter(friend => friend.username.toLowerCase().includes(value.toLowerCase()));
      setFilteredFriends(filtered);
    } else {
      setFilteredFriends([]);
    }
  };

  return (
    <div className="quiz-page">
      <Navbar username={username} profilePicture={profilePicture} onLogout={handleLogout} /> {/* Add Navbar */}
      <div className="left-sidebar">
      <h2>Online players</h2>
      <ul>
        {users
          .filter(user => user.username !== username) // Filter out the current user
          .map(user => (
            <li key={user.id}>
              <span className={user.online ? 'online-dot' : 'offline-dot'}></span>
              {user.username}
              <span className={`status ${user.online ? 'active' : 'inactive'}`}>
                {user.online ? 'Online' : 'Offline'}
              </span>
            </li>
          ))}
      </ul>
    </div>
      <div className="quiz-container">
        <h1>Dobrodošli na kviz!</h1>
        {socket ? (
          <>
            {!quizStarted && (
              <div className="button-container-wrapper">
                {!roomId && (
                  <div className="button-container">
                    <button className="small-button" onClick={() => joinRoom('room1')}>Soba 1</button>
                    <button className="small-button" onClick={() => joinRoom('room2')}>Soba 2</button>
                  </div>
                )}
                {!roomId && (
                  <div className="friend-challenge-container">
                    <input
                      type="text"
                      placeholder="Unesite korisničko ime prijatelja"
                      value={friendUsername}
                      onChange={handleFriendUsernameChange}
                    />
                    <button onClick={challengeFriend}>Izazovi prijatelja</button>
                    {filteredFriends.length > 0 && (
                      <ul className="friend-suggestions">
                        {filteredFriends.map((friend, index) => (
                          <li key={index} onClick={() => setFriendUsername(friend.username)}>
                            {friend.username}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {roomId && !quizStarted && (
                  <button className="leave-room-button" onClick={leaveRoom}>Izlaz iz sobe</button>
                )}
              </div>
            )}
            {roomId && (
              <div>
                <h3>Trenutna soba: {roomId}</h3>
                {quizStarted && <h3>Pitanje: {questionCount}/3</h3>} {/* Display current question count */}
                {waitingForOpponent && !quizStarted && <p className="waiting-message blinking-text">{roomMessage}</p>} {/* Show waiting message only if quiz hasn't started */}
                <div className="quiz-content">
                  {quizStarted && !quizEnded && (
                    <div className="quiz-started">
                      <p><strong>Pitanje:</strong> {currentQuestion}</p>
                      {!isAnswered && (
                        <div className="timer-container">
                          <svg className="timer-svg" width="100" height="100">
                            <circle
                              className="timer-circle"
                              cx="50"
                              cy="50"
                              r="45"
                              style={{
                                animation: `countdown 20s linear forwards`
                              }}
                            ></circle>
                          </svg>
                          <div className="timer-text">{timeLeft}</div>
                        </div>
                      )}
                      
                      <div className="hint-container">
                      <input
                        type="text"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        disabled={isAnswered}
                      />
                      {!isAnswered && (
                        <i
                          className="fas fa-magic hint-icon"
                          onClick={useHint}
                          style={{ cursor: hints > 0 ? 'pointer' : 'not-allowed', color: hints > 0 ? '#007bff' : '#ccc' }}
                          title={`Use Hint (${hints} left)`}
                        ></i>
                      )} {/* Replace the "Use Hint" button with an icon */}
                    </div>
                      <button onClick={submitAnswer} disabled={isAnswered}>Potvrdi odgovor</button>
                      
                    </div>
                    
                  )}
                  {results && (
                    <div className="results-container">
                      <h3>Rezultati trenutnog pitanja:</h3>
                      <ul>
                        {results.userAnswers.map((userAnswer, index) => {
                          const user = roomUsers.find(user => user.id === userAnswer.id);
                          return (
                            <li
                              key={index}
                              className={userAnswer.answer === results.correctAnswer ? 'correct-answer' : 'incorrect-answer'}
                            >
                              Korisnik {user ? user.username : 'Nepoznat'} - Odgovor: <span className="user-answer">{userAnswer.answer}</span>
                            </li>
                          );
                        })}
                      </ul>
                      <p className="correct-answer-text">Točan odgovor: {results.correctAnswer}</p>
                    </div>
                  )}
                </div>
                {roomMessage && !quizStarted && <p className="room-message">{roomMessage}</p>} {/* Show room message only if quiz hasn't started */}

                {/* Display users in the room */}
                {roomUsers && roomUsers.length > 0 && (
                  <div className="results-container">
                    <h3>Korisnici u sobi:</h3>
                    <ul>
                      {roomUsers.map((user, index) => (
                        <li key={index}>
                          Korisnik {user.username} <span className="checkmark">✔️</span> {user.ready && <span className="ready-status">Spreman</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Display scores at the end of the quiz */}
                {quizEnded && (
                  <div className="end-results-container">
                    <h3>Kviz je završen!</h3>
                    <h3>Rezultati:</h3>
                    <ul>
                      {roomUsers.map((user, index) => (
                        <li
                          key={index}
                          className={getWinnerClass(user)}
                        >
                          Korisnik {user.username} - Bodovi: {user.points}
                        </li>
                      ))}
                    </ul>
                    <p>{getResultMessage()}</p>
                    <button onClick={resetQuiz}>Povratak na početak</button>
                  </div>
                )}
                {!isReady && !quizStarted && (
                  <button className={`ready-button ${isReady ? 'unready' : 'ready'}`} onClick={handleReadyClick}>
                    {isReady ? 'Unready' : 'Ready'}
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <p>Spajanje na server...</p>
        )}
      </div>
      {!quizStarted && (
        <div className="chatbox">
          <h2 className="chat-heading">Chat</h2>
          <hr className="chat-divider" />
          <div className="chat-messages">
            {chatMessages.map((message, index) => (
              <p key={index} className="chat-message">{message}</p>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              placeholder="Unesite poruku"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button onClick={sendMessage}>Pošalji</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quiz;