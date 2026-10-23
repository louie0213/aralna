import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
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
import Files from './pages/admin/Files.jsx';
import AddAdmin from './pages/admin/AddAdmin.jsx';
import AdminQuizzes from './pages/admin/Quizzes.jsx';
import Quizzes from './pages/Quizzes.jsx';
import Quiz from './pages/Quiz.jsx';
import Landing from './pages/Landing.jsx';
import RouteTransition from './components/RouteTransition.jsx';
import { Analytics } from '@vercel/analytics/react';

const homeFor = (user) => (user.role === 'admin' ? '/admin' : '/app');

function Guarded({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="page-status">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  const allowedRoles = Array.isArray(role) ? role : [role];
  if (!allowedRoles.includes(user.role)) return <Navigate to={homeFor(user)} replace />;
  return children;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="page-status">Loading...</p>;
  if (user) return <Navigate to={homeFor(user)} replace />;
  return children;
}

function SuperAdminOnly({ children }) {
  const { user } = useAuth();
  if (!user?.isSuperAdmin) return <Navigate to="/admin/users" replace />;
  return children;
}

function QuizFocusGuard({ children }) {
  const { user, activeQuizId } = useAuth();
  const location = useLocation();
  const quizPath = activeQuizId ? `/app/quizzes/${activeQuizId}` : '';

  if (user?.role === 'student' && activeQuizId && location.pathname !== quizPath) {
    return <Navigate to={quizPath} replace state={{ quizNavigationBlocked: true }} />;
  }
  return children;
}

export default function App() {
  return (
    <QuizFocusGuard>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
        <Route path="/app" element={<Guarded role={['student', 'admin']}><StudentLayout /></Guarded>}>
          <Route element={<RouteTransition />}>
            <Route index element={<StudentHome />} />
            <Route path="upload" element={<Upload />} />
            <Route path="reviewers" element={<Reviewers />} />
            <Route path="reviewers/:id" element={<Reviewer />} />
            <Route path="quizzes" element={<Quizzes />} />
            <Route path="quizzes/:id" element={<Quiz />} />
          </Route>
        </Route>
        <Route path="/admin" element={<Guarded role="admin"><AdminLayout /></Guarded>}>
          <Route element={<RouteTransition />}>
            <Route index element={<Overview />} />
            <Route path="users" element={<Users />} />
            <Route path="files" element={<Files />} />
            <Route path="quizzes" element={<AdminQuizzes />} />
            <Route path="admins/new" element={<SuperAdminOnly><AddAdmin /></SuperAdminOnly>} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Analytics />
    </QuizFocusGuard>
  );
}
