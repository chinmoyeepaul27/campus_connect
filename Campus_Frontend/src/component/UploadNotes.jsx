import React, { useState, useRef } from "react";
// Simple Toast component for notifications
function Toast({ message, type, onClose }) {
  return (
    <div className={`toast ${type}`}>
      {message}
      <button className="toast-close" onClick={onClose}>
        &times;
      </button>
    </div>
  );
}
import { useNavigate, Link } from "react-router-dom";
import "./UploadNotes.css";
import axios from "axios";

// Always use the same backend URL logic as Notes.jsx
const BACKEND_URL =
  import.meta.env?.VITE_BACKEND_URL || "http://localhost:8000";
axios.defaults.baseURL = BACKEND_URL;

export default function UploadNotes() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [batch, setBatch] = useState("");
  const [tags, setTags] = useState([]);
  const [fileName, setFileName] = useState("");
  const [semester, setSemester] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false); // Spinner state
  const navigate = useNavigate();
  const tagInputRef = useRef(null);

  // Handle tag input
  const addTag = (tag) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    if (tagInputRef.current) tagInputRef.current.value = "";
  };
  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Handle file input
  const handleFileChange = (e) => {
    const fileObj = e.target.files[0];
    setFile(fileObj);
    setFileName(fileObj ? fileObj.name : "");
  };

  // Remove file and show upload box again
  const handleRemoveFile = () => {
    setFile(null);
    setFileName("");
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file.");
      setSuccess("");
      setToast({ message: "Please select a file.", type: "error" });
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("subject", subject);
    formData.append("batch", batch);
    formData.append("semester", semester);
    formData.append("course_code", courseCode);
    formData.append("file", file);
    tags.forEach((tag, idx) => formData.append(`tags[${idx}]`, tag));

    // Always get the token fresh at submit time
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to upload notes.");
      setSuccess("");
      setLoading(false);
      setToast({
        message: "You must be logged in to upload notes.",
        type: "error",
      });
      return;
    }

    axios
      .post("/api/notes/upload/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Token ${token}`,
        },
      })
      .then((response) => {
        setSuccess("Note uploaded successfully!");
        setError("");
        setTitle("");
        setDescription("");
        setSubject("");
        setFile(null);
        setTags([]);
        setFileName("");
        setSemester("");
        setBatch("");
        setCourseCode("");
        setLoading(false);
        setToast({ message: "Note uploaded successfully!", type: "success" });
        setTimeout(() => navigate("/notes"), 1200);
      })
      .catch((error) => {
        let msg = "Failed to upload note.";
        if (error.response && error.response.status === 401) {
          msg = "Authentication failed. Please log in first.";
        } else if (error.response?.data?.detail) {
          msg = error.response.data.detail;
        }
        setError(msg);
        setSuccess("");
        setLoading(false);
        setToast({ message: msg, type: "error" });
      });
  };

  return (
    <div className="upload-notes-container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
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
            <Link to="/notes">
              <button>
                <i className="fas fa-book"></i> Notes
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
            <i className="fas fa-upload"></i> Upload Study Notes
          </h2>
          <p>
            Share your knowledge with fellow students & juniors by uploading
            your study materials
          </p>
        </div>
      </section>
      <main className="container">
        {/* Preload spinner overlay */}
        {loading && (
          <div className="spinner-overlay">
            <div className="spinner"></div>
            <div style={{ marginTop: 16, color: "#333", fontWeight: 500 }}>
              Uploading, please wait...
            </div>
          </div>
        )}
        <form className="upload-form" id="uploadForm" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="noteTitle">
              <i className="fas fa-heading"></i> Note Title *
            </label>
            <input
              type="text"
              id="noteTitle"
              name="noteTitle"
              placeholder="Enter the title of your notes... "
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="subject">
                <i className="fas fa-book"></i> Subject *
              </label>
              <select
                id="subject"
                name="subject"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                <option value="">Select Subject</option>
                <option value="cse">Computer Science Engineering (CSE)</option>
                <option value="ece">Electronics & Communication (ECE)</option>
                <option value="me">Mechanical Engineering (ME)</option>
                <option value="ce">Civil Engineering (CE)</option>
                <option value="eee">Electrical & Electronics (EEE)</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="batch">
                <i className="fas fa-graduation-cap"></i> Batch Year *
              </label>
              <select
                id="batch"
                name="batch"
                required
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
              >
                <option value="">Select Batch</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
                <option value="2020">2020</option>
                <option value="2019">2019</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">
              <i className="fas fa-align-left"></i> Description *
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Provide a detailed description of the content covered in these notes..."
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-file-upload"></i> Upload File *
            </label>
            {/* If file is not selected, show upload box. If file is selected, show preview instead. */}
            {!file ? (
              <div
                className="file-upload"
                style={{
                  background: "#fff",
                  border: "2px dashed #007bff",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                }}
              >
                <input
                  type="file"
                  id="fileInput"
                  name="file"
                  className="file-input"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  required
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="fileInput"
                  className="file-label"
                  id="fileLabel"
                >
                  <i className="fas fa-cloud-upload-alt"></i>
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      Click to upload or drag and drop
                    </div>
                    <div style={{ fontSize: "12px", opacity: 0.7 }}>
                      PDF, DOC, DOCX, PPT, PPTX (Max 10MB)
                    </div>
                  </div>
                </label>
                <div className="file-info" id="fileInfo">
                  {fileName && (
                    <div>
                      <strong>File Details:</strong>
                      <br />
                      Name: {fileName}
                      <br />
                      Size: {file
                        ? (file.size / (1024 * 1024)).toFixed(2)
                        : 0}{" "}
                      MB
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                className="preview-section"
                id="previewSection"
                style={{
                  marginTop: 0,
                  background: "#f8fbff",
                  border: "2px dashed #007bff",
                  borderRadius: 8,
                  minHeight: 120,
                  color: "#222",
                  fontWeight: "bold",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                  padding: 16,
                  zIndex: 1000,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div className="preview-title">
                    <i className="fas fa-eye"></i> Preview
                  </div>
                  <button
                    type="button"
                    style={{
                      background: "#fff",
                      border: "1px solid #ff0000",
                      color: "#ff0000",
                      borderRadius: 4,
                      padding: "2px 10px",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                    onClick={handleRemoveFile}
                  >
                    Remove File
                  </button>
                </div>
                <div
                  className="note-preview"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                  }}
                >
                  <div
                    className="note-header"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      className="subject-badge"
                      id="previewSubject"
                      style={{ marginBottom: 4 }}
                    >
                      <i className="fas fa-book"></i>
                      <span>{subject ? subject.toUpperCase() : "Subject"}</span>
                    </div>
                    <span className="owner-badge">My Upload</span>
                  </div>
                  <div
                    className="note-content"
                    style={{ textAlign: "center", width: "100%" }}
                  >
                    <h3 id="previewTitle" style={{ margin: 0 }}>
                      {title || "Note Title"}
                    </h3>
                    <p id="previewDescription" style={{ margin: "8px 0" }}>
                      {description || "Note description will appear here..."}
                    </p>
                    <div
                      className="note-meta"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                        margin: "8px 0",
                      }}
                    >
                      <span>
                        <i className="fas fa-calendar"></i> Uploading now
                      </span>
                      <span>
                        <i className="fas fa-file-pdf"></i>{" "}
                        {/* File name as clickable link to preview */}
                        {file && (
                          <>
                            <a
                              href={URL.createObjectURL(file)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "#007bff",
                                textDecoration: "underline",
                                fontWeight: 600,
                                marginRight: 8,
                              }}
                              title="Click to preview file"
                            >
                              {file.name}
                            </a>
                            <span style={{ color: "#555", fontWeight: 500 }}>
                              ({file.name.split(".").pop().toUpperCase()} file)
                            </span>
                          </>
                        )}
                        {!file && <span id="previewFileType">PDF</span>} •{" "}
                        <span id="previewFileSize">
                          {file ? (file.size / (1024 * 1024)).toFixed(2) : "0"}{" "}
                          MB
                        </span>
                      </span>
                    </div>
                    <div
                      className="note-tags"
                      id="previewTags"
                      style={{ margin: "8px 0" }}
                    >
                      {tags && tags.length > 0 ? (
                        tags.map((tag, idx) => (
                          <span className="tag" key={idx}>
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: "#aaa" }}>No tags</span>
                      )}
                    </div>
                    <div
                      className="note-extra-details"
                      style={{
                        marginTop: 8,
                        fontSize: "14px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <i className="fas fa-calendar-alt"></i> Semester:{" "}
                        {semester ? (
                          semester
                        ) : (
                          <span style={{ color: "#aaa" }}>N/A</span>
                        )}
                      </div>
                      <div>
                        <i className="fas fa-code"></i> Course Code:{" "}
                        {courseCode ? (
                          courseCode
                        ) : (
                          <span style={{ color: "#aaa" }}>N/A</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-tags"></i> Tags
            </label>
            <div className="tags-input" id="tagsInput">
              <input
                type="text"
                className="tag-input"
                placeholder="Type a tag and press Enter..."
                id="tagInputField"
                ref={tagInputRef}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag(e.target.value.trim());
                    e.target.value = "";
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    addTag(e.target.value.trim());
                    e.target.value = "";
                  }
                }}
              />
              <div className="tag-list">
                {tags.map((tag) => (
                  <span className="tag" key={tag}>
                    {tag}
                    <button
                      type="button"
                      className="remove-tag"
                      onClick={() => removeTag(tag)}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <small style={{ color: "#666", fontSize: "12px" }}>
              Add relevant tags to help others find your notes easily
            </small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="semester">
                <i className="fas fa-calendar-alt"></i> Semester
              </label>
              <select
                id="semester"
                name="semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              >
                <option value="">Select Semester</option>
                <option value="1">1st Semester</option>
                <option value="2">2nd Semester</option>
                <option value="3">3rd Semester</option>
                <option value="4">4th Semester</option>
                <option value="5">5th Semester</option>
                <option value="6">6th Semester</option>
                <option value="7">7th Semester</option>
                <option value="8">8th Semester</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="courseCode">
                <i className="fas fa-code"></i> Course Code
              </label>
              <input
                type="text"
                id="courseCode"
                name="courseCode"
                placeholder="e.g., CSE301, ECE204"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/notes")}
            >
              <i className="fas fa-times"></i> Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <i className="fas fa-upload"></i> Upload Notes
            </button>
          </div>
          {/* error/success fallback for non-toast browsers */}
          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}
        </form>
      </main>

      <footer>
        <p>&copy; 2025 Campus Connect. All rights reserved.</p>
      </footer>

      {/* Spinner & Toast CSS */}
      <style>{`
        .spinner-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(255,255,255,0.7);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .spinner {
          border: 6px solid #f3f3f3;
          border-top: 6px solid #3498db;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .toast {
          position: fixed;
          top: 30px;
          right: 30px;
          z-index: 9999;
          background: #fff;
          color: #222;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          padding: 16px 32px 16px 20px;
          min-width: 220px;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 12px;
          border-left: 6px solid #007bff;
          animation: toast-in 0.3s;
        }
        .toast.success { border-left-color: #28a745; }
        .toast.error { border-left-color: #dc3545; }
        .toast-close {
          background: none;
          border: none;
          font-size: 1.2em;
          margin-left: 12px;
          cursor: pointer;
        }
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
