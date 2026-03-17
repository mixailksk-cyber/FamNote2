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
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useNotesData } from './BL12_DataHooks'; // Добавляем импорт

const SettingsScreen = ({ 
  setCurrentScreen, 
  goToSearch, 
  settings, 
  saveSettings, 
  notes, 
  folders, 
  onBrandColorChange,
  onDataRestored // Добавляем проп для уведомления о восстановлении
}) => {
  const fontSizeOptions = [14, 16, 18, 20, 22, 24];
  const brandColor = getBrandColor(settings);
  const [logs, setLogs] = useState([]);
  const { loadData } = useNotesData(); // Получаем функцию загрузки данных

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

      // Читаем файл
      addLog('📖 Чтение файла...');
      let content;
      
      if (Platform.OS === 'web') {
        const response = await fetch(asset.uri);
        content = await response.text();
      } else {
        // Копируем во временный файл
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
        
        // Нормализуем заметки
        const normalizedNotes = backup.notes.map(n => ({ 
          ...n, 
          color: n.color || brandColor 
        }));
        
        // Сохраняем данные
        await AsyncStorage.setItem('notes', JSON.stringify(normalizedNotes));
        await AsyncStorage.setItem('folders', JSON.stringify(backup.folders));
        
        if (backup.settings) {
          await AsyncStorage.setItem('settings', JSON.stringify(backup.settings));
        }
        
        addLog('✅ Данные сохранены в AsyncStorage');
        
        // ВАЖНО: Уведомляем приложение о необходимости перезагрузить данные
        addLog('🔄 Уведомляем приложение о восстановлении...');
        
        // Вызываем функцию перезагрузки данных
        if (onDataRestored) {
          onDataRestored();
        }
        
        // Показываем успех и предлагаем перезапустить
        Alert.alert(
          '✅ Успех', 
          'Данные восстановлены. Перезапустите приложение для применения изменений.',
          [
            { 
              text: 'OK', 
              onPress: () => {
                // Возвращаемся на главный экран
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

  const showLogs = () => {
    Alert.alert(
      '📋 Логи операций',
      logs.map(log => 
        `[${log.time}] ${log.message}\n${log.data ? log.data : ''}`
      ).join('\n\n') || 'Логов нет',
      [
        { text: 'Очистить', onPress: () => setLogs([]) },
        { text: 'OK' }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Header 
        title="Настройки" 
        showBack 
        onBack={() => setCurrentScreen('notes')} 
        rightIcon="close" 
        onRightPress={() => setCurrentScreen('notes')} 
        showSearch 
        onSearchPress={goToSearch} 
        brandColor={brandColor}
      />
      
      <ScrollView style={{ flex: 1, padding: 20 }}>
        {/* Размер текста */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16 }}>Размер текста</Text>
          <View style={{ backgroundColor: '#F8F9FA', borderRadius: 16, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap' }}>
              {fontSizeOptions.map((size) => (
                <TouchableOpacity 
                  key={size} 
                  onPress={() => handleFontSizeChange(size)} 
                  style={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: 22, 
                    backgroundColor: settings.fontSize === size ? brandColor : '#F0F0F0', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    margin: 4 
                  }}
                >
                  <Text style={{ color: settings.fontSize === size ? 'white' : '#666' }}>{size}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Цвет бренда */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16 }}>Цвет бренда</Text>
          <View style={{ backgroundColor: '#F8F9FA', borderRadius: 16, padding: 20 }}>
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
                    borderColor: '#333' 
                  }} 
                />
              ))}
            </View>
          </View>
        </View>

        {/* Резервное копирование */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16 }}>Резервное копирование</Text>
          <View style={{ backgroundColor: '#F8F9FA', borderRadius: 16, padding: 20, gap: 12 }}>
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
                backgroundColor: '#FF6B6B', 
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

            <TouchableOpacity 
              style={{ 
                backgroundColor: '#4A4A4A', 
                padding: 12, 
                borderRadius: 8, 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'center'
              }} 
              onPress={showLogs}
            >
              <MaterialIcons name="bug-report" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={{ color: 'white', fontSize: 14 }}>Показать логи</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;
