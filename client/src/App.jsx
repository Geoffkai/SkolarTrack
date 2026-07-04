import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Login from './pages/Login'
import EditScholarship from './pages/EditScholarship'
import AdminDashboard from './pages/AdminDashboard'
import MyTracker from './pages/MyTracker'
import NewScholarship from './pages/NewScholarship'
import Register from './pages/Register'
import ScholarshipDetail from './pages/ScholarshipDetail'
import Scholarships from './pages/Scholarships'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />}/>
        <Route path="/login" element={<Login />}/>
        <Route path="/scholarships" element={<Scholarships />}/>
        <Route path="/scholarships/:id" element={<ScholarshipDetail />}/>
        <Route path="/my-tracker" element={<MyTracker />}/>
        <Route path="/admin/dashboard" element={<AdminDashboard />}/>
        <Route path="/admin/scholarships/new" element={<NewScholarship />}/>
        <Route path="/admin/scholarships/:id/edit" element={<EditScholarship />}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
