import React, { useEffect, useState } from "react";
import axios from "../axiosConfig";
import { Link } from "react-router-dom";
import ClubAdminPanel from "./ClubAdminPanel";
import "./Clubs.css";

export default function Clubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [joinFormData, setJoinFormData] = useState({
    fullName: "",
    studentId: "",
    email: "",
    phone: "",
    department: "",
    batch: "",
    motivation: "",
    paymentMethod: "bkash",
  });
  const [paymentImageErrors, setPaymentImageErrors] = useState({});
  const [newClub, setNewClub] = useState({
    name: "",
    description: "",
    type: "tech",
    meeting_info: "",
    tags: "",
  });
  const [addClubError, setAddClubError] = useState("");
  const [addClubSuccess, setAddClubSuccess] = useState("");
  const [clubImage, setClubImage] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [selectedClubForAdmin, setSelectedClubForAdmin] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please login to access clubs");
      setLoading(false);
      return;
    }

    // Fetch clubs
    axios
      .get("/api/clubs/")
      .then((response) => {
        console.log("Clubs data:", response.data); // Debug log
        setClubs(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setError("Failed to load clubs");
        setLoading(false);
      });

    // Fetch user info for admin check
    axios
      .get("/api/userinfo/")
      .then((res) => {
        setIsAdmin(res.data.is_staff || res.data.is_superuser);
      })
      .catch((err) => {
        setIsAdmin(false);
      });
  }, []);

  // Filter clubs based on active filter
  const getFilteredClubs = () => {
    switch (activeFilter) {
      case "all":
        return clubs;
      case "registered":
        // Show clubs where user is a member or has pending/rejected applications
        return clubs.filter(
          (club) =>
            club.is_member ||
            club.membership_status === "pending" ||
            club.membership_status === "rejected"
        );
      case "tech":
        return clubs.filter((club) => club.type === "tech");
      case "cultural":
        return clubs.filter((club) => club.type === "cultural");
      case "sports":
        return clubs.filter((club) => club.type === "sports");
      default:
        return clubs;
    }
  };

  // Handle filter button click
  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
  };

  // Handle admin panel
  const handleAdminPanel = (club) => {
    setSelectedClubForAdmin(club);
    setShowAdminPanel(true);
  };

  const closeAdminPanel = () => {
    setShowAdminPanel(false);
    setSelectedClubForAdmin(null);
  };

  // Handle join club button click
  const handleJoinClub = (club) => {
    setSelectedClub(club);
    setShowJoinModal(true);
    // Pre-fill user data if available
    const userData = {
      fullName: localStorage.getItem("username") || "",
      email: "", // Will be filled by user
      department: localStorage.getItem("department") || "",
      batch: localStorage.getItem("batch") || "",
      studentId: "",
      phone: "",
      motivation: "",
      paymentMethod: "bkash",
    };
    setJoinFormData(userData);
  };

  // Handle join form input changes
  const handleJoinFormChange = (e) => {
    const { name, value } = e.target;
    setJoinFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle payment submission
  const handlePaymentSubmit = (e) => {
    e.preventDefault();

    // Validate form
    if (
      !joinFormData.fullName ||
      !joinFormData.studentId ||
      !joinFormData.email ||
      !joinFormData.phone ||
      !joinFormData.motivation
    ) {
      alert("Please fill all required fields");
      return;
    }

    // Store registration data temporarily
    const registrationData = {
      clubId: selectedClub.id,
      clubName: selectedClub.name,
      membershipFee: 500, // Fixed fee or can be dynamic
      ...joinFormData,
    };

    localStorage.setItem(
      "pendingRegistration",
      JSON.stringify(registrationData)
    );

    // Redirect to payment gateway based on selected method
    redirectToPaymentGateway(joinFormData.paymentMethod, registrationData);
  };

  // Redirect to payment gateway
  const redirectToPaymentGateway = (method, data) => {
    const amount = data.membershipFee;
    const reference = `CLUB_${data.clubId}_${Date.now()}`;

    // In a real app, you'd integrate with actual payment APIs
    // For demo purposes, we'll simulate the payment flow
    switch (method) {
      case "bkash":
        // Simulate bKash payment
        simulatePayment("bKash", amount, reference);
        break;
      case "nagad":
        // Simulate Nagad payment
        simulatePayment("Nagad", amount, reference);
        break;
      case "rocket":
        // Simulate Rocket payment
        simulatePayment("Rocket", amount, reference);
        break;
      default:
        alert("Please select a payment method");
    }
  };

  // Simulate payment process
  const simulatePayment = (method, amount, reference) => {
    // Show payment processing
    const confirmed = window.confirm(
      `Redirecting to ${method} for payment of ৳${amount}\n\n` +
        `Club: ${selectedClub.name}\n` +
        `Reference: ${reference}\n\n` +
        `Click OK to simulate successful payment`
    );

    if (confirmed) {
      // Simulate successful payment
      setTimeout(() => {
        handlePaymentSuccess(reference);
      }, 1000);
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = (reference) => {
    const registrationData = JSON.parse(
      localStorage.getItem("pendingRegistration")
    );

    // Check if registrationData exists and has required properties
    if (!registrationData || !registrationData.clubId) {
      console.error("No registration data found or missing clubId");
      alert("Payment processing error. Please try again.");
      return;
    }

    // Join the club - make API call to backend with new format
    axios
      .post(`/api/clubs/${registrationData.clubId}/join/`, {
        full_name: registrationData.fullName,
        student_id: registrationData.studentId,
        email: registrationData.email,
        phone: registrationData.phone,
        department: registrationData.department,
        batch: registrationData.batch,
        motivation: registrationData.motivation,
        payment_method: registrationData.paymentMethod,
        payment_reference: reference,
      })
      .then((response) => {
        // Update club data locally - set as pending until admin approval
        setClubs((prevClubs) =>
          prevClubs.map((club) =>
            club.id === registrationData.clubId
              ? {
                  ...club,
                  membership_status: "pending", // Add membership status
                  members_count: club.members_count + 1,
                }
              : club
          )
        );

        // Clear temporary data
        localStorage.removeItem("pendingRegistration");
        setShowJoinModal(false);
        setSelectedClub(null);

        alert(
          `Successfully submitted application to join ${registrationData.clubName}! Your membership is pending admin approval.`
        );
      })
      .catch((error) => {
        console.error("Failed to join club:", error);
        alert(
          "Payment successful but failed to submit membership application. Please contact admin."
        );
      });
  };

  // Close join modal
  const closeJoinModal = () => {
    setShowJoinModal(false);
    setSelectedClub(null);
    setJoinFormData({
      fullName: "",
      studentId: "",
      email: "",
      phone: "",
      department: "",
      batch: "",
      motivation: "",
      paymentMethod: "bkash",
    });
  };

  const handleAddClubChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setClubImage(files[0]);
    } else {
      setNewClub((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddClubSubmit = (e) => {
    e.preventDefault();
    setAddClubError("");
    setAddClubSuccess("");
    // Prepare tags as array
    const formData = new FormData();
    formData.append("name", newClub.name);
    formData.append("description", newClub.description);
    formData.append("type", newClub.type);
    formData.append("meeting_info", newClub.meeting_info);
    formData.append(
      "tags",
      JSON.stringify(
        newClub.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t)
      )
    );
    if (clubImage) formData.append("image", clubImage);
    axios
      .post("/api/clubs/create/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((res) => {
        setAddClubSuccess("Club added successfully!");
        setClubs((prev) => [...prev, res.data]);
        setShowAddForm(false);
        setNewClub({
          name: "",
          description: "",
          type: "tech",
          meeting_info: "",
          tags: "",
        });
        setClubImage(null);
      })
      .catch((err) => {
        setAddClubError(
          err.response?.data?.detail || "Failed to add club. Please try again."
        );
      });
  };

  return (
    <div className="clubs-container">
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
            <i className="fas fa-users"></i> Campus Clubs
          </h2>
          <p>Discover and join exciting clubs and activities on campus</p>
        </div>
      </section>

      <main className="container">
        <div className="clubs-controls">
          <div className="clubs-filter">
            <button
              className={activeFilter === "all" ? "active" : ""}
              data-filter="all"
              onClick={() => handleFilterClick("all")}
            >
              Explore Clubs
            </button>
            <button
              className={activeFilter === "registered" ? "active" : ""}
              data-filter="registered"
              onClick={() => handleFilterClick("registered")}
            >
              My Clubs
            </button>
            <button
              className={activeFilter === "tech" ? "active" : ""}
              data-filter="tech"
              onClick={() => handleFilterClick("tech")}
            >
              Tech
            </button>
            <button
              className={activeFilter === "cultural" ? "active" : ""}
              data-filter="cultural"
              onClick={() => handleFilterClick("cultural")}
            >
              Cultural
            </button>
            <button
              className={activeFilter === "sports" ? "active" : ""}
              data-filter="sports"
              onClick={() => handleFilterClick("sports")}
            >
              Sports
            </button>
          </div>
          {isAdmin && (
            <div className="add-club-admin">
              <button
                className="add-club-btn"
                onClick={() => setShowAddForm((v) => !v)}
              >
                <i className="fas fa-plus"></i>
                {showAddForm ? "Cancel" : "Add Club"}
              </button>
            </div>
          )}
        </div>

        {isAdmin && showAddForm && (
          <form className="add-club-form" onSubmit={handleAddClubSubmit}>
            <h4>
              <i className="fas fa-plus-circle"></i> Add New Club
            </h4>

            <label>
              Club Name:
              <input
                type="text"
                name="name"
                value={newClub.name}
                onChange={handleAddClubChange}
                placeholder="Enter club name"
                required
              />
            </label>

            <label>
              Description:
              <textarea
                name="description"
                value={newClub.description}
                onChange={handleAddClubChange}
                placeholder="Describe the club's purpose and activities"
                required
              />
            </label>

            <label>
              Club Type:
              <select
                name="type"
                value={newClub.type}
                onChange={handleAddClubChange}
                required
              >
                <option value="tech">Tech</option>
                <option value="cultural">Cultural</option>
                <option value="sports">Sports</option>
              </select>
            </label>

            <label>
              Meeting Information:
              <input
                type="text"
                name="meeting_info"
                value={newClub.meeting_info}
                onChange={handleAddClubChange}
                placeholder="e.g., Every Friday 3:00 PM, Room 101"
                required
              />
            </label>

            <label>
              Tags (comma separated):
              <input
                type="text"
                name="tags"
                value={newClub.tags}
                onChange={handleAddClubChange}
                placeholder="e.g., programming, web development, coding"
              />
            </label>

            <label>
              Club Image:
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleAddClubChange}
              />
            </label>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                <i className="fas fa-check"></i> Add Club
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowAddForm(false)}
              >
                <i className="fas fa-times"></i> Cancel
              </button>
            </div>

            {addClubError && (
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
                <i className="fas fa-exclamation-triangle"></i> {addClubError}
              </div>
            )}

            {addClubSuccess && (
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
                <i className="fas fa-check-circle"></i> {addClubSuccess}
              </div>
            )}
          </form>
        )}

        <h3 className="section-title">
          {activeFilter === "all" && "Explore Clubs"}
          {activeFilter === "registered" && "Your Registered Clubs"}
          {activeFilter === "tech" && "Tech Clubs"}
          {activeFilter === "cultural" && "Cultural Clubs"}
          {activeFilter === "sports" && "Sports Clubs"}
        </h3>
        <div className="clubs-list">
          {loading ? (
            <p>Loading clubs...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : getFilteredClubs().length === 0 ? (
            <div className="no-clubs">
              <i className="fas fa-users-slash"></i>
              <h3>No Clubs Found</h3>
              <p>
                {activeFilter === "all" &&
                  "There are no clubs available. Check back later or contact admin."}
                {activeFilter === "registered" &&
                  "You haven't applied to any clubs yet. Explore clubs below and apply to join!"}
                {activeFilter === "tech" &&
                  "No tech clubs available at the moment. Check back later."}
                {activeFilter === "cultural" &&
                  "No cultural clubs available at the moment. Check back later."}
                {activeFilter === "sports" &&
                  "No sports clubs available at the moment. Check back later."}
              </p>
            </div>
          ) : (
            getFilteredClubs().map((club) => (
              <div
                className={`club-card ${club.registered ? "registered" : ""} ${
                  club.type
                }`}
                data-type={`${club.registered ? "registered" : ""} ${
                  club.type
                }`}
                key={club.id}
              >
                <div className="club-banner">
                  <div className={`club-logo ${club.type}`}>
                    {club.image ? (
                      <img
                        src={club.image}
                        alt={club.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                        onError={(e) => {
                          // Fallback to icon if image fails to load
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "block";
                        }}
                      />
                    ) : null}
                    <i
                      className={club.icon || "fas fa-users"}
                      style={{
                        display: club.image ? "none" : "block",
                        fontSize: "36px",
                      }}
                    ></i>
                  </div>
                  {/* Show different badges based on membership status */}
                  {club.is_member && (
                    <span className="registered-badge approved">Member</span>
                  )}
                  {club.membership_status === "pending" && (
                    <span className="registered-badge pending">Pending</span>
                  )}
                  {club.membership_status === "rejected" && (
                    <span className="registered-badge rejected">Rejected</span>
                  )}
                </div>
                <div className="club-content">
                  <h3>{club.name}</h3>
                  <p>{club.description}</p>
                  <div className="club-meta">
                    <span>
                      <i className="fas fa-users"></i> {club.members_count}{" "}
                      members
                    </span>
                    <span>
                      <i className="fas fa-calendar"></i> {club.meeting_info}
                    </span>
                  </div>
                  <div className="club-tags">
                    {club.tags &&
                      club.tags.map((tag) => (
                        <span className="tag" key={tag}>
                          {tag}
                        </span>
                      ))}
                  </div>
                </div>
                <div className="club-action">
                  {/* Show different buttons based on membership status */}
                  {club.is_member ? (
                    <button className="leave-button">Leave Club</button>
                  ) : club.membership_status === "pending" ? (
                    <button className="pending-button" disabled>
                      <i className="fas fa-clock"></i> Pending Approval
                    </button>
                  ) : club.membership_status === "rejected" ? (
                    <div>
                      <button className="rejected-info" disabled>
                        <i className="fas fa-times-circle"></i> Application
                        Rejected
                      </button>
                      <button
                        className="join-button retry"
                        onClick={() => handleJoinClub(club)}
                        style={{ marginTop: "5px", fontSize: "12px" }}
                      >
                        Apply Again
                      </button>
                    </div>
                  ) : (
                    <button
                      className="join-button"
                      onClick={() => handleJoinClub(club)}
                    >
                      Join Club
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      className="admin-button"
                      onClick={() => handleAdminPanel(club)}
                      style={{
                        marginTop: "10px",
                        background: "#17a2b8",
                        color: "white",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontSize: "12px",
                        width: "100%",
                      }}
                    >
                      <i className="fas fa-cog"></i> Admin Panel
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Join Club Modal */}
        {showJoinModal && selectedClub && (
          <div className="modal-overlay" onClick={closeJoinModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>
                  <i className="fas fa-user-plus"></i> Join {selectedClub.name}
                </h3>
                <button className="modal-close" onClick={closeJoinModal}>
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <form className="join-form" onSubmit={handlePaymentSubmit}>
                <div className="form-section">
                  <h4>Personal Information</h4>

                  <label>
                    Full Name *
                    <input
                      type="text"
                      name="fullName"
                      value={joinFormData.fullName}
                      onChange={handleJoinFormChange}
                      placeholder="Enter your full name"
                      required
                    />
                  </label>

                  <label>
                    Student ID *
                    <input
                      type="text"
                      name="studentId"
                      value={joinFormData.studentId}
                      onChange={handleJoinFormChange}
                      placeholder="e.g., 2104004"
                      required
                    />
                  </label>

                  <label>
                    Email *
                    <input
                      type="email"
                      name="email"
                      value={joinFormData.email}
                      onChange={handleJoinFormChange}
                      placeholder="your.email@student.cuet.ac.bd"
                      required
                    />
                  </label>

                  <label>
                    Phone Number *
                    <input
                      type="tel"
                      name="phone"
                      value={joinFormData.phone}
                      onChange={handleJoinFormChange}
                      placeholder="01XXXXXXXXX"
                      required
                    />
                  </label>

                  <div className="form-row">
                    <label>
                      Department
                      <select
                        name="department"
                        value={joinFormData.department}
                        onChange={handleJoinFormChange}
                      >
                        <option value="">Select Department</option>
                        <option value="CSE">CSE</option>
                        <option value="EEE">EEE</option>
                        <option value="ME">ME</option>
                        <option value="CE">CE</option>
                        <option value="WRE">WRE</option>
                        <option value="MME">MME</option>
                        <option value="ETE">ETE</option>
                      </select>
                    </label>

                    <label>
                      Batch
                      <input
                        type="text"
                        name="batch"
                        value={joinFormData.batch}
                        onChange={handleJoinFormChange}
                        placeholder="e.g., 2021"
                      />
                    </label>
                  </div>

                  <label>
                    Why do you want to join this club? *
                    <textarea
                      name="motivation"
                      value={joinFormData.motivation}
                      onChange={handleJoinFormChange}
                      placeholder="Tell us your motivation for joining this club..."
                      rows="4"
                      required
                    />
                  </label>
                </div>

                <div className="form-section">
                  <h4>Payment Information</h4>
                  <p className="membership-fee">
                    <i className="fas fa-money-bill"></i>
                    Membership Fee:{" "}
                    <strong>৳{selectedClub.membership_fee || 500}</strong>
                  </p>

                  <label>
                    Payment Method *
                    <div className="payment-methods">
                      <div className="payment-option">
                        <input
                          type="radio"
                          id="bkash"
                          name="paymentMethod"
                          value="bkash"
                          checked={joinFormData.paymentMethod === "bkash"}
                          onChange={handleJoinFormChange}
                        />{" "}
                        <label htmlFor="bkash" className="payment-label">
                          {!paymentImageErrors.bkash ? (
                            <img
                              src="https://logos-world.net/wp-content/uploads/2022/01/BKash-Logo.png"
                              alt="bKash"
                              className="payment-logo"
                              onError={() =>
                                setPaymentImageErrors((prev) => ({
                                  ...prev,
                                  bkash: true,
                                }))
                              }
                            />
                          ) : (
                            <div className="payment-logo payment-fallback">
                              bK
                            </div>
                          )}
                          <span>bKash</span>
                        </label>
                      </div>

                      <div className="payment-option">
                        <input
                          type="radio"
                          id="nagad"
                          name="paymentMethod"
                          value="nagad"
                          checked={joinFormData.paymentMethod === "nagad"}
                          onChange={handleJoinFormChange}
                        />{" "}
                        <label htmlFor="nagad" className="payment-label">
                          {!paymentImageErrors.nagad ? (
                            <img
                              src="https://seeklogo.com/images/N/nagad-logo-7A70CCFEE6-seeklogo.com.png"
                              alt="Nagad"
                              className="payment-logo"
                              onError={() =>
                                setPaymentImageErrors((prev) => ({
                                  ...prev,
                                  nagad: true,
                                }))
                              }
                            />
                          ) : (
                            <div className="payment-logo payment-fallback">
                              N
                            </div>
                          )}
                          <span>Nagad</span>
                        </label>
                      </div>

                      <div className="payment-option">
                        <input
                          type="radio"
                          id="rocket"
                          name="paymentMethod"
                          value="rocket"
                          checked={joinFormData.paymentMethod === "rocket"}
                          onChange={handleJoinFormChange}
                        />{" "}
                        <label htmlFor="rocket" className="payment-label">
                          {!paymentImageErrors.rocket ? (
                            <img
                              src="https://logos-world.net/wp-content/uploads/2022/01/Dutch-Bangla-Rocket-Logo.png"
                              alt="Rocket"
                              className="payment-logo"
                              onError={() =>
                                setPaymentImageErrors((prev) => ({
                                  ...prev,
                                  rocket: true,
                                }))
                              }
                            />
                          ) : (
                            <div className="payment-logo payment-fallback">
                              R
                            </div>
                          )}
                          <span>Rocket</span>
                        </label>
                      </div>
                    </div>
                  </label>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={closeJoinModal}
                  >
                    <i className="fas fa-times"></i> Cancel
                  </button>
                  <button type="submit" className="payment-btn">
                    <i className="fas fa-credit-card"></i> Proceed to Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Club Admin Panel */}
        {showAdminPanel && selectedClubForAdmin && (
          <ClubAdminPanel
            clubId={selectedClubForAdmin.id}
            onClose={closeAdminPanel}
          />
        )}
      </main>

      <footer>
        <p>&copy; 2025 Campus Connect. All rights reserved.</p>
      </footer>
    </div>
  );
}
