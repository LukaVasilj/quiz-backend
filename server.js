
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const http = require('http');
const socketIo = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Dodajte ovu liniju
const { PythonShell } = require('python-shell');
const { spawn } = require('child_process');



const { generateRandomQuestionAndAnswer } = require('./questionGenerator');
const { generateTrainingQuestion } = require('./trainingQuestionGenerator');
const { generateTrainingQuestion2 } = require('./trainingQuestionGenerator2');



// Add the generateHint function here
const generateHint = (correctAnswer, currentAnswer) => {
  if (!currentAnswer) {
    return correctAnswer.charAt(0); // Return the first letter if no current answer
  }

  let nextCharIndex = currentAnswer.length;
  while (nextCharIndex < correctAnswer.length && correctAnswer.charAt(nextCharIndex) === ' ') {
    nextCharIndex++; // Skip spaces
  }

  if (nextCharIndex < correctAnswer.length) {
    return correctAnswer.substring(0, nextCharIndex + 1); // Return the next letter
  }

  return correctAnswer; // If the current answer is already complete, return the full answer
};

const app = express();

// Kreiraj HTTP server koji omogućuje WebSocket povezivanje
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  },
  transports: ['websocket'],
});

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: true,
}));
app.use(bodyParser.json());


// Postavite direktorij 'uploads' kao statički direktorij
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/icons', express.static(path.join(__dirname, 'icons')));



// MySQL konfiguracija

console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);



const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

let db;

function handleDisconnect() {
  db = mysql.createConnection(dbConfig);

  db.connect((err) => {
    if (err) {
      console.error('Error connecting to MySQL:', err);
      setTimeout(handleDisconnect, 2000); // Try to reconnect after 2 seconds
    } else {
      console.log('Connected to MySQL database!');
    }
  });

  db.on('error', (err) => {
    console.error('MySQL error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect(); // Reconnect if the connection is lost
    } else {
      throw err;
    }
  });
}

handleDisconnect();



// Middleware to authenticate user and attach userId and username to socket
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  console.log('Received token:', token); // Debug log
  if (!token) {
    console.error('No token provided'); // Debug log
    return next(new Error('Authentication error'));
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.error('Token verification failed:', err); // Debug log
      return next(new Error('Authentication error'));
    }
    socket.userId = decoded.id;
    // Fetch username from the database
    const query = 'SELECT username FROM users WHERE id = ?';
    db.query(query, [decoded.id], (err, results) => {
      if (err || results.length === 0) {
        console.error('User not found or DB error:', err); // Debug log
        return next(new Error('User not found'));
      }
      socket.username = results[0].username;
      console.log(`Socket authenticated: ${socket.username}`); // Debug log
      next();
    });
  });
});

// Middleware to authenticate token for HTTP requests
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('Received token:', token); // Log the token

  if (!token) {
    console.error('No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      console.error('Token verification failed:', err); // Log token verification error
      return res.status(403).json({ error: 'Token verification failed' });
    }

    req.user = user;
    console.log('Token verified, user:', user); // Log verified user
    next();
  });
};

// Middleware to authorize admin role
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    console.error('Access denied: Admins only');
    return res.status(403).json({ error: 'Access denied: Admins only' });
  }
  next();
};

// Konfiguracija za multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });


// Function to update achievements based on points and quizzes completed
const updateAchievements = (userId, points, quizzesCompleted, correctAnswers) => {
  const achievementsQuery = `
    SELECT id, name FROM achievements
  `;
  db.query(achievementsQuery, (err, achievements) => {
    if (err) {
      console.error('Greška pri dohvaćanju achievements:', err);
      return;
    }
    achievements.forEach(achievement => {
      let unlock = false;
      if (achievement.name === 'First Quiz' && quizzesCompleted >= 1) {
        unlock = true;
      } 
      else if (achievement.name === 'Bronze Champion' && points >= 25) {
        unlock = true;
      
      }else if (achievement.name === 'High Score' && points >= 50) {
        unlock = true;
      } else if (achievement.name === 'Gold Master' && points >= 100) {
        unlock = true;
      }
      if (unlock) {
        const updateQuery = `
          INSERT INTO user_achievements (user_id, achievement_id)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE user_id = user_id
        `;
        db.query(updateQuery, [userId, achievement.id], (err, result) => {
          if (err) {
            console.error('Greška pri ažuriranju achievements:', err);
          } else {
            console.log(`Achievement ${achievement.name} unlocked for user ${userId}`);
          }
        });
      }
    });

    // Update user level based on points
    const level = Math.floor(points / 100) + 1;
    const updateLevelQuery = 'UPDATE users SET level = ? WHERE id = ?';
    db.query(updateLevelQuery, [level, userId], (err, result) => {
      if (err) {
        console.error('Greška pri ažuriranju razine:', err);
      } else {
        console.log(`User ${userId} level updated to ${level}`);
      }
    });
  });
};

// WebSocket logika
// WebSocket logika za matchmaking
// WebSocket logika za matchmaking
const onlineUsers = new Set(); // Track online users
const waitingMatchmakingPlayers = {}; // Track waiting players by category and group
let matchmakingRoomUsersData = {}; // Svi podaci o korisnicima po sobama za matchmaking kviz

io.on('connection', (socket) => {
  console.log('Korisnik povezan: ' + socket.id);

  onlineUsers.add(socket.userId);
  console.log('Online users:', Array.from(onlineUsers)); // Debug log

  socket.on('findMatch', ({ username, category }) => {
    console.log(`Korisnik ${username} traži protivnika u kategoriji ${category}`);

    // Fetch user's group for the selected category
    const groupQuery = `SELECT ${category}_group AS userGroup FROM users WHERE id = ?`;
    db.query(groupQuery, [socket.userId], (err, results) => {
      if (err || results.length === 0) {
        console.error('Error fetching user group:', err);
        socket.emit('error', 'Error fetching user group');
        return;
      }

      const userGroup = results[0].userGroup;
      console.log(`User ${username} is in group ${userGroup} for category ${category}`);

      // Store user's group in socket object
      socket.userGroup = userGroup;

      if (!waitingMatchmakingPlayers[category]) {
        waitingMatchmakingPlayers[category] = {};
      }

      if (!waitingMatchmakingPlayers[category][userGroup]) {
        waitingMatchmakingPlayers[category][userGroup] = [];
      }

      console.log('Waiting players in category and group:', category, userGroup, waitingMatchmakingPlayers[category][userGroup]); // Debug log

      if (waitingMatchmakingPlayers[category][userGroup].length > 0) {
        const opponentSocketId = waitingMatchmakingPlayers[category][userGroup].shift();
        const roomId = `room_${Date.now()}`;
        console.log(`Creating room with ID: ${roomId}`); // Debug log
        socket.join(roomId);
        io.to(opponentSocketId).socketsJoin(roomId);
        const opponentSocket = io.sockets.sockets.get(opponentSocketId);
        io.to(roomId).emit('matchFound', { roomId, users: [
          { id: socket.userId, username: socket.username, points: 0, group: socket.userGroup },
          { id: opponentSocket.userId, username: opponentSocket.username, points: 0, group: opponentSocket.userGroup }
        ]});
        console.log(`Match found! Room ID: ${roomId}`);

        // Initialize room data
        matchmakingRoomUsersData[roomId] = [
          { id: socket.userId, username: socket.username, points: 0, group: socket.userGroup },
          { id: opponentSocket.userId, username: opponentSocket.username, points: 0, group: opponentSocket.userGroup }
        ];

        // Pokreni kviz nakon 5 sekundi
        setTimeout(() => {
          startMatchmakingQuiz(roomId, category);
        }, 5000);
      } else {
        waitingMatchmakingPlayers[category][userGroup].push(socket.id);
        socket.emit('findingOpponent');
        console.log(`Korisnik ${username} čeka protivnika u kategoriji ${category} i grupi ${userGroup}`);
      }
    });
  });

  const fetchNextMatchmakingQuestion = async (roomId, category) => {
    try {
      let questionData;
      const room = io.sockets.adapter.rooms.get(roomId);
      const userGroup = room.userGroup; // Assume both users are in the same group

      if (userGroup <= 2) {
        // Only multiple-choice questions
        questionData = generateTrainingQuestion(category);
      } else if (userGroup === 3) {
        // Both multiple-choice and input field questions
        const random = Math.random() < 0.5;
        questionData = random ? generateTrainingQuestion(category) : generateTrainingQuestion2(category);
      } else {
        // Only input field questions
        questionData = generateTrainingQuestion2(category);
      }

      if (questionData.error) {
        throw new Error(questionData.error);
      }

      const { question, correctAnswer, type, options } = questionData;
      console.log(`Generated question for room ID: ${roomId}`); // Debug log
      io.to(roomId).emit('newQuestion', { question, correctAnswer, type, options });

      // Spremanje točnog odgovora u sobu
      room.correctAnswer = correctAnswer;
      room.userAnswers = []; // Resetiramo odgovore za novu rundu

      io.to(roomId).emit('startQuiz');
    } catch (error) {
      console.error('Greška pri generiranju pitanja:', error);
      io.to(roomId).emit('error', 'Došlo je do greške prilikom generiranja pitanja');
    }
  };

  const startMatchmakingQuiz = (roomId, category) => {
    console.log(`Starting quiz for room ID: ${roomId} with category: ${category}`); // Debug log
    if (!roomId) {
      console.error('Room ID is null'); // Debug log
      return;
    }

    let room = io.sockets.adapter.rooms.get(roomId);
    if (!room) {
      console.error(`Room ID ${roomId} not found in io.sockets.adapter.rooms`); // Debug log
      return;
    }
    room.userAnswers = room.userAnswers || [];
    room.questionCount = 0; // Dodajemo brojač pitanja
    room.usedFacts = room.usedFacts || []; // Dodajemo polje za praćenje korištenih pitanja
    room.category = category; // Spremamo kategoriju u sobu
    room.userGroup = matchmakingRoomUsersData[roomId][0].group; // Assume both users are in the same group

    setTimeout(() => fetchNextMatchmakingQuestion(roomId, category), 5000);
  };

  socket.on('submitMatchmakingAnswer', (roomId, userAnswer) => {
    console.log(`Received answer for room ID: ${roomId} from user ID: ${socket.userId}`); // Debug log
    if (!roomId) {
      console.error('Room ID is null'); // Debug log
      return;
    }

    if (!matchmakingRoomUsersData[roomId]) {
      console.error(`Room ID ${roomId} not found in matchmakingRoomUsersData`); // Debug log
      return;
    }
    const room = io.sockets.adapter.rooms.get(roomId); // Dohvaćanje sobe prema roomId
    if (!room) {
      console.error(`Room ID ${roomId} not found in io.sockets.adapter.rooms`); // Debug log
      return;
    }
    
    // Osiguranje da je userAnswers polje
    let userAnswers = room.userAnswers || [];
    
    // Provjera postoji li već odgovor za ovog korisnika
    const existingAnswerIndex = userAnswers.findIndex(answer => answer.id === socket.userId);
    if (existingAnswerIndex !== -1) {
      // Ažuriranje postojećeg odgovora
      console.log(`Updating existing answer for user ID: ${socket.userId}`); // Debug log
      userAnswers[existingAnswerIndex].answer = userAnswer;
    } else {
      // Dodavanje novog odgovora
      console.log(`Adding new answer for user ID: ${socket.userId}`); // Debug log
      userAnswers.push({ id: socket.userId, answer: userAnswer });
    }
    
    // Spremanje ažuriranih odgovora
    room.userAnswers = userAnswers;
    console.log(`Current user answers for room ID: ${roomId}:`, userAnswers); // Debug log
    
    if (userAnswers.length === 2) {
      const correctAnswer = room.correctAnswer;
    
      // Ažuriranje bodova
      userAnswers.forEach(userAnswer => {
        console.log(`Updating points for user ID: ${userAnswer.id} in room ID: ${roomId}`); // Debug log
        if (userAnswer.answer === correctAnswer) {
          const user = matchmakingRoomUsersData[roomId].find(user => user.id === userAnswer.id);
          if (user) {
            user.points += 1;
            console.log(`User ${user.username} now has ${user.points} points`); // Debug log
          } else {
            console.error(`User ID ${userAnswer.id} not found in matchmakingRoomUsersData[${roomId}]`); // Debug log
          }
        }
      });
    
      room.questionCount = room.questionCount || 0;
      room.questionCount += 1; // Povećavamo brojač pitanja
    
      // Emitiranje rezultata kada oba korisnika odgovore
      io.to(roomId).emit('results', {
        userAnswers: userAnswers, // Osigurajte da je to polje
        correctAnswer,
        roomUsers: matchmakingRoomUsersData[roomId] // Emitovanje ažuriranih bodova
      });

      if (room.questionCount >= 5) { // Ako su odgovori na pet pitanja, završavamo kviz
        setTimeout(() => {
          const [user1, user2] = matchmakingRoomUsersData[roomId];
          let winner = null;
          let loser = null;

          if (user1.points > user2.points) {
            winner = user1;
            loser = user2;
          } else if (user2.points > user1.points) {
            winner = user2;
            loser = user1;
          }

          if (winner && loser) {
            console.log(`Winner ID: ${winner.id}, Loser ID: ${loser.id}`); // Debug log

            // Ažuriraj bodove u bazi podataka
            const updateWinnerQuery = 'UPDATE users SET points = points + ? WHERE id = ?';
            console.log(`Executing query: ${updateWinnerQuery} with values: [${winner.points}, ${winner.id}]`); // Debug log
            db.query(updateWinnerQuery, [winner.points, winner.id], (err, result) => {
              if (err) {
                console.error('Greška pri ažuriranju bodova pobjednika:', err);
              } else {
                console.log(`Bodovi ažurirani za pobjednika ${winner.username}`);
                console.log(`Result: ${JSON.stringify(result)}`); // Debug log
              }
            });

            const updateLoserQuery = 'UPDATE users SET points = points - 2 WHERE id = ?';
            console.log(`Executing query: ${updateLoserQuery} with values: [${loser.id}]`); // Debug log
            db.query(updateLoserQuery, [loser.id], (err, result) => {
              if (err) {
                console.error('Greška pri ažuriranju bodova gubitnika:', err);
              } else {
                console.log(`Bodovi ažurirani za gubitnika ${loser.username}`);
                console.log(`Result: ${JSON.stringify(result)}`); // Debug log
              }
            });

            io.to(roomId).emit('quizEnd', {
              winner: winner.username,
              loser: loser.username,
              roomUsers: matchmakingRoomUsersData[roomId]
            });
          } else {
            io.to(roomId).emit('quizEnd', {
              message: 'Neriješeno!',
              roomUsers: matchmakingRoomUsersData[roomId]
            });
          }

          // Resetovanje sobe
          delete matchmakingRoomUsersData[roomId];
        }, 5000); // Dodajemo pauzu od 5 sekundi pre prikazivanja konačnih rezultata
      } else {
        // Postavljanje novog pitanja nakon kratke pauze
        setTimeout(() => fetchNextMatchmakingQuestion(roomId, room.category), 5000);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Korisnik isključen: ' + socket.id);
    onlineUsers.delete(socket.userId);
    console.log('Online users after disconnect:', Array.from(onlineUsers)); // Debug log

    // Remove user from waiting players
    for (const category in waitingMatchmakingPlayers) {
      for (const group in waitingMatchmakingPlayers[category]) {
        waitingMatchmakingPlayers[category][group] = waitingMatchmakingPlayers[category][group].filter(id => id !== socket.id);
        console.log(`Updated waiting players in category ${category} and group ${group}:`, waitingMatchmakingPlayers[category][group]); // Debug log
      }
    }

    // Uklanjanje korisnika iz svih soba
    for (const roomId in matchmakingRoomUsersData) {
      matchmakingRoomUsersData[roomId] = matchmakingRoomUsersData[roomId].filter(user => user.id !== socket.userId);
      if (matchmakingRoomUsersData[roomId].length === 0) {
        delete matchmakingRoomUsersData[roomId];
      } else {
        io.to(roomId).emit('roomUsers', matchmakingRoomUsersData[roomId]);
      }
    }
  });
});


// Endpoint to get all users and their online status
app.get('/users', authenticateToken, (req, res) => {
  const query = 'SELECT id, username FROM users';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: 'Error fetching users' });
    }
    const users = results.map(user => ({
      ...user,
      online: onlineUsers.has(user.id)
    }));
    res.json(users);
  });
});

// Pohrana korisnika u sobi
let roomUsersData = {}; // Svi podaci o korisnicima po sobama
let roomCounter = 1; // Brojač za sobe


io.on('connection', (socket) => {
  console.log('Korisnik povezan: ' + socket.id);

  onlineUsers.add(socket.userId);

  socket.on('joinRoom', (roomId) => {
    const userId = socket.userId;
    const username = socket.username;
    if (!userId || !username) {
      console.error(`UserId or username is undefined for socket ${socket.id}`);
      return;
    }

    socket.join(roomId);
    console.log(`Korisnik ${socket.id} pridružen sobi ${roomId} sa userId ${userId} i username ${username}`);
  
    // Dodaj korisnika u sobu u pohranu ako već nije dodan
    if (!roomUsersData[roomId]) {
      roomUsersData[roomId] = [];
    }
    if (!roomUsersData[roomId].some(user => user.id === socket.id)) {
      roomUsersData[roomId].push({ id: socket.id, userId: userId, username: username, points: 0, ready: false });
    }
  
    io.to(roomId).emit('roomUsers', roomUsersData[roomId]);
  
    // Emitiranje poruke svim korisnicima koji su online, a nisu u sobi
    io.to(roomId).emit('userJoinedRoom', `Korisnik ${username} je ušao u sobu ${roomId}`);
  
    // Emitiranje popisa korisnika koji su već u sobi (za korisnike koji nisu u sobi)
    io.to(socket.id).emit('currentRoomUsers', roomUsersData[roomId]);
  
    const roomUsers = io.sockets.adapter.rooms.get(roomId);
    const userCount = roomUsers ? roomUsers.size : 0;
  
    if (userCount === 1) {
      socket.emit('roomMessage', 'Čekamo protivnika, ljudi u sobi 1/2');
    } else if (userCount === 2) {
      console.log('Emitiranje poruke: Korisnik je ušao u sobu');
      io.to(roomId).emit('roomMessage', `Korisnik ${username} je ušao. Ljudi u sobi 2/2.`);
      console.log('Oba korisnika su u sobi, čekamo da budu spremni...');
    }
  });

  socket.on('ready', (roomId) => {
    const user = roomUsersData[roomId].find(user => user.id === socket.id);
    if (user) {
      user.ready = true;
      io.to(roomId).emit('roomUsers', roomUsersData[roomId]);

      // Check if both users are ready
      const allReady = roomUsersData[roomId].every(user => user.ready);
      if (allReady) {
        console.log('Oba korisnika su spremna, pokrećemo kviz...');
        startQuiz(roomId);
      }
    }
  });

  const startQuiz = (roomId) => {
    let room = io.sockets.adapter.rooms.get(roomId);
    room.userAnswers = room.userAnswers || [];
    room.questionCount = 0; // Dodajemo brojač pitanja
    room.usedFacts = []; // Dodajemo polje za praćenje korištenih pitanja

    setTimeout(async () => {
      try {
        const { question, correctAnswer } = await generateRandomQuestionAndAnswer(room.usedFacts);
        io.to(roomId).emit('newQuestion', { question, correctAnswer });

        // Spremanje točnog odgovora u sobu
        room.correctAnswer = correctAnswer;
        room.userAnswers = []; // Resetiramo odgovore za novu rundu

        io.to(roomId).emit('startQuiz');
      } catch (error) {
        console.error('Greška pri generiranju pitanja:', error);
        io.to(roomId).emit('error', 'Došlo je do greške prilikom generiranja pitanja');
      }
    }, 5000);
  };

  socket.on('submitAnswer', (roomId, userAnswer) => {
    const room = io.sockets.adapter.rooms.get(roomId); // Dohvaćanje sobe prema roomId
    if (!room) return;
    
    // Osiguranje da je userAnswers polje
    let userAnswers = room.userAnswers || [];
    
    // Dodavanje korisničkog odgovora u polje
    userAnswers.push({ id: socket.id, answer: userAnswer });
    
    // Spremanje ažuriranih odgovora
    room.userAnswers = userAnswers;
    
    if (userAnswers.length === 2) {
      const correctAnswer = room.correctAnswer;
    
      // Ažuriranje bodova
      userAnswers.forEach(userAnswer => {
        if (userAnswer.answer === correctAnswer) {
          const user = roomUsersData[roomId].find(user => user.id === userAnswer.id);
          if (user) {
            user.points += 1;
          }
        }
      });
    
      room.questionCount = room.questionCount || 0;
      room.questionCount += 1; // Povećavamo brojač pitanja
    
      // Emitiranje rezultata kada oba korisnika odgovore
      io.to(roomId).emit('results', {
        userAnswers: userAnswers, // Osigurajte da je to polje
        correctAnswer,
        roomUsers: roomUsersData[roomId] // Emitovanje ažuriranih bodova
      });
  
      if (room.questionCount >= 3) { // Ako su odgovori na tri pitanja, završavamo kviz
        setTimeout(() => {
          io.to(roomId).emit('quizEnd', roomUsersData[roomId]);
  
           // Ažuriranje bodova u bazi podataka
  roomUsersData[roomId].forEach(user => {
    console.log(`Updating points for userId ${user.userId} with points ${user.points}`);
    
    // Fetch current points from the database
    const fetchPointsQuery = 'SELECT points FROM users WHERE id = ?';
    db.query(fetchPointsQuery, [user.userId], (err, results) => {
      if (err) {
        console.error('Greška pri dohvaćanju trenutnih bodova:', err);
      } else {
        const currentPoints = results[0].points;
        const newTotalPoints = currentPoints + user.points;

        // Update points in the database
        const updatePointsQuery = 'UPDATE users SET points = ? WHERE id = ?';
        db.query(updatePointsQuery, [newTotalPoints, user.userId], (err, result) => {
          if (err) {
            console.error('Greška pri ažuriranju bodova:', err);
          } else {
            console.log(`Points updated for userId ${user.userId}`);
            
            // Fetch updated points to calculate level
            db.query(fetchPointsQuery, [user.userId], (err, results) => {
              if (err) {
                console.error('Greška pri dohvaćanju ažuriranih bodova:', err);
              } else {
                const updatedPoints = results[0].points;
                const newLevel = Math.floor(updatedPoints / 10) + 1;

                // Update level in the database
                const updateLevelQuery = 'UPDATE users SET level = ? WHERE id = ?';
                db.query(updateLevelQuery, [newLevel, user.userId], (err, result) => {
                  if (err) {
                    console.error('Greška pri ažuriranju razine:', err);
                  } else {
                    console.log(`Level updated for userId ${user.userId}`);
                    
                    // Insert user answers into user_answers table
                    const insertAnswersQuery = `
                      INSERT INTO user_answers (user_id, room_id, question_id, answer, correct)
                      VALUES (?, ?, ?, ?, ?)
                    `;
                    userAnswers.forEach(userAnswer => {
                      db.query(insertAnswersQuery, [user.userId, roomId, userAnswer.question_id, userAnswer.answer, userAnswer.answer === correctAnswer], (err, result) => {
                        if (err) {
                          console.error('Greška pri unosu odgovora korisnika:', err);
                        }
                      });
                    });

                    // Update achievements based on points and quizzes completed
                    const quizzesCompletedQuery = `
                      SELECT COUNT(DISTINCT room_id) AS quizzesCompleted 
                      FROM user_answers 
                      WHERE user_id = ?
                    `;
                    db.query(quizzesCompletedQuery, [user.userId], (err, results) => {
                      if (err) {
                        console.error('Greška pri dohvaćanju broja završenih kvizova:', err);
                      } else {
                        const quizzesCompleted = results[0].quizzesCompleted;
                        console.log(`User ${user.userId} has completed ${quizzesCompleted} quizzes`);
                        updateAchievements(user.userId, updatedPoints, quizzesCompleted);
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  });

  
          // Resetovanje sobe
          delete roomUsersData[roomId];
        }, 5000); // Dodajemo pauzu od 5 sekundi pre prikazivanja konačnih rezultata
      } else {
        // Postavljanje novog pitanja nakon kratke pauze
        setTimeout(async () => {
          try {
            const { question, correctAnswer } = await generateRandomQuestionAndAnswer(room.usedFacts);
            io.to(roomId).emit('newQuestion', { question, correctAnswer });

            // Add the following code here
              if (room) {
                roomUsersData[roomId].forEach(user => {
                  user.currentAnswer = ''; // Reset currentAnswer for each user
                });
              }
    
            // Spremanje novog točnog odgovora
            room.correctAnswer = correctAnswer;
            room.userAnswers = []; // Resetiramo odgovore za novu rundu
          } catch (error) {
            console.error('Greška pri generiranju pitanja:', error);
            io.to(roomId).emit('error', 'Došlo je do greške prilikom generiranja pitanja');
          }
        }, 5000);
      }
    }
  });

  //Hint imeplementacija

  socket.on('useHint', async (roomId) => {
    const userId = socket.userId;
    const query = 'SELECT hints FROM users WHERE id = ?';
    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Error fetching user hints:', err);
        socket.emit('error', 'Error fetching user hints');
        return;
      }
  
      const userHints = results[0].hints;
      if (userHints > 0) {
        const updateQuery = 'UPDATE users SET hints = hints - 1 WHERE id = ?';
        db.query(updateQuery, [userId], (err, result) => {
          if (err) {
            console.error('Error updating user hints:', err);
            socket.emit('error', 'Error updating user hints');
            return;
          }
  
          const room = io.sockets.adapter.rooms.get(roomId);
          const user = roomUsersData[roomId].find(user => user.id === socket.id);
          user.currentAnswer = user.currentAnswer || ''; // Initialize currentAnswer if not set
          const hint = generateHint(room.correctAnswer, user.currentAnswer); // Use generateHint function
          user.currentAnswer = hint; // Update currentAnswer with the hint
          socket.emit('hint', hint);
        });
      } else {
        socket.emit('error', 'No hints available');
      }
    });
  });

  // Dodavanje događaja za izazivanje prijatelja
  socket.on('challengeFriend', (friendUsername) => {
    console.log(`Korisnik ${socket.username} izaziva ${friendUsername}`);
    const friendSocket = findSocketByUsername(friendUsername);
    if (friendSocket) {
      console.log(`Pronađen prijatelj: ${friendUsername}, slanje izazova`);
      friendSocket.emit('receiveChallenge', socket.username);
    } else {
      console.log(`Prijatelj ${friendUsername} nije pronađen`);
    }
  });
  
  socket.on('acceptChallenge', (challengerUsername) => {
    console.log(`Korisnik ${socket.username} prihvaća izazov od ${challengerUsername}`);
    const challengerSocket = findSocketByUsername(challengerUsername);
    if (challengerSocket) {
      const roomId = `room_${roomCounter++}`; // Generiranje jednostavnijeg imena sobe
      console.log(`Kreiranje sobe: ${roomId}`);
      socket.join(roomId);
      challengerSocket.join(roomId);
      io.to(roomId).emit('challengeAccepted', roomId);
    } else {
      console.log(`Izazivač ${challengerUsername} nije pronađen`);
    }
  });

const findSocketByUsername = (username) => {
  console.log(`Traženje socket-a za korisnika: ${username}`);
  for (let [id, socket] of io.of("/").sockets) {
    if (socket.username === username) {
      console.log(`Pronađen socket za korisnika ${username}: ${id}`);
      return socket;
    }
  }
  console.log(`Socket za korisnika ${username} nije pronađen`);
  return null;
};

  // Handle chat messages
  socket.on('chatMessage', (message) => {
    const userMessage = `Korisnik ${socket.username}: ${message}`;
    io.emit('chatMessage', userMessage); // Broadcast the message to all connected clients
  });
  
  socket.on('disconnect', () => {
    console.log('Korisnik isključen: ' + socket.id);
    // Remove user from online users set
    onlineUsers.delete(socket.userId);
    // Uklanjanje korisnika iz svih soba
    for (const roomId in roomUsersData) {
      roomUsersData[roomId] = roomUsersData[roomId].filter(user => user.id !== socket.id);
      if (roomUsersData[roomId].length === 0) {
        delete roomUsersData[roomId];
      } else {
        io.to(roomId).emit('roomUsers', roomUsersData[roomId]);
      }
    }
  });
});

// Ruta za registraciju
app.post('/register', async (req, res) => {
  const { username, email, password, confirmPassword, role } = req.body;

  if (!username || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'Sva polja su obavezna' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Lozinke se ne podudaraju' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const query = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
  db.query(query, [username, email, hashedPassword, role || 'user'], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Greška pri registraciji' });
    }

    res.status(201).json({ message: 'Korisnik uspješno registriran!' });
  });
});

// Ruta za login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(401).send('Korisnik nije pronađen.');
    }

    const user = results[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).send('Pogrešna lozinka.');
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h' });
    console.log('Generated token:', token); // Log the generated token
    res.json({ token, username: user.username, role: user.role });
  });
});

// Ruta za dohvaćanje leaderboarda
app.get('/leaderboard', (req, res) => {
  const query = 'SELECT username, points, profile_picture FROM users ORDER BY points DESC LIMIT 10';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Greška pri dohvaćanju leaderboarda:', err);
      return res.status(500).json({ error: 'Greška pri dohvaćanju leaderboarda' });
    }

    // Calculate level based on points
    const players = results.map(player => {
      const level = Math.floor(player.points / 10) + 1;
      return { ...player, level };
    });

    res.json(players);
  });
});

// Ruta za dohvaćanje achievements
app.get('/api/achievements', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const query = `
    SELECT a.id, a.name, a.description,
      CASE WHEN ua.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS completed
    FROM achievements a
    LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
  `;
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Greška pri dohvaćanju achievements:', err);
      return res.status(500).json({ error: 'Greška pri dohvaćanju achievements' });
    }
    res.json(results);
  });
});



// Ruta za dohvaćanje prijatelja
app.get('/friends', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.query('SELECT u.id, u.username, u.profile_picture FROM friends f JOIN users u ON (f.friend_id = u.id OR f.user_id = u.id) WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = "accepted" AND u.id != ?', [userId, userId, userId], (err, results) => {
    if (err) {
      console.error('Error fetching friends:', err);
      return res.status(500).send('Error fetching friends');
    }
    console.log('Friends fetched:', results); // Debug log
    res.status(200).json(results);
  });
});

// Ruta za dodavanje prijatelja
app.post('/add-friend', authenticateToken, (req, res) => {
  const { friendUsername } = req.body;
  const userId = req.user.id;

  // Pronađi ID korisnika na temelju korisničkog imena
  db.query('SELECT id FROM users WHERE username = ?', [friendUsername], (err, results) => {
    if (err) return res.status(500).send('Error finding user');
    if (results.length === 0) return res.status(404).send('User not found');

    const friendId = results[0].id;

    // Provjeri postoji li već zahtjev za prijateljstvo
    db.query('SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)', [userId, friendId, friendId, userId], (err, results) => {
      if (err) return res.status(500).send('Error checking existing friend request');
      if (results.length > 0) return res.status(400).send('Friend request already sent or already friends');

      // Unesi zahtjev za prijateljstvo u bazu podataka
      db.query('INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, "pending")', [userId, friendId], (err, result) => {
        if (err) return res.status(500).send('Error adding friend');
        res.status(200).send('Friend request sent');
      });
    });
  });
});

// Ruta za prihvaćanje zahtjeva za prijateljstvo
app.post('/accept-friend', authenticateToken, (req, res) => {
  const { friendId } = req.body;
  const userId = req.user.id;

  // Ažuriraj status prijateljstva na "accepted" za oba korisnika
  db.query('UPDATE friends SET status = "accepted" WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)', [friendId, userId, userId, friendId], (err, result) => {
    if (err) return res.status(500).send('Error accepting friend request');
    res.status(200).send('Friend request accepted');
  });
});


// Ruta za dohvaćanje zahtjeva za prijateljstvo
app.get('/friend-requests', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.query('SELECT u.id, u.username, u.profile_picture FROM friends f JOIN users u ON f.user_id = u.id WHERE f.friend_id = ? AND f.status = "pending"', [userId], (err, results) => {
    if (err) return res.status(500).send('Error fetching friend requests');
    res.status(200).json(results);
  });
});


// Ruta za pretragu korisnika
app.get('/search-users', authenticateToken, (req, res) => {
  const searchTerm = req.query.q;

  db.query('SELECT id, username, profile_picture FROM users WHERE username LIKE ?', [`${searchTerm}%`], (err, results) => {
    if (err) return res.status(500).send('Error searching users');
    res.status(200).json(results);
  });
});



// Ruta za brisanje prijatelja
app.delete('/delete-friend', authenticateToken, (req, res) => {
  const { friendId } = req.body;
  const userId = req.user.id;

  db.query('DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)', [userId, friendId, friendId, userId], (err, result) => {
    if (err) return res.status(500).send('Error deleting friend');
    res.status(200).send('Friend deleted');
  });
});

// Ruta za odbijanje zahtjeva za prijateljstvo
app.post('/decline-friend', authenticateToken, (req, res) => {
  const { friendId } = req.body;
  const userId = req.user.id;

  db.query('DELETE FROM friends WHERE user_id = ? AND friend_id = ? AND status = "pending"', [friendId, userId], (err, result) => {
    if (err) return res.status(500).send('Error declining friend request');
    res.status(200).send('Friend request declined');
  });
});


// Ruta za promjenu lozinke
app.post('/change-password', authenticateToken, async (req, res) => {
  const { password } = req.body;
  const userId = req.user.id;

  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const query = 'UPDATE users SET password = ? WHERE id = ?';
  db.query(query, [hashedPassword, userId], (err, result) => {
    if (err) {
      console.error('Error updating password:', err);
      return res.status(500).json({ message: 'Error updating password' });
    }
    res.json({ message: 'Password updated successfully' });
  });
});

// Ruta za učitavanje profilne slike
app.post('/upload-profile-picture', authenticateToken, upload.single('profilePicture'), (req, res) => {
  const profilePicturePath = `/uploads/${req.file.filename}`;
  const userId = req.user.id;

  const query = 'UPDATE users SET profile_picture = ? WHERE id = ?';
  db.query(query, [profilePicturePath, userId], (err, result) => {
    if (err) {
      console.error('Error updating profile picture:', err);
      return res.status(500).json({ message: 'Error updating profile picture' });
    }
    res.json({ profile_picture: profilePicturePath });
  });
});

// Ruta za dohvaćanje profila
app.get('/api/profile', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const query = `
    SELECT username, email, profile_picture, level, points, coins , hints
    FROM users
    WHERE id = ?
  `;
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching profile:', err);
      return res.status(500).json({ error: 'Error fetching profile' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = results[0];
    const achievementsQuery = `
      SELECT a.id, a.name, a.icon
      FROM achievements a
      JOIN user_achievements ua ON a.id = ua.achievement_id
      WHERE ua.user_id = ?
    `;
    db.query(achievementsQuery, [userId], (err, achievements) => {
      if (err) {
        console.error('Error fetching achievements:', err);
        return res.status(500).json({ error: 'Error fetching achievements' });
      }
      user.achievements = achievements;
      res.json(user);
    });
  });
});

// Ruta za dohvaćanje profila prijatelja
app.get('/api/profile/:friendId', authenticateToken, (req, res) => {
  const friendId = req.params.friendId;
  const query = `
    SELECT username, email, profile_picture, level, points
    FROM users
    WHERE id = ?
  `;
  db.query(query, [friendId], (err, results) => {
    if (err) {
      console.error('Error fetching profile:', err);
      return res.status(500).json({ error: 'Error fetching profile' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = results[0];
    const achievementsQuery = `
      SELECT a.id, a.icon
      FROM achievements a
      JOIN user_achievements ua ON a.id = ua.achievement_id
      WHERE ua.user_id = ?
    `;
    db.query(achievementsQuery, [friendId], (err, achievements) => {
      if (err) {
        console.error('Error fetching achievements:', err);
        return res.status(500).json({ error: 'Error fetching achievements' });
      }
      user.achievements = achievements;
      res.json(user);
    });
  });
});

// Ruta za slanje poruke
app.post('/send-message', authenticateToken, (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.user.id;

  console.log('Sending message from senderId:', senderId, 'to receiverId:', receiverId, 'with content:', content); // Debug log

  const query = 'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)';
  db.query(query, [senderId, receiverId, content], (err, result) => {
    if (err) {
      console.error('Error sending message:', err);
      return res.status(500).json({ error: 'Error sending message' });
    }
    console.log('Message sent successfully'); // Debug log
    res.status(200).json({ message: 'Message sent successfully' });
  });
});


// Ruta za dohvaćanje poruka
app.get('/messages', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const receiverId = req.query.receiverId;

  console.log('Fetching messages for userId:', userId, 'and receiverId:', receiverId); // Debug log

  const query = `
    SELECT m.id, m.content, m.timestamp, m.is_read, u.username AS sender
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE (m.receiver_id = ? AND m.sender_id = ?) OR (m.receiver_id = ? AND m.sender_id = ?)
    ORDER BY m.timestamp DESC
  `;
  db.query(query, [userId, receiverId, receiverId, userId], (err, results) => {
    if (err) {
      console.error('Error fetching messages:', err);
      return res.status(500).json({ error: 'Error fetching messages' });
    }
    console.log('Messages fetched successfully:', results); // Debug log
    res.status(200).json(results);
  });
});

// Ruta za označavanje poruke kao pročitane
app.post('/mark-message-read', authenticateToken, (req, res) => {
  const { messageId } = req.body;

  const query = 'UPDATE messages SET is_read = TRUE WHERE id = ?';
  db.query(query, [messageId], (err, result) => {
    if (err) {
      console.error('Error marking message as read:', err);
      return res.status(500).json({ error: 'Error marking message as read' });
    }
    res.status(200).json({ message: 'Message marked as read' });
  });
});

// Ruta za dohvaćanje korisnika (samo za administratore)
app.get('/admin/users', authenticateToken, authorizeAdmin, (req, res) => {
  const query = 'SELECT id, username, email, points, role FROM users';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).send('Greška pri dohvaćanju korisnika.');
    }
    res.json(results);
  });
});

// Ruta za stvaranje korisnika (samo za administratore)
app.post('/admin/users', authenticateToken, authorizeAdmin, (req, res) => {
  const { username, email, password, role } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  const query = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
  db.query(query, [username, email, hashedPassword, role], (err, result) => {
    if (err) {
      console.error('Error creating user:', err);
      return res.status(500).json({ error: 'Error creating user' });
    }
    res.status(201).json({ message: 'User created successfully' });
  });
});

// Ruta za ažuriranje korisnika (samo za administratore)
app.put('/admin/users/:id', authenticateToken, authorizeAdmin, (req, res) => {
  const { id } = req.params;
  const { username, email, role } = req.body;

  const query = 'UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?';
  db.query(query, [username, email, role, id], (err, result) => {
    if (err) {
      console.error('Error updating user:', err);
      return res.status(500).json({ error: 'Error updating user' });
    }
    res.status(200).json({ message: 'User updated successfully' });
  });
});

// Ruta za brisanje korisnika (samo za administratore)
app.delete('/admin/users/:id', authenticateToken, authorizeAdmin, (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM users WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error deleting user:', err);
      return res.status(500).json({ error: 'Error deleting user' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  });
});


//Ruta za kupovinu hinta
app.post('/shop/purchase-hint', authenticateToken, (req, res) => {
  const userId = req.user.id;
  console.log('User ID:', userId); // Debug log
  const hintPrice = 10; // Set the price for a hint

  const query = 'SELECT coins FROM users WHERE id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user coins:', err);
      return res.status(500).json({ error: 'Error fetching user coins' });
    }

    console.log('User coins:', results[0].coins); // Debug log

    const userCoins = results[0].coins;
    if (userCoins >= hintPrice) {
      const updateQuery = 'UPDATE users SET coins = coins - ?, hints = hints + 1 WHERE id = ?';
      db.query(updateQuery, [hintPrice, userId], (err, result) => {
        if (err) {
          console.error('Error updating user coins and hints:', err);
          return res.status(500).json({ error: 'Error updating user coins and hints' });
        }
        res.json({ success: true });
      });
    } else {
      res.status(400).json({ error: 'Not enough coins' });
    }
  });
});

// Add this route to handle chest opening
app.post('/shop/open-chest', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const chestCost = 20; // Set the cost for opening the chest

  const query = 'SELECT coins FROM users WHERE id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user coins:', err);
      return res.status(500).json({ error: 'Error fetching user coins' });
    }

    const userCoins = results[0].coins;
    if (userCoins >= chestCost) {
      const hintsWon = [10, 20, 75][Math.floor(Math.random() * 3)];
      const updateQuery = 'UPDATE users SET coins = coins - ?, hints = hints + ? WHERE id = ?';
      db.query(updateQuery, [chestCost, hintsWon, userId], (err, result) => {
        if (err) {
          console.error('Error updating user coins and hints:', err);
          return res.status(500).json({ error: 'Error updating user coins and hints' });
        }
        res.json({ success: true, hintsWon });
      });
    } else {
      res.status(400).json({ error: 'Not enough coins' });
    }
  });
});

// Add this route to handle second chest opening
app.post('/shop/open-second-chest', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const chestCost = 50; // Set the cost for opening the second chest

  const query = 'SELECT coins FROM users WHERE id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user coins:', err);
      return res.status(500).json({ error: 'Error fetching user coins' });
    }

    const userCoins = results[0].coins;
    if (userCoins >= chestCost) {
      const hintsWon = [20, 50, 100, 200][Math.floor(Math.random() * 4)];
      const updateQuery = 'UPDATE users SET coins = coins - ?, hints = hints + ? WHERE id = ?';
      db.query(updateQuery, [chestCost, hintsWon, userId], (err, result) => {
        if (err) {
          console.error('Error updating user coins and hints:', err);
          return res.status(500).json({ error: 'Error updating user coins and hints' });
        }
        res.json({ success: true, hintsWon });
      });
    } else {
      res.status(400).json({ error: 'Not enough coins' });
    }
  });
});

// Add this route to handle training questions
app.get('/api/training-question', async (req, res) => {
  try {
    const category = req.query.category || 'animals'; // Default to 'animals' if no category is specified
    console.log(`Received request for training question in category: ${category}`);
    const questionData = generateTrainingQuestion(category);
    if (questionData.error) {
      throw new Error(questionData.error);
    }
    console.log('Generated question:', questionData);
    res.json(questionData);
  } catch (error) {
    console.error('Error generating question:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/random-question', async (req, res) => {
  try {
    const category = req.query.category || 'animals'; // Default to 'Science' if no category is specified
    console.log(`Received request for random question in category: ${category}`);
    const questionData = generateTrainingQuestion2(category);
    if (questionData.error) {
      throw new Error(questionData.error);
    }
    console.log('Generated question:', questionData);
    res.json(questionData);
  } catch (error) {
    console.error('Error generating question:', error);
    res.status(500).json({ error: error.message });
  }
});

//api store performance funkcija 
//const { spawn } = require('child_process');

app.post('/api/store-performance', authenticateToken, (req, res) => {
  const { category, level, correctAnswers, incorrectAnswers, averageTime } = req.body;
  const userId = req.user.id;

  // Log the incoming request data and user ID
  console.log('Received performance data:', { userId, category, level, correctAnswers, incorrectAnswers, averageTime });

  // Prepare data for prediction
  const totalQuestions = correctAnswers + incorrectAnswers;
  const accuracy = correctAnswers / totalQuestions;
  const timePerQuestion = averageTime / totalQuestions;
  const speedScore = totalQuestions / averageTime;
  const difficultyAdjustedScore = correctAnswers * level;
  const normalizedScore = (correctAnswers - incorrectAnswers) / totalQuestions;

  const userData = {
    category,
    correct_answers: correctAnswers,
    incorrect_answers: incorrectAnswers,
    average_time: parseFloat(averageTime), // Ensure average_time is a float
    level,
    total_questions: totalQuestions,
    accuracy,
    time_per_question: timePerQuestion,
    speed_score: speedScore,
    difficulty_adjusted_score: difficultyAdjustedScore,
    normalized_score: normalizedScore
  };

  // Convert userData to JSON string
  const userDataJson = JSON.stringify(userData);
  console.log('User data for prediction:', userDataJson);

  // Predict group using Python script
  const pythonProcess = spawn('python', [path.join(__dirname, 'predict.py'), userDataJson]);

  pythonProcess.stdout.on('data', (data) => {
    const results = data.toString();
    console.log('Prediction results:', results);

    try {
      const parsedResult = JSON.parse(results);  // Očekuje JSON odgovor iz Pythona
      const predictedGroup = parsedResult.prediction;
      console.log('Predicted group:', predictedGroup);

      if (isNaN(predictedGroup)) {
        console.error('Invalid predicted group received');
        return res.status(500).json({ error: 'Invalid prediction result' });
      }

      // SQL upit za unos podataka
      const query = `
        INSERT INTO user_performance (user_id, category, level, correct_answers, incorrect_answers, average_time, \`group\`)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      console.log('Executing query:', query);
      console.log('Query parameters:', [userId, category, level, correctAnswers, incorrectAnswers, parseFloat(averageTime), predictedGroup]);

      db.query(query, [userId, category, level, correctAnswers, incorrectAnswers, parseFloat(averageTime), predictedGroup], (err, result) => {
        if (err) {
          console.error('Error storing performance data:', err);
          return res.status(500).json({ error: 'Error storing performance data' });
        }
        console.log('Performance data stored successfully:', result);

        // Izračun prosječne vrijednosti grupe za korisnika za određenu kategoriju
        const avgGroupQuery = `
          SELECT AVG(\`group\`) as avgGroup
          FROM user_performance
          WHERE user_id = ? AND category = ?
        `;

        db.query(avgGroupQuery, [userId, category], (err, avgResult) => {
          if (err) {
            console.error('Error calculating average group:', err);
            return res.status(500).json({ error: 'Error calculating average group' });
          }

          let avgGroup = avgResult[0].avgGroup;
          console.log('Average group before rounding:', avgGroup);

          // Zaokruživanje prosječne vrijednosti grupe na najbliži cijeli broj
          avgGroup = Math.round(avgGroup);
          console.log('Average group after rounding:', avgGroup);

          // Ažuriranje odgovarajućeg stupca u tablici users
          const categoryColumn = `${category}_group`;
          const updateUserGroupQuery = `
            UPDATE users
            SET ${categoryColumn} = ?
            WHERE id = ?
          `;

          db.query(updateUserGroupQuery, [avgGroup, userId], (err, updateResult) => {
            if (err) {
              console.error('Error updating user group:', err);
              return res.status(500).json({ error: 'Error updating user group' });
            }

            console.log('User group updated successfully:', updateResult);
            res.status(200).json({ message: 'Performance data stored and user group updated successfully', group: predictedGroup });
          });
        });
      });
    } catch (parseError) {
      console.error('Error parsing prediction result:', parseError);
      return res.status(500).json({ error: 'Error parsing prediction result' });
    }
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error('Error predicting group:', data.toString());
    return res.status(500).json({ error: 'Error predicting group' });
  });
});


// Ruta za dohvaćanje statistike korisnika
app.get('/api/user-statistics', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT category, AVG(correct_answers) as avg_correct_answers, AVG(incorrect_answers) as avg_incorrect_answers, AVG(average_time) as avg_time
    FROM user_performance
    WHERE user_id = ?
    GROUP BY category
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user statistics:', err);
      return res.status(500).json({ error: 'Error fetching user statistics' });
    }

    console.log('User statistics:', results); // Debug log

    const groupQuery = `
      SELECT animals_group, movies_group, science_group, history_group, geography_group
      FROM users
      WHERE id = ?
    `;

    db.query(groupQuery, [userId], (err, groupResults) => {
      if (err) {
        console.error('Error fetching user groups:', err);
        return res.status(500).json({ error: 'Error fetching user groups' });
      }

      console.log('User groups:', groupResults); // Debug log

      res.json({ statistics: results, groups: groupResults[0] });
    });
  });
});

// Pokrenite server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server radi na portu ${PORT}`);
});