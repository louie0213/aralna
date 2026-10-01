import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import StudentLayout from './components/StudentLayout.jsx';
import StudentHome from './pages/StudentHome.jsx';
import Upload from './pages/Upload.jsx';
import Reviewers from './pages/Reviewers.jsx';
import Reviewer from './pages/Reviewer.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import Overview from './pages/admin/Overview.jsx';
import Users from './pages/admin/Users.jsx';
import AddAdmin from './pages/admin/AddAdmin.jsx';

const homeFor = (user) => (user.role === 'admin' ? '/admin' : '/app');

function Guarded({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="page-status">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={homeFor(user)} replace />;
  return children;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="page-status">Loading...</p>;
  if (user) return <Navigate to={homeFor(user)} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
      <Route path="/app" element={<Guarded role="student"><StudentLayout /></Guarded>}>
        <Route index element={<StudentHome />} />
        <Route path="upload" element={<Upload />} />
        <Route path="reviewers" element={<Reviewers />} />
        <Route path="reviewers/:id" element={<Reviewer />} />
      </Route>
      <Route path="/admin" element={<Guarded role="admin"><AdminLayout /></Guarded>}>
        <Route index element={<Overview />} />
        <Route path="users" element={<Users />} />
        <Route path="admins/new" element={<AddAdmin />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
