import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5001/api/admin';

const Settings = () => {
  const [config, setConfig] = useState({
    triggerMode: 'keyword',
    keywords: 'link, guide, send',
    initialMessage: "Hello jii 🤍 !\n\nI know exactly how valuable time is. That's why everything on my page is packed with free, premium value to help you level up.\n\nClick below and I'll send you the link in just a sec ✨",
    notFollowingMessage: "Wait, you're not following the page yet? 🧠\n\nThis is exclusive to the crew who actually want to grow. Trust me, you won't regret following-you'll learn something new from every single post!\nwelcome to the crew 💛",
    finalMessage: "Perfect! 🚀\nNow get the apply link 👇\n\n📢 Daily Job update: https://example.com/jobs\n👟 Nike apply link: https://example.com/nike\n✈️ Cleartrip apply form: https://example.com/cleartrip"
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
          triggerMode: data.triggerMode || 'keyword',
          keywords: data.keywords || 'link, guide, send',
          initialMessage: data.initialMessage || "Hello jii 🤍 !\n\nI know exactly how valuable time is. That's why everything on my page is packed with free, premium value to help you level up.\n\nClick below and I'll send you the link in just a sec ✨",
          notFollowingMessage: data.notFollowingMessage || "Wait, you're not following the page yet? 🧠\n\nThis is exclusive to the crew who actually want to grow. Trust me, you won't regret following-you'll learn something new from every single post!\nwelcome to the crew 💛",
          finalMessage: data.finalMessage || "Perfect! 🚀\nNow get the apply link 👇\n\n📢 Daily Job update: https://example.com/jobs\n👟 Nike apply link: https://example.com/nike\n✈️ Cleartrip apply form: https://example.com/cleartrip"
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
        <p className="page-subtitle">Configure your DM funnels, templates, and trigger keywords.</p>
      </div>

      <form className="glass-panel" onSubmit={handleSave} style={{ maxWidth: '650px' }}>
        
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

        <div className="form-group" style={{ marginTop: '24px' }}>
          <label className="form-label">Step 1 Template: Initial Comment Reply</label>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            This message is sent immediately when a user comments on your post. Includes [Send me the link] button.
          </p>
          <textarea 
            className="form-control" 
            name="initialMessage"
            rows={4}
            value={config.initialMessage}
            onChange={handleChange}
          />
        </div>

        <div className="form-group" style={{ marginTop: '24px' }}>
          <label className="form-label">Step 2 Template: User NOT Following</label>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Sent when user clicks "Send me the link" but doesn't follow yet. Includes [I'm following ✓] button.
          </p>
          <textarea 
            className="form-control" 
            name="notFollowingMessage"
            rows={4}
            value={config.notFollowingMessage}
            onChange={handleChange}
          />
        </div>

        <div className="form-group" style={{ marginTop: '24px' }}>
          <label className="form-label">Step 3 Template: Final Resource & Apply Links</label>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Sent once user follows or clicks "I'm following ✓". Include your target links here.
          </p>
          <textarea 
            className="form-control" 
            name="finalMessage"
            rows={5}
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
