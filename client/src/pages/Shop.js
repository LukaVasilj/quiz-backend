import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbarr';
import '../App.css'; // Import the CSS file

const Shop = ({ setHints }) => {
  const [user, setUser] = useState({ coins: 0, hints: 0 });
  const [animation, setAnimation] = useState({ coins: false, hints: false });
  const [chestOpened, setChestOpened] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [hintsWon, setHintsWon] = useState(0);
  const [cooldownTime, setCooldownTime] = useState(3600); // 1 hour in seconds
  const [showHintsWonMessage, setShowHintsWonMessage] = useState(false);

  const [secondChestOpened, setSecondChestOpened] = useState(false);
  const [secondCooldown, setSecondCooldown] = useState(false);
  const [secondHintsWon, setSecondHintsWon] = useState(0);
  const [secondCooldownTime, setSecondCooldownTime] = useState(3600); // 1 hour in seconds
  const [showSecondHintsWonMessage, setShowSecondHintsWonMessage] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
        setHints(response.data.hints); // Set the hints state
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchUser();
  }, [setHints]);

  useEffect(() => {
    const savedCooldownEndTime = localStorage.getItem('cooldownEndTime');
    if (savedCooldownEndTime) {
      const remainingTime = Math.floor((new Date(savedCooldownEndTime) - new Date()) / 1000);
      if (remainingTime > 0) {
        setCooldown(true);
        setCooldownTime(remainingTime);
      } else {
        localStorage.removeItem('cooldownEndTime');
      }
    }
  }, []);

  useEffect(() => {
    let timer;
    if (cooldown) {
      timer = setInterval(() => {
        setCooldownTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            setCooldown(false);
            localStorage.removeItem('cooldownEndTime');
            return 3600; // Reset to 1 hour
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    let messageTimer;
    if (showHintsWonMessage) {
      messageTimer = setTimeout(() => {
        setShowHintsWonMessage(false);
      }, 15000); // Hide message after 15 seconds
    }
    return () => clearTimeout(messageTimer);
  }, [showHintsWonMessage]);

  useEffect(() => {
    const savedSecondCooldownEndTime = localStorage.getItem('secondCooldownEndTime');
    if (savedSecondCooldownEndTime) {
      const remainingTime = Math.floor((new Date(savedSecondCooldownEndTime) - new Date()) / 1000);
      if (remainingTime > 0) {
        setSecondCooldown(true);
        setSecondCooldownTime(remainingTime);
      } else {
        localStorage.removeItem('secondCooldownEndTime');
      }
    }
  }, []);

  useEffect(() => {
    let timer;
    if (secondCooldown) {
      timer = setInterval(() => {
        setSecondCooldownTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            setSecondCooldown(false);
            localStorage.removeItem('secondCooldownEndTime');
            return 3600; // Reset to 1 hour
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [secondCooldown]);

  useEffect(() => {
    let messageTimer;
    if (showSecondHintsWonMessage) {
      messageTimer = setTimeout(() => {
        setShowSecondHintsWonMessage(false);
      }, 15000); // Hide message after 15 seconds
    }
    return () => clearTimeout(messageTimer);
  }, [showSecondHintsWonMessage]);

  const handlePurchaseHint = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/shop/purchase-hint`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (response.data.success) {
        setUser({ ...user, coins: user.coins - 10, hints: user.hints + 1 });
        setHints(user.hints + 1); // Update the hints state
        setAnimation({ coins: true, hints: true });
  
        setTimeout(() => {
          setAnimation({ coins: false, hints: false });
        }, 1000); // Reset animation after 1 second
      } else {
        alert('Not enough coins');
      }
    } catch (error) {
      console.error('Error purchasing hint:', error);
      alert('Error purchasing hint');
    }
  };

  const handleOpenChest = async () => {
    if (user.coins >= 20 && !cooldown) {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/shop/open-chest`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        if (response.data.success) {
          const hintsWon = response.data.hintsWon;
          setUser({ ...user, coins: user.coins - 20, hints: user.hints + hintsWon });
          setHints(user.hints + hintsWon); // Update the hints state
          setHintsWon(hintsWon);
          setChestOpened(true);
          setCooldown(true);
          setShowHintsWonMessage(true);
          const cooldownEndTime = new Date(new Date().getTime() + 3600 * 1000);
          localStorage.setItem('cooldownEndTime', cooldownEndTime);
          setTimeout(() => {
            setChestOpened(false);
          }, 5000); // Show chest opened for 5 seconds
        } else {
          alert('Error opening chest');
        }
      } catch (error) {
        console.error('Error opening chest:', error);
        alert('Error opening chest');
      }
    } else if (user.coins < 20) {
      alert('Not enough coins to open the chest');
    }
  };

  const handleOpenSecondChest = async () => {
    if (user.coins >= 50 && !secondCooldown) {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/shop/open-second-chest`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        if (response.data.success) {
          const hintsWon = response.data.hintsWon;
          setUser({ ...user, coins: user.coins - 50, hints: user.hints + hintsWon });
          setHints(user.hints + hintsWon); // Update the hints state
          setSecondHintsWon(hintsWon);
          setSecondChestOpened(true);
          setShowSecondHintsWonMessage(true);
          const secondCooldownEndTime = new Date(new Date().getTime() + 3600 * 1000);
          localStorage.setItem('secondCooldownEndTime', secondCooldownEndTime);
          setTimeout(() => {
            setSecondChestOpened(false);
            setSecondCooldown(true);
          }, 10000); // Show chest opened for 10 seconds
        } else {
          alert('Error opening second chest');
        }
      } catch (error) {
        console.error('Error opening second chest:', error);
        alert('Error opening second chest');
      }
    } else if (user.coins < 50) {
      alert('Not enough coins to open the chest');
    }
  };

  const handlePurchaseCoins = async (amount) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/shop/purchase-coins`, {
        amount,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (response.data.success) {
        setUser((prevUser) => ({ ...prevUser, coins: prevUser.coins + amount }));
        setAnimation({ coins: true, hints: false });
  
        setTimeout(() => {
          setAnimation({ coins: false, hints: false });
        }, 1000); // Reset animation after 1 second
      } else {
        alert('Error purchasing coins');
      }
    } catch (error) {
      console.error('Error purchasing coins:', error);
      alert('Error purchasing coins');
    }
  };

  const getChestImage = () => {
    if (cooldown) {
      return '/slike/otvoren.png';
    } else if (user.coins >= 20) {
      return '/slike/zatvoren.png';
    } else {
      return '/slike/zatvoren.png'; // Add a grayscale filter in CSS for disabled state
    }
  };

  const getSecondChestImage = () => {
    if (secondCooldown) {
      return '/slike/chest3.png';
    } else if (secondChestOpened) {
      return '/slike/chest2.png';
    } else {
      return '/slike/chest1.png';
    }
  };

  const formatCooldownTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div>
      <Navbar username={user.username} profilePicture={user.profile_picture} onLogout={() => {}} />
      <div className="shop-container">
        <h1>Shop</h1>
        <div className="user-info">
          <div className="user-info-item">
            <i className="fas fa-coins user-info-icon"></i>
            <p>Coins: {user.coins} {animation.coins && <span className="coins-animation">-10</span>}</p>
          </div>
          <div className="user-info-item">
            <i className="fas fa-lightbulb user-info-icon"></i>
            <p>Hints: {user.hints} {animation.hints && <span className="hints-animation">+1</span>}</p>
          </div>
        </div>
        <div className="hints-section">
          <div className="hint-item">
            <i className="fas fa-magic hint-icon"></i>
            <div className="hint-details">
              <h3>Magic Hint</h3>
              <p>Get a magical hint to help you answer the question.</p>
              <button onClick={handlePurchaseHint}>Buy Hint (10 coins)</button>
            </div>
          </div>
          <div className="hint-item">
            <i className="fas fa-lightbulb hint-icon"></i>
            <div className="hint-details">
              <h3>Lightbulb Hint</h3>
              <p>Get a lightbulb hint to illuminate your path.</p>
              <button disabled>Coming Soon</button>
            </div>
          </div>
          <div className="hint-item">
            <i className="fas fa-question-circle hint-icon"></i>
            <div className="hint-details">
              <h3>Question Mark Hint</h3>
              <p>Get a question mark hint to guide you.</p>
              <button disabled>Coming Soon</button>
            </div>
          </div>
        </div>
      </div>
      <div className="chest-container">
        <div className={`chest-section ${user.coins >= 20 ? 'glow' : ''}`}>
          <div className="progress-bar">
            <div className="progress" style={{ width: `${((3600 - cooldownTime) / 3600) * 100}%` }}></div>
          </div>
          <p className="cooldown-timerr">Your coins : {user.coins}.</p><br></br>
          <p className="cooldown-timerr">20 coins to open the chest</p>
          <p className="cooldown-timerrr">Possible rewards: 10, 20 or 75 hints</p>
          <img
            src={getChestImage()}
            alt="Chest"
            className={`chest-image ${user.coins < 20 && !cooldown ? 'disabled' : ''} ${(!chestOpened && !cooldown) ? 'animate' : ''}`}
            onClick={handleOpenChest}
            style={{ cursor: user.coins >= 20 && !cooldown ? 'pointer' : 'not-allowed' }}
          />
          {cooldown && <p className="cooldown-timer">Open next in: {formatCooldownTime(cooldownTime)}</p>}
          {showHintsWonMessage && (
            <p className="hints-won-message">
              Congratulations! You won <span className="hints-won-number">{hintsWon}</span> hints!
            </p>
          )}
        </div>
      </div>
      <div className="chest-container">
        <div className={`chest-section ${user.coins >= 50 ? 'glow' : ''}`}>
          <div className="progress-bar">
            <div className="progress" style={{ width: `${((3600 - secondCooldownTime) / 3600) * 100}%` }}></div>
          </div>
          <p className="cooldown-timerr">Your coins : {user.coins}.</p><br></br>
<p className="cooldown-timerr">50 coins to open the chest</p>
<p className="cooldown-timerrr">Possible rewards : 20, 50, 100, or 200 hints</p>
          <img
            src={getSecondChestImage()}
            alt="Second Chest"
            className={`chest-image2 ${user.coins < 50 && !secondCooldown ? 'disabled' : ''} ${secondChestOpened ? 'opened' : ''} ${(!secondChestOpened && !secondCooldown) ? 'animate' : ''}`}
            onClick={handleOpenSecondChest}
            style={{ cursor: user.coins >= 50 && !secondCooldown ? 'pointer' : 'not-allowed' }}
          />
          {secondCooldown && <p className="cooldown-timer">Open next in: {formatCooldownTime(secondCooldownTime)}</p>}
          {showSecondHintsWonMessage && (
            <p className="hints-won-message">
              Congratulations! You won <span className="hints-won-number">{secondHintsWon}</span> hints!
            </p>
          )}
        </div>
      </div>
      <div className="purchase-coins-section">
        <h2>Purchase Coins</h2>
        <div className="coin-packages">
          <div className="coin-package">
            <img src="/slike/coins1.png" alt="Coins" className="coin-image" />
            <p className="original-price">$29.99</p>
            <p className="discounted-price">$19.99</p>
            <p>100 Coins</p>
            <button onClick={() => handlePurchaseCoins(100)}>Buy Now</button>
          </div>
          <div className="coin-package">
            <img src="/slike/coins2.png" alt="Coins" className="coin-image" />
            <p className="original-price">$49.99</p>
            <p className="discounted-price">$34.99</p>
            <p>200 Coins</p>
            <button onClick={() => handlePurchaseCoins(200)}>Buy Now</button>
          </div>
          <div className="coin-package">
            <img src="/slike/coins3.png" alt="Coins" className="coin-image" />
            <p className="original-price">$99.99</p>
            <p className="discounted-price">$69.99</p>
            <p>500 Coins</p>
            <button onClick={() => handlePurchaseCoins(500)}>Buy Now</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;