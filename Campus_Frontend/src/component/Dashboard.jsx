import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Dashboard.css";
import axios from "axios";
const BACKEND_URL =
  import.meta.env?.VITE_BACKEND_URL || "http://localhost:8000";
axios.defaults.baseURL = BACKEND_URL;
function Dashboard() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [input, setInput] = useState("");
  const [userInfo, setUserInfo] = useState({
    username: "",
    department: "",
    batch: "",
    profile_picture: "", // URL or base64
  });
  const [showProfileUpload, setShowProfileUpload] = useState(false);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState("");
  const [profileImageError, setProfileImageError] = useState(false);
  const [clubImageErrors, setClubImageErrors] = useState({});
  const [myNotes, setMyNotes] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [myClubs, setMyClubs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activity, setActivity] = useState({
    activities: [],
    user_stats: {},
    admin_stats: {},
  });
  const token = localStorage.getItem("token");
  // Fetch notifications for dashboard (with polling for live update)
  useEffect(() => {
    if (!token) return;
    let intervalId;
    const fetchNotifications = () => {
      axios
        .get("/api/notifications/", {
          headers: { Authorization: `Token ${token}` },
        })
        .then((response) => {
          setNotifications(response.data);
        })
        .catch((error) => {
          setNotifications([]);
        });
    };
    fetchNotifications();
    intervalId = setInterval(fetchNotifications, 10000); // Poll every 10 seconds
    // Fetch user activity for dashboard
    axios
      .get("/api/activity/", {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        setActivity(response.data);
      })
      .catch((error) => {
        setActivity({ activities: [], user_stats: {}, admin_stats: {} });
      });
    return () => clearInterval(intervalId);
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    // Fetch dashboard items
    axios
      .get("/api/items/", {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        setItems(response.data);
      })
      .catch((error) => {
        console.error("Get error:", error);
      });

    // Fetch user info from backend
    axios
      .get("/api/userinfo/", {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        setUserInfo({
          username: response.data.username || "",
          department: response.data.department || "",
          batch: response.data.batch || "",
          profile_picture: response.data.profile_picture || "",
        });
      })
      .catch((error) => {
        console.error("User info fetch error:", error);
      });

    // Fetch my notes for dashboard
    axios
      .get("/api/notes/?my=1", {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        setMyNotes(response.data);
      })
      .catch((error) => {
        setMyNotes([]);
      });

    // Fetch upcoming events for dashboard
    axios
      .get("/api/events/", {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        // Filter for upcoming events (today and future) - matching Events.jsx logic
        const today = new Date();
        const todayStr = today.toLocaleDateString("en-CA"); // "YYYY-MM-DD"
        const upcoming = response.data.filter((event) => {
          return event.date >= todayStr;
        });
        setUpcomingEvents(upcoming.slice(0, 3)); // Show max 3 events
      })
      .catch((error) => {
        setUpcomingEvents([]);
      });

    // Fetch user's clubs for dashboard
    axios
      .get("/api/clubs/", {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        // Filter for clubs the user is a member of
        const userClubs = response.data.filter(
          (club) => club.is_member === true
        );
        setMyClubs(userClubs.slice(0, 3)); // Show max 3 clubs
      })
      .catch((error) => {
        setMyClubs([]);
      });
  }, [token, navigate]);

  // After fetching myNotes, update activity if notes were uploaded
  useEffect(() => {
    if (myNotes && myNotes.length > 0) {
      // Find the two most recent notes
      const sortedNotes = [...myNotes].sort(
        (a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at)
      );
      const recentNotes = sortedNotes.slice(0, 2);
      // Map to activity format
      const noteActivities = recentNotes.map((note) => ({
        id: `note-${note.id}`,
        icon: "fas fa-file-alt",
        message: `You uploaded a new note${
          note.title ? `: ${note.title}` : ""
        }`,
        timestamp: note.uploaded_at,
      }));
      // Merge with other activity, but avoid duplicates
      setActivity((prev) => {
        // Remove any previous note-upload activities from activities array
        const filtered = Array.isArray(prev.activities)
          ? prev.activities.filter((act) => !String(act.id).startsWith("note-"))
          : [];
        return {
          ...prev,
          activities: [...noteActivities, ...filtered].slice(0, 5),
        };
      });
    }
  }, [myNotes]);

  const handleAddItem = (e) => {
    e.preventDefault();
    axios
      .post(
        "/api/items/",
        { value: input },
        { headers: { Authorization: `Token ${token}` } }
      )
      .then((response) => {
        setItems([...items, response.data]);
        setInput("");
      })
      .catch((error) => {
        console.error("Post error:", error);
      });
  };
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

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
            <Link to="/notification">
              <button>
                <i className="fas fa-bell"></i> Notifications
              </button>
            </Link>
            <Link to="/">
              <button>
                <i className="fas fa-home"></i> Home
              </button>
            </Link>
            <button onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Log Out
            </button>
          </div>
        </nav>
      </header>

      <main className="container">
        <div className="dashboard-header">
          <div className="user-welcome">
            <div className="user-avatar">
              {userInfo.profile_picture &&
              userInfo.profile_picture.trim() !== "" &&
              !profileImageError ? (
                <img
                  src={
                    userInfo.profile_picture.startsWith("http")
                      ? userInfo.profile_picture
                      : `${BACKEND_URL}${userInfo.profile_picture}`
                  }
                  alt="User Profile"
                  style={{
                    objectFit: "cover",
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                  }}
                  onError={() => setProfileImageError(true)}
                />
              ) : (
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    backgroundColor: "#1e3d58",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "24px",
                  }}
                >
                  <i className="fas fa-user"></i>
                </div>
              )}
            </div>
            <div className="user-info">
              <h2 style={{ fontWeight: 700, color: "#222" }}>
                {userInfo.username && userInfo.username.trim() !== ""
                  ? `Welcome Back! ${userInfo.username}`
                  : "Welcome Back!"}
              </h2>
              <p style={{ fontSize: "1.08rem", marginTop: 2, color: "#444" }}>
                {(() => {
                  const dept = userInfo.department;
                  const batch = userInfo.batch;
                  const hasDept =
                    dept &&
                    dept.trim() !== "" &&
                    dept !== "null" &&
                    dept !== "undefined";
                  const hasBatch =
                    batch &&
                    batch.trim() !== "" &&
                    batch !== "null" &&
                    batch !== "undefined";
                  if (hasDept && hasBatch) {
                    return `${dept} | ${batch}`;
                  } else if (hasDept) {
                    return dept;
                  } else if (hasBatch) {
                    return batch;
                  } else {
                    return "Department | Batch";
                  }
                })()}
              </p>
            </div>
          </div>
          <div className="quick-stats">
            <div className="stat-card">
              <i className="fas fa-note-sticky"></i>
              <div className="stat-info">
                <h3>
                  {activity.user_stats &&
                  typeof activity.user_stats.notes_saved === "number"
                    ? activity.user_stats.notes_saved
                    : 0}
                </h3>
                <p>Uploaded Notes</p>
              </div>
            </div>
            <div className="stat-card">
              <i className="fas fa-calendar-check"></i>
              <div className="stat-info">
                <h3>
                  {activity.user_stats &&
                  typeof activity.user_stats.upcoming_events === "number"
                    ? activity.user_stats.upcoming_events
                    : 0}
                </h3>
                <p>Upcoming Events</p>
              </div>
            </div>
            <div className="stat-card">
              <i className="fas fa-users"></i>
              <div className="stat-info">
                <h3>
                  {activity.user_stats &&
                  typeof activity.user_stats.clubs_joined === "number"
                    ? activity.user_stats.clubs_joined
                    : 0}
                </h3>
                <p>Joined Clubs</p>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-main">
          <div className="dashboard-sidebar">
            <h3>Quick Access</h3>
            <ul className="sidebar-menu">
              <li className="active">
                <a href="#">
                  <i className="fas fa-th-large"></i> Overview
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/notes");
                  }}
                  className="sidebar-link"
                >
                  <i className="fas fa-book"></i> My Notes
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/events");
                  }}
                  className="sidebar-link"
                >
                  <i className="fas fa-calendar-alt"></i> Events
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/clubs");
                  }}
                  className="sidebar-link"
                >
                  <i className="fas fa-user-friends"></i> Clubs
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/notification");
                  }}
                  className="sidebar-link"
                >
                  <i className="fas fa-bell"></i> Notifications
                </a>
              </li>
              <li>
                <button
                  type="button"
                  className="sidebar-link"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#222", // match other sidebar links
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "1em",
                    marginTop: 16, // add space below Notifications
                  }}
                  onClick={() => setShowProfileUpload(true)}
                >
                  <i className="fas fa-user-circle"></i> +Add Profile Picture
                </button>
              </li>
            </ul>
          </div>

          <div className="dashboard-content">
            <h3>
              <i className="fas fa-columns"></i> My Dashboard
            </h3>

            <div className="dashboard-grid">
              <div className="card notes-card">
                <div className="card-header">
                  <i className="fas fa-book"></i>
                  <h4>My Notes</h4>
                </div>
                <div className="card-content">
                  <ul className="notes-list">
                    {myNotes.length === 0 ? (
                      <li style={{ color: "#888" }}>No notes uploaded yet.</li>
                    ) : (
                      myNotes.slice(0, 3).map((note) => (
                        <li
                          key={note.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          {/* Mini logo/icon for each note */}
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 28,
                              height: 28,
                              background: "#f3f3f3",
                              borderRadius: "50%",
                              marginRight: 6,
                            }}
                          >
                            <i
                              className="fas fa-file-pdf"
                              style={{ color: "#c0392b", fontSize: 16 }}
                            ></i>
                          </span>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 600,
                                color: "#222",
                                fontSize: "0.98em",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {note.title || "Untitled"}
                            </span>
                            <span
                              style={{
                                color: "#888",
                                fontSize: "0.85em",
                                fontWeight: 500,
                                marginTop: 2,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "block",
                              }}
                              title={
                                note.uploaded_at
                                  ? new Date(note.uploaded_at).toLocaleString()
                                  : "-"
                              }
                            >
                              Updated{" "}
                              {note.uploaded_at
                                ? new Date(note.uploaded_at).toLocaleString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    }
                                  )
                                : "-"}
                            </span>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                  <Link to="/notes" className="card-link">
                    View All Notes <i className="fas fa-arrow-right"></i>
                  </Link>
                </div>
              </div>

              <div className="card events-card">
                <div className="card-header">
                  <i className="fas fa-calendar-alt"></i>
                  <h4>Upcoming Events</h4>
                </div>
                <div className="card-content">
                  {upcomingEvents.length === 0 ? (
                    <div
                      style={{
                        color: "#888",
                        padding: "20px",
                        textAlign: "center",
                      }}
                    >
                      No upcoming events
                    </div>
                  ) : (
                    upcomingEvents.map((event) => (
                      <div className="event-item" key={event.id}>
                        <div className="event-date">
                          <span className="day">
                            {new Date(event.date).getDate()}
                          </span>
                          <span className="month">
                            {new Date(event.date)
                              .toLocaleDateString("en-US", {
                                month: "short",
                              })
                              .toUpperCase()}
                          </span>
                        </div>
                        <div className="event-details">
                          <h5>{event.title}</h5>
                          <p>
                            {event.club?.name || event.location || "Campus"} •{" "}
                            {event.time}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <Link to="/events" className="card-link">
                    All Events <i className="fas fa-arrow-right"></i>
                  </Link>
                </div>
              </div>

              <div className="card clubs-card">
                <div className="card-header">
                  <i className="fas fa-user-friends"></i>
                  <h4>My Clubs</h4>
                </div>
                <div className="card-content">
                  <div className="clubs-list">
                    {myClubs.length === 0 ? (
                      <div
                        style={{
                          color: "#888",
                          padding: "20px",
                          textAlign: "center",
                        }}
                      >
                        No clubs joined yet
                      </div>
                    ) : (
                      myClubs.map((club) => (
                        <div className="club-item" key={club.id}>
                          {club.image && !clubImageErrors[club.id] ? (
                            <img
                              src={
                                club.image.startsWith("http")
                                  ? club.image
                                  : `http://localhost:8000${club.image}`
                              }
                              alt={club.name}
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                objectFit: "cover",
                              }}
                              onError={() => {
                                setClubImageErrors((prev) => ({
                                  ...prev,
                                  [club.id]: true,
                                }));
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                backgroundColor: "#1e3d58",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontSize: "12px",
                              }}
                            >
                              <i className="fas fa-users"></i>
                            </div>
                          )}
                          <span>{club.name}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <Link to="/clubs" className="card-link">
                    Explore Clubs <i className="fas fa-arrow-right"></i>
                  </Link>
                </div>
              </div>

              <div className="card notifications-card">
                <div className="card-header">
                  <i className="fas fa-bell"></i>
                  <h4>Recent Notifications</h4>
                </div>
                <div className="card-content">
                  {Array.isArray(notifications) && notifications.length > 0 ? (
                    notifications.slice(0, 3).map((notif) => (
                      <div className="notification-item" key={notif.id}>
                        <i className="fas fa-info-circle"></i>
                        <div
                          style={{ display: "flex", flexDirection: "column" }}
                        >
                          <p style={{ marginBottom: 2 }}>
                            {notif.message || notif.title || "Notification"}
                          </p>
                          <span style={{ color: "#888", fontSize: "0.85em" }}>
                            {(() => {
                              // If uploaded within the last 2 minutes, show 'just now'
                              if (notif.timestamp) {
                                const now = new Date();
                                const notifTime = new Date(notif.timestamp);
                                const diffMs = now - notifTime;
                                if (diffMs < 2 * 60 * 1000) {
                                  return "just now";
                                } else {
                                  return notifTime.toLocaleString();
                                }
                              }
                              return "-";
                            })()}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: "#888" }}>No notifications yet.</div>
                  )}
                  <button
                    className="card-link"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#007bff",
                      cursor: "pointer",
                      padding: 0,
                      marginTop: 8,
                    }}
                    onClick={() => navigate("/notification")}
                  >
                    All Notifications <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="activity-section">
              <h3>
                <i className="fas fa-history"></i> Recent Activity
              </h3>
              <div className="activity-timeline">
                {Array.isArray(activity.activities) &&
                activity.activities.length > 0 ? (
                  activity.activities.slice(0, 5).map((act) => (
                    <div className="timeline-item" key={act.id}>
                      <div className="timeline-icon">
                        <i className={act.icon || "fas fa-info-circle"}></i>
                      </div>
                      <div className="timeline-content">
                        <p>{act.message || act.action || "Activity"}</p>
                        <span className="timeline-date">
                          {act.timestamp
                            ? new Date(act.timestamp).toLocaleString()
                            : "-"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: "#888" }}>No recent activity yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer>
        <p>&copy; 2025 Campus Connect. All rights reserved.</p>
      </footer>

      {/* Enhanced Profile Picture Upload Modal */}
      {showProfileUpload && (
        <div
          className="modal-overlay"
          onClick={() => setShowProfileUpload(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fas fa-graduation-cap"></i>
                Upload Profile Picture
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowProfileUpload(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* File Upload Area */}
            <div className="upload-section">
              <label className="upload-label">
                Choose a new profile picture
              </label>

              {/* Custom File Input */}
              <label className="file-upload-area" htmlFor="profile-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setProfilePicFile(e.target.files[0]);
                      setProfilePicPreview(
                        URL.createObjectURL(e.target.files[0])
                      );
                    }
                  }}
                  id="profile-upload"
                />
                <i className="fas fa-cloud-upload-alt upload-icon"></i>
                <p className="upload-text">
                  {profilePicFile
                    ? profilePicFile.name
                    : "Click to select image or drag & drop"}
                </p>
              </label>
            </div>

            {/* Preview Section */}
            {profilePicPreview && (
              <div className="preview-area">
                <p className="preview-label">Preview:</p>
                <img
                  src={profilePicPreview}
                  alt="Preview"
                  className="preview-image"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="modal-actions">
              <button
                className="btn-modal btn-cancel"
                onClick={() => {
                  setShowProfileUpload(false);
                  setProfilePicFile(null);
                  setProfilePicPreview("");
                }}
              >
                <i className="fas fa-times"></i>
                Cancel
              </button>
              <button
                className="btn-modal btn-upload"
                onClick={async () => {
                  if (!profilePicFile) {
                    alert("Please select an image first.");
                    return;
                  }
                  const formData = new FormData();
                  formData.append("profile_picture", profilePicFile);
                  try {
                    const res = await axios.post(
                      "/api/userinfo/upload_profile_picture/",
                      formData,
                      {
                        headers: {
                          Authorization: `Token ${token}`,
                          "Content-Type": "multipart/form-data",
                        },
                      }
                    );
                    setUserInfo((prev) => ({
                      ...prev,
                      profile_picture: res.data.profile_picture,
                    }));
                    setShowProfileUpload(false);
                    setProfilePicFile(null);
                    setProfilePicPreview("");

                    // Show success message without redirecting
                    const successMsg = document.createElement("div");
                    successMsg.style.cssText = `
                      position: fixed;
                      top: 20px;
                      right: 20px;
                      background: #28a745;
                      color: white;
                      padding: 15px 20px;
                      border-radius: 8px;
                      z-index: 1000000;
                      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                      font-weight: 500;
                    `;
                    successMsg.textContent =
                      "✅ Profile picture updated successfully!";
                    document.body.appendChild(successMsg);

                    // Remove success message after 3 seconds
                    setTimeout(() => {
                      if (document.body.contains(successMsg)) {
                        document.body.removeChild(successMsg);
                      }
                    }, 3000);
                  } catch (err) {
                    console.error("Upload error:", err);

                    // Show error message
                    const errorMsg = document.createElement("div");
                    errorMsg.style.cssText = `
                      position: fixed;
                      top: 20px;
                      right: 20px;
                      background: #dc3545;
                      color: white;
                      padding: 15px 20px;
                      border-radius: 8px;
                      z-index: 1000000;
                      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                      font-weight: 500;
                    `;
                    errorMsg.textContent =
                      "❌ Failed to upload profile picture. Please try again.";
                    document.body.appendChild(errorMsg);

                    // Remove error message after 4 seconds
                    setTimeout(() => {
                      if (document.body.contains(errorMsg)) {
                        document.body.removeChild(errorMsg);
                      }
                    }, 4000);
                  }
                }}
                disabled={!profilePicFile}
              >
                <i className="fas fa-upload"></i>
                Upload Picture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
