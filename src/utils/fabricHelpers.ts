import {
  Canvas,
  Rect,
  Circle,
  Triangle,
  Path,
  Polygon,
  IText,
  FabricObject,
  Point,
  Color,
} from 'fabric';
import { ColorPalette, PatternPreset, PresetShape, TileConfig } from '../types';
import { ShapeDefinition } from './shapeLibrary';

/**
 * Creates a Fabric shape from ShapeDefinition
 */
export function createFabricShape(
  def: ShapeDefinition,
  options: {
    left?: number;
    top?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  } = {}
): FabricObject {
  const {
    left = 40,
    top = 40,
    fill = '#6366F1',
    stroke = '#4338CA',
    strokeWidth = 0,
  } = options;

  switch (def.type) {
    case 'rect':
      return new Rect({
        left,
        top,
        width: def.defaultWidth || 40,
        height: def.defaultHeight || 40,
        fill,
        stroke,
        strokeWidth,
        originX: 'center',
        originY: 'center',
      });

    case 'circle':
      return new Circle({
        left,
        top,
        radius: def.defaultRadius || 20,
        fill,
        stroke,
        strokeWidth,
        originX: 'center',
        originY: 'center',
      });

    case 'triangle':
      return new Triangle({
        left,
        top,
        width: def.defaultWidth || 40,
        height: def.defaultHeight || 36,
        fill,
        stroke,
        strokeWidth,
        originX: 'center',
        originY: 'center',
      });

    case 'polygon':
      if (def.points) {
        return new Polygon(def.points, {
          left,
          top,
          fill,
          stroke,
          strokeWidth,
          originX: 'center',
          originY: 'center',
        });
      }
      return new Rect({ left, top, width: 40, height: 40, fill });

    case 'path':
      if (def.path) {
        return new Path(def.path, {
          left,
          top,
          fill: def.id.includes('wave') || def.id.includes('zigzag') || def.id.includes('seigaiha') ? 'transparent' : fill,
          stroke: strokeWidth > 0 ? stroke : (def.id.includes('wave') || def.id.includes('zigzag') || def.id.includes('seigaiha') ? fill : undefined),
          strokeWidth: (def.id.includes('wave') || def.id.includes('zigzag') || def.id.includes('seigaiha')) && strokeWidth === 0 ? 3 : strokeWidth,
          originX: 'center',
          originY: 'center',
        });
      }
      return new Rect({ left, top, width: 40, height: 40, fill });

    default:
      return new Rect({ left, top, width: 40, height: 40, fill });
  }
}

/**
 * Loads a PatternPreset into canvas
 */
export async function loadPresetIntoCanvas(
  canvas: Canvas,
  preset: PatternPreset,
  updateConfig: (cfg: Partial<TileConfig>) => void
) {
  canvas.clear();

  updateConfig({
    width: preset.tileWidth,
    height: preset.tileHeight,
    backgroundColor: preset.backgroundColor,
    repeatMode: preset.repeatMode,
    rowShift: preset.rowShift ?? 0.5,
    colShift: preset.colShift ?? 0.5,
  });

  for (const item of preset.shapes) {
    let obj: FabricObject | null = null;

    if (item.type === 'rect') {
      obj = new Rect({
        left: item.left,
        top: item.top,
        width: item.width ?? 30,
        height: item.height ?? 30,
        fill: item.fill,
        stroke: item.stroke,
        strokeWidth: item.strokeWidth ?? 0,
        angle: item.angle ?? 0,
        opacity: item.opacity ?? 1,
      });
    } else if (item.type === 'circle') {
      obj = new Circle({
        left: item.left,
        top: item.top,
        radius: item.radius ?? 15,
        fill: item.fill,
        stroke: item.stroke,
        strokeWidth: item.strokeWidth ?? 0,
        strokeDashArray: item.strokeDashArray,
        angle: item.angle ?? 0,
        opacity: item.opacity ?? 1,
      });
    } else if (item.type === 'triangle') {
      obj = new Triangle({
        left: item.left,
        top: item.top,
        width: item.width ?? 30,
        height: item.height ?? 30,
        fill: item.fill,
        stroke: item.stroke,
        strokeWidth: item.strokeWidth ?? 0,
        angle: item.angle ?? 0,
        opacity: item.opacity ?? 1,
      });
    } else if (item.type === 'path' && item.path) {
      obj = new Path(item.path, {
        left: item.left,
        top: item.top,
        fill: item.fill,
        stroke: item.stroke,
        strokeWidth: item.strokeWidth ?? 0,
        angle: item.angle ?? 0,
        opacity: item.opacity ?? 1,
      });
    }

    if (obj) {
      canvas.add(obj);
    }
  }

  canvas.renderAll();
}

/**
 * Applies a color palette across existing canvas elements
 */
export function applyPaletteToCanvas(
  canvas: Canvas,
  palette: ColorPalette,
  updateBg: (color: string) => void
) {
  updateBg(palette.bg);
  const objects = canvas.getObjects();

  if (objects.length === 0) return;

  objects.forEach((obj, idx) => {
    const color = palette.colors[idx % palette.colors.length];
    if (obj.fill && obj.fill !== 'transparent' && obj.fill !== '') {
      obj.set('fill', color);
    }
    if (obj.stroke && obj.stroke !== 'transparent' && obj.stroke !== '') {
      // Pick next color or contrast
      const strokeColor = palette.colors[(idx + 1) % palette.colors.length];
      obj.set('stroke', strokeColor);
    }
  });

  canvas.renderAll();
}

/**
 * Align selected objects or single object
 */
export function alignObjects(
  canvas: Canvas,
  alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom',
  tileWidth: number,
  tileHeight: number
) {
  const activeObj = canvas.getActiveObject();
  if (!activeObj) return;

  const bound = activeObj.getBoundingRect();

  switch (alignment) {
    case 'left':
      activeObj.set('left', activeObj.left - bound.left);
      break;
    case 'center-h':
      activeObj.set('left', activeObj.left + (tileWidth / 2 - (bound.left + bound.width / 2)));
      break;
    case 'right':
      activeObj.set('left', activeObj.left + (tileWidth - (bound.left + bound.width)));
      break;
    case 'top':
      activeObj.set('top', activeObj.top - bound.top);
      break;
    case 'center-v':
      activeObj.set('top', activeObj.top + (tileHeight / 2 - (bound.top + bound.height / 2)));
      break;
    case 'bottom':
      activeObj.set('top', activeObj.top + (tileHeight - (bound.top + bound.height)));
      break;
  }

  activeObj.setCoords();
  canvas.renderAll();
}

/**
 * Seamless wrap tool:
 * Clones objects that cross canvas edges and places the corresponding repeat on the opposite side
 */
export async function makeSeamlessWrap(canvas: Canvas, tileWidth: number, tileHeight: number) {
  const objects = [...canvas.getObjects()];
  const wrappedObjects: FabricObject[] = [];

  for (const obj of objects) {
    const bound = obj.getBoundingRect();
    let dx = 0;
    let dy = 0;

    // Check horizontal overlap
    if (bound.left < 0) {
      dx = tileWidth;
    } else if (bound.left + bound.width > tileWidth) {
      dx = -tileWidth;
    }

    // Check vertical overlap
    if (bound.top < 0) {
      dy = tileHeight;
    } else if (bound.top + bound.height > tileHeight) {
      dy = -tileHeight;
    }

    // If crossing edges, clone
    if (dx !== 0) {
      const cloneX = await obj.clone();
      cloneX.set({
        left: obj.left + dx,
        top: obj.top,
      });
      cloneX.setCoords();
      wrappedObjects.push(cloneX);
    }

    if (dy !== 0) {
      const cloneY = await obj.clone();
      cloneY.set({
        left: obj.left,
        top: obj.top + dy,
      });
      cloneY.setCoords();
      wrappedObjects.push(cloneY);
    }

    if (dx !== 0 && dy !== 0) {
      const cloneCorner = await obj.clone();
      cloneCorner.set({
        left: obj.left + dx,
        top: obj.top + dy,
      });
      cloneCorner.setCoords();
      wrappedObjects.push(cloneCorner);
    }
  }

  if (wrappedObjects.length > 0) {
    wrappedObjects.forEach((cloned) => canvas.add(cloned));
    canvas.renderAll();
  }
}
