import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../AuthContext.jsx';
import { api } from '../../api.js';

const fmt = (d) => (d ? new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Never');

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setSearch(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (status) params.set('status', status);
    if (search) params.set('q', search);
    api
      .get(`/admin/users?${params}`)
      .then((d) => { setUsers(d.users); setError(''); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [role, status, search]);

  async function toggle(u) {
    if (u.isActive && !window.confirm(`Disable ${u.fullName}? They will be logged out and cannot log in until you enable the account again.`)) return;
    setError('');
    try {
      const { user } = await api.patch(`/admin/users/${u.id}/active`, { isActive: !u.isActive });
      setUsers((list) => list.map((x) => (x.id === user.id ? user : x)));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="users-page">
      <header className="page-heading">
        <div>
          <p className="page-eyebrow">ADMIN WORKSPACE / DIRECTORY</p>
          <h1>Users</h1>
          <p className="page-description">Manage access and review account activity.</p>
        </div>
        <Link className="btn btn-primary page-heading-action" to="/admin/admins/new">Add admin <span aria-hidden="true">↗</span></Link>
      </header>
      {error && <div className="alert" role="alert">{error}</div>}
      <div className="users-toolbar">
        <label className="user-search">
          <span aria-hidden="true">⌕</span>
          <input type="search" placeholder="Search by name or email" aria-label="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <select className="user-filter" aria-label="Filter by role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="admin">Admins</option>
        </select>
        <select className="user-filter" aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any status</option>
          <option value="active">Enabled</option>
          <option value="disabled">Disabled</option>
        </select>
        <span className="results-count">{loading ? 'Updating...' : `${users.length} ${users.length === 1 ? 'account' : 'accounts'}`}</span>
      </div>
      <div className="table-wrap users-table-wrap">
        <table className="users-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last active</th><th></th></tr>
          </thead>
          <tbody>
            {loading && <tr><td className="table-message" colSpan="6">Loading accounts...</td></tr>}
            {!loading && users.length === 0 && <tr><td className="table-message" colSpan="6">No accounts match these filters.</td></tr>}
            {users.map((u) => (
              <tr key={u.id}>
                <td data-label="Name"><span className="user-name">{u.fullName}</span></td>
                <td data-label="Email" className="user-email">{u.email}</td>
                <td data-label="Role"><span className="role-label">{u.role}</span></td>
                <td data-label="Status"><span className={u.isActive ? 'badge badge-on' : 'badge badge-off'}>{u.isActive ? 'Enabled' : 'Disabled'}</span></td>
                <td data-label="Last active" className="last-active">{fmt(u.lastActiveAt)}</td>
                <td data-label="Account access" className="user-action-cell">
                  <button className="btn btn-ghost user-action" disabled={u.id === me.id} onClick={() => toggle(u)} aria-label={`${u.isActive ? 'Disable' : 'Enable'} ${u.fullName}`}>
                    {u.id === me.id ? 'You' : u.isActive ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
