import React from 'react';
import { CheckCircle, Clock, Send, UserCheck, UserX, MessageCircle } from 'lucide-react';
import { useEvents } from '../hooks/useEvents';

const Activity = () => {
  const { events, loading } = useEvents();

  return <div className="activity-page">
    <div className="page-header"><div><h1 className="page-title">Activity</h1></div></div>
    <section className="glass-panel activity-panel">
      <div className="table-heading"><h2>Recent activity</h2><span>{loading ? 'Loading…' : `${events.length} events`}</span></div>
      <div className="table-container"><table><thead><tr><th>User</th><th>Comment</th><th>Follower status</th><th>Automation status</th><th>Time</th></tr></thead>
        <tbody>{events.map((ev) => <tr key={ev._id}>
          <td><div className="user-cell"><span className="avatar">{(ev.username || '?').slice(0, 2).toUpperCase()}</span>@{ev.username}</div></td>
          <td><div className="comment-cell">“{ev.commentText}”</div></td>
          <td>{ev.isFollowing ? <span className="badge completed"><UserCheck size={12}/>Following</span> : <span className="badge awaiting_follow"><UserX size={12}/>Not following</span>}</td>
          <td><span className={`badge ${ev.status}`}>{ev.status === 'completed' && <CheckCircle size={12}/>} {ev.status === 'pending' && <Clock size={12}/>} {ev.status === 'dm_sent' && <Send size={12}/>} {ev.status.replace('_', ' ')}</span></td>
          <td className="time-cell">{new Date(ev.createdAt).toLocaleString()}</td>
        </tr>)}
        {events.length === 0 && !loading && <tr><td colSpan="5" className="empty-state"><div className="empty-icon"><MessageCircle size={18}/></div>No comment activity yet.</td></tr>}</tbody>
      </table></div>
    </section>
  </div>;
};

export default Activity;
