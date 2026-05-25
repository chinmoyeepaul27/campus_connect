import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Homepage.css";
import axios from "axios";

axios.defaults.baseURL = "http://localhost:8000";

export default function Homepage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSignupWarning, setShowSignupWarning] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem("token"));
    // Fade-in on scroll
    const faders = document.querySelectorAll(".fade-in");
    const appearOptions = { threshold: 0.2 };
    const appearOnScroll = new window.IntersectionObserver(function (
      entries,
      observer
    ) {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    },
    appearOptions);
    faders.forEach((fader) => appearOnScroll.observe(fader));
    // Cleanup
    return () => appearOnScroll.disconnect();
  }, []);
  return (
    <div className="page-container">
      <header>
        <nav className="container">
          <Link to="/" className="logo-link">
            <div className="logo">
              <img src="/campus-connect-logo.jpg" alt="Campus Connect Logo" />
              <h2 style={{ fontStyle: "italic" }}>Campus Connect</h2>
            </div>
          </Link>
          <div className="auth-buttons">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">
                  <button>
                    <i className="fas fa-th-large"></i> Dashboard
                  </button>
                </Link>
                <button
                  onClick={() => {
                    localStorage.removeItem("token");
                    setIsAuthenticated(false);
                    navigate("/SignInUp");
                  }}
                >
                  <i className="fas fa-sign-out-alt"></i> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/SignInUp">
                  <button>
                    <i className="fas fa-user-plus"></i> Sign Up
                  </button>
                </Link>
                <Link to="/SignInUp">
                  <button>
                    <i className="fas fa-sign-in-alt"></i> Log In
                  </button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main>
        <section className="hero container">
          <h2>Welcome to Campus Connect</h2>
          <p>
            A platform for sharing and accessing notes, event updates, and club
            activities for students.
          </p>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                navigate("/SignInUp");
              } else {
                setShowSignupWarning(true);
              }
            }}
          >
            Sign Up Now
          </button>
          {showSignupWarning && (
            <div
              style={{
                color: "#c0392b",
                marginTop: 8,
                fontWeight: 500,
                fontSize: "1em",
              }}
            >
              Please log out first to sign up with a new account.
            </div>
          )}
        </section>
        <section className="features container">
          <div className="feature fade-in">
            <i className="fas fa-file-alt fa-3x"></i>
            <h3>Browse Notes</h3>
            <p>Access notes shared by students from different batches.</p>
            <Link to="/notes">
              <button className="view-btn">View Notes</button>
            </Link>
          </div>
          <div className="feature fade-in">
            <i className="fas fa-calendar-alt fa-3x"></i>
            <h3>Upcoming Events</h3>
            <p>View the schedule for events and workshops</p>
            <Link to="/events">
              <button className="view-btn">View Events</button>
            </Link>
          </div>
          <div className="feature fade-in">
            <i className="fas fa-users fa-3x"></i>
            <h3>Campus Clubs</h3>
            <p>
              Learn more about clubs of CUET
              <br />
              Explore the Clubs!!
            </p>
            <Link to="/clubs">
              <button className="view-btn">View Clubs</button>
            </Link>
          </div>

          <div className="feature fade-in">
            <i className="fas fa-bell fa-3x"></i>
            <h3>Notifications</h3>
            <p>Get notified about club workshops</p>
            <Link to="/notification">
              <button className="view-btn">View Notifications</button>
            </Link>
          </div>
        </section>
      </main>

      <footer>
        <p>&copy; 2025 Campus Connect. All rights reserved.</p>
      </footer>
    </div>
  );
}
