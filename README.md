# Quiz App

Quiz App je interaktivna platforma za kvizove koja omogućava korisnicima da testiraju svoje znanje, natječu se s prijateljima, prate svoja postignuća i još mnogo toga.

## Značajke

### 🔐 Registracija i Prijava
- Korisnici se mogu registrirati i prijaviti kako bi pristupili svim značajkama aplikacije.

### 🧠 Kvizovi
- Sudjelujte u raznim kvizovima iz različitih kategorija.
- **Trening Kvizovi**: Vježbajte svoje znanje u različitim kategorijama i razinama težine.
- **Matchmaking Kvizovi**: Natječite se protiv drugih korisnika u realnom vremenu.

### 👥 Prijatelji
- Dodajte prijatelje, šaljite poruke i izazivajte ih na kvizove.
- **Dodavanje Prijatelja**: Pretražujte korisnike i šaljite zahtjeve za prijateljstvo.
- **Poruke**: Razmjenjujte poruke s prijateljima.
- **Izazovi**: Izazovite prijatelje na kvizove i natječite se za bodove.

### 🏆 Postignuća
- Pratite svoja postignuća i otključavajte nove nagrade.
- **Otključavanje Postignuća**: Osvojite postignuća dovršavanjem kvizova i dostizanjem prekretnica.
- **Prikaz Postignuća**: Pregledajte svoja postignuća i pratite svoj napredak.

### 📊 Leaderboard
- Natječite se s drugim korisnicima i pogledajte svoj rang na leaderboardu.
- **Sezonski Leaderboard**: Pogledajte najbolje igrače u tekućoj sezoni.
- **Globalni Leaderboard**: Pogledajte najbolje igrače svih vremena.

### 🛒 Trgovina
- Kupujte hintove i druge predmete u trgovini.
- **Kupovina Hintova**: Koristite zarađene bodove za kupovinu hintova.
- **Otvaranje Škrinja**: Otvorite škrinje za osvajanje dodatnih nagrada.

### 🔧 Admin Dashboard
- Administratori mogu upravljati korisnicima i pregledavati statistike.
- **Upravljanje Korisnicima**: Pregledajte i upravljajte korisničkim računima.
- **Statistike**: Pregledajte statistike aplikacije i korisnika.

## 🛠️ Tehnologije

- **Frontend**: React, CSS
- **Backend**: Node.js, Express.js, Socket.io
- **Baza podataka**: MySQL
- **Autentifikacija**: JWT (JSON Web Tokens)
- **Strojno učenje**: Python, XGBoost

## 🚀 Instalacija

1. Klonirajte repozitorij:
   ```sh
   git clone https://github.com/vaš-korisnički-račun/quiz-app.git
   cd quiz-app
   ```

2. Instalirajte potrebne pakete za backend:
   ```sh
   cd server
   npm install
   ```

3. Instalirajte potrebne pakete za frontend:
   ```sh
   cd client
   npm install
   ```

4. Postavite `.env` datoteku u root direktoriju servera s potrebnim varijablama okruženja:
   ```ini
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=vaša-lozinka
   DB_NAME=quiz_app
   ACCESS_TOKEN_SECRET=vaš-tajni-kljuc
   HF_API_KEY=vaš-huggingface-api-kljuc
   ```

5. Pokrenite backend server:
   ```sh
   cd server
   node server.js
   ```

6. Pokrenite frontend aplikaciju:
   ```sh
   cd client
   npm start
   ```

7. Otvorite preglednik i idite na `http://localhost:3000`.

## 📖 Korištenje

### 🔐 Registracija i Prijava
- Registrirajte se pomoću korisničkog imena, emaila i lozinke.
- Prijavite se pomoću emaila i lozinke.

### 🧠 Kvizovi
- **Trening Kvizovi**: Odaberite kategoriju i razinu težine, te započnite kviz.
- **Matchmaking Kvizovi**: Pronađite protivnika i natječite se u realnom vremenu.

### 👥 Prijatelji
- **Dodavanje Prijatelja**: Pretražujte korisnike i šaljite zahtjeve za prijateljstvo.
- **Poruke**: Razmjenjujte poruke s prijateljima.
- **Izazovi**: Izazovite prijatelje na kvizove i natječite se za bodove.

### 🏆 Postignuća
- Pratite svoja postignuća i otključavajte nove nagrade.

### 📊 Leaderboard
- Pogledajte svoj rang na leaderboardu i natječite se s drugim korisnicima.

### 🛒 Trgovina
- Kupujte hintove i druge predmete pomoću zarađenih bodova.

### 🔧 Admin Dashboard
- Administratori mogu upravljati korisnicima i pregledavati statistike.

## 🤝 Doprinosi

Doprinosi su dobrodošli! Ako želite doprinijeti, molimo vas da otvorite pull request ili prijavite problem.

## 📜 Licenca

Ovaj projekt je licenciran pod MIT licencom. Pogledajte `LICENSE` za više informacija.
