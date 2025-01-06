import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// Provjera da li je korisnik prijavljen
const PrivateRoute = () => {
  const token = localStorage.getItem('token');  // Provjerava ako je token pohranjen

  if (!token) {
    // Ako nema tokena, preusmjerava na login stranicu
    return <Navigate to="/login" />;
  }

  // Ako je korisnik prijavljen, prikazuje sadržaj rute (Outlet)
  return <Outlet />;
};

export default PrivateRoute;
