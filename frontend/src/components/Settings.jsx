import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV
  ? 'http://localhost:5001/api/admin'
  : 'https://table-tap-automation.onrender.com/api/admin');

const Settings = () => {
  const [config, setConfig] = useState({
    triggerMode: 'keyword',
    keywords: 'link, table, tap, order, menu',
    initialMessage: "Hey there! 🍽️✨\n\nThanks for reaching out! Table-Tap makes dining out seamless, fast, and interactive.\n\nClick below and I'll send you your exclusive access link in just a sec! 👇",
    notFollowingMessage: "Wait, you're not following us yet? 🍕\n\nWe share exclusive food deals, secret dining spots, and instant restaurant updates. Hit follow below and join the Table-Tap family! 💛",
    finalMessage: "Awesome! Welcome aboard! 🚀\nHere is your official Table-Tap link 👇\n\n👉 Visit Table-Tap: https://table-tap.in\n📱 Instant Menu & Ordering: https://table-tap.in\n🔥 Exclusive Dining Deals: https://table-tap.in"
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
          keywords: data.keywords || 'link, table, tap, order, menu',
          initialMessage: data.initialMessage || "Hey there! 🍽️✨\n\nThanks for reaching out! Table-Tap makes dining out seamless, fast, and interactive.\n\nClick below and I'll send you your exclusive access link in just a sec! 👇",
          notFollowingMessage: data.notFollowingMessage || "Wait, you're not following us yet? 🍕\n\nWe share exclusive food deals, secret dining spots, and instant restaurant updates. Hit follow below and join the Table-Tap family! 💛",
          finalMessage: data.finalMessage || "Awesome! Welcome aboard! 🚀\nHere is your official Table-Tap link 👇\n\n👉 Visit Table-Tap: https://table-tap.in\n📱 Instant Menu & Ordering: https://table-tap.in\n🔥 Exclusive Dining Deals: https://table-tap.in"
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
      alert('Table-Tap settings saved successfully!');
    } catch (err) {
      console.error('Failed to save config', err);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="settings-page"><div className="page-header"><h1 className="page-title">Loading Table-Tap Config...</h1></div></div>;
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">Table-Tap Automation Settings</h1>
        <p className="page-subtitle">Configure your Table-Tap DM funnels, templates, and trigger keywords.</p>
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
              placeholder="e.g. link, table, tap, order, menu"
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
          <label className="form-label">Step 3 Template: Final Resource & Table-Tap Links</label>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Sent once user follows or clicks "I'm following ✓". Include your target Table-Tap links here.
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
            {saving ? 'Saving...' : 'Save Table-Tap Config'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default Settings;
