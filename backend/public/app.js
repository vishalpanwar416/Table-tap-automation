const $ = (selector) => document.querySelector(selector);
const api = '/api/admin';

function initials(name = '?') { return name.replace(/^@/, '').slice(0, 2).toUpperCase(); }
function relativeDate(value) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value)) / 1000));
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2800); }
function setMetric(id, count, caption) { $(`#${id}`).textContent = count; $(`#${id.replace('-count', '-caption')}`).textContent = caption; }

async function loadEvents() {
  const response = await fetch(`${api}/events`);
  if (!response.ok) throw new Error('Could not load recent activity');
  const events = await response.json();
  const completed = events.filter(({ status }) => status === 'completed').length;
  const sent = events.filter(({ status }) => ['dm_sent', 'awaiting_follow', 'completed'].includes(status)).length;
  setMetric('comments-count', events.length, 'All recent comments');
  setMetric('dms-count', sent, 'Conversations started');
  setMetric('completed-count', completed, 'Links delivered');
  $('#nav-count').textContent = events.filter(({ status }) => status !== 'completed').length;
  const body = $('#events-body');
  body.innerHTML = events.length ? events.slice(0, 8).map((event) => `<tr><td><div class="person"><span class="person-avatar">${initials(event.username)}</span>@${event.username}</div></td><td class="comment" title="${escapeHtml(event.commentText)}">${escapeHtml(event.commentText)}</td><td><span class="badge ${event.status}">${event.status.replace('_', ' ')}</span></td><td>${relativeDate(event.createdAt)}</td></tr>`).join('') : '<tr><td colspan="4" class="empty">No conversations yet. New Instagram comments will appear here.</td></tr>';
}
function escapeHtml(text = '') { const node = document.createElement('div'); node.textContent = text; return node.innerHTML; }
async function loadConfig() {
  const response = await fetch(`${api}/config`);
  if (!response.ok) throw new Error('Could not load automation settings');
  const config = await response.json();
  $('#trigger-mode').value = config.triggerMode || 'keyword'; $('#keywords').value = config.keywords || '';
  $('#initial-message').value = config.initialMessage || ''; $('#final-message').value = config.finalMessage || '';
  toggleKeywords();
}
function toggleKeywords() { $('#keywords-label').style.display = $('#trigger-mode').value === 'keyword' ? 'block' : 'none'; }
async function saveConfig(event) {
  event.preventDefault(); const button = $('.save-button'); button.disabled = true; button.textContent = 'Saving…';
  const payload = Object.fromEntries(new FormData(event.currentTarget));
  try { const response = await fetch(`${api}/config`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!response.ok) throw new Error(); $('#save-state').textContent = 'Saved just now'; toast('Automation settings saved'); }
  catch { toast('Could not save settings. Please try again.'); }
  finally { button.disabled = false; button.innerHTML = 'Save changes <span>→</span>'; }
}
async function initialise() { try { await Promise.all([loadEvents(), loadConfig()]); } catch (error) { toast(error.message || 'Unable to connect to AutoDM'); } }
$('#config-form').addEventListener('submit', saveConfig); $('#trigger-mode').addEventListener('change', toggleKeywords); $('#refresh-button').addEventListener('click', async () => { $('#refresh-button').textContent = 'Refreshing…'; try { await loadEvents(); toast('Activity updated'); } catch (error) { toast(error.message); } finally { $('#refresh-button').innerHTML = 'Refresh <span>↻</span>'; } });
initialise();
