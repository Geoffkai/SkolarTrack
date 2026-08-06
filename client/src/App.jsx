import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import EditScholarship from "./pages/EditScholarship";
import AdminDashboard from "./pages/AdminDashboard";
import MyTracker from "./pages/MyTracker";
import NewScholarship from "./pages/NewScholarship";
import Register from "./pages/Register";
import ScholarshipDetail from "./pages/ScholarshipDetail";
import Scholarships from "./pages/Scholarships";
import PublicBrowse from "./pages/PublicBrowse";
import AdminApplicants from "./pages/AdminApplicants";
import ProtectedRoute from "./components/ProtectedRoute";
import Nav from "./components/Nav";
import Sidebar from "./components/Sidebar";
import { useAuth } from "./context/AuthContext";

function App() {
  const { token } = useAuth();
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <Nav />
          <Routes>
            <Route path="/" element={<PublicBrowse />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/scholarships"
              element={token ? <Scholarships /> : <PublicBrowse />}
            />
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
              path="/admin/scholarships/:id/applicants"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminApplicants />
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
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
