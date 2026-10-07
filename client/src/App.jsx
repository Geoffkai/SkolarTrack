import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";
import Logout from "./pages/Logout";
import ProtectedRoute from "./components/ProtectedRoute";
import Nav from "./components/Nav";
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";
import { useAuth } from "./context/useAuth";
import Home from "./components/Home";

function App() {
  const { token } = useAuth();

  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 min-w-0">
          {/* exactly one of these two renders: Nav when logged out, MobileNav when logged in */}
          <Nav />
          <MobileNav />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/logout" element={<Logout />} />
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
              {/* must stay last: "*" matches anything the routes above didn't */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
