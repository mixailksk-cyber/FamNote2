// =====================================================
// FILE: BL12_DataHooks.js
// =====================================================
import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';
import { NOTE_COLORS } from './BL02_Constants';
import { updateWidgetData } from './WidgetBridge';

export const useNotesData = () => {
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState(['Главная', 'Корзина']);
  const [settings, setSettings] = useState({ fontSize: 16 });

  useEffect(() => {
    loadData();
    if (Platform.OS !== 'web') {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT).catch(() => {});
    }
  }, []);

  const loadData = async () => {
    try {
      const [savedNotes, savedFolders, savedSettings] = await Promise.all([
        AsyncStorage.getItem('notes'),
        AsyncStorage.getItem('folders'),
        AsyncStorage.getItem('settings')
      ]);
      
      if (savedNotes) {
        const parsed = JSON.parse(savedNotes);
        const normalized = parsed.map(n => ({ ...n, color: n.color || NOTE_COLORS[0] }));
        setNotes(normalized);
        // Обновляем виджет при загрузке
        updateWidgetData(normalized);
      }
      if (savedFolders) setFolders(JSON.parse(savedFolders));
      if (savedSettings) setSettings(JSON.parse(savedSettings));
    } catch (e) {
      console.log('Error loading data:', e);
    }
  };

  const saveNotes = useCallback(async (newNotes) => {
    const normalized = newNotes.map(n => ({ ...n, color: n.color || NOTE_COLORS[0] }));
    setNotes(normalized);
    try {
      await AsyncStorage.setItem('notes', JSON.stringify(normalized));
      // Обновляем виджет при сохранении
      updateWidgetData(normalized);
    } catch (e) {
      if (Platform.OS === 'web') Alert.alert('Внимание', 'Данные сохранены только в памяти');
    }
  }, []);

  const saveFolders = useCallback(async (newFolders) => {
    setFolders(newFolders);
    await AsyncStorage.setItem('folders', JSON.stringify(newFolders));
  }, []);

  const saveSettings = useCallback(async (newSettings) => {
    setSettings(newSettings);
    await AsyncStorage.setItem('settings', JSON.stringify(newSettings));
  }, []);

  return { notes, folders, settings, saveNotes, saveFolders, saveSettings };
};
