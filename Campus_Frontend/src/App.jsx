import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Homepage from "./component/Homepage";
import SignInUp from "./component/SignInUp";
import Notes from "./component/Notes";
import Events from "./component/Events";
import Clubs from "./component/Clubs";
import Notifications from "./component/Notifications";
import Dashboard from "./component/Dashboard";
import UploadNotes from "./component/UploadNotes";
import PasswordResetConfirm from "./component/PasswordResetConfirm";
import "./App.css";
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/SignInUp" element={<SignInUp />} />
        <Route path="/login" element={<SignInUp />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/events" element={<Events />} />
        <Route path="/clubs" element={<Clubs />} />
        <Route path="/notification" element={<Notifications />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload-notes" element={<UploadNotes />} />
        {/* Password reset confirm routes: support both with and without trailing slash */}
        <Route
          path="/password-reset-confirm/:uid/:token"
          element={<PasswordResetConfirm />}
        />
        <Route
          path="/password-reset-confirm/:uid/:token/"
          element={<PasswordResetConfirm />}
        />
        {/* Also support the dj-rest-auth default route for compatibility */}
        <Route
          path="/password/reset/confirm/:uid/:token"
          element={<PasswordResetConfirm />}
        />
      </Routes>
    </Router>
  );
}
