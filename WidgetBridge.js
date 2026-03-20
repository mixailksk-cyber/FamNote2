// =====================================================
// FILE: WidgetBridge.js
// =====================================================
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Получаем нативный модуль
const { WidgetDataModule } = NativeModules;

export const updateWidgetData = async (notes) => {
  try {
    if (!notes || !Array.isArray(notes)) {
      console.log('No notes to update widget');
      return;
    }

    // Берем только заметки из Главной папки (не удаленные)
    const mainFolderNotes = notes
      .filter(note => note.folder === 'Главная' && !note.deleted)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .map(note => ({
        id: note.id,
        title: note.title || 'Без названия',
        content: note.content || '...',
        date: note.updatedAt || note.createdAt || Date.now()
      }));
    
    const notesJson = JSON.stringify(mainFolderNotes);
    
    // Сохраняем в AsyncStorage для резерва
    await AsyncStorage.setItem('@widget_notes', notesJson);
    
    // Отправляем в нативный модуль, если он существует
    if (Platform.OS === 'android' && WidgetDataModule) {
      console.log('Sending notes to widget module:', mainFolderNotes.length);
      WidgetDataModule.updateWidgetNotes(notesJson);
    } else {
      console.log('Widget module not available on this platform');
    }
    
  } catch (error) {
    console.error('Error updating widget:', error);
  }
};

export const getWidgetNotes = async () => {
  try {
    const notesJson = await AsyncStorage.getItem('@widget_notes');
    return notesJson ? JSON.parse(notesJson) : [];
  } catch (error) {
    console.error('Error getting widget notes:', error);
    return [];
  }
};
