import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';  // Uvoz za socket.io-client

const Dashboard = () => {
  const [userData, setUserData] = useState(null);  // Za pohranu podataka korisnika
  const [loading, setLoading] = useState(true);  // Za prikaz učitavanja
  const [isLoggedIn, setIsLoggedIn] = useState(true);  // Za provjeru da li je korisnik prijavljen
  const [socket, setSocket] = useState(null);  // Držimo WebSocket konekciju
  const [roomId, setRoomId] = useState(null);  // Za pohranu ID sobe
  const navigate = useNavigate();  // Hook za navigaciju

  useEffect(() => {
    const token = localStorage.getItem('token'); // Provjeri postoji li token
    if (!token) {
      setIsLoggedIn(false);  // Ako nema tokena, postavi status na false
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/dashboard', {
          method: 'GET',  // Provjerite da je metoda GET
          headers: {
            'Authorization': `Bearer ${token}`,  // Dodaj token u Authorization header
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Greška u odgovoru: ', errorText);  // Ispiši grešku u konzolu
          throw new Error('Neuspješan odgovor od servera');
        }

        const data = await response.json();
        console.log('Dohvaćeni podaci:', data);
        setUserData(data);  // Spremi korisničke podatke
      } catch (error) {
        console.error('Greška prilikom dohvaćanja podataka:', error);
      } finally {
        setLoading(false);  // Postavi loading na false bez obzira na ishod
      }
    };

    fetchData();  // Pozovi fetch funkciju

    // Povezivanje sa socket.io serverom
    const socketConnection = io('http://localhost:5000');  // Povezivanje sa serverom
    setSocket(socketConnection);

    return () => {
      if (socketConnection) {
        socketConnection.disconnect();  // Isključi WebSocket kada se komponenta unmount-a
      }
    };
  }, []);  // `useEffect` se aktivira samo jednom kad se komponenta učita

  // Funkcija za pridruživanje sobi
  const joinRoom = (room) => {
    if (socket) {
      socket.emit('joinRoom', room);  // Pošaljemo podatke o sobi serveru
      setRoomId(room);  // Spremi ID sobe
    }
  };

  // Funkcija za slanje odgovora
  const submitAnswer = (answer) => {
    if (socket && roomId) {
      socket.emit('submitAnswer', { roomId, answer });  // Pošaljemo odgovor u sobu
    }
  };

  const handleLogout = () => {
    // Ukloni token iz localStorage
    localStorage.removeItem('token');
    // Preusmjeri na login
    navigate('/login');
  };

  if (!isLoggedIn) {
    return <Navigate to="/login" />;  // Ako nije prijavljen, preusmjeri na login
  }

  if (loading) {
    return <p>Učitavam podatke...</p>;  // Prikazuje se dok se podaci učitavaju
  }

  return (
    <div>
      <h1>Dobrodošli na Dashboard!</h1>

      {userData ? (
        <div>
                    <h2>Dobrodošli, {userData.name}!</h2>
          <p>Email: {userData.email}</p>
          {/* Ovdje možeš dodati ostale podatke o korisniku */}

          {/* Pridruživanje sobi */}
          <button onClick={() => joinRoom('room1')}>Pridruži se sobi 1</button>
          <button onClick={() => joinRoom('room2')}>Pridruži se sobi 2</button>

          {/* Forma za odgovor na pitanje */}
          <input 
            type="text" 
            placeholder="Unesite odgovor"
            onBlur={(e) => submitAnswer(e.target.value)}  // Kada korisnik unese odgovor
          />

          {/* Prikaz WebSocket odgovora */}
          {roomId && (
            <div>
              <h3>Trenutna soba: {roomId}</h3>
              <p>Čekam odgovore...</p>
            </div>
          )}

          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <p>Podaci nisu dostupni.</p>
      )}
    </div>
  );
};

export default Dashboard;

