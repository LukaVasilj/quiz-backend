import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (!token) {
    // Ako korisnik nije prijavljen, preusmjeri ga na login stranicu
    return <Navigate to="/login" />;
  }

  if (role && userRole !== role) {
    // Ako korisnik nema odgovarajuću ulogu, preusmjeri ga na home stranicu
    return <Navigate to="/quiz" />;
    
  }

  return children;
};

export default ProtectedRoute;