import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, Clock, Send, UserCheck, UserX } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV
  ? 'http://localhost:5001/api/admin'
  : 'https://table-tap-automation.onrender.com/api/admin');

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchEvents(true);

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
          <p className="page-subtitle">Live real-time view of Instagram comment triggers and follower conversions.</p>
        </div>
        <div>
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
                <th>Follower Status</th>
                <th>Automation Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev._id}>
                  <td style={{ fontWeight: 500 }}>@{ev.username}</td>
                  <td>"{ev.commentText}"</td>
                  <td>
                    {ev.isFollowing ? (
                      <span className="badge completed" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        <UserCheck size={12} style={{ marginRight: 4 }}/>
                        Following
                      </span>
                    ) : (
                      <span className="badge awaiting_follow" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                        <UserX size={12} style={{ marginRight: 4 }}/>
                        Not Following
                      </span>
                    )}
                  </td>
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
