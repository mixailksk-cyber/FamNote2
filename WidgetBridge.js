// =====================================================
// FILE: WidgetBridge.js
// =====================================================
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const { WidgetDataModule } = NativeModules;

export const updateWidgetData = async (notes) => {
  try {
    console.log('🔄 [WidgetBridge] updateWidgetData called');
    
    if (!notes || !Array.isArray(notes)) {
      console.log('❌ [WidgetBridge] No notes array provided');
      return;
    }

    // Берем только заметки из папки "Главная"
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
    console.log(`✅ [WidgetBridge] Filtered ${mainFolderNotes.length} notes`);
    console.log(`📦 [WidgetBridge] JSON length: ${notesJson.length}`);
    
    // Сохраняем в AsyncStorage
    await AsyncStorage.setItem('@widget_notes', notesJson);
    console.log('💾 [WidgetBridge] Saved to AsyncStorage');
    
    // Сохраняем в файл через FileSystem (экспо-способ)
    if (Platform.OS === 'android') {
      try {
        const fileUri = FileSystem.documentDirectory + 'widget_notes.json';
        await FileSystem.writeAsStringAsync(fileUri, notesJson);
        console.log(`💾 [WidgetBridge] Saved to file: ${fileUri}`);
      } catch (e) {
        console.log('❌ [WidgetBridge] FileSystem error:', e);
      }
    }
    
    // Пытаемся отправить в нативный модуль
    if (Platform.OS === 'android' && WidgetDataModule) {
      try {
        WidgetDataModule.updateWidgetNotes(notesJson);
        console.log('📱 [WidgetBridge] Sent to native module');
      } catch (e) {
        console.log('❌ [WidgetBridge] Native module error:', e);
      }
    } else {
      console.log('⚠️ [WidgetBridge] Native module not available');
    }
    
  } catch (error) {
    console.error('❌ [WidgetBridge] Error updating widget:', error);
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
