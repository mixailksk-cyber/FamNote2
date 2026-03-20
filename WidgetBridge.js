// =====================================================
// FILE: WidgetBridge.js
// =====================================================
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const { WidgetDataModule } = NativeModules;

export const updateWidgetData = async (notes) => {
  try {
    console.log('🔄 [WidgetBridge] updateWidgetData called');
    
    if (!notes || !Array.isArray(notes)) {
      return;
    }

    // Берем только заметки из папки "Главная"
    const mainFolderNotes = notes
      .filter(note => note.folder === 'Главная' && !note.deleted)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .map(note => ({
        id: note.id,
        title: note.title || 'Без названия',
        content: (note.content || '').substring(0, 100),
        date: note.updatedAt || note.createdAt || Date.now()
      }));
    
    const notesJson = JSON.stringify(mainFolderNotes);
    
    // Сохраняем в AsyncStorage
    await AsyncStorage.setItem('@widget_notes', notesJson);
    
    // Сохраняем в файл через FileSystem
    if (Platform.OS === 'android' && FileSystem.documentDirectory) {
      try {
        const fileUri = FileSystem.documentDirectory + 'widget_notes.json';
        await FileSystem.writeAsStringAsync(fileUri, notesJson);
        console.log('💾 Saved to file:', fileUri);
      } catch (e) {
        console.log('FileSystem error:', e);
      }
    }
    
    // Отправляем в нативный модуль
    if (Platform.OS === 'android' && WidgetDataModule) {
      try {
        WidgetDataModule.updateWidgetNotes(notesJson);
      } catch (e) {
        console.log('Native module error:', e);
      }
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
    return [];
  }
};
