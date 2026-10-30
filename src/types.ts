export type RepeatMode = 'grid' | 'brick-row' | 'brick-col';

export type MockupType = 'flat' | 'tote-bag' | 'phone-case' | 'mug' | 'tshirt' | 'wallpaper';

export interface TileConfig {
  width: number;
  height: number;
  backgroundColor: string;
  transparentBackground: boolean;
  repeatMode: RepeatMode;
  rowShift: number; // 0 to 1, default 0.5 for brick-row
  colShift: number; // 0 to 1, default 0.5 for brick-col
  spacingX: number; // gap between tiles
  spacingY: number;
  showGridGuides: boolean;
  showCenterCrosshair: boolean;
  showGhostTiles: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

export interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
  bg: string;
}

export interface PatternPreset {
  id: string;
  name: string;
  category: 'Geometric' | 'Traditional' | 'Minimal' | 'Artistic' | 'Textile';
  description: string;
  tileWidth: number;
  tileHeight: number;
  backgroundColor: string;
  repeatMode: RepeatMode;
  rowShift?: number;
  colShift?: number;
  shapes: PresetShape[];
}

export interface PresetShape {
  type: 'rect' | 'circle' | 'triangle' | 'path' | 'polygon';
  left: number;
  top: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: Array<{ x: number; y: number }>;
  path?: string;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDashArray?: number[];
  angle?: number;
  opacity?: number;
  originX?: string;
  originY?: string;
}

export type ActiveTool = 'select' | 'brush' | 'text' | 'shape';
