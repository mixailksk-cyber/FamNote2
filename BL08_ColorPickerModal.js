// =====================================================
// FILE: BL08_ColorPickerModal.js
// =====================================================
import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { NOTE_COLORS, width, getBrandColor } from './BL02_Constants';

const ColorPickerModal = ({ visible, onClose, selectedColor, onSelect, settings }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: width - 40 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: '#333' }}>Цвет заметки</Text>
        
        {/* Сетка 3x4 */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
          {NOTE_COLORS.map((c, i) => (
            <TouchableOpacity 
              key={i} 
              onPress={() => { onSelect(c); onClose(); }} 
              style={{ 
                width: 50, 
                height: 50, 
                borderRadius: 25, 
                backgroundColor: c, 
                margin: 8, 
                borderWidth: selectedColor === c ? 3 : 0, 
                borderColor: '#333' 
              }} 
            />
          ))}
        </View>
        
        <TouchableOpacity onPress={onClose} style={{ alignSelf: 'center', marginTop: 16, padding: 8 }}>
          <Text style={{ color: getBrandColor(settings) }}>Отмена</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default ColorPickerModal;
