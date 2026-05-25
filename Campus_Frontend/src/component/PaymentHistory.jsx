import React, { useState, useEffect } from "react";
import axios from "../axiosConfig";
import { Link } from "react-router-dom";
import "./PaymentHistory.css";

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      const response = await axios.get("/api/payments/history/");
      setPayments(response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load payment history");
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "#28a745";
      case "pending":
        return "#ffc107";
      case "failed":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case "bkash":
        return "💳";
      case "nagad":
        return "📱";
      case "rocket":
        return "🚀";
      default:
        return "💰";
    }
  };

  if (loading) {
    return (
      <div className="payment-history-container">
        <div className="loading">Loading payment history...</div>
      </div>
    );
  }

  return (
    <div className="payment-history-container">
      <header>
        <nav className="container">
          <Link to="/" className="logo-link">
            <div className="logo">
              <img src="/campus-connect-logo.jpg" alt="Campus Connect Logo" />
              <h2 style={{ fontStyle: "italic" }}>Campus Connect</h2>
            </div>
          </Link>
          <div className="auth-buttons">
            <Link to="/dashboard">
              <button>
                <i className="fas fa-th-large"></i> Dashboard
              </button>
            </Link>
            <Link to="/clubs">
              <button>
                <i className="fas fa-users"></i> Clubs
              </button>
            </Link>
            <Link to="/notes">
              <button>
                <i className="fas fa-book"></i> Notes
              </button>
            </Link>
          </div>
        </nav>
      </header>

      <section className="page-header">
        <div className="container">
          <h2>
            <i className="fas fa-credit-card"></i> Payment History
          </h2>
          <p>View all your payment transactions and receipts</p>
        </div>
      </section>

      <main className="container">
        {error ? (
          <div className="error-message">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-receipt"></i>
            <h3>No Payment History</h3>
            <p>You haven't made any payments yet.</p>
            <Link to="/clubs" className="cta-button">
              <i className="fas fa-users"></i> Explore Clubs
            </Link>
          </div>
        ) : (
          <div className="payments-grid">
            {payments.map((payment) => (
              <div key={payment.id} className="payment-card">
                <div className="payment-header">
                  <div className="payment-method">
                    <span className="method-icon">
                      {getPaymentMethodIcon(payment.payment_method)}
                    </span>
                    <span className="method-name">
                      {payment.payment_method.toUpperCase()}
                    </span>
                  </div>
                  <div
                    className="payment-status"
                    style={{ backgroundColor: getStatusColor(payment.status) }}
                  >
                    {payment.status.toUpperCase()}
                  </div>
                </div>

                <div className="payment-details">
                  <h3>৳{payment.amount}</h3>
                  <p className="club-name">
                    <i className="fas fa-users"></i>
                    {payment.membership_details.club_details.name}
                  </p>
                  <p className="transaction-id">
                    <i className="fas fa-hashtag"></i>
                    {payment.transaction_id}
                  </p>
                  <p className="payment-date">
                    <i className="fas fa-calendar"></i>
                    {new Date(payment.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="payment-actions">
                  <button
                    className="download-receipt-btn"
                    onClick={() => {
                      // Generate and download receipt
                      const receiptData = {
                        transactionId: payment.transaction_id,
                        amount: payment.amount,
                        club: payment.membership_details.club_details.name,
                        paymentMethod: payment.payment_method,
                        date: payment.created_at,
                        status: payment.status,
                      };

                      const dataStr = JSON.stringify(receiptData, null, 2);
                      const dataUri =
                        "data:application/json;charset=utf-8," +
                        encodeURIComponent(dataStr);
                      const exportFileDefaultName = `receipt_${payment.transaction_id}.json`;

                      const linkElement = document.createElement("a");
                      linkElement.setAttribute("href", dataUri);
                      linkElement.setAttribute(
                        "download",
                        exportFileDefaultName
                      );
                      linkElement.click();
                    }}
                  >
                    <i className="fas fa-download"></i> Download Receipt
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer>
        <p>&copy; 2025 Campus Connect. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default PaymentHistory;
