import { Platform } from 'react-native';

// Dynamically updated to your machine's Wi-Fi IP address so your physical phone can connect!
export const API_BASE_URL = 'http://10.31.229.96:8000';

export const searchTracks = async (query) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Search failed');
    return await response.json();
  } catch (error) {
    console.error('API Search Error:', error);
    return [];
  }
};

export const getRadioQueue = async (artist, currentTrackId) => {
  try {
    // Search for the artist's popular songs to build a dynamic radio queue
    const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(artist + " popular songs audio")}`);
    if (!response.ok) throw new Error('Radio failed');
    const results = await response.json();
    // Filter out the current track so it doesn't repeat immediately
    return results.filter(t => t.id !== currentTrackId);
  } catch (error) {
    console.error('API Radio Error:', error);
    return [];
  }
};

export const getStreamUrl = async (videoId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stream/${videoId}`);
    if (!response.ok) throw new Error('Stream fetch failed');
    const data = await response.json();
    return data.stream_url;
  } catch (error) {
    console.error('API Stream Error:', error);
    return null;
  }
};
