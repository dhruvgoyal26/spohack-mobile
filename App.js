import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Home as HomeIcon, Search, Library, Settings as SettingsIcon } from 'lucide-react-native';
import Home from './components/Home';
import MiniPlayer from './components/MiniPlayer';
import NowPlaying from './components/NowPlaying';
import { getStreamUrl, getRadioQueue } from './services/api';
import './global.css';

// 1. Import the global audio config 
import { setAudioModeAsync } from 'expo-audio';

function App() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState('home');
  const [repeatMode, setRepeatMode] = useState(0); // 0=off, 1=all, 2=one
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [nextStreamUrl, setNextStreamUrl] = useState(null);

  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);
  const lastSkippedTime = useRef(0);

  // 2. Globally force Android to keep the Audio Engine alive in the background
  useEffect(() => {
    setAudioModeAsync({
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
      playsInSilentMode: true,
    });
  }, []);

  // expo-audio uses SECONDS. We multiply by 1000 to work in milliseconds!
  const position = (status.currentTime || 0) * 1000;
  const duration = (status.duration || 0) * 1000;

  useEffect(() => {
    // Proactively fetch the NEXT song's stream URL in the background while the current song is playing!
    // This allows instant playback when the track finishes, preventing Android from suspending the app.
    if (queue.length > 0) {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length && repeatMode === 1) {
        nextIndex = 0;
      }
      if (nextIndex < queue.length) {
        getStreamUrl(queue[nextIndex].id).then(url => setNextStreamUrl(url));
      }
    }
  }, [currentIndex, queue, repeatMode]);

  useEffect(() => {
    // Auto-play next track when finished natively (wakes up JS thread even in background)
    if (status.didJustFinish) {
      const now = Date.now();
      if (now - lastSkippedTime.current > 5000) {
        lastSkippedTime.current = now;
        if (repeatMode === 2) {
          player.seekTo(0);
          player.play();
        } else {
          handleSkipForward();
        }
      }
    }
  }, [status.didJustFinish, repeatMode]);

  const handlePlayTrack = async (track, newQueue = null, index = 0, prefetchedUrl = null) => {
    try {
      setCurrentTrack(track);
      setModalVisible(true); // Open Now Playing immediately
      setIsLoading(true);

      if (newQueue) {
        setQueue(newQueue);
        setCurrentIndex(index);
        
        // If this is a search result (meaning newQueue is exactly the search results array),
        // let's fetch a smart "radio" queue in the background based on the artist
        // to avoid playing the exact same song 5 times!
        if (newQueue.length > 2 && newQueue[0].title === newQueue[1].title) {
           getRadioQueue(track.artist, track.id).then((smartQueue) => {
              if (smartQueue.length > 0) {
                 setQueue([track, ...smartQueue]);
                 setCurrentIndex(0);
              }
           });
        }
      } else {
        // If no queue is provided, build one dynamically
        setQueue([track]);
        setCurrentIndex(0);
        getRadioQueue(track.artist, track.id).then((smartQueue) => {
           if (smartQueue.length > 0) {
              setQueue([track, ...smartQueue]);
           }
        });
      }
      
      const streamUrl = prefetchedUrl || await getStreamUrl(track.id);
      if (!streamUrl) throw new Error('Stream URL not found');

      // 3. Register the lock screen controls to prevent Android from killing the background service!
      player.setActiveForLockScreen(true, {
        title: track.title,
        artist: track.artist,
        artworkUrl: track.thumbnail,
      });

      player.replace(streamUrl);
      player.play();

      setIsPlaying(true);
      setIsLoading(false);
    } catch (error) {
      console.error("Error playing track:", error);
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const handleTogglePlay = () => {
    if (!player) return;
    if (player.playing) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  const handleShuffle = () => {
    if (queue.length > 0) {
      const remainingQueue = [...queue];
      const current = remainingQueue.splice(currentIndex, 1)[0];
      for (let i = remainingQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remainingQueue[i], remainingQueue[j]] = [remainingQueue[j], remainingQueue[i]];
      }
      setQueue([current, ...remainingQueue]);
      setCurrentIndex(0);
    }
  };

  const handleToggleRepeat = () => {
    setRepeatMode((prev) => (prev + 1) % 3);
  };

  const handleSkipForward = () => {
    if (queue.length > 0) {
      if (currentIndex < queue.length - 1) {
        const nextIndex = currentIndex + 1;
        handlePlayTrack(queue[nextIndex], queue, nextIndex, nextStreamUrl);
      } else if (repeatMode === 1) {
        // Repeat All: loop to the start
        handlePlayTrack(queue[0], queue, 0, nextStreamUrl);
      }
    }
  };

  const handleSkipBack = () => {
    if (queue.length > 0 && currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      handlePlayTrack(queue[prevIndex], queue, prevIndex);
    }
  };

  const handleSeek = (value) => {
    if (player) {
      // The slider passes milliseconds, but expo-audio seekTo expects seconds
      player.seekTo(value / 1000);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#131315" />
      
      <Home 
        onPlayTrack={(track, q, idx) => handlePlayTrack(track, q, idx)} 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
      />
      
      {currentTrack && (
        <MiniPlayer 
          track={currentTrack}
          isPlaying={isPlaying}
          position={position}
          duration={duration}
          onTogglePlay={handleTogglePlay}
          onPress={() => setModalVisible(true)}
        />
      )}

      {/* Bottom Navigation */}
      <View className="flex-row items-center justify-around bg-[#131315] border-t border-[#1a1a1c] pt-2 pb-6 px-4 h-20 absolute bottom-0 w-full z-50">
        <TouchableOpacity className="items-center" onPress={() => setActiveTab('home')}>
          <HomeIcon color={activeTab === 'home' ? '#d0bcff' : '#958ea0'} size={24} fill={activeTab === 'home' ? '#d0bcff' : 'none'} />
          <Text className={`text-xs mt-1 ${activeTab === 'home' ? 'text-[#d0bcff]' : 'text-[#958ea0]'}`}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="items-center" onPress={() => setActiveTab('search')}>
          <Search color={activeTab === 'search' ? '#d0bcff' : '#958ea0'} size={24} />
          <Text className={`text-xs mt-1 ${activeTab === 'search' ? 'text-[#d0bcff]' : 'text-[#958ea0]'}`}>Search</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center" onPress={() => setActiveTab('library')}>
          <Library color={activeTab === 'library' ? '#d0bcff' : '#958ea0'} size={24} />
          <Text className={`text-xs mt-1 ${activeTab === 'library' ? 'text-[#d0bcff]' : 'text-[#958ea0]'}`}>Playlists</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center" onPress={() => setActiveTab('settings')}>
          <SettingsIcon color={activeTab === 'settings' ? '#d0bcff' : '#958ea0'} size={24} />
          <Text className={`text-xs mt-1 ${activeTab === 'settings' ? 'text-[#d0bcff]' : 'text-[#958ea0]'}`}>Settings</Text>
        </TouchableOpacity>
      </View>

      <NowPlaying 
        visible={modalVisible}
        track={currentTrack}
        isPlaying={isPlaying}
        loading={isLoading}
        position={position}
        duration={duration}
        repeatMode={repeatMode}
        onClose={() => setModalVisible(false)}
        onTogglePlay={handleTogglePlay}
        onSkipForward={handleSkipForward}
        onSkipBack={handleSkipBack}
        onSeek={handleSeek}
        onShuffle={handleShuffle}
        onToggleRepeat={handleToggleRepeat}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131315',
  },
});

export default App;
