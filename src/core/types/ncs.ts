// Define clear interfaces for your data
export interface NcsItem {
  key: string;
  hex: string;
}

export interface NcsGroup {
  strip: NcsItem[];
  hueFamily: string;
}

export interface SelectionPath {
  groupIndex: number;
  itemIndex: number;
}
