import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbarr';  // Import the Navbar component
import '../App.css';

const Trening = () => {
  const [username, setUsername] = useState(''); // Define the username state
  const [profilePicture, setProfilePicture] = useState('');
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [quizEnded, setQuizEnded] = useState(false);
  const [level, setLevel] = useState(null); // State to store the selected level
  const [category, setCategory] = useState('animals'); // State to store the selected category
  const [correctAnswers, setCorrectAnswers] = useState(0); // State to store correct answers count
  const [incorrectAnswers, setIncorrectAnswers] = useState(0); // State to store incorrect answers count
  const [timeTaken, setTimeTaken] = useState([]); // State to store time taken for each question
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false); // State to show correct answer
  const timerRef = useRef(null); // Ref to store the timer

  const totalQuestions = 5;

  useEffect(() => {
    const storedUsername = localStorage.getItem('username'); // Retrieve the username
    setUsername(storedUsername); // Set the username state
  
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Fetching profile with token:', token);
        const response = await fetch('http://localhost:5000/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        console.log('Profile fetched:', data);
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

  const startQuiz = async (selectedLevel, selectedCategory) => {
    console.log('Starting quiz...');
    setQuizStarted(true);
    setQuizEnded(false);
    setScore(0);
    setQuestionIndex(0);
    setLevel(selectedLevel); // Set the selected level
    setCategory(selectedCategory); // Set the selected category
    setCorrectAnswers(0);
    setIncorrectAnswers(0);
    setTimeTaken([]);
    await fetchNextQuestion(selectedLevel, selectedCategory);
  };

  const fetchNextQuestion = async (selectedLevel, selectedCategory) => {
    try {
      console.log('Fetching next question...');
      let response;
      if (selectedLevel === 1) {
        response = await fetch(`http://localhost:5000/api/training-question?category=${selectedCategory}`);
      } else if (selectedLevel === 2) {
        const random = Math.random() < 0.5;
        if (random) {
          response = await fetch(`http://localhost:5000/api/training-question?category=${selectedCategory}`);
        } else {
          response = await fetch(`http://localhost:5000/api/random-question?category=${selectedCategory}`);
        }
      } else {
        response = await fetch(`http://localhost:5000/api/random-question?category=${selectedCategory}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      console.log('Fetched question:', data);

      setCurrentQuestion(data);
      setShowCorrectAnswer(false); // Hide the correct answer when fetching a new question
      startTimer(); // Start the timer when a new question is fetched
    } catch (error) {
      console.error('Error fetching question:', error);
      setCurrentQuestion({ error: 'Error fetching question' });
    }
  };

  const startTimer = () => {
    timerRef.current = Date.now();
  };

  const stopTimer = () => {
    const timeElapsed = (Date.now() - timerRef.current) / 1000; // Time in seconds
    setTimeTaken((prevTimes) => [...prevTimes, timeElapsed]);
  };

  const handleAnswer = async (answer) => {
    stopTimer(); // Stop the timer when the user answers
    console.log('Answer selected:', answer);
    if (answer === currentQuestion.correctAnswer) {
      console.log('Correct answer!');
      setScore((prevScore) => prevScore + 1);
      setCorrectAnswers((prevCount) => prevCount + 1);
    } else {
      console.log('Wrong answer!');
      setIncorrectAnswers((prevCount) => prevCount + 1);
    }

    setShowCorrectAnswer(true); // Show the correct answer

    setTimeout(async () => {
      if (questionIndex + 1 < totalQuestions) {
        setQuestionIndex((prevIndex) => prevIndex + 1);
        await fetchNextQuestion(level, category);
      } else {
        console.log('Quiz ended');
        setQuizEnded(true);
      }
    }, 3000); // Wait for 3 seconds before fetching the next question
  };

  const handleInputAnswer = (e) => {
    setUserAnswer(e.target.value);
  };

  const submitInputAnswer = () => {
    handleAnswer(userAnswer);
    setUserAnswer('');
  };

  const sendPerformanceData = async (category, level, correctAnswers, incorrectAnswers, averageTime) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/store-performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ category, level, correctAnswers, incorrectAnswers, averageTime })
      });
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      console.log('Performance data stored:', data);
    } catch (error) {
      console.error('Error storing performance data:', error);
    }
  };

  useEffect(() => {
    if (quizEnded) {
      console.log('Quiz ended, showing results');
      const averageTime = timeTaken.length > 0 ? (timeTaken.reduce((a, b) => a + b, 0) / timeTaken.length).toFixed(2) : 0;
      sendPerformanceData(category, level, correctAnswers, incorrectAnswers, averageTime);
  
      const timer = setTimeout(() => {
        console.log('Refreshing page...');
        window.location.reload();
      }, 7000); // Reloads page after 15 seconds to allow user to see results
      return () => clearTimeout(timer);
    }
  }, [quizEnded, category, level, correctAnswers, incorrectAnswers, timeTaken]);

  useEffect(() => {
    console.log('Rendering component with state:', { quizStarted, quizEnded, score, questionIndex, currentQuestion });
  }, [quizStarted, quizEnded, score, questionIndex, currentQuestion]); // Add dependencies to log changes

  return (
    <>
      <Navbar username={username} profilePicture={profilePicture} onLogout={handleLogout} />
      <div className="help-container">
        <div className="background-image"></div>
        <div className="help-content">
          <h1>Help & Support</h1>
          <div className="help-section">
            <h2>Frequently Asked Questions (FAQs)</h2>
            {!quizStarted ? (
              <div>
                <select onChange={(e) => setCategory(e.target.value)}>
                  <option value="animals">Animals</option>
                  <option value="movies">Movies</option>
                  <option value="science">Science</option>
                  <option value="history">History</option>
                  <option value="geography">Geography</option>
                  <option value="general">General</option>
                </select>
                <button onClick={() => startQuiz(1, category)}>Level 1</button>
                <button onClick={() => startQuiz(2, category)}>Level 2</button>
                <button onClick={() => startQuiz(3, category)}>Level 3</button>
              </div>
            ) : quizEnded ? (
              <div className="end-results-container">
                <h3>Quiz Finished!</h3>
                <h3>Results:</h3>
                <p>Your score: {score} / {totalQuestions}</p>
                <p>Correct answers: {correctAnswers}</p>
                <p>Incorrect answers: {incorrectAnswers}</p>
                
                {console.log('Displaying results:', { score, totalQuestions })}
              </div>
            ) : (
              <div>
                {currentQuestion ? (
                  currentQuestion.error ? (
                    <p>{currentQuestion.error}</p>
                  ) : (
                    <>
                      <h3>Question {questionIndex + 1} / {totalQuestions}</h3>
                      <h3>{currentQuestion.question}</h3>
                      {console.log('Current question type:', currentQuestion.type)}
                      {currentQuestion.type === 'multiple-choice' ? (
                        currentQuestion.options.map((option, index) => (
                          <button key={index} onClick={() => handleAnswer(option)}>
                            {option}
                          </button>
                        ))
                      ) : currentQuestion.type === 'input' ? (
                        <div>
                          <input
                            type="text"
                            value={userAnswer}
                            onChange={handleInputAnswer}
                          />
                          <button onClick={submitInputAnswer}>Submit</button>
                        </div>
                      ) : (
                        <p>Unknown question type</p>
                      )}
                      {showCorrectAnswer && (
                        <p>Correct answer: {currentQuestion.correctAnswer}</p>
                      )}
                    </>
                  )
                ) : (
                  <p>Loading question...</p>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="statistics-container">
          <h2>Statistics</h2>
          <p>Correct answers: {correctAnswers}</p>
          <p>Incorrect answers: {incorrectAnswers}</p>
          <p>Average time per question: {timeTaken.length > 0 ? (timeTaken.reduce((a, b) => a + b, 0) / timeTaken.length).toFixed(2) : 0} seconds</p>
        </div>
      </div>
    </>
  );
};

export default Trening;