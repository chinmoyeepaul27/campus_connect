import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Notes.css";
import axios from "axios";

// Set your backend URL here for easy configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
axios.defaults.baseURL = BACKEND_URL;

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [myNotes, setMyNotes] = useState([]);
  const [allNotes, setAllNotes] = useState([]);

  // Fetch all notes and my notes separately

  // Edit modal state
  const [editModal, setEditModal] = useState({ open: false, note: null });

  // Delete note handler
  const handleDelete = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`/api/notes/${noteId}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      // Remove from UI
      setAllNotes((prev) => prev.filter((n) => n.id !== noteId));
      setMyNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      alert("Failed to delete note.");
    }
  };
  // Edit note handler
  const handleEdit = (note) => {
    setEditModal({ open: true, note });
  };

  // Save edited note
  const handleEditSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("description", editModal.note.description || "");
    formData.append("tags", editModal.note.tags || "");
    if (editModal.note.newFile) {
      formData.append("file", editModal.note.newFile);
    }
    try {
      const res = await axios.patch(
        `/api/notes/${editModal.note.id}/`,
        formData,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );
      // Update UI
      setAllNotes((prev) =>
        prev.map((n) => (n.id === res.data.id ? res.data : n))
      );
      setMyNotes((prev) =>
        prev.map((n) => (n.id === res.data.id ? res.data : n))
      );
      setEditModal({ open: false, note: null });
    } catch (err) {
      alert("Failed to update note.");
    }
  };

  // Handle edit form field changes
  const handleEditField = (field, value) => {
    setEditModal((prev) => ({
      ...prev,
      note: { ...prev.note, [field]: value },
    }));
  };

  useEffect(() => {
    setLoading(true);
    setError("");
    // Always send token if present
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Token ${token}` } : {};

    // Fetch all notes (with token)
    axios
      .get("/api/notes/", { headers })
      .then((response) => {
        setAllNotes(response.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load notes.");
        setLoading(false);
      });

    // Fetch my notes (with token)
    axios
      .get("/api/notes/?my=1", { headers })
      .then((response) => {
        setMyNotes(response.data);
      })
      .catch(() => {
        setMyNotes([]);
      });

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
    return () => appearOnScroll.disconnect();
  }, []);

  // Handle filter button click
  const handleFilter = (type) => {
    setFilter(type);
  };

  // Handle search
  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  // Filter notes based on filter and search
  let displayedNotes = [];
  if (filter === "all") {
    displayedNotes = allNotes;
  } else if (filter === "my-notes") {
    displayedNotes = myNotes;
  } else {
    // Batch filter (e.g., "2022")
    displayedNotes = allNotes.filter((note) => String(note.batch) === filter);
  }
  if (search.trim() !== "") {
    displayedNotes = displayedNotes.filter(
      (note) =>
        note.title?.toLowerCase().includes(search.toLowerCase()) ||
        note.subject?.toLowerCase().includes(search.toLowerCase()) ||
        note.description?.toLowerCase().includes(search.toLowerCase())
    );
  }

  return (
    <>
      <header>
        <nav className="container">
          {/* Logo and Campus Connect Title */}
          <Link to="/" className="logo-link">
            <div className="logo">
              <img src="campus-connect-logo.jpg" alt="Campus Connect Logo" />
              <h2 style={{ fontStyle: "italic" }}>Campus Connect</h2>
            </div>
          </Link>

          {/* Right-side Navigation buttons */}
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
          </div>
        </nav>
      </header>

      <section className="page-header">
        <div className="container">
          <h2>
            <i className="fas fa-book"></i> Study Notes
          </h2>
          <p>Access and share study materials with your fellow students</p>
        </div>
      </section>

      <main className="container">
        {/* Notes Controls */}
        <div className="notes-controls">
          <div className="notes-filter">
            <button
              className={filter === "all" ? "active" : ""}
              onClick={() => handleFilter("all")}
            >
              All Notes
            </button>
            <button
              className={filter === "my-notes" ? "active" : ""}
              onClick={() => handleFilter("my-notes")}
            >
              My Notes
            </button>
            <button
              className={filter === "2022" ? "active" : ""}
              onClick={() => handleFilter("2022")}
            >
              2022 Batch
            </button>
            <button
              className={filter === "2021" ? "active" : ""}
              onClick={() => handleFilter("2021")}
            >
              2021 Batch
            </button>
            <button
              className={filter === "2020" ? "active" : ""}
              onClick={() => handleFilter("2020")}
            >
              2020 Batch
            </button>
            <button
              className={filter === "2019" ? "active" : ""}
              onClick={() => handleFilter("2019")}
            >
              2019 Batch
            </button>
          </div>
          <div className="notes-actions">
            <button className="upload-btn">
              <Link
                to="/upload-notes"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <i className="fas fa-upload"></i> Upload Notes
              </Link>
            </button>
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search notes, subjects..."
                id="searchInput"
                value={search}
                onChange={handleSearch}
              />
            </div>
          </div>
        </div>

        {/* Notes List Section */}
        <h3 className="section-title">
          {filter === "my-notes"
            ? "My Uploaded Notes"
            : filter === "all"
            ? "All Notes"
            : `${filter} Batch Notes`}
        </h3>

        <div className="notes-list">
          {loading ? (
            <p>Loading notes...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : displayedNotes.length === 0 ? (
            <div className="no-notes">
              <i className="fas fa-book-open"></i>
              <h3>No Notes Found</h3>
              <p>
                There are no notes matching your search criteria. Try different
                keywords or upload your own notes.
              </p>
            </div>
          ) : (
            displayedNotes.map((note) => {
              // Defensive: fallback for all fields
              const uploadDate = note.uploaded_at || note.uploadDate || "";
              const downloads =
                typeof note.downloads === "number" ? note.downloads : 0;
              let fileUrl = note.file;
              if (fileUrl) {
                if (fileUrl.includes("/media/")) {
                  const mediaIndex = fileUrl.indexOf("/media/");
                  fileUrl = `${BACKEND_URL}${fileUrl.substring(mediaIndex)}`;
                } else if (!fileUrl.startsWith("http")) {
                  if (!fileUrl.startsWith("/")) fileUrl = "/" + fileUrl;
                  fileUrl = `${BACKEND_URL}${fileUrl}`;
                }
              } else {
                fileUrl = null;
              }
              const fileSize = note.size ? ` • ${note.size}` : "";
              return (
                <div className="note-card" key={note.id} data-type={note.batch}>
                  <div className="note-header">
                    <div className={`subject-badge ${note.subject || "cse"}`}>
                      <i className="fas fa-code"></i>
                      <span>{note.subject || "CSE"}</span>
                    </div>
                    {note.is_owner && (
                      <span className="owner-badge">My Upload</span>
                    )}
                  </div>
                  <div className="note-content">
                    <h3>{note.title || "Untitled"}</h3>
                    <p>{note.description || "No description."}</p>
                    <div className="note-meta">
                      <span>
                        <i className="fas fa-calendar"></i> Uploaded{" "}
                        {uploadDate}
                      </span>
                      <span>
                        <i className="fas fa-download"></i> {downloads}{" "}
                        downloads
                      </span>
                      <span>
                        <i className="fas fa-file-pdf"></i>{" "}
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          PDF
                        </a>
                        {fileSize}
                      </span>
                    </div>
                    <div className="note-tags">
                      {Array.isArray(note.tags) ? (
                        note.tags.map((tag, idx) => (
                          <span className="tag" key={idx}>
                            {tag}
                          </span>
                        ))
                      ) : note.tags ? (
                        <span className="tag">{note.tags}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="note-actions">
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(note)}
                    >
                      <i className="fas fa-edit"></i> Edit
                    </button>
                    {fileUrl ? (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="download-btn"
                        style={{
                          display: "inline-block",
                          textDecoration: "none",
                        }}
                        download
                      >
                        <i className="fas fa-download"></i> Download
                      </a>
                    ) : (
                      <span
                        style={{
                          color: "red",
                          fontSize: "0.9em",
                          marginLeft: 8,
                        }}
                      >
                        File not available
                      </span>
                    )}
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(note.id)}
                    >
                      <i className="fas fa-trash"></i> Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {/* Edit Note Modal (rendered once, outside the map) */}
        {editModal.open && (
          <div
            className="modal-backdrop"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.4)",
              zIndex: 1000,
            }}
          >
            <div
              className="modal"
              style={{
                background: "#fff",
                maxWidth: 500,
                margin: "5% auto",
                padding: 24,
                borderRadius: 8,
                position: "relative",
              }}
            >
              <h3>Edit Note</h3>
              <form onSubmit={handleEditSave}>
                <div style={{ marginBottom: 12 }}>
                  <label>Description:</label>
                  <textarea
                    value={editModal.note.description || ""}
                    onChange={(e) =>
                      handleEditField("description", e.target.value)
                    }
                    style={{ width: "100%", minHeight: 60 }}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label>Tags (comma separated):</label>
                  <input
                    type="text"
                    value={
                      Array.isArray(editModal.note.tags)
                        ? editModal.note.tags.join(",")
                        : editModal.note.tags || ""
                    }
                    onChange={(e) => handleEditField("tags", e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label>Replace File (optional):</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) =>
                      handleEditField("newFile", e.target.files[0])
                    }
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setEditModal({ open: false, note: null })}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="edit-btn">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <footer>
        <p>&copy; 2025 Campus Connect. All rights reserved.</p>
      </footer>
    </>
  );
};

export default Notes;
