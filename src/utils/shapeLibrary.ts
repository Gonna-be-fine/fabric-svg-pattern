/**
 * Vector shape path definitions and generator helpers for Fabric.js pattern editor
 */

export interface ShapeDefinition {
  id: string;
  name: string;
  category: 'Basic' | 'Geometric' | 'Organic' | 'Traditional' | 'Decorative';
  type: 'path' | 'rect' | 'circle' | 'triangle' | 'polygon';
  path?: string;
  points?: Array<{ x: number; y: number }>;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultRadius?: number;
}

export const SHAPE_LIBRARY: ShapeDefinition[] = [
  // Basic Shapes
  {
    id: 'rect',
    name: 'Rectangle',
    category: 'Basic',
    type: 'rect',
    defaultWidth: 40,
    defaultHeight: 40,
  },
  {
    id: 'circle',
    name: 'Circle',
    category: 'Basic',
    type: 'circle',
    defaultRadius: 20,
  },
  {
    id: 'triangle',
    name: 'Triangle',
    category: 'Basic',
    type: 'triangle',
    defaultWidth: 40,
    defaultHeight: 36,
  },

  // Geometric & Polygons
  {
    id: 'diamond',
    name: 'Diamond',
    category: 'Geometric',
    type: 'polygon',
    points: [
      { x: 20, y: 0 },
      { x: 40, y: 20 },
      { x: 20, y: 40 },
      { x: 0, y: 20 },
    ],
  },
  {
    id: 'hexagon',
    name: 'Hexagon',
    category: 'Geometric',
    type: 'polygon',
    points: [
      { x: 20, y: 0 },
      { x: 38, y: 10 },
      { x: 38, y: 30 },
      { x: 20, y: 40 },
      { x: 2, y: 30 },
      { x: 2, y: 10 },
    ],
  },
  {
    id: 'star-5',
    name: '5-Point Star',
    category: 'Geometric',
    type: 'path',
    path: 'M 20 0 L 26 13 L 40 15 L 29 25 L 32 39 L 20 32 L 8 39 L 11 25 L 0 15 L 14 13 Z',
  },
  {
    id: 'star-4',
    name: 'Celestial Sparkle',
    category: 'Geometric',
    type: 'path',
    path: 'M 20 0 Q 20 20 40 20 Q 20 20 20 40 Q 20 20 0 20 Q 20 20 20 0 Z',
  },
  {
    id: 'cross-plus',
    name: 'Plus / Cross',
    category: 'Geometric',
    type: 'path',
    path: 'M 14 0 H 26 V 14 H 40 V 26 H 26 V 40 H 14 V 26 H 0 V 14 H 14 Z',
  },

  // Organic & Nature
  {
    id: 'heart',
    name: 'Heart',
    category: 'Organic',
    type: 'path',
    path: 'M 20 36 C 20 36 2 24 2 13 C 2 6 7 2 13 2 C 17 2 19 5 20 7 C 21 5 23 2 27 2 C 33 2 38 6 38 13 C 38 24 20 36 20 36 Z',
  },
  {
    id: 'crescent-moon',
    name: 'Crescent Moon',
    category: 'Organic',
    type: 'path',
    path: 'M 25 3 C 12 3 2 14 2 27 C 2 40 12 51 25 51 C 29 51 33 50 37 48 C 27 44 20 35 20 24 C 20 13 27 4 37 0 C 33 2 29 3 25 3 Z',
  },
  {
    id: 'leaf',
    name: 'Botanical Leaf',
    category: 'Organic',
    type: 'path',
    path: 'M 0 40 C 0 40 2 16 20 2 C 38 16 40 40 40 40 C 40 40 24 38 20 20 C 16 38 0 40 0 40 Z',
  },
  {
    id: 'flower-petal',
    name: 'Floral Petal Motif',
    category: 'Organic',
    type: 'path',
    path: 'M 20 0 C 26 12 38 14 38 20 C 38 26 26 28 20 40 C 14 28 2 26 2 20 C 2 14 14 12 20 0 Z',
  },

  // Decorative Lines & Waves
  {
    id: 'wave-sine',
    name: 'Sine Wave',
    category: 'Decorative',
    type: 'path',
    path: 'M 0 15 Q 15 0 30 15 T 60 15',
  },
  {
    id: 'zigzag',
    name: 'Zig-zag Chevron',
    category: 'Decorative',
    type: 'path',
    path: 'M 0 20 L 12 0 L 24 20 L 36 0 L 48 20 L 60 0',
  },
  {
    id: 'arch-bauhaus',
    name: 'Bauhaus Arch',
    category: 'Decorative',
    type: 'path',
    path: 'M 0 40 L 0 20 A 20 20 0 0 1 40 20 L 40 40 Z',
  },
  {
    id: 'quarter-circle',
    name: 'Quarter Fan',
    category: 'Decorative',
    type: 'path',
    path: 'M 0 0 L 40 0 A 40 40 0 0 1 0 40 Z',
  },

  // Traditional Patterns
  {
    id: 'seigaiha-arc',
    name: 'Seigaiha Wave Arc',
    category: 'Traditional',
    type: 'path',
    path: 'M 0 30 A 30 30 0 0 1 60 30 M 10 30 A 20 20 0 0 1 50 30 M 20 30 A 10 10 0 0 1 40 30',
  },
  {
    id: 'moroccan-trellis',
    name: 'Moroccan Trellis Arc',
    category: 'Traditional',
    type: 'path',
    path: 'M 25 0 C 18 10 12 18 0 20 C 12 22 18 30 25 40 C 32 30 38 22 50 20 C 38 18 32 10 25 0 Z',
  },
];
