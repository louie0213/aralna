import { useEffect, useState } from 'react';
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
    <>
      <h1>Users</h1>
      {error && <div className="alert" role="alert">{error}</div>}
      <div className="toolbar">
        <input type="search" placeholder="Search name or email" aria-label="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="Filter by role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="admin">Admins</option>
        </select>
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any status</option>
          <option value="active">Enabled</option>
          <option value="disabled">Disabled</option>
        </select>
        <span className="count">{users.length} found</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last active</th><th></th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="6">Loading...</td></tr>}
            {!loading && users.length === 0 && <tr><td colSpan="6">No accounts match these filters.</td></tr>}
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.fullName}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td><span className={u.isActive ? 'badge' : 'badge badge-off'}>{u.isActive ? 'Enabled' : 'Disabled'}</span></td>
                <td>{fmt(u.lastActiveAt)}</td>
                <td>
                  <button className="btn btn-ghost" disabled={u.id === me.id} onClick={() => toggle(u)}>
                    {u.isActive ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
