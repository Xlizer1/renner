export interface NcsItem {
  key: string;
  // Change: hex can now be a string (color) or number (require ID)
  hex: string | number; 
  blackness: string;
  chromatines: string;
  hue: string;
  // New optional flag
  isTexture?: boolean;
}

export interface NcsGroup {
  strip: NcsItem[];
  hueFamily: string;
}

export interface SelectionPath {
  groupIndex: number;
  itemIndex: number;
}