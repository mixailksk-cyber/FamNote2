// =====================================================
// FILE: BL02_Constants.js
// =====================================================
import { Dimensions } from 'react-native';
export const BRAND_COLOR='#20A0A0'; // Сделал светлее (был #008080)
// Основные цвета + 2 случайных для сетки 3x4 (12 цветов)
export const NOTE_COLORS=[
  '#008080', // Бирюзовый (основной)
  '#45B7D1', // Голубой
  '#96CEB4', // Мятный
  '#9B59B6', // Фиолетовый
  '#3498DB', // Синий
  '#E67E22', // Оранжевый
  '#2ECC71', // Зеленый
  '#F1C40F', // Желтый
  '#E74C3C', // Красный
  '#34495E', // Темно-синий
  '#FF6B6B', // Коралловый (добавлен)
  '#4ECDC4'  // Бирюзово-зеленый (добавлен)
];
export const FOLDER_COLORS=['#008080','#45B7D1','#96CEB4','#9B59B6','#3498DB','#E67E22','#2ECC71','#F1C40F','#E74C3C','#34495E'];
export const TITLE_MAX_LENGTH=40; // Увеличено на 10 (было 30)
export const NOTE_MAX_LENGTH=20000;
export const FOLDER_NAME_MAX_LENGTH=50;
export const{width}=Dimensions.get('window');
export const getBrandColor=(settings)=>settings?.brandColor||BRAND_COLOR;
export const formatDate=(ts)=>{const d=new Date(ts);const m=['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];return{day:d.getDate().toString().padStart(2,'0'),month:m[d.getMonth()]};};
export const validateFolderName=(name,folders)=>{if(!name.trim())return'Введите название папки';if(name.trim().length>FOLDER_NAME_MAX_LENGTH)return`Максимум ${FOLDER_NAME_MAX_LENGTH} символов`;if(/[<>:"/\\|?*]/.test(name.trim()))return'Недопустимые символы: < > : " / \\ | ? *';const names=folders.map(f=>typeof f==='object'?f.name:f);if(names.includes(name.trim()))return'Папка с таким именем уже существует';return null;};
