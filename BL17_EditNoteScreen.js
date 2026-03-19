import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Share, InteractionManager, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Header from './BL04_Header';
import ColorPickerModal from './BL08_ColorPickerModal';
import { BRAND_COLOR, NOTE_COLORS, TITLE_MAX_LENGTH, NOTE_MAX_LENGTH, getBrandColor } from './BL02_Constants';

const EditNoteScreen = ({ selectedNote, currentFolder, notes, settings, navigationStack, onSave, setCurrentScreen, setNavigationStack, setSearchQuery, insets, searchQuery, setCurrentFolder }) => {
  const brandColor = getBrandColor(settings);
  const [note, setNote] = useState(selectedNote ? { ...selectedNote } : { 
    id: Date.now() + '', 
    title: '', 
    content: '', 
    color: brandColor, 
    folder: currentFolder, 
    createdAt: Date.now(), 
    updatedAt: Date.now(), 
    deleted: false, 
    pinned: false,
    locked: false
  });
  const [showColor, setShowColor] = useState(false);
  const [isEditing, setIsEditing] = useState(selectedNote?.isNew || !selectedNote);
  const contentInputRef = useRef(null);
  const titleInputRef = useRef(null);
  const scrollViewRef = useRef(null);
  const comingFromSearch = useMemo(() => navigationStack[navigationStack.length - 1] === 'search', [navigationStack]);
  const hasChanges = useMemo(() => {
    if (!selectedNote) return note.title !== '' || note.content !== '' || note.color !== brandColor;
    return selectedNote.title !== note.title || selectedNote.content !== note.content || selectedNote.color !== note.color;
  }, [note, selectedNote, brandColor]);
  const isInTrash = note.folder === 'Корзина' || note.deleted === true;
  const isNewNote = !selectedNote || selectedNote?.isNew;
  const isLocked = note.locked === true;

  // Фокус на content при включении режима редактирования
  useEffect(() => {
    if (isEditing && contentInputRef.current && !isLocked) {
      const focusTask = InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          contentInputRef.current.focus();
          contentInputRef.current.setNativeProps({
            selection: { start: note.content.length, end: note.content.length }
          });
        }, 100);
      });
      return () => focusTask.cancel();
    }
  }, [isEditing, note.content.length, isLocked]);

  // Для новой заметки проверяем, что режим редактирования включен
  useEffect(() => {
    if (isNewNote) {
      setIsEditing(true);
    }
  }, [isNewNote]);

  const handleShare = async () => {
    try {
      const message = note.title ? `${note.title}\n\n${note.content}` : note.content;
      await Share.share({ message, title: note.title || 'Заметка' });
    } catch (error) {
      console.log(error);
    }
  };

  const handlePermanentDelete = () => {
    const updatedNotes = notes.filter(n => n.id !== note.id);
    onSave(updatedNotes);
    setNavigationStack(prev => prev.slice(0, -1));
    setCurrentScreen('notes');
    setCurrentFolder('Корзина');
  };

  const handleDelete = () => {
    if (isInTrash) {
      handlePermanentDelete();
      return;
    }
    const updatedNote = { ...note, folder: 'Корзина', deleted: true, pinned: false, updatedAt: Date.now() };
    onSave(updatedNote);
    setNavigationStack(prev => prev.slice(0, -1));
    if (comingFromSearch) {
      setCurrentScreen('search');
      setCurrentFolder(note.folder); 
    } else {
      const prevScreen = navigationStack[navigationStack.length - 1] || 'notes';
      setCurrentScreen(prevScreen);
    }
  };

  const handleUnlock = () => {
    // Создаем обновленную заметку без блокировки
    const updatedNote = { 
      ...note, 
      locked: false, 
      updatedAt: Date.now() 
    };
    
    // Обновляем локальное состояние
    setNote(updatedNote);
    
    // Сохраняем в общем хранилище с флагом, что это разблокировка
    const { isNew, ...noteToSave } = updatedNote;
    onSave(noteToSave, true); // Передаем true как флаг "skipNavigation"
    
    console.log('Note unlocked, staying on view mode');
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Несохраненные изменения',
        'У вас есть несохраненные изменения. Выйти без сохранения?',
        [
          { text: 'Отмена', style: 'cancel' },
          { 
            text: 'Выйти', 
            onPress: () => {
              setNavigationStack(prev => prev.slice(0, -1));
              if (selectedNote && !selectedNote.isNew) {
                if (comingFromSearch) {
                  setCurrentScreen('search');
                  setCurrentFolder(selectedNote.folder);
                } else {
                  setCurrentScreen('notes');
                  setCurrentFolder(selectedNote.folder);
                  setSearchQuery('');
                }
              } else if (comingFromSearch) {
                setCurrentScreen('search');
                setCurrentFolder(currentFolder);
              } else {
                const prevScreen = navigationStack[navigationStack.length - 1] || 'notes';
                setCurrentScreen(prevScreen);
              }
            }
          }
        ]
      );
    } else {
      setNavigationStack(prev => prev.slice(0, -1));
      if (selectedNote && !selectedNote.isNew) {
        if (comingFromSearch) {
          setCurrentScreen('search');
          setCurrentFolder(selectedNote.folder);
        } else {
          setCurrentScreen('notes');
          setCurrentFolder(selectedNote.folder);
          setSearchQuery('');
        }
      } else if (comingFromSearch) {
        setCurrentScreen('search');
        setCurrentFolder(currentFolder);
      } else {
        const prevScreen = navigationStack[navigationStack.length - 1] || 'notes';
        setCurrentScreen(prevScreen);
      }
    }
  };

  const handleSave = () => {
    const { isNew, ...noteToSave } = note;
    if (hasChanges) onSave({ ...noteToSave, updatedAt: Date.now() }, false);
    else onSave(noteToSave, false);
    setIsEditing(false);
  };

  const handleEditPress = () => {
    if (!isLocked) {
      setIsEditing(true);
    } else {
      Alert.alert('Заметка заблокирована', 'Нажмите на замок в шапке для разблокировки');
    }
  };

  const handleTitlePress = () => {
    if (!isEditing && !isLocked && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  };

  const buttonSize = 70;
  const buttonBottom = insets.bottom + 24;
  const buttonRight = 24;

  const headerTitle = isEditing ? "Редактирование" : "Просмотр";
  // Цвет шапки = цвет заметки (или цвет бренда, если у заметки нет цвета)
  const headerColor = note.color || brandColor;

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: 'white' }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Header 
        title={headerTitle}
        showBack 
        onBack={handleBack} 
        rightIcon="settings" 
        onRightPress={() => setCurrentScreen('settings')} 
        showPalette 
        onPalettePress={() => setShowColor(true)} 
        showSearch={false} 
        brandColor={headerColor}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Кнопка замка - показывается только если заметка заблокирована и не в режиме редактирования */}
          {isLocked && !isEditing && (
            <TouchableOpacity onPress={handleUnlock} style={{ marginRight: 20 }}>
              <MaterialIcons name="lock" size={24} color="white" />
            </TouchableOpacity>
          )}
          
          {/* Кнопка поделиться - всегда показывается */}
          <TouchableOpacity onPress={handleShare} style={{ marginRight: 20 }}>
            <MaterialIcons name="share" size={24} color="white" />
          </TouchableOpacity>
          
          {/* Кнопка удалить - всегда показывается */}
          <TouchableOpacity onPress={handleDelete}>
            <MaterialIcons name="delete" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </Header>

      <ScrollView 
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          {isEditing ? (
            <TextInput 
              ref={titleInputRef}
              style={{ fontSize: settings.fontSize + 2, fontWeight: 'bold', paddingVertical: 8, color: '#333' }} 
              placeholder="Заголовок" 
              placeholderTextColor="#999" 
              maxLength={TITLE_MAX_LENGTH} 
              value={note.title} 
              onChangeText={t => setNote({ ...note, title: t })}
              editable={!isInTrash && isEditing && !isLocked}
            />
          ) : (
            <TouchableOpacity onPress={handleTitlePress} activeOpacity={0.7}>
              <Text style={{ fontSize: settings.fontSize + 2, fontWeight: 'bold', paddingVertical: 8, color: '#333' }}>
                {note.title || 'Заголовок'}
              </Text>
            </TouchableOpacity>
          )}
          <View style={{ height: 2, backgroundColor: note.color || brandColor, width: '100%', marginTop: 4 }} />
        </View>

        {isEditing ? (
          <TextInput 
            ref={contentInputRef}
            style={{ fontSize: settings.fontSize, paddingHorizontal: 16, paddingVertical: 12, textAlignVertical: 'top', color: '#333', minHeight: 200 }} 
            placeholder="Текст заметки..." 
            placeholderTextColor="#999" 
            multiline 
            maxLength={NOTE_MAX_LENGTH} 
            value={note.content} 
            onChangeText={t => setNote({ ...note, content: t })}
            editable={!isInTrash && isEditing && !isLocked}
            scrollEnabled={true}
          />
        ) : (
          <Text 
            selectable={true}
            style={{ fontSize: settings.fontSize, paddingHorizontal: 16, paddingVertical: 12, color: '#333', lineHeight: settings.fontSize * 1.5 }}
          >
            {note.content || '...'}
          </Text>
        )}
      </ScrollView>

      <TouchableOpacity 
        style={{ 
          position: 'absolute', 
          bottom: buttonBottom, 
          right: buttonRight, 
          width: buttonSize, 
          height: buttonSize, 
          borderRadius: buttonSize / 2, 
          backgroundColor: note.color || brandColor, 
          justifyContent: 'center', 
          alignItems: 'center', 
          elevation: 5, 
          zIndex: 1000,
          opacity: isLocked && !isEditing ? 0.5 : 1
        }} 
        onPress={isEditing ? handleSave : handleEditPress}
        disabled={isLocked && !isEditing}
      >
        <MaterialIcons name={isEditing ? "check" : "edit"} size={36} color="white" />
      </TouchableOpacity>

      <ColorPickerModal 
        visible={showColor} 
        onClose={() => setShowColor(false)} 
        selectedColor={note.color} 
        onSelect={(color) => setNote({ ...note, color, updatedAt: Date.now() })} 
        settings={settings}
      />
    </KeyboardAvoidingView>
  );
};

export default EditNoteScreen;
