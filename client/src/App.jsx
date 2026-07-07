import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import EditScholarship from "./pages/EditScholarship";
import AdminDashboard from "./pages/AdminDashboard";
import MyTracker from "./pages/MyTracker";
import NewScholarship from "./pages/NewScholarship";
import Register from "./pages/Register";
import ScholarshipDetail from "./pages/ScholarshipDetail";
import Scholarships from "./pages/Scholarships";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/scholarships">Browse Scholarships</Link>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </nav>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/scholarships" element={<Scholarships />} />
        <Route path="/scholarships/:id" element={<ScholarshipDetail />} />
        <Route
          path="/my-tracker"
          element={
            <ProtectedRoute requiredRole="student">
              <MyTracker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/scholarships/new"
          element={
            <ProtectedRoute requiredRole="admin">
              <NewScholarship />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/scholarships/:id/edit"
          element={
            <ProtectedRoute requiredRole="admin">
              <EditScholarship />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
