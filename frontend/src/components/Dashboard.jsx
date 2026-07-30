import React, { useMemo } from 'react';
import { UserCheck, UserX, MessageCircle, UserPlus, ChartNoAxesCombined, Images } from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import { getEventAnalytics } from '../utils/eventAnalytics';

const Dashboard = () => {
  const { events, loading } = useEvents();
  const analytics = useMemo(() => getEventAnalytics(events), [events]);

  return <div className="dashboard">
    <div className="page-header"><div><h1 className="page-title">Dashboard</h1></div></div>

    <section className="metric-grid" aria-label="Analytics overview">
      <div className="metric-card"><span className="metric-icon comments"><MessageCircle size={19}/></span><div><p>Comments</p><strong>{events.length}</strong></div></div>
      <div className="metric-card"><span className="metric-icon followers"><UserPlus size={19}/></span><div><p>New followers</p><strong>+{analytics.followers.length}</strong></div></div>
      <div className="metric-card"><span className="metric-icon conversion"><ChartNoAxesCombined size={19}/></span><div><p>Follow conversion</p><strong>{analytics.conversion}%</strong></div></div>
      <div className="metric-card"><span className="metric-icon posts"><Images size={19}/></span><div><p>Posts with comments</p><strong>{analytics.posts.length}</strong></div></div>
    </section>

    <section className="dashboard-grid">
      <div className="glass-panel dashboard-panel">
        <div className="table-heading"><h2>New followers</h2><span>{analytics.followers.length} total</span></div>
        <div className="follower-list">
          {analytics.followers.slice(0, 6).map((event) => <div className="follower-row" key={event._id}>
            <span className="avatar">{(event.username || '?').slice(0, 2).toUpperCase()}</span>
            <div><strong>@{event.username}</strong><span>{new Date(event.followedAt || event.updatedAt).toLocaleDateString()}</span></div>
            <UserCheck size={16}/>
          </div>)}
          {!loading && analytics.followers.length === 0 && <div className="panel-empty">No new followers yet.</div>}
        </div>
      </div>

      <div className="glass-panel dashboard-panel">
        <div className="table-heading"><h2>Comments by post</h2><span>{analytics.posts.length} posts</span></div>
        <div className="post-list">
          {analytics.posts.slice(0, 6).map((post) => <div className="post-row" key={post.id}>
            <div className="post-id"><Images size={16}/><span>Post {post.id.slice(-6)}</span></div>
            <div className="post-count"><strong>{post.comments}</strong><span>comments</span></div>
            <div className="post-bar"><span style={{ width: `${Math.max(8, (post.comments / (analytics.posts[0]?.comments || 1)) * 100)}%` }}/></div>
          </div>)}
          {!loading && analytics.posts.length === 0 && <div className="panel-empty">No post activity yet.</div>}
        </div>
      </div>
    </section>

    <section className="glass-panel activity-panel">
      <div className="table-heading"><h2>Recent comments</h2><span>{loading ? 'Loading…' : `${events.length} events`}</span></div>
      <div className="table-container"><table><thead><tr><th>User</th><th>Comment</th><th>Follower status</th><th>Time</th></tr></thead>
        <tbody>{events.map((ev) => <tr key={ev._id}>
          <td><div className="user-cell"><span className="avatar">{(ev.username || '?').slice(0, 2).toUpperCase()}</span>@{ev.username}</div></td>
          <td><div className="comment-cell">“{ev.commentText}”</div></td>
          <td>{ev.isFollowing ? <span className="badge completed"><UserCheck size={12}/>Following</span> : <span className="badge awaiting_follow"><UserX size={12}/>Not following</span>}</td>
          <td className="time-cell">{new Date(ev.createdAt).toLocaleString()}</td>
        </tr>)}
        {events.length === 0 && !loading && <tr><td colSpan="4" className="empty-state"><div className="empty-icon"><MessageCircle size={18}/></div>No comment activity yet.</td></tr>}</tbody>
      </table></div>
    </section>
  </div>;
};

export default Dashboard;
