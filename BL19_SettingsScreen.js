// =====================================================
// FILE: BL19_SettingsScreen.js
// =====================================================
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import { MaterialIcons } from '@expo/vector-icons';
import Header from './BL04_Header';
import { NOTE_COLORS, getBrandColor } from './BL02_Constants';
import { useTheme } from './BL21_ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { NativeModules } from 'react-native';

const { WidgetDataModule } = NativeModules;

const SettingsScreen = ({ setCurrentScreen, goToSearch, settings, saveSettings, notes, folders, onBrandColorChange, onDataRestored }) => {
  const fontSizeOptions = [14, 16, 18, 20, 22, 24];
  const brandColor = getBrandColor(settings);
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [logs, setLogs] = useState([]);

  const addLog = (message, data) => {
    const time = new Date().toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    const logEntry = {
      time,
      message,
      data: data ? JSON.stringify(data, null, 2) : null
    };
    console.log(`📋 [${time}] ${message}`, data || '');
    setLogs(prev => [...prev.slice(-9), logEntry]);
  };

  useEffect(() => {
    checkFileSystem();
  }, []);

  const checkFileSystem = async () => {
    addLog('🔍 Проверка файловой системы...');
    
    const info = {
      platform: Platform.OS,
      platformVersion: Platform.Version,
      documentDirectory: FileSystem.documentDirectory || 'null',
      cacheDirectory: FileSystem.cacheDirectory || 'null',
      sharingAvailable: await Sharing.isAvailableAsync(),
    };

    addLog('📁 Информация о ФС:', info);
  };

  const formatDateForFilename = () => {
    const date = new Date();
    return `${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
  };

  const handleFontSizeChange = (size) => saveSettings({ ...settings, fontSize: size });

  const handleBrandColorChange = (color) => {
    saveSettings({ ...settings, brandColor: color });
    if (onBrandColorChange) onBrandColorChange(color);
  };

  const handleBackup = async () => {
    try {
      addLog('💾 Начало резервного копирования...');
      
      const backup = { notes, folders, settings };
      const backupStr = JSON.stringify(backup, null, 2);
      const fileName = `FamNote_Backup_${formatDateForFilename()}.bak`;

      addLog('📦 Размер бэкапа:', backupStr.length);

      if (Platform.OS === 'web') {
        addLog('🌐 Web платформа');
        const blob = new Blob([backupStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        Alert.alert('✅ Успех', 'Резервная копия создана');
        return;
      }

      if (FileSystem.documentDirectory) {
        addLog('📁 documentDirectory:', FileSystem.documentDirectory);
        
        const fileUri = FileSystem.documentDirectory + fileName;
        addLog('📄 URI файла:', fileUri);
        
        await FileSystem.writeAsStringAsync(fileUri, backupStr, {
          encoding: FileSystem.EncodingType.UTF8
        });
        addLog('✅ Файл записан');

        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        addLog('📊 Информация о файле:', fileInfo);

        if (fileInfo.exists) {
          if (await Sharing.isAvailableAsync()) {
            addLog('📤 Открываем диалог сохранения...');
            await Sharing.shareAsync(fileUri, {
              mimeType: 'application/octet-stream',
              dialogTitle: 'Сохранить резервную копию'
            });
          } else {
            Alert.alert('✅ Файл создан', `Файл сохранен:\n${fileUri}`);
          }
        }
      }

    } catch (e) {
      addLog('❌ Ошибка бэкапа:', e);
      Alert.alert('❌ Ошибка', 'Не удалось создать резервную копию');
    }
  };

  const handleRestore = async () => {
    try {
      addLog('🔄 Начало восстановления...');
      
      addLog('📂 Открываем DocumentPicker...');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/octet-stream', 'application/json', '*/*'],
        copyToCacheDirectory: true
      });
      
      addLog('📦 Результат:', result);

      if (result.canceled) {
        addLog('❌ Выбор отменен');
        return;
      }
      
      const asset = result.assets[0];
      addLog('📄 Выбран файл:', {
        name: asset.name,
        size: asset.size,
        uri: asset.uri
      });

      let content;
      
      if (Platform.OS === 'web') {
        const response = await fetch(asset.uri);
        content = await response.text();
      } else {
        const tempFile = FileSystem.cacheDirectory + 'temp_restore.bak';
        addLog('📁 Копируем во временный файл:', tempFile);
        
        await FileSystem.copyAsync({
          from: asset.uri,
          to: tempFile
        });
        
        content = await FileSystem.readAsStringAsync(tempFile, {
          encoding: FileSystem.EncodingType.UTF8
        });
        
        await FileSystem.deleteAsync(tempFile);
      }

      addLog('📄 Содержимое (первые 100 символов):', content.substring(0, 100));

      addLog('🔍 Парсим JSON...');
      const backup = JSON.parse(content);
      
      addLog('📊 Структура бэкапа:', {
        notesCount: backup.notes?.length,
        foldersCount: backup.folders?.length,
        hasSettings: !!backup.settings
      });

      if (backup.notes && backup.folders) {
        addLog('💾 Сохраняем в AsyncStorage...');
        
        const normalizedNotes = backup.notes.map(n => ({ 
          ...n, 
          color: n.color || brandColor 
        }));
        
        await AsyncStorage.setItem('notes', JSON.stringify(normalizedNotes));
        await AsyncStorage.setItem('folders', JSON.stringify(backup.folders));
        
        if (backup.settings) {
          await AsyncStorage.setItem('settings', JSON.stringify(backup.settings));
        }
        
        addLog('✅ Данные сохранены в AsyncStorage');
        
        Alert.alert(
          '✅ Успех', 
          'Данные восстановлены. Перезапустите приложение для применения изменений.',
          [
            { 
              text: 'OK', 
              onPress: () => {
                setCurrentScreen('notes');
              }
            }
          ]
        );
      } else {
        throw new Error('Неверный формат файла');
      }

    } catch (e) {
      addLog('❌ Ошибка восстановления:', {
        message: e.message,
        stack: e.stack
      });
      
      Alert.alert('❌ Ошибка', `Не удалось восстановить данные: ${e.message}`);
    }
  };

  const diagnoseWidget = async () => {
    const logs = [];
    const timestamp = new Date().toLocaleString('ru-RU');
    
    logs.push(`🔍 Диагностика виджета ${timestamp}`);
    logs.push('='.repeat(40));
    
    if (Platform.OS === 'android') {
      if (WidgetDataModule) {
        logs.push('✅ Native module WidgetDataModule доступен');
      } else {
        logs.push('❌ Native module WidgetDataModule НЕ доступен');
      }
      
      logs.push(`📁 Document directory: ${FileSystem.documentDirectory || 'null'}`);
      logs.push(`📁 Cache directory: ${FileSystem.cacheDirectory || 'null'}`);
      
      try {
        const fileUri = FileSystem.documentDirectory + 'widget_notes.json';
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        logs.push(`📄 Файл ${fileUri}: ${fileInfo.exists ? 'существует, размер: ' + fileInfo.size : 'НЕ существует'}`);
        
        if (fileInfo.exists) {
          const content = await FileSystem.readAsStringAsync(fileUri);
          logs.push(`📝 Содержимое файла (первые 200 символов): ${content.substring(0, 200)}...`);
        }
      } catch (e) {
        logs.push(`❌ Ошибка проверки файла: ${e.message}`);
      }
    }
    
    const mainFolderNotes = notes.filter(n => n.folder === 'Главная' && !n.deleted);
    logs.push(`📊 Заметок в папке "Главная": ${mainFolderNotes.length}`);
    
    if (mainFolderNotes.length > 0) {
      logs.push('📝 Список заметок:');
      mainFolderNotes.forEach((note, index) => {
        logs.push(`  ${index + 1}. ${note.title || 'Без названия'} (ID: ${note.id})`);
      });
    } else {
      logs.push('⚠️ Создайте хотя бы одну заметку в папке "Главная"');
    }
    
    const widgetNotes = mainFolderNotes.map(note => ({
      id: note.id,
      title: note.title || 'Без названия',
      content: (note.content || '').substring(0, 50),
      date: note.updatedAt || note.createdAt || Date.now()
    }));
    
    const notesJson = JSON.stringify(widgetNotes);
    logs.push(`📦 JSON для виджета (${notesJson.length} символов):`);
    logs.push(notesJson.substring(0, 500) + (notesJson.length > 500 ? '...' : ''));
    
    try {
      const savedJson = await AsyncStorage.getItem('@widget_notes');
      logs.push(`💾 В AsyncStorage: ${savedJson ? savedJson.substring(0, 100) + '...' : 'null'}`);
    } catch (e) {
      logs.push(`❌ Ошибка чтения AsyncStorage: ${e.message}`);
    }
    
    if (Platform.OS === 'android' && WidgetDataModule) {
      try {
        WidgetDataModule.updateWidgetNotes(notesJson);
        logs.push('✅ Данные отправлены в нативный модуль');
      } catch (e) {
        logs.push(`❌ Ошибка отправки: ${e.message}`);
      }
    }
    
    Alert.alert(
      '📱 Диагностика виджета',
      logs.join('\n'),
      [
        { 
          text: 'Копировать', 
          onPress: () => {
            Clipboard.setStringAsync(logs.join('\n'));
            Alert.alert('✅ Скопировано', 'Логи скопированы в буфер обмена');
          }
        },
        { text: 'OK' }
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Header 
        title="Настройки" 
        showBack 
        onBack={() => setCurrentScreen('notes')} 
        rightIcon="close" 
        onRightPress={() => setCurrentScreen('notes')} 
        showSearch 
        onSearchPress={goToSearch} 
        brandColor={brandColor}
        theme={theme}
      />
      
      <ScrollView style={{ flex: 1, padding: 20 }}>
        {/* Размер текста */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: theme.text, marginBottom: 16 }}>Размер текста</Text>
          <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap' }}>
              {fontSizeOptions.map((size) => (
                <TouchableOpacity 
                  key={size} 
                  onPress={() => handleFontSizeChange(size)} 
                  style={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: 22, 
                    backgroundColor: settings.fontSize === size ? brandColor : theme.divider, 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    margin: 4 
                  }}
                >
                  <Text style={{ color: settings.fontSize === size ? 'white' : theme.textSecondary }}>{size}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Цвет бренда */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: theme.text, marginBottom: 16 }}>Цвет бренда</Text>
          <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 20 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              {NOTE_COLORS.map((color, index) => (
                <TouchableOpacity 
                  key={index} 
                  onPress={() => handleBrandColorChange(color)} 
                  style={{ 
                    width: 50, 
                    height: 50, 
                    borderRadius: 25, 
                    backgroundColor: color, 
                    margin: 6, 
                    borderWidth: brandColor === color ? 3 : 0, 
                    borderColor: theme.text 
                  }} 
                />
              ))}
            </View>
          </View>
        </View>

        {/* Тёмная тема */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: theme.text, marginBottom: 16 }}>Тёмная тема</Text>
          <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 20 }}>
            <TouchableOpacity 
              style={{ 
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12,
              }} 
              onPress={toggleTheme}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons 
                  name={isDarkMode ? "dark-mode" : "light-mode"} 
                  size={24} 
                  color={brandColor} 
                  style={{ marginRight: 12 }}
                />
                <Text style={{ fontSize: 16, color: theme.text }}>
                  {isDarkMode ? "Тёмная тема включена" : "Светлая тема включена"}
                </Text>
              </View>
              <MaterialIcons 
                name={isDarkMode ? "toggle-on" : "toggle-off"} 
                size={32} 
                color={brandColor} 
              />
            </TouchableOpacity>
            <Text style={{ color: theme.textHint, fontSize: 12, marginTop: 8, textAlign: 'center' }}>
              Переключить тему оформления приложения
            </Text>
          </View>
        </View>

        {/* Резервное копирование */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: theme.text, marginBottom: 16 }}>Резервное копирование</Text>
          <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 20, gap: 12 }}>
            <TouchableOpacity 
              style={{ 
                backgroundColor: brandColor, 
                padding: 16, 
                borderRadius: 12, 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'center'
              }} 
              onPress={handleBackup}
            >
              <MaterialIcons name="backup" size={24} color="white" style={{ marginRight: 8 }} />
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Создать копию</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={{ 
                backgroundColor: theme.error, 
                padding: 16, 
                borderRadius: 12, 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'center'
              }} 
              onPress={() => {
                Alert.alert(
                  'Восстановление', 
                  'Все данные будут заменены. Продолжить?', 
                  [
                    { text: 'Отмена', style: 'cancel' }, 
                    { text: 'Восстановить', onPress: handleRestore }
                  ]
                );
              }}
            >
              <MaterialIcons name="restore" size={24} color="white" style={{ marginRight: 8 }} />
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Восстановить</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Диагностика виджета */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: theme.text, marginBottom: 16 }}>Диагностика виджета</Text>
          <View style={{ backgroundColor: theme.surface, borderRadius: 16, padding: 20 }}>
            <TouchableOpacity 
              style={{ 
                backgroundColor: theme.success, 
                padding: 16, 
                borderRadius: 12, 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'center'
              }} 
              onPress={diagnoseWidget}
            >
              <MaterialIcons name="bug-report" size={24} color="white" style={{ marginRight: 8 }} />
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Проверить виджет</Text>
            </TouchableOpacity>
            <Text style={{ color: theme.textHint, fontSize: 12, marginTop: 8, textAlign: 'center' }}>
              Результат появится в диалоговом окне
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;
