import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NOTE_COLORS, formatDate, getBrandColor } from './BL02_Constants';

const NoteItem = ({ item, onPress, onLongPress, settings, showPin, theme }) => {
  const defaultColor = getBrandColor(settings);
  const { day, month } = formatDate(item.updatedAt || item.createdAt || Date.now());
  
  return (
    <TouchableOpacity 
      onLongPress={onLongPress} 
      onPress={onPress} 
      style={{ 
        padding: 12, 
        borderBottomWidth: 1, 
        borderColor: theme.divider, 
        flexDirection: 'row', 
        alignItems: 'center',
        backgroundColor: theme.background
      }}>
      
      <View style={{ 
        width: 52, 
        height: 52, 
        borderRadius: 26, 
        backgroundColor: item.color || defaultColor, 
        marginRight: 16, 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>{day}</Text>
        <Text style={{ color: 'white', fontSize: 10 }}>{month}</Text>
      </View>
      
      <View style={{ flex: 1 }}>
        {item.title ? (
          <>
            <Text style={{ fontWeight: 'bold', fontSize: 18, color: theme.text }} numberOfLines={1}>{item.title}</Text>
            {item.content ? (
              <Text style={{ color: theme.textSecondary, fontSize: 16 }} numberOfLines={1}>{item.content}</Text>
            ) : null}
          </>
        ) : (
          <Text style={{ color: theme.textSecondary, fontSize: 16 }} numberOfLines={2}>{item.content || '...'}</Text>
        )}
      </View>
      
      {showPin && item.pinned && <MaterialIcons name="push-pin" size={20} color={defaultColor} style={{ marginLeft: 8 }} />}
    </TouchableOpacity>
  );
};

export default NoteItem;
