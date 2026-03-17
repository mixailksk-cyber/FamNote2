// =====================================================
// FILE: BL11_AppContent.js
// =====================================================
import React, { useState, useEffect } from 'react';
import { View, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND_COLOR, getBrandColor } from './BL02_Constants';
import { useNotesData } from './BL12_DataHooks';
import { useMemoizedCalculations } from './BL13_MemoizedCalculations';
import { useFolderHandlers } from './BL14_FolderHandlers';
import { useSearchNavigation } from './BL15_SearchNavigation';
import NotesListScreen from './BL16_NotesListScreen';
import EditNoteScreen from './BL17_EditNoteScreen';
import FoldersScreen from './BL18_FoldersScreen';
import SettingsScreen from './BL19_SettingsScreen';
import SearchScreen from './BL20_SearchScreen';
import NoteActionDialog from './BL07_NoteActionDialog';

const AppContent = () => {
  const insets = useSafeAreaInsets();
  const [currentScreen, setCurrentScreen] = useState('notes');
  const [navigationStack, setNavigationStack] = useState(['notes']);
  const [currentFolder, setCurrentFolder] = useState('Главная');
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [showFolderSettings, setShowFolderSettings] = useState(false);
  const [selectedFolderForSettings, setSelectedFolderForSettings] = useState(null);
  const [selectedFolderColor, setSelectedFolderColor] = useState(BRAND_COLOR);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [selectedNoteForAction, setSelectedNoteForAction] = useState(null);
  const [restoreKey, setRestoreKey] = useState(0); // Ключ для принудительного обновления
  
  const { notes, folders, settings, saveNotes, saveFolders, saveSettings, loadData } = useNotesData();
  const { sortedNotes } = useMemoizedCalculations({ notes, folders, currentFolder });
  const { handleRenameFolder, handleColorChange, handleDeleteFolder } = useFolderHandlers({
    folders, notes, currentFolder, saveFolders, saveNotes, setCurrentFolder
  });
  const { searchResults, goToSearch, goBack, handleNotePress, handleCloseSearch } = useSearchNavigation({
    notes, searchQuery, currentScreen, navigationStack, setCurrentScreen, setNavigationStack, setSelectedNote, setSearchQuery
  });

  // Функция для принудительной перезагрузки данных после восстановления
  const handleDataRestored = async () => {
    console.log('🔄 Data restored, reloading...');
    await loadData(); // Перезагружаем данные
    setRestoreKey(prev => prev + 1); // Меняем ключ для обновления компонентов
  };
  
  const handleTogglePin = (noteId) => {
    const updatedNotes = notes.map(n => n.id === noteId ? { ...n, pinned: !n.pinned, updatedAt: Date.now() } : n);
    saveNotes(updatedNotes);
  };
  
  const handleSaveNote = (updatedNote) => {
    if (Array.isArray(updatedNote)) {
      saveNotes(updatedNote);
      return;
    }
    
    if (!updatedNote.updatedAt) updatedNote.updatedAt = Date.now();
    if (updatedNote.folder !== selectedNote?.folder && updatedNote.pinned) {
      updatedNote.pinned = false;
    }
    
    const index = notes.findIndex(n => n.id === updatedNote.id);
    const newNotes = index >= 0 
      ? [...notes.slice(0, index), updatedNote, ...notes.slice(index + 1)] 
      : [updatedNote, ...notes];
    
    saveNotes(newNotes);
    
    const comingFromSearch = navigationStack[navigationStack.length - 1] === 'search';
    setNavigationStack(prev => prev.slice(0, -1));
    
    if (comingFromSearch) {
      const hasChanges = selectedNote 
        ? (selectedNote.title !== updatedNote.title || 
           selectedNote.content !== updatedNote.content || 
           selectedNote.color !== updatedNote.color)
        : true;
      
      if (hasChanges) {
        setCurrentFolder(updatedNote.folder);
        setCurrentScreen('notes');
        setSearchQuery('');
      } else {
        setCurrentScreen('search');
        setTimeout(() => { setSearchQuery(searchQuery); }, 100);
      }
    } else {
      const prevScreen = navigationStack[navigationStack.length - 1] || 'notes';
      setCurrentScreen(prevScreen);
    }
  };
  
  const handleBrandColorChange = (color) => saveSettings({ ...settings, brandColor: color });
  
  const renderScreen = () => {
    switch (currentScreen) {
      case 'notes':
        return <NotesListScreen 
          key={`notes-${restoreKey}`} // Ключ для обновления
          currentFolder={currentFolder} 
          sortedNotes={sortedNotes} 
          handleNotePress={(note) => handleNotePress(note, 'notes')} 
          setSelectedNoteForAction={setSelectedNoteForAction} 
          setShowNoteDialog={setShowNoteDialog} 
          setCurrentScreen={setCurrentScreen} 
          setSelectedNote={setSelectedNote} 
          goToSearch={goToSearch} 
          insets={insets} 
          settings={settings} 
        />;
      
      case 'edit':
        return <EditNoteScreen 
          selectedNote={selectedNote} 
          currentFolder={currentFolder} 
          notes={notes} 
          settings={settings} 
          navigationStack={navigationStack} 
          onSave={handleSaveNote} 
          setCurrentScreen={setCurrentScreen} 
          setNavigationStack={setNavigationStack} 
          setSearchQuery={setSearchQuery} 
          insets={insets} 
          searchQuery={searchQuery} 
          setCurrentFolder={setCurrentFolder} 
        />;
      
      case 'folders':
        return <FoldersScreen 
          folders={folders} 
          currentFolder={currentFolder} 
          setCurrentFolder={setCurrentFolder} 
          setCurrentScreen={setCurrentScreen} 
          goToSearch={goToSearch} 
          insets={insets} 
          showFolderDialog={showFolderDialog} 
          setShowFolderDialog={setShowFolderDialog} 
          saveFolders={saveFolders} 
          showFolderSettings={showFolderSettings} 
          setShowFolderSettings={setShowFolderSettings} 
          selectedFolderForSettings={selectedFolderForSettings} 
          setSelectedFolderForSettings={setSelectedFolderForSettings} 
          selectedFolderColor={selectedFolderColor} 
          setSelectedFolderColor={setSelectedFolderColor} 
          handleRenameFolder={handleRenameFolder} 
          handleColorChange={handleColorChange} 
          handleDeleteFolder={handleDeleteFolder} 
          settings={settings} 
          notes={notes} 
        />;
      
      case 'settings':
        return <SettingsScreen 
          setCurrentScreen={setCurrentScreen} 
          goToSearch={goToSearch} 
          settings={settings} 
          saveSettings={saveSettings} 
          notes={notes} 
          folders={folders} 
          onBrandColorChange={handleBrandColorChange}
          onDataRestored={handleDataRestored} // Передаем обработчик
        />;
      
      case 'search':
        return <SearchScreen 
          notes={notes} 
          setCurrentScreen={setCurrentScreen} 
          setSelectedNote={setSelectedNote} 
          setSelectedNoteForAction={setSelectedNoteForAction} 
          setShowNoteDialog={setShowNoteDialog} 
          goBack={goBack} 
          navigationStack={navigationStack} 
          setNavigationStack={setNavigationStack} 
          setSearchQuery={setSearchQuery} 
          searchQuery={searchQuery} 
          settings={settings} 
        />;
      
      default:
        return <NotesListScreen 
          key={`notes-${restoreKey}`}
          currentFolder={currentFolder} 
          sortedNotes={sortedNotes} 
          handleNotePress={(note) => handleNotePress(note, 'notes')} 
          setSelectedNoteForAction={setSelectedNoteForAction} 
          setShowNoteDialog={setShowNoteDialog} 
          setCurrentScreen={setCurrentScreen} 
          setSelectedNote={setSelectedNote} 
          goToSearch={goToSearch} 
          insets={insets} 
          settings={settings} 
        />;
    }
  };
  
  const currentBrandColor = getBrandColor(settings);
  
  return (
    <>
      <StatusBar backgroundColor={currentBrandColor} barStyle="light-content" />
      <View style={{ flex: 1 }}>{renderScreen()}</View>
      
      {selectedNoteForAction && (
        <NoteActionDialog 
          visible={showNoteDialog} 
          onClose={() => { setShowNoteDialog(false); setSelectedNoteForAction(null); }} 
          folders={folders} 
          currentFolder={selectedNoteForAction?.folder || currentFolder} 
          onMove={(targetFolder) => {
            saveNotes(notes.map(n => 
              n.id === selectedNoteForAction.id 
                ? { ...n, folder: targetFolder, deleted: targetFolder === 'Корзина', pinned: false, updatedAt: Date.now() } 
                : n
            ));
            setShowNoteDialog(false);
            setSelectedNoteForAction(null);
          }} 
          onDelete={() => {
            saveNotes(notes.map(n => 
              n.id === selectedNoteForAction.id 
                ? { ...n, folder: 'Корзина', deleted: true, pinned: false, updatedAt: Date.now() } 
                : n
            ));
            setShowNoteDialog(false);
            setSelectedNoteForAction(null);
          }} 
          onPermanentDelete={() => {
            const updatedNotes = notes.filter(n => n.id !== selectedNoteForAction.id);
            saveNotes(updatedNotes);
            setShowNoteDialog(false);
            setSelectedNoteForAction(null);
          }} 
          onTogglePin={() => handleTogglePin(selectedNoteForAction.id)} 
          isPinned={selectedNoteForAction?.pinned || false} 
          settings={settings} 
        />
      )}
    </>
  );
};

export default AppContent;
