
export interface InvoiceItem {
  id: string;
  date: string;
  qty: number;
  price: number;
}

export interface Theme {
  type: 'color' | 'gradient';
  pageBg: string;
  primary: string;
  textDark: string;
  textMedium: string;
  textLight: string;
  border: string;
  headerBg: string;
}

export interface ThemeCollection {
  [key: string]: Theme;
}

export interface ExtractedItem {
  date: string;
  quantity: string;
}
