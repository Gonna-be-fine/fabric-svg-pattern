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

/** Convert raw SVG XML or a legacy SVG data URL into a self-contained nested SVG. */
function buildNestedSvgGraphic(source: string, width: number, height: number, tint: string | null, opacity: number, idPrefix: string): string | null {
  if (!source) return null;
  let markup = source.trim();

  if (/^data:image\/svg\+xml/i.test(markup)) {
    const comma = markup.indexOf(',');
    if (comma < 0) return null;
    const metadata = markup.slice(0, comma);
    const payload = markup.slice(comma + 1);
    try {
      markup = /;base64/i.test(metadata)
        ? decodeURIComponent(escape(atob(payload)))
        : decodeURIComponent(payload);
    } catch {
      return null;
    }
  }

  try {
    const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
    const root = doc.documentElement;
    if (root.localName.toLowerCase() !== 'svg' || doc.querySelector('parsererror')) return null;

    const nested = root.cloneNode(true) as SVGSVGElement;
    nested.setAttribute('x', '0');
    nested.setAttribute('y', '0');
    nested.setAttribute('width', String(width));
    nested.setAttribute('height', String(height));

    if (!nested.hasAttribute('viewBox')) {
      const sourceWidth = parseFloat(root.getAttribute('width') || '');
      const sourceHeight = parseFloat(root.getAttribute('height') || '');
      nested.setAttribute('viewBox', `0 0 ${sourceWidth > 0 ? sourceWidth : width} ${sourceHeight > 0 ? sourceHeight : height}`);
    }

    if (tint) {
      const nodes = [nested, ...Array.from(nested.querySelectorAll('*'))];
      for (const node of nodes) {
        for (const attr of ['fill', 'stroke']) {
          const value = node.getAttribute(attr);
          if (value && value !== 'none' && !value.startsWith('url(')) node.setAttribute(attr, tint);
        }
        const style = node.getAttribute('style');
        if (style) {
          node.setAttribute('style', style
            .replace(/(^|;)\\s*fill\\s*:[^;]+/gi, `$1fill:${tint}`)
            .replace(/(^|;)\\s*stroke\\s*:[^;]+/gi, `$1stroke:${tint}`));
        }
      }
    }

    // IDs inside SVG defs must be unique when the same artwork is applied to
    // more than one jersey panel (gradients, masks, clipPaths, filters, etc.).
    const allNodes = [nested, ...Array.from(nested.querySelectorAll('*'))];
    const idMap = new Map<string, string>();
    for (const node of allNodes) {
      const oldId = node.getAttribute('id');
      if (oldId) {
        const newId = `${idPrefix}_${oldId}`;
        idMap.set(oldId, newId);
        node.setAttribute('id', newId);
      }
    }
    for (const node of allNodes) {
      for (const attr of Array.from(node.attributes)) {
        let value = attr.value;
        for (const [oldId, newId] of idMap) {
          const escapedId = oldId.replace(/[.*+?^${}()|[\]\\]/g, '\\    if (opacity < 1) nested.setAttribute('opacity', String(opacity));
    return new XMLSerializer().serializeToString(nested);');
          value = value.replace(new RegExp(`url\\(#${escapedId}\\)`, 'g'), `url(#${newId})`);
          if ((attr.name === 'href' || attr.name === 'xlink:href') && value === `#${oldId}`) {
            value = `#${newId}`;
          }
          if (attr.name === 'aria-labelledby' || attr.name === 'aria-describedby') {
            value = value.split(/\\s+/).map((token) => token === oldId ? newId : token).join(' ');
          }
        }
        if (value !== attr.value) node.setAttribute(attr.name, value);
      }
    }

    if (opacity < 1) nested.setAttribute('opacity', String(opacity));
    return new XMLSerializer().serializeToString(nested);
  } catch {
    return null;
  }
}


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

    const { canvas: patternBuffer, width: tileW, height: tileH } =
      await createPatternCanvas(options);

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
      (obj as any).patternMeta = { ...options, tileWidth: options.tileWidth || tileW, tileHeight: options.tileHeight || tileH };
      this.patternMetaMap.set(partId, { ...options, tileWidth: tileW, tileHeight: tileH });
      if (options.bgColor) {
        this.panelColorMap.set(partId, options.bgColor);
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

        // Pattern transform
        const transformAttr = `translate(${offsetX}, ${offsetY}) rotate(${angle}) scale(${scale})`;

        // Keep SVG paths, defs, gradients, masks and clipping paths as vectors.
        // Raster uploads and malformed SVGs fall back to an embedded image.
        const vectorGraphic = svgContent
          ? buildNestedSvgGraphic(svgContent, tileWidth, tileHeight, patternColor, opacity, patternId)
          : null;
        const safeHref = url.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
        const innerGraphic = vectorGraphic
          ? vectorGraphic
          : `<image href="${safeHref}" width="${tileWidth}" height="${tileHeight}" opacity="${opacity}" />`;

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
