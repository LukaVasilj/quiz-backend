// filepath: /path/to/your/project/initDatabase.js
const fs = require('fs');
const mysql = require('mysql');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

connection.connect();

// Popis tablica koje treba provjeriti
const tables = [
  'achievements',
  'challenges',
  'friends',
  'leaderboard',
  'messages',
  'quizzes',
  'user_achievements',
  'user_answers',
  'user_performance',
  'users'
];

// Funkcija za provjeru postojanja tablica
function checkTablesExist(callback) {
  let tablesChecked = 0;
  let allTablesExist = true;

  tables.forEach(table => {
    connection.query(`SHOW TABLES LIKE '${table}'`, function (error, results, fields) {
      if (error) throw error;

      if (results.length === 0) {
        allTablesExist = false;
      }

      tablesChecked++;
      if (tablesChecked === tables.length) {
        callback(allTablesExist);
      }
    });
  });
}

// Provjera postojanja tablica i učitavanje podataka ako tablice ne postoje
checkTablesExist(allTablesExist => {
  if (!allTablesExist) {
    const sql = fs.readFileSync('backup.sql').toString();

    connection.query(sql, function (error, results, fields) {
      if (error) throw error;
      console.log('Database initialized');
    });
  } else {
    console.log('All tables already exist, skipping initialization');
  }

  connection.end();
});