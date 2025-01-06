import React, { useEffect } from 'react';
import '../Home.css';  // Make sure to import your CSS file

function Home() {
  useEffect(() => {
    // Dynamically load Bootstrap CSS
    const bootstrapCSS = document.createElement('link');
    bootstrapCSS.rel = 'stylesheet';
    bootstrapCSS.href = 'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css';
    document.head.appendChild(bootstrapCSS);

    // Dynamically load Bootstrap JS and dependencies
    const jqueryScript = document.createElement('script');
    jqueryScript.src = 'https://code.jquery.com/jquery-3.5.1.slim.min.js';
    jqueryScript.async = true;
    document.body.appendChild(jqueryScript);

    const popperScript = document.createElement('script');
    popperScript.src = 'https://cdn.jsdelivr.net/npm/@popperjs/core@2.9.2/dist/umd/popper.min.js';
    popperScript.async = true;
    document.body.appendChild(popperScript);

    const bootstrapScript = document.createElement('script');
    bootstrapScript.src = 'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js';
    bootstrapScript.async = true;
    document.body.appendChild(bootstrapScript);

    // Cleanup function to remove Bootstrap CSS and JS when component unmounts
    return () => {
      document.head.removeChild(bootstrapCSS);
      document.body.removeChild(jqueryScript);
      document.body.removeChild(popperScript);
      document.body.removeChild(bootstrapScript);
    };
  }, []);

  return (
    <div>
      <div>

        {/* Slider Section */}
        <section className="slider_section section">
          
          <div id="customCarousel1" className="carousel slide" data-ride="carousel">
            <div className="carousel-inner">
              <div className="carousel-item active">
                <div className="container">
                  <div className="row">
                    <div className="col-md-6 order-md-1">
                      <div className="detail-box">
                        
                        <h1>Welcome to <br /> Quiz App</h1>
                        <p>
                          Join our exciting quiz platform where you can challenge your friends, compete on leaderboards, and unlock achievements. Test your knowledge and have fun!
                        </p>
                      </div>
                    </div>
                    <div className="col-md-6 order-md-2">
                      <div className="img-box">
                        <img src="/slike/quiz-time.png" alt="Slider" className="img-fluid" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* End Slider Section */}

        {/* Service Section */}
        <section className="service_section section layout_padding">
          <div className="service_container">
            <div className="container">
              <div className="heading_container heading_center">
                <h2>Our <span>Features</span></h2>
                <p>Explore the amazing features of our Quiz App designed to enhance your learning and competitive experience.</p>
              </div>
              <div className="row">
                <div className="col-md-4">
                  <div className="box">
                    <div className="img-box">
                      <img src="/slike/group.png" alt="Feature 1" />
                    </div>
                    <div className="detail-box">
                      <h5>Challenging Quizzes</h5>
                      <p>Participate in a variety of quizzes across different topics and challenge your knowledge.</p>
                      <button className="read-more-btn">Read More</button>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="box">
                    <div className="img-box">
                      <img src="/slike/competition.png" alt="Feature 2" />
                    </div>
                    <div className="detail-box">
                      <h5>Leaderboard</h5>
                      <p>Compete with other players and see your ranking on the leaderboard. Strive to be the best!</p>
                      <button className="read-more-btn">Read More</button>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="box">
                    <div className="img-box">
                      <img src="/slike/achievement.png" alt="Feature 3" />
                    </div>
                    <div className="detail-box">
                      <h5>Achievements</h5>
                      <p>Unlock achievements by completing quizzes and reaching milestones. Track your progress and achievements.</p>
                      <button className="read-more-btn">Read More</button>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </section>
        {/* End Service Section */}

        {/* About Section */}
        <section className="about_section section layout_padding">
          <div className="container">
            <div className="heading_container heading_center">
              <h2>About <span>Quiz App</span></h2>
              <p>Quiz App is a platform designed to make learning fun and competitive. Engage in quizzes, challenge friends, and track your progress.</p>
            </div>
            <div className="row">
              <div className="col-md-6">
                <div className="img-box">
                  <img src="/slike/mission.png" alt="About Us" />
                </div>
              </div>
              <div className="col-md-6">
                <div className="detail-box">
                  <h3>Our Mission</h3>
                  <p>Our mission is to provide an engaging and interactive platform for users to test their knowledge, compete with others, and have fun while learning.</p>
                  
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* End About Section */}

        {/* Team Section */}
        <section className="team_section section layout_padding">
          
          <div className="container">
            <div className="heading_container heading_center">
              <h2 class="white">Meet Our <span>Team</span></h2> 
              <p class="white">Get to know the creators behind Quiz App.</p>
            </div>
            <div className="row">
              <div className="col-md-3">
                <div className="box">
                  <div className="img-box">
                    <img src="/slike/slikamoja.jpg" alt="Creator 1" />
                  </div>
                  <div className="detail-box">
                    <h5>Luka Vasilj</h5>
                    
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="box">
                  <div className="img-box">
                    <img src="/slike/sopta.jpg" alt="Creator 2" />
                  </div>
                  <div className="detail-box">
                    <h5>Marko Sopta</h5>
                    
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="box">
                  <div className="img-box">
                    <img src="/slike/tomas.jpg" alt="Creator 3" />
                  </div>
                  <div className="detail-box">
                    <h5>Ivan Tomas</h5>
                    
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="box">
                  <div className="img-box">
                    <img src="/slike/creator4.png" alt="Creator 4" />
                  </div>
                  <div className="detail-box">
                    <h5>Creator 4</h5>
                    <p>Role: QA Engineer</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* End Team Section */}

        {/* Footer Section */}
        <section className="footer_section section">
          <div className="container">
            <p>&copy; <span id="displayYear"></span> All Rights Reserved By Quiz App</p>
          </div>
        </section>
        {/* End Footer Section */}
      </div>
    </div>
  );
}

export default Home;