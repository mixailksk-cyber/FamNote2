// =====================================================
// FILE: WidgetBridge.js
// =====================================================
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { WidgetDataModule } = NativeModules;

export const updateWidgetData = async (notes) => {
  try {
    console.log('🔄 [WidgetBridge] updateWidgetData called');
    
    if (!notes || !Array.isArray(notes)) {
      console.log('❌ [WidgetBridge] No notes array provided');
      return;
    }

    console.log(`📊 [WidgetBridge] Total notes: ${notes.length}`);

    // Берем только заметки из папки "Главная" (не удаленные)
    const mainFolderNotes = notes
      .filter(note => {
        const isMain = note.folder === 'Главная';
        const notDeleted = !note.deleted;
        console.log(`📝 [WidgetBridge] Note ${note.id}: folder=${note.folder}, deleted=${note.deleted}, isMain=${isMain}, notDeleted=${notDeleted}`);
        return isMain && notDeleted;
      })
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .map(note => ({
        id: note.id,
        title: note.title || 'Без названия',
        content: note.content || '...',
        date: note.updatedAt || note.createdAt || Date.now()
      }));
    
    console.log(`✅ [WidgetBridge] Filtered notes for widget: ${mainFolderNotes.length}`);
    
    const notesJson = JSON.stringify(mainFolderNotes);
    console.log(`📦 [WidgetBridge] JSON: ${notesJson}`);
    
    // Сохраняем в AsyncStorage для резерва
    await AsyncStorage.setItem('@widget_notes', notesJson);
    console.log('💾 [WidgetBridge] Saved to AsyncStorage');
    
    // Отправляем в нативный модуль
    if (Platform.OS === 'android') {
      if (WidgetDataModule) {
        console.log('📱 [WidgetBridge] Sending to native module');
        WidgetDataModule.updateWidgetNotes(notesJson);
      } else {
        console.log('❌ [WidgetBridge] WidgetDataModule not available');
      }
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
