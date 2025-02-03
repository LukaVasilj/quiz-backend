import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbarr';  // Import the Navbar component
import '../App.css';
import '../Trening.css'; // Import the CSS file for Trening component

const Trening = () => {
  const [username, setUsername] = useState(''); // Define the username state
  const [profilePicture, setProfilePicture] = useState('');
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState(''); // Define the user answer state
  const [score, setScore] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [quizEnded, setQuizEnded] = useState(false);
  const [level, setLevel] = useState(null); // State to store the selected level
  const [category, setCategory] = useState('animals'); // State to store the selected category
  const [correctAnswers, setCorrectAnswers] = useState(0); // State to store correct answers count
  const [incorrectAnswers, setIncorrectAnswers] = useState(0); // State to store incorrect answers count
  const [timeTaken, setTimeTaken] = useState([]); // State to store time taken for each question
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false); // State to show correct answer
  const [inputDisabled, setInputDisabled] = useState(false); // Define the input disabled state
  const [buttonDisabled, setButtonDisabled] = useState(false); // Define the button disabled state
  const [submittedAnswer, setSubmittedAnswer] = useState(''); // Define the submitted answer state
  const [answerClasses, setAnswerClasses] = useState([]); // Define the answer classes state
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
      let url;
      if (selectedLevel === 1) {
        url = `http://localhost:5000/api/training-question?category=${selectedCategory}`;
      } else if (selectedLevel === 2) {
        const random = Math.random() < 0.5;
        if (random) {
          url = `http://localhost:5000/api/training-question?category=${selectedCategory}`;
        } else {
          url = `http://localhost:5000/api/random-question?category=${selectedCategory}`;
        }
      } else {
        url = `http://localhost:5000/api/random-question?category=${selectedCategory}`;
      }
      console.log('Fetching URL:', url);
      response = await fetch(url);
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      console.log('Fetched question:', data);

      // Check if the question is of type 'multiple-choice' and has options
      if (data.type === 'multiple-choice' && !data.options) {
        throw new Error('No options available for this question');
      }

      setCurrentQuestion(data);
      setShowCorrectAnswer(false); // Hide the correct answer when fetching a new question
      setInputDisabled(false); // Enable input
      setButtonDisabled(false); // Enable button
      setSubmittedAnswer(''); // Reset submitted answer
      setUserAnswer(''); // Reset user answer
      setAnswerClasses(data.type === 'multiple-choice' ? new Array(data.options.length).fill('option-button2') : []); // Reset answer classes
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

  const handleAnswer = async (answer, index) => {
    stopTimer(); // Stop the timer when the user answers
    console.log('Answer selected:', answer);
    setButtonDisabled(true); // Disable button after submitting answer
    setInputDisabled(true); // Disable input after submitting answer
    setSubmittedAnswer(answer); // Set the submitted answer

    if (currentQuestion.type === 'multiple-choice') {
      const newAnswerClasses = currentQuestion.options.map((option) => {
        if (option === currentQuestion.correctAnswer) {
          return 'option-button2 correct';
        } else {
          return 'option-button2 incorrect';
        }
      });
      setAnswerClasses(newAnswerClasses);
    }

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
      }, 15000); // Reloads page after 15 seconds to allow user to see results
      return () => clearTimeout(timer);
    }
  }, [quizEnded, category, level, correctAnswers, incorrectAnswers, timeTaken]);

  useEffect(() => {
    console.log('Rendering component with state:', { quizStarted, quizEnded, score, questionIndex, currentQuestion });
  }, [quizStarted, quizEnded, score, questionIndex, currentQuestion]); // Add dependencies to log changes

  return (
    <>
      <Navbar username={username} profilePicture={profilePicture} onLogout={handleLogout} />
      <div className="quiz-container2">
        <div className="background-image2"></div>
        <div className="quiz-content2">
          <h1>Training Quiz</h1>
          <div className="quiz-section2">
            {!quizStarted ? (
              <div className="start-section2">
                <h3>Select a category and level to start the quiz</h3>
                <select onChange={(e) => setCategory(e.target.value)} className="category-select2">
                <option value="animals">🐘 Animals</option>
                <option value="movies">🎬 Movies</option>
                  <option value="science">🔬 Science</option>
                  <option value="history">📜 History</option>
                  <option value="geography">🌍 Geography</option>
                  <option value="general">❓ General</option>
                </select>
                <div className="level-buttons2">
                  <button onClick={() => startQuiz(1, category)} className="level-button2">Level 1</button>
                  <button onClick={() => startQuiz(2, category)} className="level-button2">Level 2</button>
                  <button onClick={() => startQuiz(3, category)} className="level-button2">Level 3</button>
                </div>
              </div>
            ) : quizEnded ? (
              <div className="end-results-container2">
                <h3>Quiz Finished!</h3>
                <h3>Results:</h3>
                <p>Your score: {score} / {totalQuestions}</p>
                <p>Correct answers: {correctAnswers}</p>
                <p>Incorrect answers: {incorrectAnswers}</p>
                <p>Average time per question: {timeTaken.length > 0 ? (timeTaken.reduce((a, b) => a + b, 0) / timeTaken.length).toFixed(2) : 0} seconds</p>
                {console.log('Displaying results:', { score, totalQuestions })}
              </div>
            ) : (
              <div className="question-section2">
                {currentQuestion ? (
                  currentQuestion.error ? (
                    <p>{currentQuestion.error}</p>
                  ) : (
                    <>
                      <h3>Question {questionIndex + 1} / {totalQuestions}</h3>
                      <h3>{currentQuestion.question}</h3>
                      {console.log('Current question type:', currentQuestion.type)}                    
                      {currentQuestion.type === 'multiple-choice' ? (
                        <div className="options-grid2">
                          {currentQuestion.options.map((option, index) => (
                            <button key={index} onClick={() => handleAnswer(option, index)} disabled={buttonDisabled} className={answerClasses[index]}>
                              {option}
                            </button>
                          ))}
                        </div>
                      ) : currentQuestion.type === 'input' ? (
                        <div className="input-section2">
                          <input
                            type="text"
                            value={userAnswer}
                            onChange={handleInputAnswer}
                            disabled={inputDisabled}
                            className="answer-input2"
                          />
                          <button onClick={submitInputAnswer} disabled={inputDisabled} className="submit-button2">Submit</button>
                        </div>
                      ) : (
                        <p>Unknown question type</p>
                      )}
                      {showCorrectAnswer && (
                        <div className="correct-answer-section2">
                          <div className="answer-box correct-answer-box">
                            <p>Correct answer: {currentQuestion.correctAnswer}</p>
                          </div>
                          <div className={`answer-box your-answer-box ${submittedAnswer === currentQuestion.correctAnswer ? 'correct' : 'incorrect'}`}>
                            <p>Your answer: {submittedAnswer}</p>
                          </div>
                        </div>
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
        {quizStarted && !quizEnded && (
          <div className="statistics-container2">
            <h2>Statistics</h2>
            <p>Correct answers: {correctAnswers}</p>
            <p>Incorrect answers: {incorrectAnswers}</p>
            <p>Average time per question: {timeTaken.length > 0 ? (timeTaken.reduce((a, b) => a + b, 0) / timeTaken.length).toFixed(2) : 0} seconds</p>
          </div>
        )}
      </div>
    </>
  );
};

export default Trening;