import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, Clock, Send } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5001/api/admin';

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/events`);
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch events', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async (id) => {
    try {
      await axios.put(`${API_URL}/events/${id}`, { status: 'completed' });
      setEvents(events.map(ev => ev._id === id ? { ...ev, status: 'completed' } : ev));
    } catch (err) {
      console.error('Failed to override status', err);
    }
  };

  return (
    <div className="dashboard">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Activity Feed</h1>
          <p className="page-subtitle">Live view of Instagram comment triggers and DM automations.</p>
        </div>
        <button className="btn btn-outline" onClick={fetchEvents} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Comment</th>
                <th>Status</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev._id}>
                  <td style={{ fontWeight: 500 }}>@{ev.username}</td>
                  <td>"{ev.commentText}"</td>
                  <td>
                    <span className={`badge ${ev.status}`}>
                      {ev.status === 'completed' && <CheckCircle size={12} style={{ marginRight: 4 }}/>}
                      {ev.status === 'pending' && <Clock size={12} style={{ marginRight: 4 }}/>}
                      {ev.status === 'dm_sent' && <Send size={12} style={{ marginRight: 4 }}/>}
                      {ev.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {new Date(ev.createdAt).toLocaleString()}
                  </td>
                  <td>
                    {ev.status !== 'completed' && (
                      <button className="btn btn-outline btn-sm" onClick={() => handleOverride(ev._id)}>
                        Mark Followed
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>
                    No events captured yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
