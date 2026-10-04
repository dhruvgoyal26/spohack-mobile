import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Play, Pause } from 'lucide-react-native';

export default function MiniPlayer({ track, isPlaying, position, duration, onTogglePlay, onPress }) {
  if (!track) return null;

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View className="absolute bottom-20 w-full bg-surface-container pb-2 pt-2 px-3 shadow-lg border-t border-surface-container-high overflow-hidden z-40">
      <TouchableOpacity 
        className="flex-row items-center justify-between h-14"
        onPress={onPress}
      >
        <View className="flex-row items-center flex-1 mr-4">
          <Image source={{ uri: track.thumbnail }} className="w-11 h-11 rounded-lg bg-surface-container-high" />
          <View className="flex-col ml-3 flex-1">
            <Text className="text-on-surface font-semibold text-base" numberOfLines={1}>{track.title}</Text>
            <Text className="text-on-surface-variant text-sm mt-0.5" numberOfLines={1}>{track.artist}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          className="w-10 h-10 items-center justify-center rounded-full bg-surface-container-high"
          onPress={onTogglePlay}
        >
          {isPlaying ? (
            <Pause color="#e5e1e4" size={24} fill="#e5e1e4" />
          ) : (
            <Play color="#e5e1e4" size={24} fill="#e5e1e4" />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
      
      {/* Mini Progress Bar */}
      <View className="w-full h-[2px] bg-surface-container-highest mt-2 rounded-full overflow-hidden">
        <View className="h-full bg-primary" style={{ width: `${progress}%` }} />
      </View>
    </View>
  );
}
