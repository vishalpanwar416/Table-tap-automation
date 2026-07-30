export function getEventAnalytics(events) {
  const followerEvents = events.filter((event) => event.isFollowing);
  const followers = [...new Map(followerEvents.map((event) => [event.instagramUserId, event])).values()]
    .sort((a, b) => new Date(b.followedAt || b.updatedAt) - new Date(a.followedAt || a.updatedAt));

  const postsById = events.reduce((groups, event) => {
    const id = event.mediaId || 'unknown';
    const post = groups[id] || { id, comments: 0, followers: 0 };
    post.comments += 1;
    post.followers += Number(event.isFollowing);
    groups[id] = post;
    return groups;
  }, {});

  const posts = Object.values(postsById).sort((a, b) => b.comments - a.comments);
  return {
    followers,
    posts,
    conversion: events.length ? Math.round((followers.length / events.length) * 100) : 0
  };
}
