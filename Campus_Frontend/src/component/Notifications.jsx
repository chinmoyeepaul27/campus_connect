import React from "react";
import { Link } from "react-router-dom";
import "./Notifications.css";
import { useEffect, useState } from "react";
import axios from "axios";

axios.defaults.baseURL = "http://localhost:8000";

export default function Notifications() {
  // useEffect(() => {
  //   const faders = document.querySelectorAll(".fade-in");
  //   faders.forEach((fader) => {
  //     fader.classList.add("visible"); // Add the visible class to trigger animation
  //   });
  // }, []);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let intervalId;
    const fetchNotifications = () => {
      axios
        .get("/api/notifications/")
        .then((response) => {
          setNotifications(response.data);
          setLoading(false);
        })
        .catch((error) => {
          setError("Failed to load notifications.");
          setLoading(false);
        });
    };
    fetchNotifications();
    intervalId = setInterval(fetchNotifications, 10000); // Poll every 10 seconds
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div>
      <header>
        <nav className="container">
          <Link to="/" className="logo-link">
            <div className="logo">
              <img src="campus-connect-logo.jpg" alt="Campus Connect Logo" />
              <h2 style={{ fontStyle: "italic" }}>Campus Connect</h2>
            </div>
          </Link>

          <div className="auth-buttons">
            <Link to="/dashboard">
              <button>
                <i className="fas fa-th-large"></i> Dashboard
              </button>
            </Link>
            <Link to="/">
              <button>
                <i className="fas fa-home"></i> Home
              </button>
            </Link>
            <Link to="/login">
              <button>
                <i className="fas fa-sign-out-alt"></i> Log Out
              </button>
            </Link>
          </div>
        </nav>
      </header>

      <section className="page-headerr">
        <div className="container">
          <h2>
            <i className="fas fa-bell"></i> Notifications
          </h2>
          <p>
            Stay updated with important campus announcements, events, and notes
          </p>
        </div>
      </section>

      <main className="container">
        <div className="notification-controls ">
          <div className="notification-filter">
            <button data-filter="all">All Notifications</button>
            <button data-filter="events">Events</button>
            <button data-filter="announcements">Announcements</button>
            <button data-filter="notes">Study Materials</button>
          </div>
        </div>

        <div className="notifications-list">
          {/* Example notification */}
          {loading ? (
            <p> Loading Notifications...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : notifications.length === 0 ? (
            <div className="no-notifications">
              <i className="fas fa-bell-slash"> </i>
              <h3> No Notifications</h3>
              <p>
                {" "}
                You're all caught up!Check back later for new notifications
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                className="notification "
                data-type={notification.type}
                key={notification.id}
              >
                <div className={`notification-icon ${notification.type}`}>
                  <i className={notification.icon || "fas fa-bullhorn"}></i>
                </div>
                <div className="notification-content">
                  <h3>{notification.title}</h3>
                  <p>{notification.description}</p>
                  <div className="notification-meta">
                    <span>
                      <i className="fas fa-calendar"></i> {notification.date}
                    </span>
                    <span>
                      <i className="fas fa-clock"></i> {notification.time}
                    </span>
                    <span>
                      <i className="fas fa-map-marker-alt"></i>{" "}
                      {notification.location}
                    </span>
                  </div>
                  {notification.rsvp && (
                    <button className="rsvp-button">Register</button>
                  )}
                </div>
                <div className="notification-time">
                  <span>
                    {(() => {
                      if (notification.timestamp) {
                        const now = new Date();
                        const notifTime = new Date(notification.timestamp);
                        const diffMs = now - notifTime;
                        if (diffMs < 2 * 60 * 1000) {
                          return "just now";
                        } else {
                          return notifTime.toLocaleString();
                        }
                      }
                      // fallback to backend-provided time_ago if exists
                      return notification.time_ago || "-";
                    })()}
                  </span>
                  <span className={`notification-badge ${notification.type}`}>
                    {notification.type.charAt(0).toUpperCase() +
                      notification.type.slice(1)}
                  </span>
                </div>
              </div>
            ))
          )}
          {/* More notifications */}
        </div>

        {/* Empty state (hidden by default) */}
        <div className="no-notifications" style={{ display: "none" }}>
          <i className="fas fa-bell-slash"></i>
          <h3>No Notifications</h3>
          <p>You're all caught up! Check back later for new notifications.</p>
        </div>
      </main>

      <footer>
        <p>&copy; 2025 Campus Connect. All rights reserved.</p>
      </footer>
    </div>
  );
}
