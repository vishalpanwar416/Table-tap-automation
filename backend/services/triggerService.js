class TriggerService {
  matches(commentText, config) {
    if (config.triggerMode === 'any') return true;

    const comment = (commentText || '').toLowerCase();
    const keywords = (config.keywords || '')
      .split(',')
      .map((keyword) => keyword.trim().toLowerCase())
      .filter(Boolean);

    return keywords.some((keyword) => comment.includes(keyword));
  }
}

module.exports = TriggerService;
