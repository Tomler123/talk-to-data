import { useEffect, useState } from 'react';
import axios from '../api/axios';
import './AdminUsers.css';

interface User {
  id: number;
  username: string;
  role: string;
}

const PAGE_SIZE = 50;
const ALLOWED_ROLES = ['admin', 'data analyst', 'business user', 'viewer'];

export default function AdminUsers() {
  const [users, setUsers]             = useState<User[]>([]);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [loading, setLoading]         = useState(false);
  const [savingId, setSavingId]       = useState<number | null>(null);
  const [deletingId, setDeletingId]   = useState<number | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [draftRoles, setDraftRoles]   = useState<Record<number, string>>({});

  const [filterId, setFilterId]           = useState<string>('');
  const [filterUsername, setFilterUsername] = useState<string>('');
  const [filterRole, setFilterRole]       = useState<string>('');
  
  interface UserFilters {
    id?: string;
    username?: string;
    role?: string;
  }

  const fetchUsers = async (
    pageNum = 1,
    filters: UserFilters = {}
  ) => {
    setLoading(true);
    try {
      const params = {
        page:     pageNum,
        per_page: PAGE_SIZE,
        ...filters
      };
      const { data } = await axios.get('/admin/users', { params });
      setUsers(data.users);
      setPage(data.page);
      setTotalPages(data.pages);

      // reset draftRoles for any new page
      const initial: Record<number, string> = {};
      data.users.forEach((u: User) => { initial[u.id] = u.role; });
      setDraftRoles(initial);
    } catch {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (id: number, newRole: string) => {
    setDraftRoles(dr => ({ ...dr, [id]: newRole }));
  };

  const handleUpdate = async (user: User) => {
    const newRole = draftRoles[user.id];
    setSavingId(user.id);
    setError(null);

    try {
      await axios.patch(`/admin/users/${user.id}`, { role: newRole });
      setUsers(us =>
        us.map(u => u.id === user.id ? { ...u, role: newRole } : u)
      );
    } catch {
      setError(`Failed to update ${user.username}`);
      setDraftRoles(dr => ({ ...dr, [user.id]: user.role }));
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (user: User) => {
    const ok = window.confirm(
      `Are you sure you want to delete "${user.username}" from the database?`
    );
    if (!ok) return;

    setDeletingId(user.id);
    setError(null);

    try {
      await axios.delete(`/admin/users/${user.id}`);
      // remove from UI
      setUsers(us => us.filter(u => u.id !== user.id));
    } catch {
      setError(`Failed to delete ${user.username}`);
    } finally {
      setDeletingId(null);
    }
  };

  const onSearch = () => {
    fetchUsers(1, {
      id:       filterId,
      username: filterUsername,
      role:     filterRole
    });
  };
  
  useEffect(() => { fetchUsers(1); }, []);

  return (
    <div className="users-wrapper">
      <div className="users-container">
        <h2 className="users-title">User Management</h2>
        {error && <div className="error-banner">{error}</div>}
        <div className="filter-bar">
          <input
            type="text"
            placeholder="ID"
            value={filterId}
            onChange={e => setFilterId(e.target.value)}
          />
          <input
            type="text"
            placeholder="Username"
            value={filterUsername}
            onChange={e => setFilterUsername(e.target.value)}
          />
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
          >
            <option value="">All Roles</option>
            {ALLOWED_ROLES.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <button
            className="users-btn search-btn"
            onClick={onSearch}
            disabled={loading}
          >
            Search
          </button>
        </div>
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead className="users-table-header">
              <tr>
                <th className="users-cell">ID</th>
                <th className="users-cell">Username</th>
                <th className="users-cell">Role</th>
                <th className="users-cell">Actions</th>
                <th className="users-cell">Delete</th>
              </tr>
            </thead>
            <tbody className="users-table-body">
              {users.map(user => {
                const draft = draftRoles[user.id] ?? user.role;
                const changed = draft !== user.role;
                return (
                  <tr key={user.id} className="users-row">
                    <td className="users-cell">{user.id}</td>
                    <td className="users-cell">{user.username}</td>
                    <td className="users-cell">
                      <select
                        className="users-select"
                        value={draft}
                        onChange={e => handleRoleChange(user.id, e.target.value)}
                        disabled={savingId === user.id || deletingId === user.id}
                      >
                        {ALLOWED_ROLES.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </td>
                    <td className="users-cell">
                      {changed && (
                        <button
                          className="users-btn update-btn"
                          onClick={() => handleUpdate(user)}
                          disabled={savingId === user.id || deletingId === user.id}
                        >
                          {savingId === user.id ? 'Saving…' : 'Update'}
                        </button>
                      )}
                    </td>
                    <td className="users-cell">
                      <button
                        className="users-btn delete-btn"
                        onClick={() => handleDelete(user)}
                        disabled={savingId === user.id || deletingId === user.id}
                      >
                        {deletingId === user.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="users-pagination">
          <button
            className="users-btn prev-btn"
            onClick={() => fetchUsers(page - 1, {
                            id:       filterId,
                            username: filterUsername,
                            role:     filterRole
                          })}
            disabled={page <= 1 || loading}
          >
            Previous
          </button>
          <span className="users-page-info">
            Page {page} of {totalPages}
          </span>
          <button
            className="users-btn next-btn"
            onClick={() => fetchUsers(page + 1, {
                            id:       filterId,
                            username: filterUsername,
                            role:     filterRole
                          })}
            disabled={page >= totalPages || loading}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
