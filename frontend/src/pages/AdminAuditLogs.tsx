import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import './AdminAuditLogs.css';

interface AuditLog {
  id: number;
  user_id: number | null;
  username?: string | null;
  action: string;
  timestamp: string;
  details: Record<string, any>;
}

const PAGE_SIZE = 25;

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [filterId, setFilterId] = useState<string>('');
  const [filterUserId, setFilterUserId] = useState<string>('');
  const [filterUsername, setFilterUsername] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('');

  interface Filters {
    id?: string;
    user_id?: string;
    username?: string;
    action?: string;
  }

  const fetchLogs = async (
    pageNum = 1,
    filters: Filters = {}
  ) => {
    setLoading(true);
    try {
      const params = {
        page:     pageNum,
        per_page: PAGE_SIZE,
        ...filters
      };
      const { data } = await axios.get('/admin/audit-logs', { params });
      setLogs(data.logs);
      setTotalPages(data.pages);
      setPage(data.page);
    } catch (err) {
      console.error('Failed fetching logs', err);
    } finally {
      setLoading(false);
    }
  };
  
  const onSearch = () => {
    fetchLogs(1, {
      id:       filterId,
      user_id:  filterUserId,
      username: filterUsername,
      action:   filterAction
    });
  };

  useEffect(() => { fetchLogs(1); }, []);

  return (
    <div className="audit-wrapper">
      <div className="audit-container">
        <h2 className="audit-title">Audit Logs</h2>
        <div className="filter-bar">
          <input
            type="text"
            placeholder="ID"
            value={filterId}
            onChange={e => setFilterId(e.target.value)}
          />
          <input
            type="text"
            placeholder="User ID"
            value={filterUserId}
            onChange={e => setFilterUserId(e.target.value)}
          />
          <input
            type="text"
            placeholder="Username"
            value={filterUsername}
            onChange={e => setFilterUsername(e.target.value)}
          />
          <input
            type="text"
            placeholder="Action"
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
          />
          <button
            className="audit-btn search-btn"
            onClick={onSearch}
            disabled={loading}
          >
            Search
          </button>
        </div>
        <div className="audit-table-wrapper">
          <table className="audit-table">
            <thead className="audit-table-header">
              <tr>
                <th className="audit-cell">ID</th>
                <th className="audit-cell">User ID</th>
                <th className="audit-cell">Username</th>
                <th className="audit-cell">Action</th>
                <th className="audit-cell">Timestamp</th>
                <th className="audit-cell">Details</th>
              </tr>
            </thead>
            <tbody className="audit-table-body">
              {logs.map(log => (
                <tr key={log.id} className="audit-row">
                  <td className="audit-cell">{log.id}</td>
                  <td className="audit-cell">{log.user_id ?? '-'}</td>
                  <td className="audit-cell">{log.username ?? '-'}</td>
                  <td className="audit-cell">{log.action}</td>
                  <td className="audit-cell">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="audit-cell details-cell">
                    <pre>{JSON.stringify(log.details, null, 2)}</pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="audit-pagination">
          <button
            className="audit-btn prev-btn"
            onClick={() => fetchLogs(page - 1, {
              id:       filterId,
              user_id:  filterUserId,
              username: filterUsername,
              action:   filterAction
            })}
            disabled={page <= 1 || loading}
          >
            Previous
          </button>
          <span className="audit-page-info">
            Page {page} of {totalPages}
          </span>
          <button
            className="audit-btn next-btn"
            onClick={() => fetchLogs(page + 1, {
              id:       filterId,
              user_id:  filterUserId,
              username: filterUsername,
              action:   filterAction
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
