import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./SignInUp.css";

axios.defaults.baseURL = "http://localhost:8000";

export default function SignInUp() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [signInData, setSignInData] = useState({
    username: "",
    password: "",
  });
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false); // NEW: for disabling button
  const [signUpData, setSignUpData] = useState({
    username: "",
    email: "",
    password: "",
    department: "",
    batch: "",
  });
  const [error, setError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  // Toggle overlay
  const togglePanel = () => {
    containerRef.current.classList.toggle("right-panel-active");
    setError("");
    setSignInData({ username: "", password: "" });
    setSignUpData({ username: "", email: "", password: "" });
  };

  // Handle sign in
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("/api/login/", signInData);
      setSignInData({ username: "", password: "" }); // Always clear fields
      if (res.data && res.data.token) {
        localStorage.setItem("token", res.data.token);
        // Save username, department, batch if available in response
        if (res.data.username)
          localStorage.setItem("username", res.data.username);
        if (res.data.department)
          localStorage.setItem("department", res.data.department);
        if (res.data.batch) localStorage.setItem("batch", res.data.batch);
        setIsLoggedIn(true);
        navigate("/dashboard"); // Redirect to dashboard after login
      } else {
        setError("Invalid response from server.");
      }
    } catch (err) {
      setSignInData({ username: "", password: "" }); // Clear fields on error
      setError(
        err.response?.data?.detail ||
          "Sign in failed. Please check your credentials."
      );
    }
  };

  // Handle password reset
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetMsg("");
    setResetError("");
    setResetLoading(true);
    try {
      const res = await axios.post("/dj-rest-auth/password/reset/", {
        email: resetEmail,
      });
      setResetMsg(
        "If this email is registered, a password reset link has been sent."
      );
      setResetEmail("");
    } catch (err) {
      setResetError(
        err.response?.data?.email?.[0] ||
          err.response?.data?.detail ||
          "Failed to send reset email. Please try again."
      );
    } finally {
      setResetLoading(false);
    }
  };
  // Handle sign up
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

    const { username, email, password, department, batch } = signUpData;
    const payload = { username, email, password, department, batch };
    setSignupSuccess(false); // Reset first
    try {
      const res = await axios.post("/api/signup/", payload, {
        headers: { "Content-Type": "application/json" },
      });
      setSignUpData({
        username: "",
        email: "",
        password: "",
        department: "",
        batch: "",
      }); // Always clear all fields
      if (res.data?.token) {
        setSignupSuccess(true);
        // Scroll to the message to ensure visibility
        setTimeout(() => {
          const msg = document.querySelector(".signup-error-box");
          if (msg) msg.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 15000);
        setTimeout(() => {
          setSignupSuccess(false);
          // Save user info and redirect after message is visible
          localStorage.setItem("token", res.data.token);
          if (res.data.username)
            localStorage.setItem("username", res.data.username);
          if (res.data.department)
            localStorage.setItem("department", res.data.department);
          if (res.data.batch) localStorage.setItem("batch", res.data.batch);
          setIsLoggedIn(true);
          navigate("/");
        }, 2500);
      } else {
        setError("Unexpected response from server.");
      }
    } catch (err) {
      // Log error for debugging
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("Signup error:", err, err?.response?.data);
      }
      setSignUpData({
        username: "",
        email: "",
        password: "",
        department: "",
        batch: "",
      }); // Clear all fields on error
      if (err.response?.data) {
        // Check for unique email error (backend message enforced)
        if (
          err.response.data.email &&
          err.response.data.email.some(
            (msg) =>
              msg.toLowerCase().includes("already registered") ||
              msg.toLowerCase().includes("already exists") ||
              msg === "This Email has already registered!"
          )
        ) {
          setError("This Email has already registered!");
        } else if (
          err.response.data.detail &&
          err.response.data.detail.toLowerCase().includes("email")
        ) {
          setError("This Email has already registered!");
        } else {
          // Flatten and join all error messages from Django
          const errorMessages = Object.entries(err.response.data)
            .map(([field, messages]) => {
              // Handle both array and string messages
              const messageText = Array.isArray(messages)
                ? messages.join(" ")
                : messages;
              return `${field}: ${messageText}`;
            })
            .join(" | ");
          setError(errorMessages);
        }
      } else {
        setError("Sign up failed. Please try again.");
      }
    }
  };

  // Handle logout
  const handleLogout = () => {
    axios
      .post(
        "/api/logout/",
        {},
        {
          headers: { Authorization: `Token ${localStorage.getItem("token")}` },
        }
      )
      .then(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("department");
        localStorage.removeItem("batch");
        setIsLoggedIn(false);
        setSignInData({ username: "", password: "" });
        setSignUpData({
          username: "",
          email: "",
          password: "",
          department: "CSE",
          batch: "2023",
        });
        navigate("/"); // Redirect to home after logout
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("department");
        localStorage.removeItem("batch");
        setIsLoggedIn(false);
        setSignInData({ username: "", password: "" });
        setSignUpData({
          username: "",
          email: "",
          password: "",
          department: "CSE",
          batch: "2023",
        });
        navigate("/");
      });
  };

  return (
    <div className="signinup-outer-wrapper">
      <div className="signinup-container" ref={containerRef}>
        <div className="signinup-form-container signinup-sign-up-container">
          <form onSubmit={handleSignUp}>
            <h1>Create Account</h1>
            <div className="signinup-social-container">
              <a href="#" className="social">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a
                href="http://localhost:8000/accounts/google/login/"
                className="social"
              >
                <i className="fab fa-google-plus-g"></i>
              </a>
              <a href="#" className="social">
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
            <span>or use your email for registration</span>
            <div className="signinup-infield" style={{ marginBottom: "8px" }}>
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={signUpData.username}
                onChange={(e) =>
                  setSignUpData({
                    ...signUpData,
                    [e.target.name]: e.target.value,
                  })
                }
                required
                autoComplete="off"
              />
              <label htmlFor="signup-username"></label>
            </div>
            <div
              className="signinup-infield"
              style={{ marginBottom: "8px", position: "relative" }}
            >
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  type="email"
                  placeholder="Email"
                  value={signUpData.email}
                  onChange={(e) =>
                    setSignUpData({ ...signUpData, email: e.target.value })
                  }
                  required
                  autoComplete="off"
                  className={
                    error &&
                    !signupSuccess &&
                    error === "This Email has already registered!"
                      ? "email-error-active"
                      : ""
                  }
                  style={{
                    marginBottom:
                      error &&
                      !signupSuccess &&
                      error === "This Email has already registered!"
                        ? "2px"
                        : undefined,
                    borderColor:
                      error &&
                      !signupSuccess &&
                      error === "This Email has already registered!"
                        ? "#b71c1c"
                        : undefined,
                    backgroundColor:
                      error &&
                      !signupSuccess &&
                      error === "This Email has already registered!"
                        ? "#fff6f6"
                        : undefined,
                    color:
                      error &&
                      !signupSuccess &&
                      error === "This Email has already registered!"
                        ? "transparent"
                        : undefined,
                    caretColor:
                      error &&
                      !signupSuccess &&
                      error === "This Email has already registered!"
                        ? "#b71c1c"
                        : undefined,
                  }}
                  aria-invalid={
                    error &&
                    !signupSuccess &&
                    error === "This Email has already registered!"
                      ? "true"
                      : undefined
                  }
                  aria-describedby={
                    error &&
                    !signupSuccess &&
                    error === "This Email has already registered!"
                      ? "email-error"
                      : undefined
                  }
                />
                {/* Error message inside the input box, as a floating label */}
                {error &&
                  !signupSuccess &&
                  error === "This Email has already registered!" && (
                    <span
                      id="email-error"
                      style={{
                        color: "#b71c1c",
                        fontWeight: 400,
                        fontSize: "0.98rem",
                        lineHeight: 1.1,
                        margin: 0,
                        padding: 0,
                        position: "absolute",
                        left: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "transparent",
                        textAlign: "left",
                        zIndex: 2,
                        pointerEvents: "none",
                        width: "calc(100% - 20px)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      tabIndex={-1}
                    >
                      {error}
                    </span>
                  )}
              </div>
              <label></label>
            </div>
            <div className="signinup-infield" style={{ marginBottom: "8px" }}>
              <input
                type="password"
                placeholder="Password"
                value={signUpData.password}
                onChange={(e) =>
                  setSignUpData({ ...signUpData, password: e.target.value })
                }
                required
                autoComplete="off"
              />
              <label></label>
            </div>
            <div className="signinup-infield" style={{ marginBottom: "8px" }}>
              <select
                className="signinup-infield-input"
                name="department"
                value={signUpData.department}
                onChange={(e) =>
                  setSignUpData({ ...signUpData, department: e.target.value })
                }
                required
              >
                <option
                  value=""
                  disabled
                  hidden
                  style={{
                    color: "#bdbdbd",
                    fontStyle: "italic",
                    opacity: 0.8,
                  }}
                >
                  Select a department
                </option>
                <option value="CSE">CSE</option>
                <option value="EEE">EEE</option>
                <option value="ME">ME</option>
                <option value="CE">CE</option>
                <option value="WRE">WRE</option>
                <option value="MME">MME</option>
                <option value="ETE">ETE</option>
              </select>
              <label htmlFor="signup-department"></label>
            </div>
            <div className="signinup-infield" style={{ marginBottom: "0px" }}>
              <select
                className="signinup-infield-input"
                name="batch"
                value={signUpData.batch}
                onChange={(e) =>
                  setSignUpData({ ...signUpData, batch: e.target.value })
                }
                required
              >
                <option
                  value=""
                  disabled
                  hidden
                  style={{
                    color: "#f3f3f3",
                    fontStyle: "sans-serif",
                    opacity: 0.4,
                  }}
                >
                  Select batch
                </option>
                <option value="2016">2016</option>
                <option value="2017">2017</option>
                <option value="2018">2018</option>
                <option value="2019">2019</option>
                <option value="2020">2020</option>
                <option value="2021">2021</option>
                <option value="2022">2022</option>
                <option value="2023">2023</option>
              </select>
              <label htmlFor="signup-batch"></label>
            </div>

            <button type="submit" className="signup-submit-btn">
              Sign Up
            </button>
            {/* Success message */}
            {signupSuccess && (
              <div
                className="signup-error-box"
                style={{
                  background: "#eaffea",
                  color: "#1c7b1c",
                  border: "1px solid #bdf7bd",
                  boxShadow: "0 2px 8px #bdf7bd33",
                  marginTop: "12px",
                  marginBottom: "0",
                }}
              >
                Signup successful! Redirecting to homepage...
              </div>
            )}
            {/* Specific email already registered error now shown inside email field above */}
            {/* Other errors, default spacing */}
            {error &&
              !signupSuccess &&
              error !== "This Email has already registered!" && (
                <div
                  style={{
                    color: "#b71c1c",
                    fontWeight: 100,
                    marginTop: "0px",
                    marginBottom: "0px",
                    textAlign: "center",
                    fontSize: "1.1rem",
                    lineHeight: 1.1,
                    padding: 0,
                  }}
                  tabIndex={-1}
                  ref={(el) => {
                    if (el && error && !signupSuccess) {
                      setTimeout(() => {
                        el.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                        el.focus();
                      }, 100);
                    }
                  }}
                >
                  {typeof error === "string" && error.trim() !== ""
                    ? error.split("|").map((msg, idx) => (
                        <span
                          key={idx}
                          style={{
                            display: "block",
                            margin: 0,
                            padding: 0,
                            lineHeight: 1.1,
                          }}
                        >
                          {msg.trim()}
                        </span>
                      ))
                    : null}
                </div>
              )}
          </form>
        </div>
        <div className="signinup-form-container signinup-sign-in-container">
          {showReset ? (
            <form onSubmit={handleResetSubmit}>
              <h1 style={{ marginBottom: "18px" }}>Password Recovery</h1>
              <span style={{ display: "block", marginBottom: "18px" }}>
                Enter your institutional email to receive a reset link.
              </span>
              <div
                className="signinup-infield"
                style={{ marginBottom: "18px" }}
              >
                <input
                  type="email"
                  placeholder="Institutional Email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  autoComplete="off"
                />
                <label></label>
              </div>
              <button
                type="submit"
                style={{ marginBottom: "18px" }}
                disabled={resetLoading}
              >
                {resetLoading ? "Sending..." : "Send Reset Link"}
              </button>
              {resetMsg && (
                <div
                  className="signup-error-box"
                  style={{
                    background: "#eaffea",
                    color: "#1c7b1c",
                    border: "1px solid #bdf7bd",
                    boxShadow: "0 2px 8px #bdf7bd33",
                    marginBottom: "18px",
                  }}
                >
                  {resetMsg}
                </div>
              )}
              {resetError && (
                <div
                  className="signup-error-box"
                  style={{ marginBottom: "18px" }}
                >
                  {resetError}
                </div>
              )}
              <a
                href="#"
                className="forgot"
                style={{ marginBottom: "8px", display: "inline-block" }}
                onClick={(e) => {
                  e.preventDefault();
                  setShowReset(false);
                  setResetMsg("");
                  setResetError("");
                }}
              >
                Back to Sign In
              </a>
            </form>
          ) : (
            <form onSubmit={handleSignIn}>
              <h1>Sign in</h1>
              <div className="signinup-social-container">
                <a href="#" className="social">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a
                  href="http://localhost:8000/accounts/google/login/"
                  className="social"
                >
                  <i className="fab fa-google-plus-g"></i>
                </a>
                <a href="#" className="social">
                  <i className="fab fa-linkedin-in"></i>
                </a>
              </div>
              <span>or use your account</span>
              <div className="signinup-infield">
                <input
                  type="text"
                  placeholder="Username"
                  value={signInData.username}
                  onChange={(e) =>
                    setSignInData({ ...signInData, username: e.target.value })
                  }
                  required
                  autoComplete="off"
                />
                <label></label>
              </div>
              <div className="signinup-infield">
                <input
                  type="password"
                  placeholder="Password"
                  value={signInData.password}
                  onChange={(e) =>
                    setSignInData({ ...signInData, password: e.target.value })
                  }
                  required
                  autoComplete="off"
                />
                <label></label>
              </div>
              <a
                href="#"
                className="forgot"
                onClick={(e) => {
                  e.preventDefault();
                  setShowReset(true);
                  setError("");
                }}
              >
                Forgot your password?
              </a>
              <button type="submit">Sign In</button>
              {error && <p className="error">{error}</p>}
            </form>
          )}
        </div>
        <div className="signinup-overlay-container">
          <div className="signinup-overlay">
            <div className="signinup-overlay-panel signinup-overlay-left">
              <h1>Welcome Back!</h1>
              <p>
                To keep connected with us please login with your personal info
              </p>
              <button className="ghost" onClick={togglePanel}>
                Sign In
              </button>
              <div className="back-to-home">
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/");
                  }}
                >
                  Back to Homepage →
                </a>
              </div>
            </div>
            <div className="signinup-overlay-panel signinup-overlay-right">
              <h1>Hello, Friend!</h1>
              <p>Enter your personal details and start journey with us</p>
              <button className="ghost" onClick={togglePanel}>
                Sign Up
              </button>
              <div className="back-to-home">
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/");
                  }}
                >
                  Back to Homepage →
                </a>
              </div>
            </div>
          </div>
          <button id="overlayBtn" style={{ display: "none" }}></button>
        </div>
      </div>
    </div>
  );
}
