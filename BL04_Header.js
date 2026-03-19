import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND_COLOR } from './BL02_Constants';

const Header = ({ title, rightIcon, onRightPress, showBack, onBack, showSearch, onSearchPress, showPalette, onPalettePress, children, brandColor }) => {
  const insets = useSafeAreaInsets();
  const headerColor = brandColor || BRAND_COLOR;
  
  return (
    <View style={{ 
      backgroundColor: headerColor, 
      paddingTop: insets.top + 16, 
      paddingBottom: 16, 
      paddingLeft: insets.left + 16, 
      paddingRight: insets.right + 16, 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center' 
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {showBack && <TouchableOpacity onPress={onBack} style={{ marginRight: 16 }}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>}
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20, flex: 1 }} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
      </View>
      
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Дополнительные кнопки из children */}
        {children && React.Children.map(children, (child, index) => (
          <View key={index} style={{ marginRight: index === React.Children.count(children) - 1 ? 0 : 20 }}>
            {child}
          </View>
        ))}
        
        {showPalette && (
          <TouchableOpacity onPress={onPalettePress} style={{ marginLeft: 20 }}>
            <MaterialIcons name="palette" size={24} color="white" />
          </TouchableOpacity>
        )}
        {showSearch && (
          <TouchableOpacity onPress={onSearchPress} style={{ marginLeft: 20 }}>
            <MaterialIcons name="search" size={24} color="white" />
          </TouchableOpacity>
        )}
        {rightIcon && (
          <TouchableOpacity onPress={onRightPress} style={{ marginLeft: 20 }}>
            <MaterialIcons name={rightIcon} size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default Header;
