import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Search, History, Play, Bookmark, XCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchTracks } from '../services/api';

export default function Home({ onPlayTrack, activeTab, onTabChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('Songs');
  const [savedPlaylists, setSavedPlaylists] = useState([]);
  
  const [homeData, setHomeData] = useState({
    trending: [],
    lofi: [],
    hiphop: [],
    workout: []
  });
  const [loadingHome, setLoadingHome] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const storedPlaylists = await AsyncStorage.getItem('savedPlaylists');
        if (storedPlaylists) setSavedPlaylists(JSON.parse(storedPlaylists));

        const [trendingData, lofiData, hiphopData, workoutData] = await Promise.all([
          searchTracks("global top 50 hit songs audio"),
          searchTracks("lofi chill beats audio"),
          searchTracks("hip hop classics audio"),
          searchTracks("workout gym motivation songs audio")
        ]);
        
        setHomeData({
          trending: trendingData.slice(0, 6),
          lofi: lofiData.slice(0, 6),
          hiphop: hiphopData.slice(0, 6),
          workout: workoutData.slice(0, 6)
        });
      } catch (e) {
        console.error("Failed to fetch home data:", e);
      } finally {
        setLoadingHome(false);
      }
    };
    fetchHomeData();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim()) {
        setLoading(true);
        const data = await searchTracks(query);
        setResults(data);
        setLoading(false);
      } else {
        setResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const toggleSavePlaylist = async (playlist) => {
    try {
      const exists = savedPlaylists.find(p => p.id === playlist.id);
      let newSaved;
      if (exists) {
        newSaved = savedPlaylists.filter(p => p.id !== playlist.id);
      } else {
        newSaved = [{
          id: playlist.id,
          title: playlist.title,
          artist: playlist.artist,
          thumbnail: playlist.tracks[0]?.thumbnail || '',
          url: query // store the URL so they can click it later
        }, ...savedPlaylists];
      }
      setSavedPlaylists(newSaved);
      await AsyncStorage.setItem('savedPlaylists', JSON.stringify(newSaved));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View className="flex-1 bg-surface pt-12">
      {/* Header */}
      <View className="h-16 px-6 flex-row items-center justify-between">
        <Text className="text-on-surface font-bold text-xl uppercase tracking-wider" numberOfLines={1}>SPOHACK</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-2 pb-32">
        {/* SEARCH TAB */}
        {activeTab === 'search' && (
          <View>
            <View className="flex-row items-center w-full h-12 rounded-xl bg-surface-container-high px-4 shadow-sm mb-4">
              <Search color="#958ea0" size={20} />
              <TextInput
                className="flex-1 text-on-surface ml-3 font-medium"
                placeholder={filter === 'Playlists' ? 'Paste YouTube Playlist link...' : 'Search YouTube for tracks...'}
                placeholderTextColor="#958ea0"
                value={query}
                onChangeText={setQuery}
              />
              {query.length > 0 && !loading && (
                <TouchableOpacity onPress={() => setQuery('')} className="ml-2">
                  <XCircle color="#958ea0" size={20} />
                </TouchableOpacity>
              )}
              {loading && <ActivityIndicator color="#d0bcff" size="small" className="ml-2" />}
            </View>

            <View className="flex-row items-center mb-6">
              <TouchableOpacity 
                className={`px-4 py-1.5 rounded-full mr-3 ${filter === 'Songs' ? 'bg-primary-container' : 'bg-surface-container-high'}`}
                onPress={() => setFilter('Songs')}
              >
                <Text className={`${filter === 'Songs' ? 'text-primary' : 'text-on-surface-variant'} font-medium text-sm`}>Songs</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className={`px-4 py-1.5 rounded-full ${filter === 'Playlists' ? 'bg-primary-container' : 'bg-surface-container-high'}`}
                onPress={() => setFilter('Playlists')}
              >
                <Text className={`${filter === 'Playlists' ? 'text-primary' : 'text-on-surface-variant'} font-medium text-sm`}>Playlists</Text>
              </TouchableOpacity>
            </View>

            {query.trim().length > 0 && (
              <View className="mt-2 flex-col">
                {results.is_playlist ? (
                  <View>
                    <View className="flex-row items-center mb-6 bg-surface-container-low p-4 rounded-2xl shadow-sm">
                      <View className="flex-1">
                        <Text className="text-on-surface font-bold text-2xl mb-1">{results.title}</Text>
                        <Text className="text-on-surface-variant text-sm mb-4">{results.tracks.length} tracks • {results.artist}</Text>
                        <View className="flex-row items-center space-x-4">
                          <TouchableOpacity 
                            className="bg-primary rounded-full px-6 py-2.5 flex-row items-center self-start"
                            onPress={() => onPlayTrack(results.tracks[0], results.tracks, 0)}
                          >
                            <Play color="#131315" size={16} fill="#131315" />
                            <Text className="text-[#131315] font-bold ml-2">Play All</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            className="bg-surface-container-highest rounded-full px-5 py-2.5 flex-row items-center ml-3 self-start"
                            onPress={() => {
                              if (results.tracks.length > 0) {
                                const shuffled = [...results.tracks].sort(() => Math.random() - 0.5);
                                onPlayTrack(shuffled[0], shuffled, 0);
                              }
                            }}
                          >
                            <Text className="text-on-surface font-bold text-sm">🔀 Shuffle</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            className="w-10 h-10 ml-3 rounded-full bg-surface-container-highest items-center justify-center"
                            onPress={() => toggleSavePlaylist(results)}
                          >
                            <Bookmark 
                              color={savedPlaylists.find(p => p.id === results.id) ? "#d0bcff" : "#e5e1e4"} 
                              fill={savedPlaylists.find(p => p.id === results.id) ? "#d0bcff" : "none"} 
                              size={20} 
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                    
                    {results.tracks.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        className="flex-row items-center p-2 rounded-xl mb-3 bg-surface-container-low"
                        onPress={() => onPlayTrack(item, results.tracks, index)}
                      >
                        <Image source={{ uri: item.thumbnail }} className="w-14 h-14 rounded-lg bg-surface-container" />
                        <View className="flex-col flex-1 ml-3 mr-2">
                          <Text className="text-on-surface font-semibold text-base" numberOfLines={1}>{item.title}</Text>
                          <Text className="text-on-surface-variant text-sm mt-1" numberOfLines={1}>{item.artist}</Text>
                        </View>
                        <Text className="text-outline text-xs">{item.duration}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View>
                    <Text className="text-on-surface font-semibold text-lg mb-4">Search Results</Text>
                    {Array.isArray(results) && results.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        className="flex-row items-center p-2 rounded-xl mb-3 bg-surface-container-low"
                        onPress={() => onPlayTrack(item, results, index)}
                      >
                        <Image source={{ uri: item.thumbnail }} className="w-14 h-14 rounded-lg bg-surface-container" />
                        <View className="flex-col flex-1 ml-3 mr-2">
                          <Text className="text-on-surface font-semibold text-base" numberOfLines={1}>{item.title}</Text>
                          <Text className="text-on-surface-variant text-sm mt-1" numberOfLines={1}>{item.artist}</Text>
                        </View>
                        <Text className="text-outline text-xs">{item.duration}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* LIBRARY TAB */}
        {activeTab === 'library' && (
          <View className="flex-1">
            <Text className="text-on-surface font-bold text-2xl mb-6 mt-2">Your Library</Text>
            {savedPlaylists.length === 0 ? (
              <Text className="text-on-surface-variant text-center mt-12">No saved playlists yet.</Text>
            ) : (
              <View className="flex-row flex-wrap justify-between">
                {savedPlaylists.map((playlist, index) => (
                  <TouchableOpacity 
                    key={index} 
                    className="w-[48%] mb-6"
                    onPress={() => {
                      setQuery(playlist.url);
                      setFilter('Playlists');
                      if(onTabChange) onTabChange('search');
                    }}
                  >
                    <Image source={{ uri: playlist.thumbnail }} className="w-full aspect-square rounded-xl mb-3 bg-surface-container-low" />
                    <Text className="text-on-surface font-bold text-sm" numberOfLines={1}>{playlist.title}</Text>
                    <Text className="text-on-surface-variant text-xs mt-1" numberOfLines={1}>Playlist • {playlist.artist}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* HOME TAB */}
        {activeTab === 'home' && (
          <View className="mb-8">
            <View className="flex-row items-center justify-between px-4 py-3 rounded-xl bg-surface-container-lowest mt-2 mb-6">
              <View className="flex-row items-center gap-2">
                <View className="h-2 w-2 rounded-full bg-tertiary" />
                <Text className="text-tertiary text-xs font-bold uppercase tracking-widest">Direct Stream Engine Active</Text>
              </View>
            </View>

            {loadingHome ? (
              <View className="w-full py-16 items-center justify-center">
                <ActivityIndicator size="large" color="#d0bcff" />
              </View>
            ) : (
              <View>
                {/* Trending */}
                <Text className="text-on-surface font-bold text-xl mb-3">Trending Now</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8 -mx-6 px-6">
                  {homeData.trending.map((item, index) => (
                    <TouchableOpacity key={index} className="w-36 mr-4" onPress={() => onPlayTrack(item, homeData.trending, index)}>
                      <Image source={{ uri: item.thumbnail }} className="w-36 h-36 rounded-xl mb-2 bg-surface-container-low" />
                      <Text className="text-on-surface font-semibold text-sm" numberOfLines={1}>{item.title}</Text>
                      <Text className="text-on-surface-variant text-xs mt-0.5" numberOfLines={1}>{item.artist}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Hip Hop Classics */}
                <Text className="text-on-surface font-bold text-xl mb-3">Hip Hop Classics</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8 -mx-6 px-6">
                  {homeData.hiphop.map((item, index) => (
                    <TouchableOpacity key={index} className="w-36 mr-4" onPress={() => onPlayTrack(item, homeData.hiphop, index)}>
                      <Image source={{ uri: item.thumbnail }} className="w-36 h-36 rounded-xl mb-2 bg-surface-container-low" />
                      <Text className="text-on-surface font-semibold text-sm" numberOfLines={1}>{item.title}</Text>
                      <Text className="text-on-surface-variant text-xs mt-0.5" numberOfLines={1}>{item.artist}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Lofi Beats */}
                <Text className="text-on-surface font-bold text-xl mb-3">Lofi Chill Beats</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8 -mx-6 px-6">
                  {homeData.lofi.map((item, index) => (
                    <TouchableOpacity key={index} className="w-36 mr-4" onPress={() => onPlayTrack(item, homeData.lofi, index)}>
                      <Image source={{ uri: item.thumbnail }} className="w-36 h-36 rounded-xl mb-2 bg-surface-container-low" />
                      <Text className="text-on-surface font-semibold text-sm" numberOfLines={1}>{item.title}</Text>
                      <Text className="text-on-surface-variant text-xs mt-0.5" numberOfLines={1}>{item.artist}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Workout */}
                <Text className="text-on-surface font-bold text-xl mb-3">Workout Motivation</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8 -mx-6 px-6">
                  {homeData.workout.map((item, index) => (
                    <TouchableOpacity key={index} className="w-36 mr-4" onPress={() => onPlayTrack(item, homeData.workout, index)}>
                      <Image source={{ uri: item.thumbnail }} className="w-36 h-36 rounded-xl mb-2 bg-surface-container-low" />
                      <Text className="text-on-surface font-semibold text-sm" numberOfLines={1}>{item.title}</Text>
                      <Text className="text-on-surface-variant text-xs mt-0.5" numberOfLines={1}>{item.artist}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
