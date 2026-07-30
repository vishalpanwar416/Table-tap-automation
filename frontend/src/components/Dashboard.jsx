import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, Clock, Send } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5001/api/admin';

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Initial fetch
    fetchEvents(true);

    // Real-time polling interval every 3 seconds
    const interval = setInterval(() => {
      fetchEvents(false);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const fetchEvents = async (showInitialLoading = false) => {
    if (showInitialLoading) setLoading(true);
    setIsRefreshing(true);
    try {
      const { data } = await axios.get(`${API_URL}/events`);
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch events', err);
    } finally {
      if (showInitialLoading) setLoading(false);
      setIsRefreshing(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Activity Feed</h1>
          <p className="page-subtitle">Live real-time view of Instagram comment triggers and DM automations.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
            Real-time Sync Active
          </span>
          <button className="btn btn-outline" onClick={() => fetchEvents(false)} disabled={isRefreshing}>
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
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
                </tr>
              ))}
              {events.length === 0 && !loading && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>
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
