import { InvoiceItem, ThemeCollection } from './types';
import { v4 as uuidv4 } from 'uuid';

export const INITIAL_ITEMS: InvoiceItem[] = [
  { id: uuidv4(), date: '11 Oct 2025', qty: 1, price: 80 },
  { id: uuidv4(), date: '12 Oct 2025', qty: 2, price: 160 },
  { id: uuidv4(), date: '14 Oct 2025', qty: 1, price: 80 },
  { id: uuidv4(), date: '15 Oct 2025', qty: 1, price: 80 },
];

export const THEMES: ThemeCollection = {
  default: { type: 'color', pageBg: 'white', primary: '#f59e0b', textDark: '#1f2937', textMedium: '#4b5563', textLight: '#6b7280', border: '#d1d5db', headerBg: '#f9fafb' },
  blue: { type: 'color', pageBg: 'white', primary: '#2563eb', textDark: '#1f2937', textMedium: '#4b5563', textLight: '#6b7280', border: '#d1d5db', headerBg: '#f9fafb' },
  green: { type: 'color', pageBg: 'white', primary: '#16a34a', textDark: '#1f2937', textMedium: '#4b5563', textLight: '#6b7280', border: '#d1d5db', headerBg: '#f9fafb' },
  purple: { type: 'color', pageBg: 'white', primary: '#4f46e5', textDark: '#1f2937', textMedium: '#4b5563', textLight: '#6b7280', border: '#d1d5db', headerBg: '#f9fafb' },
  slate: { type: 'color', pageBg: '#374151', primary: '#9ca3af', textDark: '#f9fafb', textMedium: '#d1d5db', textLight: '#9ca3af', border: '#4b5563', headerBg: '#4b5563' },
  ocean: { type: 'color', pageBg: '#0c4a6e', primary: '#7dd3fc', textDark: '#f0f9ff', textMedium: '#e0f2fe', textLight: '#bae6fd', border: '#0369a1', headerBg: '#075985' },
  sunset: { type: 'color', pageBg: '#7c2d12', primary: '#fdba74', textDark: '#fff7ed', textMedium: '#ffedd5', textLight: '#fed7aa', border: '#9a3412', headerBg: '#9a3412' },
  cherry: { type: 'color', pageBg: '#7f1d1d', primary: '#fca5a5', textDark: '#fee2e2', textMedium: '#fecaca', textLight: '#fca5a5', border: '#991b1b', headerBg: '#991b1b' },
  mint: { type: 'color', pageBg: '#f0fdfa', primary: '#14b8a6', textDark: '#0f766e', textMedium: '#115e59', textLight: '#134e4a', border: '#ccfbf1', headerBg: 'rgba(204, 251, 241, 0.5)' },
  lavender: { type: 'color', pageBg: '#f5f3ff', primary: '#8b5cf6', textDark: '#5b21b6', textMedium: '#6d28d9', textLight: '#7c3aed', border: '#ede9fe', headerBg: 'rgba(237, 233, 254, 0.5)' },
  blush: { type: 'color', pageBg: '#fff1f2', primary: '#f43f5e', textDark: '#be123c', textMedium: '#9f1239', textLight: '#881337', border: '#ffe4e6', headerBg: 'rgba(255, 228, 230, 0.5)' },
  graphite: { type: 'gradient', pageBg: 'linear-gradient(to bottom right, #f9fafb, #e5e7eb)', primary: '#3b82f6', textDark: '#1f2937', textMedium: '#4b5563', textLight: '#6b7280', border: '#d1d5db', headerBg: 'rgba(255,255,255,0.5)' },
  seaside: { type: 'color', pageBg: '#FAF8F1', primary: '#34656D', textDark: '#334443', textMedium: '#34656D', textLight: '#34656D', border: '#FAEAB1', headerBg: 'rgba(250, 234, 177, 0.3)' },
  vibrant: { type: 'color', pageBg: '#E9E3DF', primary: '#FF7A30', textDark: '#000000', textMedium: '#465C88', textLight: '#465C88', border: '#465C88', headerBg: 'rgba(70, 92, 136, 0.1)' },
  pastel: { type: 'color', pageBg: '#FAF7F3', primary: '#D9A299', textDark: '#A07855', textMedium: '#D9A299', textLight: '#DCC5B2', border: '#F0E4D3', headerBg: 'rgba(240, 228, 211, 0.4)' },
  rose: { type: 'color', pageBg: '#EEEEEE', primary: '#B9375D', textDark: '#B9375D', textMedium: '#D25D5D', textLight: '#D25D5D', border: '#E7D3D3', headerBg: 'rgba(231, 211, 211, 0.4)' },
  lime: { type: 'color', pageBg: '#FFFADC', primary: '#B6F500', textDark: '#98CD00', textMedium: '#A4DD00', textLight: '#A4DD00', border: '#B6F500', headerBg: 'rgba(182, 245, 0, 0.2)' },
};
