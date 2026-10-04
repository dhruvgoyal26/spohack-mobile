import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default fallback URL (Your home Wi-Fi)
export const DEFAULT_API_URL = 'http://10.31.229.96:8000';

export const getApiBaseUrl = async () => {
  try {
    const savedUrl = await AsyncStorage.getItem('server_url');
    return savedUrl || DEFAULT_API_URL;
  } catch (e) {
    return DEFAULT_API_URL;
  }
};

export const searchTracks = async (query) => {
  try {
    const baseUrl = await getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Search failed');
    return await response.json();
  } catch (error) {
    console.error('API Search Error:', error);
    return [];
  }
};

export const getRadioQueue = async (artist, currentTrackId) => {
  try {
    const baseUrl = await getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent(artist + " popular songs audio")}`);
    if (!response.ok) throw new Error('Radio failed');
    const results = await response.json();
    return results.filter(t => t.id !== currentTrackId);
  } catch (error) {
    console.error('API Radio Error:', error);
    return [];
  }
};

export const getStreamUrl = async (videoId) => {
  try {
    const baseUrl = await getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/stream/${videoId}`);
    if (!response.ok) throw new Error('Stream fetch failed');
    const data = await response.json();
    return data.stream_url;
  } catch (error) {
    console.error('API Stream Error:', error);
    return null;
  }
};
