import React, { useState, useEffect } from "react";
import "./Events.css";
import axios from "axios";
function EventAdminPanel({ onClose, onEventAdded, onEventUpdated, events }) {
  const [clubs, setClubs] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    tags: "",
    type: "",
    club: "",
  });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    // Fetch clubs for dropdown
    axios.get("/api/clubs/").then((res) => {
      setClubs(res.data);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    // Always send tags as array
    const payload = {
      ...form,
      tags: form.tags
        ? form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    };
    // Remove icon from payload if present
    delete payload.icon;
    try {
      if (editId) {
        // Update event
        const res = await axios.put(`/api/events/${editId}/`, payload);
        setSuccess("Event updated!");
        setEditId(null);
        setForm({
          title: "",
          description: "",
          date: "",
          time: "",
          location: "",
          tags: "",
          type: "",
          club: "",
        });
        if (onEventUpdated) onEventUpdated(res.data);
      } else {
        // Add event (POST)
        const res = await axios.post("/api/events/", payload);
        setSuccess("Event added!");
        setForm({
          title: "",
          description: "",
          date: "",
          time: "",
          location: "",
          tags: "",
          type: "",
          club: "",
        });
        if (onEventAdded) onEventAdded(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save event");
    }
  };

  const handleEdit = (event) => {
    setEditId(event.id);
    setForm({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      tags: event.tags ? event.tags.join(", ") : "",
      type: event.type || "",
      club: event.club || "",
    });
    setError("");
    setSuccess("");
  };

  return (
    <div className="admin-panel-overlay" onClick={onClose}>
      <div
        className="admin-panel"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 600 }}
      >
        <div className="admin-panel-header">
          <h2>
            <i className="fas fa-calendar-plus"></i> Add New Event
          </h2>
          <button onClick={onClose} className="close-btn">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="add-club-form">
          <label>
            Event Title:
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Enter event title"
              required
            />
          </label>
          <label>
            Description:
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the event"
              required
            />
          </label>
          <label>
            Date:
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Time:
            <input
              name="time"
              type="time"
              value={form.time}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Location:
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Location"
              required
            />
          </label>
          <label>
            Tags (comma separated):
            <input
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="e.g., tech, workshop, music"
            />
          </label>
          <label>
            Event Type:
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              required
            >
              <option value="">Select type</option>
              <option value="tech">Tech</option>
              <option value="cultural">Cultural</option>
              <option value="sports">Sports</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Club Name:
            <select
              name="club"
              value={form.club}
              onChange={handleChange}
              required
            >
              <option value="">Select club</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          </label>
          <div className="form-actions">
            <button type="submit" className="submit-btn">
              <i className="fas fa-check"></i>{" "}
              {editId ? "Update Event" : "Add Event"}
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>
              <i className="fas fa-times"></i> Cancel
            </button>
          </div>
          {error && (
            <div
              className="error-message"
              style={{
                color: "#dc3545",
                background: "#f8d7da",
                border: "1px solid #f5c6cb",
                padding: "10px",
                borderRadius: "5px",
                marginTop: "15px",
              }}
            >
              <i className="fas fa-exclamation-triangle"></i> {error}
            </div>
          )}
          {success && (
            <div
              className="success-message"
              style={{
                color: "#155724",
                background: "#d4edda",
                border: "1px solid #c3e6cb",
                padding: "10px",
                borderRadius: "5px",
                marginTop: "15px",
              }}
            >
              <i className="fas fa-check-circle"></i> {success}
            </div>
          )}
        </form>
        <h3 style={{ marginTop: 24 }}>Edit Existing Events</h3>
        <div className="events-list">
          {events && events.length > 0 ? (
            events.map((ev) => (
              <div
                className="event-card"
                key={ev.id}
                style={{ cursor: "pointer", opacity: 0.9 }}
                onClick={() => handleEdit(ev)}
              >
                <div className="event-content">
                  <h4>{ev.title}</h4>
                  <p>
                    {ev.date} {ev.time}
                  </p>
                  <p>{ev.location}</p>
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: "#888" }}>No events to edit</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventAdminPanel;
