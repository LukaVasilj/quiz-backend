import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';  // Ensure you're importing the CSS file

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');  // Clear any previous error messages
  
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
  
      if (!response.ok) {
        const errorMessage = await response.text();
        setErrorMessage(errorMessage || 'Neuspješan login');
        return;
      }
  
      const data = await response.json();
      console.log('Login response data:', data); // Debug log
      localStorage.setItem('token', data.token);  // Store JWT token in localStorage
      localStorage.setItem('username', data.username);  // Store username in localStorage
      localStorage.setItem('role', data.role);  // Store role in localStorage
  
      // Redirect user based on role
      if (data.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/quiz');
      }
    } catch (error) {
      setErrorMessage('Došlo je do greške prilikom prijave. Pokušajte ponovno.');
      console.error('Login error:', error);
    }
  };

  return (
    <div className="form-container">
      {/* Login Box */}
      <div className="form-box">
        <h1>Prijava</h1>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Lozinka:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {errorMessage && <div className="error-message">{errorMessage}</div>}
          <button type="submit">Prijavi se</button>
        </form>
      </div>
    </div>
  );
};

export default Login;