const handleBackup = async () => {
  try {
    const backup = { notes, folders, settings };
    const backupStr = JSON.stringify(backup, null, 2);
    const fileName = `FamNote_Backup_${formatDateForFilename()}.bak`;

    // Web версия
    if (Platform.OS === 'web') {
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

    // Android версия - упрощаем до максимума
    try {
      // Используем кэш директорию (всегда доступна)
      const fileUri = FileSystem.cacheDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, backupStr);
      
      // Пытаемся поделиться
      if (Sharing && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Сохранить резервную копию'
        });
      } else {
        Alert.alert('✅ Успех', 'Резервная копия создана во временной папке');
      }
    } catch (writeError) {
      console.log('Write error:', writeError);
      // Если не можем записать, копируем в буфер обмена
      await Clipboard.setStringAsync(backupStr);
      Alert.alert('📋 Скопировано', 'Данные скопированы в буфер обмена');
    }
  } catch (e) {
    console.log('Backup error:', e);
    Alert.alert('❌ Ошибка', 'Не удалось создать резервную копию');
  }
};
