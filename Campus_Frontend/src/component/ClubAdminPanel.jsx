import React, { useState, useEffect } from "react";
import axios from "../axiosConfig";
import "./ClubAdminPanel.css";

const ClubAdminPanel = ({ clubId, onClose }) => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMemberships, setSelectedMemberships] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, [clubId]);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get(`/api/clubs/${clubId}/admin/dashboard/`);
      setDashboard(response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load dashboard data");
      setLoading(false);
    }
  };

  const handleMembershipAction = async (action) => {
    if (selectedMemberships.length === 0) {
      alert("Please select at least one membership to process");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to ${action} the selected memberships?`
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      await axios.post(`/api/clubs/${clubId}/admin/bulk-action/`, {
        action,
        membership_ids: selectedMemberships,
      });

      // Refresh dashboard
      await fetchDashboard();
      setSelectedMemberships([]);
      alert(
        `Successfully ${action}d ${selectedMemberships.length} memberships`
      );
    } catch (err) {
      alert(
        `Failed to ${action} memberships: ${
          err.response?.data?.detail || err.message
        }`
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleMembershipSelect = (membershipId) => {
    setSelectedMemberships((prev) =>
      prev.includes(membershipId)
        ? prev.filter((id) => id !== membershipId)
        : [...prev, membershipId]
    );
  };

  const handleSelectAll = () => {
    if (selectedMemberships.length === dashboard.pending_requests.length) {
      setSelectedMemberships([]);
    } else {
      setSelectedMemberships(dashboard.pending_requests.map((req) => req.id));
    }
  };

  if (loading) {
    return (
      <div className="admin-panel-overlay">
        <div className="admin-panel">
          <div className="loading">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-panel-overlay">
        <div className="admin-panel">
          <div className="error">{error}</div>
          <button onClick={onClose} className="close-btn">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel-overlay" onClick={onClose}>
      <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
        <div className="admin-panel-header">
          <h2>
            <i className="fas fa-cog"></i>
            Admin Panel - {dashboard.club.name}
          </h2>
          <button onClick={onClose} className="close-btn">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="admin-panel-content">
          {/* Statistics */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-content">
                <h3>{dashboard.statistics.total_members}</h3>
                <p>Total Members</p>
              </div>
            </div>
            <div className="stat-card pending">
              <div className="stat-icon">
                <i className="fas fa-clock"></i>
              </div>
              <div className="stat-content">
                <h3>{dashboard.statistics.pending_requests}</h3>
                <p>Pending Requests</p>
              </div>
            </div>
            <div className="stat-card approved">
              <div className="stat-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="stat-content">
                <h3>{dashboard.statistics.approved_members}</h3>
                <p>Approved Members</p>
              </div>
            </div>
            <div className="stat-card active">
              <div className="stat-icon">
                <i className="fas fa-star"></i>
              </div>
              <div className="stat-content">
                <h3>{dashboard.statistics.active_members}</h3>
                <p>Active Members</p>
              </div>
            </div>
          </div>

          {/* Pending Requests */}
          <div className="section">
            <div className="section-header">
              <h3>Pending Membership Requests</h3>
              <div className="bulk-actions">
                <button onClick={handleSelectAll} className="select-all-btn">
                  {selectedMemberships.length ===
                  dashboard.pending_requests.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
                <button
                  onClick={() => handleMembershipAction("approve")}
                  disabled={selectedMemberships.length === 0 || actionLoading}
                  className="approve-btn"
                >
                  <i className="fas fa-check"></i> Approve Selected
                </button>
                <button
                  onClick={() => handleMembershipAction("reject")}
                  disabled={selectedMemberships.length === 0 || actionLoading}
                  className="reject-btn"
                >
                  <i className="fas fa-times"></i> Reject Selected
                </button>
              </div>
            </div>

            {dashboard.pending_requests.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-inbox"></i>
                <p>No pending membership requests</p>
              </div>
            ) : (
              <div className="requests-list">
                {dashboard.pending_requests.map((request) => (
                  <div key={request.id} className="request-card">
                    <div className="request-select">
                      <input
                        type="checkbox"
                        checked={selectedMemberships.includes(request.id)}
                        onChange={() => handleMembershipSelect(request.id)}
                      />
                    </div>
                    <div className="request-info">
                      <h4>{request.user_details.username}</h4>
                      <p>
                        <strong>Email:</strong> {request.user_details.email}
                      </p>
                      <p>
                        <strong>Department:</strong>{" "}
                        {request.user_details.department}
                      </p>
                      <p>
                        <strong>Batch:</strong> {request.user_details.batch}
                      </p>
                      <p>
                        <strong>Applied:</strong>{" "}
                        {new Date(request.joined_at).toLocaleDateString()}
                      </p>
                      {request.motivation && (
                        <div className="motivation">
                          <strong>Motivation:</strong>
                          <p>{request.motivation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Payments */}
          <div className="section">
            <div className="section-header">
              <h3>Recent Payments</h3>
            </div>

            {dashboard.recent_payments.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-credit-card"></i>
                <p>No recent payments</p>
              </div>
            ) : (
              <div className="payments-table">
                <table>
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Member</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.recent_payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{payment.transaction_id}</td>
                        <td>
                          {payment.membership_details.user_details.username}
                        </td>
                        <td>৳{payment.amount}</td>
                        <td>{payment.payment_method.toUpperCase()}</td>
                        <td>
                          <span className={`status ${payment.status}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td>
                          {new Date(payment.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubAdminPanel;
