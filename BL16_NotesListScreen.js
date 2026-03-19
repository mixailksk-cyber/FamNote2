import React from 'react';
import { View, FlatList, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Header from './BL04_Header';
import NoteItem from './BL09_NoteItem';
import { getBrandColor } from './BL02_Constants';

const NotesListScreen = ({ currentFolder, sortedNotes, handleNotePress, setSelectedNoteForAction, setShowNoteDialog, setCurrentScreen, setSelectedNote, goToSearch, insets, settings }) => {
  const brandColor = getBrandColor(settings);
  const isInTrash = currentFolder === 'Корзина';

  const handleAddNote = () => {
    const newNote = {
      id: Date.now() + '',
      title: '',
      content: '',
      folder: currentFolder,
      color: brandColor,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deleted: false,
      pinned: false,
      isNew: true // Добавляем флаг, что это новая заметка
    };
    setSelectedNote(newNote);
    setCurrentScreen('edit');
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Header 
        title={currentFolder} 
        rightIcon="settings" 
        onRightPress={() => setCurrentScreen('settings')} 
        showBack 
        onBack={() => setCurrentScreen('folders')} 
        showSearch 
        onSearchPress={goToSearch} 
        showPalette={false} 
        brandColor={brandColor}
      />
      
      <FlatList 
        data={sortedNotes} 
        keyExtractor={item => item.id} 
        renderItem={({ item }) => <NoteItem 
          item={item} 
          onPress={() => handleNotePress(item)} 
          onLongPress={() => { setSelectedNoteForAction(item); setShowNoteDialog(true); }} 
          settings={settings} 
          showPin={!isInTrash}
        />} 
        ListEmptyComponent={<View style={{ padding: 32, alignItems: 'center' }}>
          <Text style={{ color: '#999' }}>Нет заметок</Text>
        </View>} 
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      
      {!isInTrash && (
        <TouchableOpacity 
          style={{ 
            position: 'absolute', 
            bottom: insets.bottom + 24, 
            right: insets.right + 24, 
            width: 70, 
            height: 70, 
            borderRadius: 35, 
            backgroundColor: brandColor, 
            justifyContent: 'center', 
            alignItems: 'center', 
            elevation: 5 
          }} 
          onPress={handleAddNote}>
          <MaterialIcons name="add" size={36} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default NotesListScreen;
