import React from 'react';
import { View, Text, TouchableOpacity, Image, Modal, ActivityIndicator, Dimensions } from 'react-native';
import { ChevronDown, Play, Pause, MoreVertical, SkipBack, SkipForward, Repeat, Repeat1 } from 'lucide-react-native';
import Slider from '@react-native-community/slider';

const { width } = Dimensions.get('window');

export default function NowPlaying({ visible, track, isPlaying, loading, onClose, onTogglePlay, onSkipForward, onSkipBack, onSeek, position, duration, onShuffle, repeatMode, onToggleRepeat }) {
  if (!track) return null;

  const formatTime = (millis) => {
    if (!millis) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-surface pt-12 pb-10 px-6 flex-col">
        {/* Top Bar */}
        <View className="flex-row items-center justify-between mb-8">
          <TouchableOpacity onPress={onClose} className="w-10 h-10 items-center justify-center rounded-full bg-surface-container/60">
            <ChevronDown color="#e5e1e4" size={24} />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-outline text-xs uppercase tracking-widest font-semibold">Now Playing</Text>
            <Text className="text-on-surface text-sm mt-1">Stream Engine Active</Text>
          </View>
          <TouchableOpacity className="w-10 h-10 items-center justify-center rounded-full bg-surface-container/60">
            <MoreVertical color="#e5e1e4" size={20} />
          </TouchableOpacity>
        </View>

        {/* Artwork */}
        <View className="w-full aspect-square rounded-[28px] bg-surface-container-high overflow-hidden shadow-2xl items-center justify-center mb-8" style={{ maxHeight: width - 48 }}>
          <Image source={{ uri: track.thumbnail }} className="w-full h-full object-cover absolute" />
          {loading && (
            <View className="absolute inset-0 bg-black/40 items-center justify-center">
              <ActivityIndicator size="large" color="#d0bcff" />
            </View>
          )}
        </View>

        {/* Track Meta */}
        <View className="flex-col mb-8">
          <Text className="text-on-surface font-bold text-3xl mb-1" numberOfLines={1}>{track.title}</Text>
          <Text className="text-on-surface-variant text-lg" numberOfLines={1}>{track.artist}</Text>
        </View>

        {/* Scrubber */}
        <View className="flex-col mb-8">
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={0}
            maximumValue={duration > 0 ? duration : 1000}
            value={position || 0}
            onSlidingComplete={onSeek}
            minimumTrackTintColor="#d0bcff"
            maximumTrackTintColor="#4a4458"
            thumbTintColor="#d0bcff"
          />
          <View className="flex-row justify-between items-center px-1 -mt-2">
            <Text className="text-outline text-xs font-medium">{formatTime(position)}</Text>
            <Text className="text-outline text-xs font-medium">{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Controls */}
        <View className="flex-row items-center justify-between">
          <TouchableOpacity className="items-center justify-center w-12 h-12" onPress={onShuffle}>
            <Text className="text-on-surface-variant font-bold text-[20px]">🔀</Text>
          </TouchableOpacity>
          <TouchableOpacity className="items-center justify-center w-12 h-12" onPress={onSkipBack}>
            <SkipBack color="#e5e1e4" size={32} fill="#e5e1e4" />
          </TouchableOpacity>
          <TouchableOpacity 
            className="items-center justify-center w-20 h-20 rounded-full bg-on-surface shadow-xl"
            onPress={onTogglePlay}
          >
            {isPlaying && !loading ? (
              <Pause color="#131315" size={40} fill="#131315" />
            ) : (
              <Play color="#131315" size={40} fill="#131315" className="ml-1" />
            )}
          </TouchableOpacity>
          <TouchableOpacity className="items-center justify-center w-12 h-12" onPress={onSkipForward}>
            <SkipForward color="#e5e1e4" size={32} fill="#e5e1e4" />
          </TouchableOpacity>
          <TouchableOpacity className="items-center justify-center w-12 h-12" onPress={onToggleRepeat}>
            {repeatMode === 2 ? (
              <Repeat1 color="#d0bcff" size={24} />
            ) : repeatMode === 1 ? (
              <Repeat color="#d0bcff" size={24} />
            ) : (
              <Repeat color="#958ea0" size={24} />
            )}
          </TouchableOpacity>
        </View>

      </View>
    </Modal>
  );
}
