import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../App.css';  // Ensure you're importing the CSS file
import Navbar from '../components/Navbar'; // Adjust the path according to your project structure


const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');  // Clear any previous error messages

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Lozinke se ne podudaraju!');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      alert('Registracija uspješna!');
      navigate('/login');  // Redirect to login page after successful registration
    } catch (err) {
      console.error(err);
      setErrorMessage('Greška pri registraciji.');
    }
  };

  return (
    <div className="form-container">
      <Navbar />  {/* Navbar added here */}
      <div className="form-box">
        <h1>Registracija</h1>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Korisničko ime:</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Lozinka:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Potvrdi lozinku:</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          {errorMessage && <div className="error-message">{errorMessage}</div>}
        

          <button type="submit">Registriraj se</button>
        </form>
      </div>
    </div>
  );
};

export default Register;
