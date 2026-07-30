import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

export function useEvents(refreshInterval = 3000) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadEvents = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/events`);
        if (active) setEvents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch events', error);
        if (active) setEvents([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadEvents();
    const interval = setInterval(loadEvents, refreshInterval);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [refreshInterval]);

  return { events, loading };
}
