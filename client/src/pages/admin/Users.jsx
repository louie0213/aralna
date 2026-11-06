import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../AuthContext.jsx';
import { api } from '../../api.js';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { Reveal } from '../../components/motion';
import { stagger } from '../../lib/motion.js';

const fmt = (d) => (d ? new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Never');

export default function Users() {
  const { user: me } = useAuth();
  const isSuperAdmin = Boolean(me?.isSuperAdmin);
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

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

  function requestSuspend(u) {
    setConfirmAction({
      type: 'suspend',
      user: u,
      title: `Suspend ${u.fullName}?`,
      message: 'They will be logged out and cannot log in until you restore the account.',
      confirmLabel: 'Suspend',
    });
  }

  function requestDelete(u) {
    setConfirmAction({
      type: 'delete',
      user: u,
      title: `Delete ${u.fullName}?`,
      message: `Permanently delete ${u.email} and all of their learning data? This cannot be undone.`,
      confirmLabel: 'Delete account',
    });
  }

  async function toggleStatus(u) {
    setError('');
    setBusyUserId(u.id);
    try {
      const { user } = await api.patch(`/admin/users/${u.id}/active`, { isActive: !u.isActive });
      setUsers((list) => list.map((x) => (x.id === user.id ? user : x)));
      setConfirmAction(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyUserId('');
    }
  }

  async function deleteAccount(u) {
    setError('');
    setBusyUserId(u.id);
    try {
      await api.delete(`/admin/users/${u.id}`);
      setUsers((list) => list.filter((x) => x.id !== u.id));
      setConfirmAction(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyUserId('');
    }
  }

  async function handleConfirm() {
    if (!confirmAction) return;
    if (confirmAction.type === 'suspend') await toggleStatus(confirmAction.user);
    else await deleteAccount(confirmAction.user);
  }

  return (
    <div className="users-page">
      <Reveal as="header" className="page-heading" variant="fadeUp" immediate>
        <div>
          <p className="page-eyebrow">ADMIN WORKSPACE / DIRECTORY</p>
          <h1>Users</h1>
          <p className="page-description">
            {isSuperAdmin ? 'Manage access, suspend accounts, or permanently delete them.' : 'Monitor account status and activity.'}
          </p>
        </div>
        {isSuperAdmin && (
          <Link className="btn btn-primary page-heading-action" to="/admin/admins/new">Add admin <span aria-hidden="true">↗</span></Link>
        )}
      </Reveal>
      {error && <div className="alert" role="alert">{error}</div>}
      <Reveal className="users-toolbar" variant="fadeUp" delay={stagger.tight} immediate>
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
          <option value="disabled">Suspended</option>
        </select>
        <span className="results-count">{loading ? 'Updating...' : `${users.length} ${users.length === 1 ? 'account' : 'accounts'}`}</span>
      </Reveal>
      <Reveal className="table-wrap users-table-wrap" variant="fadeUp" delay={stagger.base} immediate>
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last active</th>
              {isSuperAdmin && <th>Account access</th>}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="table-message" colSpan={isSuperAdmin ? 6 : 5}>Loading accounts...</td></tr>}
            {!loading && users.length === 0 && <tr><td className="table-message" colSpan={isSuperAdmin ? 6 : 5}>No accounts match these filters.</td></tr>}
            {users.map((u) => (
              <tr key={u.id}>
                <td data-label="Name"><span className="user-name">{u.fullName}</span></td>
                <td data-label="Email" className="user-email">{u.email}</td>
                <td data-label="Role"><span className="role-label">{u.isSuperAdmin ? 'Super admin' : u.role}</span></td>
                <td data-label="Status"><span className={u.isActive ? 'badge badge-on' : 'badge badge-off'}>{u.isActive ? 'Enabled' : 'Suspended'}</span></td>
                <td data-label="Last active" className="last-active">{fmt(u.lastActiveAt)}</td>
                {isSuperAdmin && (
                  <td data-label="Account access" className="user-action-cell">
                    {u.isSuperAdmin || u.id === me.id ? (
                      <button className="btn btn-ghost user-action" disabled aria-label={u.isSuperAdmin ? 'Super admin account is protected' : 'Your own account'}>
                        {u.isSuperAdmin ? 'Protected' : 'You'}
                      </button>
                    ) : (
                      <>
                        <button className="btn btn-ghost user-action" disabled={busyUserId === u.id} onClick={() => (u.isActive ? requestSuspend(u) : toggleStatus(u))} aria-label={`${u.isActive ? 'Suspend' : 'Restore'} ${u.fullName}`}>
                          {busyUserId === u.id ? 'Saving...' : u.isActive ? 'Suspend' : 'Restore'}
                        </button>
                        <button className="btn btn-ghost user-action user-delete-action" disabled={busyUserId === u.id} onClick={() => requestDelete(u)} aria-label={`Permanently delete ${u.fullName}`}>
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Reveal>
      <ConfirmDialog
        open={Boolean(confirmAction)}
        eyebrow="ACCOUNT ACCESS"
        title={confirmAction?.title || 'Confirm'}
        message={confirmAction?.message}
        confirmLabel={confirmAction?.confirmLabel || 'Confirm'}
        busy={Boolean(busyUserId)}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
