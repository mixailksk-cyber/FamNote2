// =====================================================
// FILE: WidgetBridge.js
// =====================================================
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { WidgetDataModule } = NativeModules;

// Функция для логирования с временной меткой
const log = (message, data) => {
  const timestamp = new Date().toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });
  console.log(`📱 Widget [${timestamp}] ${message}`, data || '');
};

export const updateWidgetData = async (notes) => {
  try {
    log('='.repeat(50));
    log('🔄 updateWidgetData started');
    
    // Проверяем входные данные
    if (!notes) {
      log('❌ notes is null or undefined');
      return;
    }
    
    if (!Array.isArray(notes)) {
      log('❌ notes is not an array, type:', typeof notes);
      return;
    }
    
    log(`📊 Total notes in app: ${notes.length}`);
    
    // Логируем первые 3 заметки для примера
    if (notes.length > 0) {
      log('📝 Sample notes:');
      notes.slice(0, 3).forEach((note, i) => {
        log(`  Note ${i + 1}:`, {
          id: note.id,
          folder: note.folder,
          deleted: note.deleted,
          title: (note.title || '').substring(0, 20)
        });
      });
    }

    // Фильтруем заметки из папки "Главная"
    const mainFolderNotes = notes
      .filter(note => {
        const isMain = note.folder === 'Главная';
        const notDeleted = !note.deleted;
        
        // Логируем каждую заметку при фильтрации
        if (note.folder === 'Главная') {
          log(`🔍 Filtering note:`, {
            id: note.id,
            title: (note.title || '').substring(0, 20),
            folder: note.folder,
            deleted: note.deleted,
            isMain,
            notDeleted,
            willInclude: isMain && notDeleted
          });
        }
        
        return isMain && notDeleted;
      })
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .map(note => ({
        id: note.id,
        title: note.title || 'Без названия',
        content: note.content || '...',
        date: note.updatedAt || note.createdAt || Date.now()
      }));
    
    log(`🎯 Found ${mainFolderNotes.length} notes in Главная folder`);
    
    if (mainFolderNotes.length === 0) {
      log('⚠️ No notes in Главная folder, sending empty array');
    } else {
      log('📋 Notes for widget:', mainFolderNotes.map(n => ({
        id: n.id,
        title: n.title.substring(0, 20)
      })));
    }
    
    const notesJson = JSON.stringify(mainFolderNotes);
    log(`📦 JSON size: ${notesJson.length} bytes`);
    log(`📄 JSON preview: ${notesJson.substring(0, 200)}...`);
    
    // Сохраняем в AsyncStorage (для отладки)
    await AsyncStorage.setItem('@widget_notes', notesJson);
    log('💾 Saved to AsyncStorage');
    
    // Проверяем, что сохранилось
    const saved = await AsyncStorage.getItem('@widget_notes');
    log('✅ Verified saved in AsyncStorage, length:', saved?.length);
    
    // Для Android - передаем в нативный модуль
    if (Platform.OS === 'android') {
      log('🤖 Android platform detected');
      
      if (WidgetDataModule) {
        log('✅ WidgetDataModule found, sending data...');
        log('📤 WidgetDataModule methods:', Object.keys(WidgetDataModule));
        
        try {
          // Пробуем вызвать нативный метод
          WidgetDataModule.updateWidgetNotes(notesJson);
          log('✅ Data sent to native module successfully');
          
          // Проверяем через секунду, не упал ли виджет
          setTimeout(() => {
            log('⏱️ Widget should be updated by now');
          }, 1000);
          
        } catch (e) {
          log('❌ Error calling native module:', {
            message: e.message,
            stack: e.stack
          });
        }
      } else {
        log('❌ WidgetDataModule NOT FOUND!');
        log('📋 Available NativeModules:', Object.keys(NativeModules).filter(
          name => !name.includes('$$') && !name.includes('__')
        ));
      }
    } else {
      log(`📱 Platform ${Platform.OS} - no native widget support`);
    }
    
    log('✅ updateWidgetData completed');
    log('='.repeat(50));
    
  } catch (error) {
    log('💥 FATAL ERROR in updateWidgetData:', {
      message: error.message,
      stack: error.stack
    });
  }
};

// Функция для ручного тестирования (можно вызвать из консоли)
export const testWidget = async () => {
  log('🧪 Running manual widget test');
  const notesJson = await AsyncStorage.getItem('@widget_notes');
  log('📄 Current widget data:', notesJson);
  
  if (Platform.OS === 'android' && WidgetDataModule) {
    try {
      WidgetDataModule.updateWidgetNotes(notesJson || '[]');
      log('✅ Manual update sent');
    } catch (e) {
      log('❌ Manual update failed:', e);
    }
  }
};

export const getWidgetNotes = async () => {
  try {
    const notesJson = await AsyncStorage.getItem('@widget_notes');
    log('📖 getWidgetNotes:', notesJson ? notesJson.substring(0, 100) : 'null');
    return notesJson ? JSON.parse(notesJson) : [];
  } catch (error) {
    log('❌ Error getting widget notes:', error);
    return [];
  }
};
