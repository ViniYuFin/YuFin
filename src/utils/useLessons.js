import { useState, useEffect } from 'react';
import { getApiUrl } from '../config/environment';

export default function useLessons() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const API_URL = getApiUrl();
    fetch(`${API_URL}/lessons`)
      .then(res => {
        if (!res.ok) throw new Error('Erro ao buscar lições');
        return res.json();
      })
      .then(data => {
        setLessons(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { lessons, loading, error };
} 