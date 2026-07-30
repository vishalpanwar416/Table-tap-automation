import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5001/api/admin';

const Settings = () => {
  const [config, setConfig] = useState({
    triggerMode: 'keyword',
    keywords: 'link, guide, send',
    notFollowingMessage: 'Hey! Thanks for the interest. Please follow our page first, and I will automatically send you the link! 🚀',
    finalMessage: 'Here is the link you requested: https://example.com/guide 👇'
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/config`);
      if (data && data._id) {
        setConfig({
          triggerMode: data.triggerMode,
          keywords: data.keywords,
          notFollowingMessage: data.notFollowingMessage,
          finalMessage: data.finalMessage
        });
      }
    } catch (err) {
      console.error('Failed to load config', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${API_URL}/config`, config);
      alert('Settings saved successfully!');
    } catch (err) {
      console.error('Failed to save config', err);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="settings-page"><div className="page-header"><h1 className="page-title">Loading...</h1></div></div>;
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">Automation Settings</h1>
        <p className="page-subtitle">Configure your DM funnels and trigger keywords.</p>
      </div>

      <form className="glass-panel" onSubmit={handleSave} style={{ maxWidth: '600px' }}>
        
        <div className="form-group">
          <label className="form-label">Trigger Mode</label>
          <select 
            className="form-control" 
            name="triggerMode" 
            value={config.triggerMode} 
            onChange={handleChange}
          >
            <option value="keyword">Specific Keywords Only</option>
            <option value="any">Any Comment on Post</option>
          </select>
        </div>

        {config.triggerMode === 'keyword' && (
          <div className="form-group">
            <label className="form-label">Trigger Keywords (comma separated)</label>
            <input 
              type="text" 
              className="form-control" 
              name="keywords" 
              value={config.keywords} 
              onChange={handleChange} 
              placeholder="e.g. link, resources, guide"
            />
          </div>
        )}

        <div className="form-group" style={{ marginTop: '32px' }}>
          <label className="form-label">Message: User NOT Following</label>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            This DM is sent immediately if the commenter doesn't follow the page yet.
          </p>
          <textarea 
            className="form-control" 
            name="notFollowingMessage"
            value={config.notFollowingMessage}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Message: Final Resource Link</label>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            This DM is sent once we verify they follow the page.
          </p>
          <textarea 
            className="form-control" 
            name="finalMessage"
            value={config.finalMessage}
            onChange={handleChange}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default Settings;
