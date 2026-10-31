import {
  Canvas,
  loadSVGFromString,
  FabricObject,
  Pattern,
  Path,
  Polygon,
  Rect,
  Group,
} from 'fabric';
import { ColorPrevList } from '../configs/jerseyParts';

export interface PatternOptions {
  patternId?: string;
  name?: string;
  category?: string;
  source?: string;
  url: string; // Data URL or Image URL
  svgContent?: string; // Optional raw SVG string of the tile
  scale?: number; // 0.1 to 50.0
  angle?: number; // 0 to 360
  opacity?: number; // 0.1 to 1.0
  offsetX?: number; // -500 to 500
  offsetY?: number; // -500 to 500
  patternColor?: string | null; // Tint color or null for original
  bgColor?: string | null; // Background color
  tileWidth?: number;
  tileHeight?: number;
}

export interface JerseyPanelMeta {
  id: string;
  originalFill: string;
  patternMeta?: PatternOptions | null;
}

function decodeSvgDataUrl(dataUrl: string): string | null {
  if (!dataUrl || !dataUrl.startsWith('data:image/svg+xml')) return null;

  try {
    const commaIndex = dataUrl.indexOf(',');
    if (commaIndex === -1) return null;
    const payload = dataUrl.slice(commaIndex + 1);
    const normalized = payload.includes('%') ? decodeURIComponent(payload) : payload;
    return atob(normalized.includes('base64') ? payload : normalized);
  } catch {
    return null;
  }
}

function stripOuterSvg(svgText: string): string {
  if (!svgText) return '';
  return svgText.replace(/^\s*<svg[^>]*>|<\/svg>\s*$/gi, '').trim();
}

function applyPatternColorToSvg(svgText: string, color?: string | null): string {
  if (!svgText || !color) return svgText;
  let next = svgText;
  next = next.replace(/stroke="[^"]*"/g, `stroke="${color}"`);
  next = next.replace(/fill="(?!none)[^"]*"/g, `fill="${color}"`);
  next = next.replace(/stroke:([^;\"]+)/gi, `stroke:${color}`);
  next = next.replace(/fill:([^;\"]+)/gi, `fill:${color}`);
  return next;
}

async function fetchSvgTextFromUrl(url: string): Promise<string | null> {
  if (!url) return null;

  if (url.startsWith('data:image/svg+xml')) {
    return decodeSvgDataUrl(url);
  }

  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('svg') && !url.match(/\.svg(?:[?#].*)?$/i)) {
      return null;
    }
    return await response.text();
  } catch {
    return null;
  }
}

/**
 * Creates an in-memory canvas for a pattern with tinting and background color
 */
export async function createPatternCanvas(
  options: PatternOptions,
  tileSize = 120
): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  const {
    url,
    patternColor = null,
    bgColor = '#ffffff',
    opacity = 1.0,
  } = options;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.width || tileSize;
      const h = img.height || tileSize;

      const buffer = document.createElement('canvas');
      buffer.width = w;
      buffer.height = h;
      const ctx = buffer.getContext('2d');
      if (!ctx) {
        resolve({ canvas: buffer, width: w, height: h });
        return;
      }

      // 1. Draw Background
      if (bgColor && bgColor !== 'transparent') {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, w, h);
      }

      // 2. Draw Pattern with Tint if requested
      if (patternColor) {
        // Create offscreen canvas for tinted graphic
        const tintCanvas = document.createElement('canvas');
        tintCanvas.width = w;
        tintCanvas.height = h;
        const tintCtx = tintCanvas.getContext('2d');
        if (tintCtx) {
          tintCtx.drawImage(img, 0, 0, w, h);
          tintCtx.globalCompositeOperation = 'source-in';
          tintCtx.fillStyle = patternColor;
          tintCtx.fillRect(0, 0, w, h);

          // Apply opacity and draw to buffer
          ctx.globalAlpha = opacity;
          ctx.drawImage(tintCanvas, 0, 0, w, h);
          ctx.globalAlpha = 1.0;
        } else {
          ctx.globalAlpha = opacity;
          ctx.drawImage(img, 0, 0, w, h);
          ctx.globalAlpha = 1.0;
        }
      } else {
        ctx.globalAlpha = opacity;
        ctx.drawImage(img, 0, 0, w, h);
        ctx.globalAlpha = 1.0;
      }

      resolve({ canvas: buffer, width: w, height: h });
    };

    img.onerror = () => {
      const fallback = document.createElement('canvas');
      fallback.width = tileSize;
      fallback.height = tileSize;
      resolve({ canvas: fallback, width: tileSize, height: tileSize });
    };

    img.src = url;
  });
}

/**
 * Fabric-based Jersey Editor implementing PatternTab.vue & FabricEditor.js behaviors
 */
export class JerseyFabricEditor {
  canvas: Canvas;
  svgRaw: string = '';
  viewBoxWidth: number = 800;
  viewBoxHeight: number = 800;
  panelMap: Map<string, FabricObject> = new Map();
  patternMetaMap: Map<string, PatternOptions> = new Map();
  panelColorMap: Map<string, string> = new Map();

  constructor(canvas: Canvas) {
    this.canvas = canvas;
  }

  private async resolvePatternSvgContent(options: PatternOptions): Promise<string | null> {
    if (!options) return null;
    if (options.svgContent) return options.svgContent;

    const svgText = await fetchSvgTextFromUrl(options.url);
    if (!svgText) return null;
    return svgText;
  }

  /**
   * Loads an SVG jersey string into Fabric.js canvas
   */
  async loadJerseySvg(svgString: string): Promise<string[]> {
    this.svgRaw = svgString;
    this.canvas.clear();
    this.panelMap.clear();

    const parsed = await loadSVGFromString(svgString, (element, fabricObject) => {
      if (element && fabricObject) {
        let id = element.getAttribute('id');
        if (!id && (element as any).closest) {
          const parentWithId = (element as any).closest('[id]');
          if (parentWithId) {
            id = parentWithId.getAttribute('id');
          }
        } else if (!id && element.parentElement) {
          id = element.parentElement.getAttribute('id');
        }
        if (id) {
          (fabricObject as any).id = id;
        }
      }
    });
    const { objects, options } = parsed;

    const width = options.width || 2048;
    const height = options.height || 2048;
    this.viewBoxWidth = width;
    this.viewBoxHeight = height;

    this.canvas.setDimensions({
      width,
      height,
    });

    const detectedPartIds: string[] = [];

    // Add objects to canvas and register panel IDs
    objects.forEach((obj) => {
      if (!obj) return;

      const id = (obj as any).id || (obj as any).name || '';
      if (id) {
        this.panelMap.set(id, obj);
        if (!detectedPartIds.includes(id)) {
          detectedPartIds.push(id);
        }

        // Record initial color
        if (typeof obj.fill === 'string') {
          (obj as any)._originalFill = obj.fill;
          this.panelColorMap.set(id, obj.fill);
        }
      }

      // Configure interaction
      obj.set({
        selectable: true,
        hasControls: false,
        hasBorders: true,
        hoverCursor: 'pointer',
      });

      this.canvas.add(obj);
    });

    this.canvas.renderAll();
    return detectedPartIds;
  }

  /**
   * Serializes current jersey state into JSON preserving patternMeta and IDs
   */
  exportJSON(): any {
    const saveJson: any = (this.canvas as any).toObject([
      'id',
      'name',
      'selectable',
      '_originalFill',
      'patternMeta',
      'visible',
    ]);
    saveJson.canvasWidth = this.viewBoxWidth;
    saveJson.canvasHeight = this.viewBoxHeight;
    saveJson.panelColorMap = Object.fromEntries(this.panelColorMap.entries());
    saveJson.patternMetaMap = Object.fromEntries(this.patternMetaMap.entries());
    return saveJson;
  }

  /**
   * Loads a JSON canvas state (matching FabricEditor.js loadCanvasState / loadJson)
   */
  async loadJSON(jsonData: any): Promise<{
    detectedParts: string[];
    patterns: Map<string, PatternOptions>;
    colors: Map<string, string>;
  }> {
    const parsedData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

    // Detect if nested in scene.model[0].texture.main
    let canvasJson = parsedData;
    if (parsedData.scene?.model?.[0]?.texture?.main) {
      canvasJson = parsedData.scene.model[0].texture.main;
    } else if (parsedData.texture?.main) {
      canvasJson = parsedData.texture.main;
    }

    this.canvas.clear();
    this.panelMap.clear();
    this.patternMetaMap.clear();
    this.panelColorMap.clear();

    const canvasWidth = canvasJson.canvasWidth || parsedData.canvasWidth || 2048;
    const canvasHeight = canvasJson.canvasHeight || parsedData.canvasHeight || 2048;
    this.viewBoxWidth = canvasWidth;
    this.viewBoxHeight = canvasHeight;

    this.canvas.setDimensions({
      width: canvasWidth,
      height: canvasHeight,
    });

    // Load canvas objects
    await this.canvas.loadFromJSON(canvasJson);

    const detectedPartIds: string[] = [];

    // Scale objects if dimensions differ
    const currentW = this.canvas.getWidth();
    const currentH = this.canvas.getHeight();
    const scaleX = currentW / canvasWidth;
    const scaleY = currentH / canvasHeight;

    for (const obj of this.canvas.getObjects()) {
      if (!obj) continue;

      if (scaleX !== 1 || scaleY !== 1) {
        obj.scaleX *= scaleX;
        obj.scaleY *= scaleY;
        obj.left *= scaleX;
        obj.top *= scaleY;
      }
      obj.setCoords();

      const id = (obj as any).id || (obj as any).name || '';
      if (id) {
        this.panelMap.set(id, obj);
        detectedPartIds.push(id);

        if ((obj as any)._originalFill) {
          this.panelColorMap.set(id, (obj as any)._originalFill);
        } else if (typeof obj.fill === 'string') {
          (obj as any)._originalFill = obj.fill;
          this.panelColorMap.set(id, obj.fill);
        }
      }

      obj.set({
        selectable: true,
        hasControls: false,
        hasBorders: true,
        hoverCursor: 'pointer',
      });
    }

    // Restore patterns if saved in patternMetaMap or on objects
    if (parsedData.patternMetaMap) {
      for (const [partId, meta] of Object.entries(parsedData.patternMetaMap)) {
        await this.setPattern(partId, meta as PatternOptions);
      }
    } else {
      // Check each object's patternMeta
      for (const obj of this.canvas.getObjects()) {
        const id = (obj as any).id;
        const meta = (obj as any).patternMeta;
        if (id && meta && meta.url) {
          await this.setPattern(id, meta);
        }
      }
    }

    if (parsedData.panelColorMap) {
      for (const [partId, col] of Object.entries(parsedData.panelColorMap)) {
        this.panelColorMap.set(partId, col as string);
      }
    }

    this.canvas.renderAll();

    return {
      detectedParts: detectedPartIds,
      patterns: new Map(this.patternMetaMap),
      colors: new Map(this.panelColorMap),
    };
  }

  /**
    * Applies pattern to a panel or all panels
    */
  async setPattern(id: string, options: PatternOptions) {
    const {
      scale = 1.0,
      angle = 0,
      offsetX = 0,
      offsetY = 0,
    } = options;

    const resolvedSvgContent = await this.resolvePatternSvgContent(options);
    const patternMeta = {
      ...options,
      svgContent: resolvedSvgContent ?? options.svgContent,
    };

    const { canvas: patternBuffer, width: tileW, height: tileH } =
      await createPatternCanvas(patternMeta);

    // Compute affine transform matrix for rotation, scale, offset
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad) * scale;
    const sin = Math.sin(rad) * scale;
    const patternMatrix: [number, number, number, number, number, number] = [
      cos,
      sin,
      -sin,
      cos,
      offsetX,
      offsetY,
    ];

    const fabricPattern = new Pattern({
      source: patternBuffer,
      repeat: 'repeat',
      patternTransform: patternMatrix,
    });

    const applyToObj = (obj: FabricObject, partId: string) => {
      if (!obj) return;
      if (!(obj as any)._originalFill && typeof obj.fill === 'string') {
        (obj as any)._originalFill = obj.fill;
      }

      obj.set('fill', fabricPattern);
      (obj as any).patternMeta = { ...patternMeta, tileWidth: tileW, tileHeight: tileH };
      this.patternMetaMap.set(partId, { ...patternMeta, tileWidth: tileW, tileHeight: tileH });
      if (patternMeta.bgColor) {
        this.panelColorMap.set(partId, patternMeta.bgColor);
      }
    };

    if (id === 'ALL') {
      this.panelMap.forEach((obj, partId) => {
        applyToObj(obj, partId);
      });
    } else {
      const targetObj = this.panelMap.get(id);
      if (targetObj) {
        applyToObj(targetObj, id);
      } else {
        // Try fallback to search in canvas objects
        const found = this.canvas.getObjects().find((o) => (o as any).id === id);
        if (found) {
          applyToObj(found, id);
        }
      }
    }

    this.canvas.renderAll();
  }

  /**
    * Removes pattern and restores color
    */
  removePattern(id: string, resetColor?: string) {
    const resetObj = (obj: FabricObject, partId: string) => {
      if (!obj) return;
      const colorToSet =
        resetColor || (obj as any)._originalFill || '#ffffff';
      obj.set('fill', colorToSet);
      (obj as any).patternMeta = null;
      this.patternMetaMap.delete(partId);
      if (resetColor) {
        this.panelColorMap.set(partId, resetColor);
      }
    };

    if (id === 'ALL') {
      this.panelMap.forEach((obj, partId) => {
        resetObj(obj, partId);
      });
    } else {
      const targetObj = this.panelMap.get(id);
      if (targetObj) {
        resetObj(targetObj, id);
      }
    }

    this.canvas.renderAll();
  }

  /**
    * Sets base solid color of a panel
    */
  setColor(id: string, color: string) {
    const obj = this.panelMap.get(id);
    if (!obj) return;

    (obj as any)._originalFill = color;
    this.panelColorMap.set(id, color);

    // If panel currently has a pattern, update its bgColor
    const meta = this.patternMetaMap.get(id);
    if (meta) {
      this.setPattern(id, { ...meta, bgColor: color });
    } else {
      obj.set('fill', color);
      this.canvas.renderAll();
    }
  }

  private buildPatternDefFromMeta(obj: FabricObject, id: string): string {
    const patternMeta = (obj as any).patternMeta as PatternOptions | undefined;
    if (!patternMeta) return '';

    const {
      scale = 1.0,
      angle = 0,
      offsetX = 0,
      offsetY = 0,
      opacity = 1.0,
      bgColor = '#ffffff',
      patternColor = null,
      tileWidth = 60,
      tileHeight = 60,
      svgContent,
      url,
    } = patternMeta;

    const patternId = `svg_pattern_${id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
    const rotateCenterX = tileWidth / 2;
    const rotateCenterY = tileHeight / 2;
    const transformAttr = `translate(${offsetX} ${offsetY}) rotate(${angle} ${rotateCenterX} ${rotateCenterY}) scale(${scale})`;

    let innerGraphic = '';
    let svgInner = svgContent || '';

    if (!svgInner) {
      const rawSvgText = url ? (() => {
        if (typeof url === 'string' && (url.startsWith('data:image/svg+xml') || /\.svg(?:[?#].*)?$/i.test(url))) {
          return ''; // resolved later by fallback route
        }
        return '';
      })() : '';

      if (rawSvgText) {
        svgInner = rawSvgText;
      }
    }

    if (svgInner) {
      let inner = stripOuterSvg(svgInner);
      if (!inner) {
        inner = svgInner;
      }
      inner = applyPatternColorToSvg(inner, patternColor);
      innerGraphic = `<g opacity="${opacity}">${inner}</g>`;
    } else if (url) {
      innerGraphic = `<image href="${url}" width="${tileWidth}" height="${tileHeight}" opacity="${opacity}" preserveAspectRatio="xMidYMid meet" />`;
    } else {
      innerGraphic = '';
    }

    const bgRect =
      bgColor && bgColor !== 'transparent'
        ? `<rect width="100%" height="100%" fill="${bgColor}" />`
        : '';

    return `
    <pattern id="${patternId}" width="${tileWidth}" height="${tileHeight}" patternUnits="userSpaceOnUse" patternTransform="${transformAttr}">
      ${bgRect}
      ${innerGraphic}
    </pattern>`;
  }

  /**
    * Exports a production-safe SVG that preserves the repeated pattern with vector data when possible.
    * This is intended for downstream factory / print workflows and avoids raster-based flattening when pattern source is SVG.
    */
  async exportProductionSVG(): Promise<string> {
    const width = this.viewBoxWidth;
    const height = this.viewBoxHeight;

    const patternDefs: string[] = [];
    const elementsSVG: string[] = [];

    for (const obj of this.canvas.getObjects()) {
      const id = (obj as any).id || `panel_${Math.random().toString(36).slice(2, 8)}`;
      const patternMeta = (obj as any).patternMeta as PatternOptions | undefined;

      let fillAttr = typeof obj.fill === 'string' ? obj.fill : '#ffffff';

      if (patternMeta && patternMeta.url) {
        let meta = { ...patternMeta };
        if (!meta.svgContent && (meta.url.startsWith('data:image/svg+xml') || /\.svg(?:[?#].*)?$/i.test(meta.url))) {
          meta.svgContent = await this.resolvePatternSvgContent(meta);
        }
        if (meta.svgContent) {
          const patternDef = this.buildPatternDefFromMeta({ ...obj, patternMeta: meta } as FabricObject, id);
          if (patternDef) patternDefs.push(patternDef);
          fillAttr = `url(#svg_pattern_${id.replace(/[^a-zA-Z0-9_]/g, '_')})`;
        }
      }

      const strokeAttr = obj.stroke ? `stroke="${obj.stroke}" stroke-width="${obj.strokeWidth || 1}"` : '';

      if (obj.type === 'path' && (obj as any).path) {
        const d = (obj as any).path
          .map((seg: any[]) => seg.join(' '))
          .join(' ');
        elementsSVG.push(`  <path id="${id}" d="${d}" fill="${fillAttr}" ${strokeAttr} />`);
      } else if (obj.type === 'polygon' && (obj as any).points) {
        const pts = (obj as any).points.map((p: any) => `${p.x},${p.y}`).join(' ');
        elementsSVG.push(`  <polygon id="${id}" points="${pts}" fill="${fillAttr}" ${strokeAttr} />`);
      } else if (obj.type === 'rect') {
        elementsSVG.push(`  <rect id="${id}" x="${obj.left}" y="${obj.top}" width="${obj.width}" height="${obj.height}" fill="${fillAttr}" ${strokeAttr} />`);
      } else {
        elementsSVG.push(`  <g id="${id}">${obj.toSVG()}</g>`);
      }
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
${patternDefs.join('\n')}
  </defs>
  <g id="jersey_garment_panels">
${elementsSVG.join('\n')}
  </g>
</svg>`;
  }

  /**
   * Exports standard W3C SVG maintaining <pattern> definitions & fill="url(#...)"
   * Directly satisfies: "要求导出来保持svg pattern"
   */
  exportSVGWithPatterns(): string {
    const width = this.viewBoxWidth;
    const height = this.viewBoxHeight;

    const patternDefs: string[] = [];
    const elementsSVG: string[] = [];

    // Collect all panels and build their SVG representation
    this.canvas.getObjects().forEach((obj, index) => {
      const id = (obj as any).id || `panel_${index}`;
      const patternMeta = (obj as any).patternMeta as PatternOptions | undefined;

      let fillAttr = typeof obj.fill === 'string' ? obj.fill : '#ffffff';

      if (patternMeta && patternMeta.url) {
        const patternId = `svg_pattern_${id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
        fillAttr = `url(#${patternId})`;

        const {
          scale = 1.0,
          angle = 0,
          offsetX = 0,
          offsetY = 0,
          opacity = 1.0,
          bgColor = '#ffffff',
          patternColor = null,
          tileWidth = 60,
          tileHeight = 60,
          svgContent,
          url,
        } = patternMeta;

        const rotateCenterX = tileWidth / 2;
        const rotateCenterY = tileHeight / 2;
        const transformAttr = `translate(${offsetX} ${offsetY}) rotate(${angle} ${rotateCenterX} ${rotateCenterY}) scale(${scale})`;

        let innerGraphic = '';
        if (svgContent) {
          let inner = stripOuterSvg(svgContent);
          if (!inner) inner = svgContent;
          inner = applyPatternColorToSvg(inner, patternColor);
          innerGraphic = `<g opacity="${opacity}">${inner}</g>`;
        } else {
          innerGraphic = `<image href="${url}" width="${tileWidth}" height="${tileHeight}" opacity="${opacity}" preserveAspectRatio="xMidYMid meet" />`;
        }

        const bgRect =
          bgColor && bgColor !== 'transparent'
            ? `<rect width="100%" height="100%" fill="${bgColor}" />`
            : '';

        patternDefs.push(`
    <pattern id="${patternId}" width="${tileWidth}" height="${tileHeight}" patternUnits="userSpaceOnUse" patternTransform="${transformAttr}">
      ${bgRect}
      ${innerGraphic}
    </pattern>`);
      }

      // Convert object to SVG path or polygon
      const strokeAttr = obj.stroke ? `stroke="${obj.stroke}" stroke-width="${obj.strokeWidth || 1}"` : '';

      if (obj.type === 'path' && (obj as any).path) {
        const d = (obj as any).path
          .map((seg: any[]) => seg.join(' '))
          .join(' ');
        elementsSVG.push(`  <path id="${id}" d="${d}" fill="${fillAttr}" ${strokeAttr} />`);
      } else if (obj.type === 'polygon' && (obj as any).points) {
        const pts = (obj as any).points.map((p: any) => `${p.x},${p.y}`).join(' ');
        elementsSVG.push(`  <polygon id="${id}" points="${pts}" fill="${fillAttr}" ${strokeAttr} />`);
      } else if (obj.type === 'rect') {
        elementsSVG.push(`  <rect id="${id}" x="${obj.left}" y="${obj.top}" width="${obj.width}" height="${obj.height}" fill="${fillAttr}" ${strokeAttr} />`);
      } else {
        // Fallback to Fabric's object SVG
        elementsSVG.push(`  <g id="${id}">${obj.toSVG()}</g>`);
      }
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
${patternDefs.join('\n')}
  </defs>
  <g id="jersey_garment_panels">
${elementsSVG.join('\n')}
  </g>
</svg>`;
  }

  /**
    * Generates High-Resolution PNG for printing/preview
    */
  exportPNG(multiplier = 2.5): string {
    return this.canvas.toDataURL({
      format: 'png',
      multiplier,
    });
  }
}
