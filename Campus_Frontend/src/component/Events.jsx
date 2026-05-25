import React, { useState, useEffect } from "react";
import EventAdminPanel from "./EventAdminPanel";
import { Link } from "react-router-dom";
import "./Events.css";
import axios from "axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

axios.defaults.baseURL = "http://localhost:8000";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Fetch user info for admin check
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get("/api/userinfo/", { headers: { Authorization: `Token ${token}` } })
        .then((res) => {
          setIsAdmin(res.data.is_staff || res.data.is_superuser);
        })
        .catch(() => setIsAdmin(false));
    } else {
      setIsAdmin(false);
    }

    // Fetch events with authentication to get user registration status
    const fetchEvents = () => {
      const headers = token ? { Authorization: `Token ${token}` } : {};
      axios
        .get("/api/events/", { headers })
        .then((response) => {
          setEvents(response.data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error Fetching Events", error);
          setLoading(false);
        });
    };

    fetchEvents();
  }, []);

  // Reload events from backend after add/update
  const reloadEvents = () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Token ${token}` } : {};
    axios
      .get("/api/events/", { headers })
      .then((response) => {
        setEvents(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error Fetching Events", error);
        setLoading(false);
      });
  };

  const handleEventAdded = () => {
    reloadEvents();
  };

  const handleEventUpdated = () => {
    reloadEvents();
  };

  const handleRegister = (eventId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to register for events");
      return;
    }

    axios
      .post(
        `/api/events/${eventId}/register/`,
        {},
        {
          headers: { Authorization: `Token ${token}` },
        }
      )
      .then((response) => {
        setEvents((prev) =>
          prev.map((ev) =>
            ev.id === eventId ? { ...ev, registered: true } : ev
          )
        );
      })
      .catch((error) => {
        console.error("Error Registering:", error);
        alert("Failed to register for event. Please try again.");
      });
  };

  const handleUnregister = (eventId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to unregister from events");
      return;
    }

    axios
      .post(
        `/api/events/${eventId}/unregister/`,
        {},
        {
          headers: { Authorization: `Token ${token}` },
        }
      )
      .then((response) => {
        setEvents((prev) =>
          prev.map((ev) =>
            ev.id === eventId ? { ...ev, registered: false } : ev
          )
        );
      })
      .catch((error) => {
        console.error("Error Unregistering:", error);
        alert("Failed to unregister from event. Please try again.");
      });
  };

  // Filter unique events by title, date, and location
  const getUniqueEvents = (eventsArr) => {
    const seen = new Set();
    return eventsArr.filter((ev) => {
      const key = `${ev.title}|${ev.date}|${ev.location}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const today = new Date();
  const formattedToday = today.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Use local date format to match backend (YYYY-MM-DD)
  const todayStr = new Date().toLocaleDateString("en-CA"); // "YYYY-MM-DD"
  const upcomingEvents = events.filter((ev) => ev.date > todayStr);
  const uniqueUpcomingEvents = getUniqueEvents(upcomingEvents);

  // Today's events: strictly events occurring today
  const todaysEvents = getUniqueEvents(
    events.filter((ev) => ev.date === todayStr)
  );

  // Filtered events for filter buttons (unchanged logic)
  const filteredEvents = getUniqueEvents(events).filter((ev) => {
    if (filter === "all") return true;
    if (filter === "registered") return ev.registered;
    if (filter === "today") {
      const today = new Date().toISOString().slice(0, 10);
      return ev.date === today;
    }
    if (filter === "upcoming") {
      const today = new Date().toISOString().slice(0, 10);
      return ev.date > today;
    }
    if (filter === "past") {
      const today = new Date().toISOString().slice(0, 10);
      return ev.date < today;
    }
    return true;
  });

  return (
    <>
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
            <Link to="/notification">
              <button>
                <i className="fas fa-bell"></i> Notifications
              </button>
            </Link>
            <Link to="/clubs">
              <button>
                <i className="fas fa-users"></i> Clubs
              </button>
            </Link>
          </div>
        </nav>
      </header>
      <section className="page-headerr">
        <div className="containerr">
          <h2>
            <i className="fas fa-calendar-alt"></i> Campus Events
          </h2>
          <p>
            Discover and participate in exciting events happening around campus
          </p>
        </div>
        <div className="today-date">
          <strong>Today:</strong> {formattedToday}
        </div>
      </section>

      <main className="container">
        {/* Admin Add Events Button - always at the top for admins */}
        {isAdmin && (
          <div
            className="add-club-admin"
            style={{
              display: "flex",
              justifyContent: "flex-end",
              margin: "16px 0 16px 0",
            }}
          >
            <button
              className="add-club-btn"
              onClick={() => setShowAdminPanel(true)}
            >
              <i className="fas fa-plus"></i> Add Events
            </button>
          </div>
        )}
        {showAdminPanel && (
          <EventAdminPanel
            onClose={() => setShowAdminPanel(false)}
            onEventAdded={handleEventAdded}
            onEventUpdated={handleEventUpdated}
            events={events}
          />
        )}
        <div className="calendar-controls-container">
          <div className="events-filter">
            <button
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
            >
              All Events
            </button>
            <button
              className={filter === "registered" ? "active" : ""}
              onClick={() => setFilter("registered")}
            >
              My Events
            </button>
            <button
              className={filter === "today" ? "active" : ""}
              onClick={() => setFilter("today")}
            >
              Today
            </button>
            <button
              className={filter === "upcoming" ? "active" : ""}
              onClick={() => setFilter("upcoming")}
            >
              Upcoming
            </button>
            <button
              className={filter === "past" ? "active" : ""}
              onClick={() => setFilter("past")}
            >
              Past Events
            </button>
          </div>
        </div>

        <div className="calendar-wrapper">
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            tileContent={({ date, view }) => {
              const dateStr = date.toISOString().slice(0, 10);
              const hasEvent = events.some((ev) => ev.date === dateStr);
              return hasEvent ? <span className="event-dot"></span> : null;
            }}
          />
        </div>

        <h3 className="section-title">
          {filter === "all" && "All Events"}
          {filter === "registered" && "My Registered Events"}
          {filter === "today" && "Today's Events"}
          {filter === "upcoming" && "Upcoming Events"}
          {filter === "past" && "Past Events"}
        </h3>
        <div className="events-list">
          {filteredEvents.length === 0 ? (
            <div className="no-events">
              <i className="fas fa-calendar-times"></i>
              <h3>No Events Found</h3>
              {filter === "registered" && (
                <p>You haven't registered for any events yet.</p>
              )}
            </div>
          ) : (
            filteredEvents.map((ev) => (
              <div className="event-card" key={ev.id}>
                <div className="event-banner">
                  <div className={`event-logo ${ev.type}`}>
                    {ev.club && ev.club.image ? (
                      <img
                        src={ev.club.image}
                        alt={ev.club.name + " logo"}
                        style={{ width: 40, height: 40, borderRadius: "50%" }}
                      />
                    ) : (
                      <i
                        className={
                          ev.club && ev.club.icon
                            ? ev.club.icon
                            : "fas fa-calendar-day"
                        }
                      ></i>
                    )}
                  </div>
                  {ev.registered && (
                    <span className="registered-badge">Registered</span>
                  )}
                </div>
                <div className="event-content">
                  <h3>{ev.title}</h3>
                  <p>{ev.description}</p>
                  <div className="event-meta">
                    <span>
                      <i className="fas fa-calendar-day"></i> {ev.date}
                    </span>
                    <span>
                      <i className="fas fa-clock"></i> {ev.time}
                    </span>
                    <span>
                      <i className="fas fa-map-marker-alt"></i> {ev.location}
                    </span>
                  </div>
                  <div className="event-tags">
                    {ev.tags &&
                      ev.tags.map((tag) => (
                        <span className="tag" key={tag}>
                          {tag}
                        </span>
                      ))}
                  </div>
                </div>
                <div className="event-action">
                  {ev.registered ? (
                    <button
                      className="unregister-button"
                      onClick={() => handleUnregister(ev.id)}
                    >
                      Unregister
                    </button>
                  ) : (
                    <button
                      className="register-button"
                      onClick={() => handleRegister(ev.id)}
                    >
                      Register
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <footer>
        <p>&copy; 2025 Campus Connect. All rights reserved.</p>
      </footer>
    </>
  );
}
