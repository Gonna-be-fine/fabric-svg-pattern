import * as THREE from 'three';
import FabricCanvas from './FabricCanvas';
import { loadSVGFromString, loadSVGFromURL } from 'fabric';
import * as fabric from 'fabric';
import { initAligningGuidelines } from 'fabric/extensions';
import { SvgFontManager } from './SvgFontManager';
import { clone, throttle } from 'lodash';
import _fontManager from '../../utils/FontManager';
import CustomText from './CustomText';
import { CareLabel, pickTextOptions } from '../../configs';
import { isSVGString } from '../utils/utils';
import PerformanceDetector from './PerformanceDetector';
import { FabricMagnifier } from './FabricMagnifer';
import { createPatternFill } from './PatternFill';
import BrandLogo from '@/assets/logo/M1.svg';
import { publicPath } from '../../utils/publicPath';

window.fabric = fabric;
const DEFAULTSIZE = 2048;
const MOBILE_TEXTURE_SIZE = 1024;
const svgUrlPattern = /\.svg(?:[?#].*)?$/i;
const svgDataUrlPattern = /^data:image\/svg\+xml/i;
const isMobileDevice = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0);

async function loadSvgImage(input) {
  const text = await fetch(input).then((res) => res.text());
  const data = await fabric.loadSVGFromString(text);
  return fabric.util.groupSVGElements(data.objects, data.options);
}
// const DEFAULTSIZE = PerformanceDetector.getOptimalSize();
class FabricEditor {
  constructor(world, options) {
    this.world = world;
    this.options = options;
    this.canvasSize = isMobileDevice() ? MOBILE_TEXTURE_SIZE : DEFAULTSIZE;
    this.loadingPromise = this.initFabricCanvas();
  }

  async toSVG(
    filename = 'canvas.svg',
    scale = 1,
    options = { isDownload: true }
  ) {
    const canvas = this.canvas;
    const width = canvas.getWidth();
    const height = canvas.getHeight();
    const svgOptions = {
      width: width * scale,
      height: height * scale,
      viewBox: { x: 0, y: 0, width, height },
      // 下面两行非常关键
      multiplier: scale, // 告诉 Fabric 内部导出时放大
      // preserveObjectStacking: true // 可选，保持层级
    };
    let svgData = canvas.toSVG(svgOptions); // 生成SVG字符串

    const objects = this.canvas.getObjects();
    let texts = objects.filter(
      (obj) => obj.type === 'text' || obj.type === 'customtext'
    );
    texts = texts.concat(
      objects.filter((v) => v.type === 'customtext').map((v) => v.textElement)
    );
    const set = new Set(texts.map((v) => v.fontFamily));
    texts = Array.from(set);

    let styleTag = '';
    for (const text of texts) {
      const base64 = await _fontManager.getFontBase64(text);
      if (base64) {
        styleTag += `
          ${base64} \n
        `;
      }
    }
    styleTag = `
      <style>
        ${styleTag}
      </style>
    `;
    svgData = svgData.replace('</svg>', `${styleTag}</svg>`);

    if (!options.isDownload) {
      return svgData;
    }
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }

  getJson() {
    const saveJson = this.canvas.toObject([
      'id',
      'selectable',
      '_originalFill',
      'patternMeta',
      'visible',
    ]);
    // 保存canvas尺寸
    saveJson.canvasWidth = this.canvas.getWidth();
    saveJson.canvasHeight = this.canvas.getHeight();
    // top-left
    saveJson.objects.forEach((obj) => {
      if (isNaN(obj.left)) {
        obj.left = 0;
      }
      if (isNaN(obj.top)) {
        obj.top = 0;
      }
    });
    return saveJson;
  }

  clearSelection() {
    if (!this.canvas.getActiveObject()) return;
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
  }

  async initFabricCanvas() {
    this.containerId = this.options.type + 'Ctn';
    this.canvas = new FabricCanvas(this.containerId, {
      enableRetinaScaling: false,
      renderOnAddRemove: false,
    }, this.world);

    // 初始化对齐线
    const config = {
      /** At what distance from the shape does alignment begin? */
      // margin: 4,
      /** Aligning line dimensions */
      width: 1,
      /** Aligning line color */
      color: 'rgb(255,255,255,0.9)',
    };
    this.deactivate = initAligningGuidelines(this.canvas, config);

    this.canvas.selection = false; // 禁用框选
    this.canvas.skipTargetFind = false; // 保证还能选中单个对象

    this.texture = new THREE.Texture(this.canvas.getElement());
    this.texture.flipY = false;
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = this.world.renderer?.capabilities.getMaxAnisotropy() || 1;

    if (typeof this.options.textureSvg === 'string') {
      await this.loadSvg();
    } else {
      await this.loadJson();
    }
    this.canvas.renderOnAddRemove = true;
    this.canvas.on(
      'after:render',
      throttle(() => {
        this.texture.needsUpdate = true;
      }, isMobileDevice() ? 350 : 200)
    );

    this.fabricMagnifer = new FabricMagnifier(this.canvas, {});
  }

  rotateElement(element, angle) {
    element.rotate(angle);
    element.setCoords(); // 添加这一行
    this.canvas.renderAll();
  }

  moveElement(element, left, top) {
    element.left = left;
    element.top = top;
    element.setCoords();
    this.canvas.renderAll();
    this.texture.needsUpdate = true;
  }

  cleanJson(json) {
    json.objects = json.objects.filter((obj) => {
      if (obj.type !== 'Image') return true;
      // 过滤掉无 src、无尺寸的空图层
      return obj.src && obj.src.length > 0 && obj.width > 0 && obj.height > 0;
    });
    return json;
  }

  async loadJson() {
    const { textureSvg } = this.options;
    // const json = this.cleanJson(url);
    const svgWidth = this.canvasSize;
    const svgHeight = this.canvasSize;
    this.canvas.setDimensions({
      width: svgWidth,
      height: svgHeight,
    });
    textureSvg.objects = textureSvg.objects.filter(
      (obj) =>
        !(
          obj.type === 'Text' &&
          (obj.text.includes('MACHINE') ||
            obj.text.includes('MADE IN AUSTRALIA') ||
            obj.text.includes('100% POLYESTER'))
        )
    );
    // 加载font
    for (const obj of textureSvg.objects) {
      if (obj.type === 'Text' || obj.type === 'FabricText' || obj.type === 'text') {
        await _fontManager.loadFont(obj.fontFamily);
      }
      if (obj.type === 'CustomText') {
        const text = obj.objects.find((v) => v.type === 'Text' || v.type === 'FabricText' || v.type === 'text');
        if (text) {
          await _fontManager.loadFont(text.fontFamily);
        }
      }
    }
    await this.canvas.loadFromJSON(textureSvg);
    const scaleX = svgWidth / textureSvg.canvasWidth;
    const scaleY = svgHeight / textureSvg.canvasHeight;

    this.canvas.getObjects().forEach((obj) => {
      obj.scaleX *= scaleX;
      obj.scaleY *= scaleY;
      obj.left *= scaleX;
      obj.top *= scaleY;
      obj.setCoords();
      // obj.selectable = false;
    });

    // MARK: 默认添加
    if (!['t_shirt', 't-shirt'].includes(this.world.options.sportType)) {
      await this.fixDefaultDesign();
    }

    await this.restorePatternFills();
    this.canvas.renderAll();
    this.texture.needsUpdate = true;
  }

  async loadCanvasState(jsonData) {
    if (!jsonData) return;
    this.clearSelection();
    
    // Check and load any font references in the objects
    if (jsonData.objects) {
      for (const obj of jsonData.objects) {
        if (obj.type === 'Text' || obj.type === 'FabricText' || obj.type === 'text') {
          await _fontManager.loadFont(obj.fontFamily);
        }
        if (obj.type === 'CustomText') {
          const text = obj.objects.find((v) => v.type === 'Text' || v.type === 'FabricText' || v.type === 'text');
          if (text) {
            await _fontManager.loadFont(text.fontFamily);
          }
        }
      }
    }
    
    await this.canvas.loadFromJSON(jsonData);
    await this.restorePatternFills();
    
    // Re-verify positions
    this.canvas.getObjects().forEach((obj) => {
      obj.setCoords();
    });
    
    this.canvas.renderAll();
    this.texture.needsUpdate = true;
  }

  async loadSvg() {
    const { textureSvg } = this.options;
    let svgString = await fetch(publicPath(textureSvg)).then((res) => res.text());

    const fontManager = new SvgFontManager();
    this.fontManager = fontManager;
    await fontManager.extractFontsFromSvg(svgString);
    const cleanedSvg = fontManager.getCleanedSvg(svgString);

    const data = await loadSVGFromString(cleanedSvg);
    const { objects, options } = data;
    const svgWidth = options.width || 2048;
    const svgHeight = options.height || 2048;
    const scaleSize = this.canvasSize / Math.max(svgWidth, svgHeight);
    this.canvas.setDimensions({
      width: scaleSize * svgWidth,
      height: scaleSize * svgHeight,
    });
    const canvas = this.canvas;
    // 计算缩放比例（保持宽高比）
    const scale = Math.min(
      canvas.width / svgWidth,
      canvas.height / svgHeight
    );
    // console.log(data);
    // 缩放并添加到画布
    objects.forEach((obj) => {
      obj.scaleX *= scale;
      obj.scaleY *= scale;
      obj.left = (obj.left ?? 0) * scale;
      obj.top = (obj.top ?? 0) * scale;
      obj.selectable = false;
      canvas.add(obj);
    });

    canvas.requestRenderAll();
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        this.texture.needsUpdate = true;
        resolve();
      });
    });
  }

  setColor(id, color) {
    const el = this.canvas.getObjectById(id);
    if (!el) {
      console.warn('找不到对象', id);
      return;
    }
    el.set('fill', color);
    this.canvas.renderAll();
  }

  async restorePatternFills() {
    // Legacy JSON contains PNG tiles. Rebuild them from the original URL;
    // new JSON revives GarmentPattern directly, including its vector tile.
    for (const obj of this.canvas.getObjects()) {
      if (obj.patternMeta?.url && obj.fill?.constructor.type !== 'GarmentPattern') {
        await this.setPattern(obj.id, obj.patternMeta);
      }
    }
  }

  async setPattern(id, options = {}) {
    const fills = new Map();
    const applyToObj = async (obj) => {
      if (!obj) return;

      const {
        url,
        scale = 1.0,
        angle = 0,
        opacity = 1.0,
        offsetX = 0,
        offsetY = 0,
        patternColor = null,
        bgColor = null
      } = options;

      if (!url) {
        if (bgColor) {
          obj.set('fill', bgColor);
        } else if (obj._originalFill && typeof obj._originalFill === 'string') {
          obj.set('fill', obj._originalFill);
        }
        obj.set('patternMeta', null);
        return;
      }

      if (!obj._originalFill || typeof obj.fill === 'string') {
        obj._originalFill = typeof obj.fill === 'string' ? obj.fill : '#ffffff';
      }

      const effectiveBgColor =
        bgColor || (typeof obj.fill === 'string' ? obj.fill : obj._originalFill) || '#ffffff';

      if (!fills.has(effectiveBgColor)) {
        const mobile = isMobileDevice();
        try {
          fills.set(effectiveBgColor, await createPatternFill({
            url, scale, angle, opacity, offsetX, offsetY,
            patternColor, bgColor: effectiveBgColor,
          }, { density: mobile ? 2 : 4, maxSize: mobile ? 1024 : 2048 }));
        } catch (error) {
          console.error('Failed to load pattern image:', error);
          return;
        }
      }
      // Share decoded images, but keep IDs unique: each panel's exported
      // pattern has dimensions relative to that panel's bounding box.
      obj.set('fill', fills.get(effectiveBgColor).clone());
      obj.set('patternMeta', {
        url,
        scale,
        angle,
        opacity,
        offsetX,
        offsetY,
        patternColor,
        bgColor: effectiveBgColor,
      });
    };

    const filterTargetObjects = () => {
      return this.canvas.getObjects().filter((obj) => {
        if (!obj?.id) return false;
        return obj.id.startsWith('COLOUR_') || ['Path', 'Polygon', 'Rect'].includes(obj.type);
      });
    };

    if (id === 'ALL') {
      for (const obj of filterTargetObjects()) {
        await applyToObj(obj);
      }
    } else {
      await applyToObj(this.canvas.getObjectById(id));
    }

    this.canvas.renderAll();
    if (this.texture) {
      this.texture.needsUpdate = true;
    }
  }

  removePattern(id, resetColor) {
    const resetObj = (obj) => {
      if (!obj) return;
      if (resetColor) {
        obj.set('fill', resetColor);
      } else if (obj._originalFill) {
        obj.set('fill', obj._originalFill);
      }
      obj.set('patternMeta', null);
    };

    const filterTargetObjects = () => {
      return this.canvas.getObjects().filter((obj) => {
        if (!obj?.id) return false;
        return obj.id.startsWith('COLOUR_') || ['Path', 'Polygon', 'Rect'].includes(obj.type);
      });
    };

    if (id === 'ALL') {
      filterTargetObjects().forEach(resetObj);
    } else {
      resetObj(this.canvas.getObjectById(id));
    }

    this.canvas.renderAll();
    if (this.texture) {
      this.texture.needsUpdate = true;
    }
  }

  addText(options) {
    const {
      left,
      top,
      fontFamily,
      fontSize,
      fill,
      originX,
      originY,
      charSpacing,
      text,
    } = options;
    const len = this.getMaxTextId() + 1;
    const newText = new CustomText(
      text.replaceAll('\n', '') || 'NAME',
      Object.assign({}, options, {
        id: options.id || 'text-' + len,
        left: left || 360,
        top: top || 700,
        fontFamily: fontFamily || 'Komikazoom',
        fontSize: fontSize || 40,
        fill: fill || '#ffffff',
        originX: originX || 'center',
        originY: originY || 'center',
        charSpacing: charSpacing || 100,
      })
    );
    this.canvas.add(newText);
    window.text = newText;
    this.canvas.requestRenderAll();
    return newText;
  }

  _addText(options) {
    const {
      left,
      top,
      fontFamily,
      fontSize,
      fill,
      originX,
      originY,
      charSpacing,
      text,
    } = options;
    const len = this.getMaxTextId() + 1;
    const newText = new fabric.FabricText(
      text || 'NAME',
      Object.assign({}, options, {
        id: options.id || 'text-' + len,
        left: left || 360,
        top: top || 700,
        fontFamily: fontFamily || 'Komikazoom',
        fontSize: fontSize || 40,
        fill: fill || '#ffffff',
        originX: originX || 'center',
        originY: originY || 'center',
        charSpacing: charSpacing || 100,
      })
    );
    this.canvas.add(newText);
    this.canvas.requestRenderAll();
    return newText;
  }

  getMaxTextId() {
    const ids = this.canvas
      .getObjects('text')
      .map((obj) => obj.id.split('-')[1] || 0);
    const ids2 = this.canvas
      .getObjects('customtext')
      .map((obj) => obj.id.split('-')[1] || 0);
    return Math.max(...ids, ...ids2);
  }

  setNewText(id, options) {
    const text = this.canvas.getObjectById(id);
    if (!text) {
      console.warn('找不到对象', id);
      return;
    }
    if (options.isCurved !== undefined) {
      // 相同的情况return
      if (
        (options.isCurved && text.textElement) ||
        (!options.isCurved && !text.textElement)
      ) {
        return;
      }
      this.removeObjectById(id);
      let textOptions = {};
      if (options.isCurved) {
        textOptions = pickTextOptions(text);
        textOptions.left = text.left;
        textOptions.top = text.top;
        textOptions.id = id;
        textOptions.curveValue = options.textOptions.curveValue || 50;
        return this.addText(textOptions);
      } else {
        textOptions = pickTextOptions(text.textElement);
        textOptions.left = text.left;
        textOptions.top = text.top;
        textOptions.id = id;
        return this._addText(textOptions);
      }
    }
  }

  updateText(id, options) {
    const text = this.canvas.getObjectById(id);
    if (!text) {
      console.warn('找不到对象', id);
      return;
    }

    if (text.textElement) {
      text.updateProperties(options);
    } else {
      text.set(options);
      this.canvas.renderAll();
    }
  }

  removeObjectById(id) {
    const obj = this.canvas.getObjectById(id);
    this.canvas.remove(obj);
  }

  setObjectsVisible(ids, visible) {
    if (!Array.isArray(ids) || ids.length === 0) return false;

    const nextVisible = Boolean(visible);
    let changed = false;

    ids.forEach((id) => {
      const obj = this.canvas.getObjectById(id);
      if (!obj) return;

      if (obj.visible !== nextVisible) {
        changed = true;
      }

      obj.set('visible', nextVisible);
      obj.setCoords?.();

      if (!nextVisible && this.canvas.getActiveObject() === obj) {
        this.canvas.discardActiveObject();
      }
    });

    if (changed) {
      this.canvas.requestRenderAll();
      if (this.texture) {
        this.texture.needsUpdate = true;
      }
    }

    return changed;
  }

  setLogoColor(id, color) {
    const obj = this.canvas.getObjectById(id);
    if (!obj || !color) return false;

    const applyColor = (target) => {
      if (!target) return;

      if (typeof target.set === 'function') {
        const fill = target.get?.('fill');
        const stroke = target.get?.('stroke');

        if (fill && fill !== 'none' && fill !== 'transparent') {
          target.set('fill', color);
        }

        if (stroke && stroke !== 'none' && stroke !== 'transparent') {
          target.set('stroke', color);
        }
      }

      const children = target.getObjects?.() || target._objects || [];
      children.forEach(applyColor);
    };

    applyColor(obj);
    this.canvas.requestRenderAll();
    if (this.texture) {
      this.texture.needsUpdate = true;
    }

    return true;
  }

  selectObjectById(id) {
    const obj = this.canvas.getObjectById(id);
    if (!obj) {
      console.warn('找不到对象', id);
      return;
    }
    this.canvas.setActiveObject(obj);
    this.canvas.requestRenderAll();
    return obj;
  }

  async loadImage(input) {
    let img = null;
    // 1. Check if the base64 string is an SVG data URI
    if (isSVGString(input)) {
      // Use fabric.loadSVGFromString for vector data
      const data = await fabric.loadSVGFromString(input);

      // Fabric 6 推荐创建 SVG 对象（新方式）
      const svg = fabric.util.groupSVGElements(data.objects, data.options);

      img = svg;
    } else if (svgDataUrlPattern.test(input) || svgUrlPattern.test(input)) {
      img = await loadSvgImage(input);
    } else {
      // Use fabric.FabricImage for image data
      img = await fabric.FabricImage.fromURL(input, {
        crossOrigin: 'anonymous',
      });
    }
    return img;
  }

  getNextLogoId() {
    const maxId = this.canvas.getObjects().reduce((max, obj) => {
      const match = typeof obj.id === 'string' ? obj.id.match(/^image-(\d+)$/) : null;
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);

    return `image-${maxId + 1}`;
  }

  async addLogo(base64, options = {}) {
    const canvas = this.canvas;

    let img = await this.loadImage(base64);
    img.id = this.getNextLogoId();

    // 自动缩放适配画布
    const canvasWidth = canvas.getWidth() / 8;
    const canvasHeight = canvas.getHeight() / 8;
    const imgWidth = img.width;
    const imgHeight = img.height;

    const scale = Math.min(
      canvasWidth / imgWidth,
      canvasHeight / imgHeight,
      1 // 不放大
    );

    img.set({
      scaleX: scale,
      scaleY: scale,
      left: canvas.getWidth() / 2,
      top: canvas.getHeight() / 2,
      originX: 'center',
      originY: 'center',
      ...options,
    });

    canvas.add(img);
    canvas.setActiveObject(img);
    return img;
  }

  async updateLogoSource(id, base64) {
    const canvas = this.canvas;
    const obj = canvas.getObjectById(id);
    if (!obj || !base64) return false;

    const isActive = canvas.getActiveObject() === obj;
    const index = canvas.getObjects().indexOf(obj);
    const preserve = {
      left: obj.left,
      top: obj.top,
      scaleX: obj.scaleX,
      scaleY: obj.scaleY,
      angle: obj.angle,
      skewX: obj.skewX,
      skewY: obj.skewY,
      flipX: obj.flipX,
      flipY: obj.flipY,
      originX: obj.originX,
      originY: obj.originY,
      opacity: obj.opacity,
      visible: obj.visible,
      selectable: obj.selectable,
      evented: obj.evented,
      lockMovementX: obj.lockMovementX,
      lockMovementY: obj.lockMovementY,
      lockRotation: obj.lockRotation,
      lockScalingX: obj.lockScalingX,
      lockScalingY: obj.lockScalingY,
      centeredRotation: obj.centeredRotation,
      centeredScaling: obj.centeredScaling,
      padding: obj.padding,
      crossOrigin: obj.crossOrigin,
    };

    try {
      if (typeof obj.setSrc === 'function') {
        await obj.setSrc(base64, { crossOrigin: 'anonymous' });
        obj.set(preserve);
        obj.setCoords?.();
        canvas.requestRenderAll();
        if (this.texture) {
          this.texture.needsUpdate = true;
        }
        if (isActive) {
          canvas.setActiveObject(obj);
        }
        return true;
      }

      const next = await this.loadImage(base64);
      next.id = obj.id;
      next.set(preserve);

      canvas.remove(obj);
      if (typeof canvas.insertAt === 'function' && index >= 0) {
        canvas.insertAt(next, index, false);
      } else {
        canvas.add(next);
      }
      if (isActive) {
        canvas.setActiveObject(next);
      }
      canvas.requestRenderAll();
      if (this.texture) {
        this.texture.needsUpdate = true;
      }
      return true;
    } catch (err) {
      console.error('Failed to update logo source:', err);
      return false;
    }
  }

  addImage(options = {}) {
    const canvas = this.canvas;
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';

      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = async (e) => {
          const base64 = e.target.result;

          try {
            const img = await fabric.FabricImage.fromURL(base64, {
              crossOrigin: 'anonymous',
            });
            img.id = this.getNextLogoId();
            // 自动缩放适配画布
            const canvasWidth = canvas.getWidth() / 8;
            const canvasHeight = canvas.getHeight() / 8;
            const imgWidth = img.width;
            const imgHeight = img.height;

            const scale = Math.min(
              canvasWidth / imgWidth,
              canvasHeight / imgHeight,
              1 // 不放大
            );

            img.set({
              scaleX: scale,
              scaleY: scale,
              left: canvasWidth / 2,
              top: canvasHeight / 2,
              originX: 'center',
              originY: 'center',
              ...options,
            });

            canvas.add(img);
            canvas.setActiveObject(img);
            resolve(img);
          } catch (err) {
            reject(err);
          }
        };

        reader.onerror = () => reject(new Error('图片读取失败'));
        reader.readAsDataURL(file);
      };

      input.click();
    });
  }

  async copyElement(objectId) {
    const activeObject = this.canvas.getObjectById(objectId);
    if (!activeObject) {
      console.warn('找不到对象', objectId);
      return;
    }
    let id = objectId + '-copy';
    if (activeObject.type === 'text' || activeObject.type === 'customtext') {
      id = 'text-' + (this.getMaxTextId() + 1);
    } else {
      id =
        `${activeObject.type}-` +
        (this.canvas.getObjects(activeObject.type).length + 1);
    }
    const cloned = await activeObject.clone();
    cloned.set({
      id,
      left: activeObject.left + 20,
      top: activeObject.top + 20,
      evented: true,
    });

    this.canvas.add(cloned);
    this.canvas.setActiveObject(cloned);
    this.canvas.requestRenderAll();
    return cloned;
  }

  async addDefaultLogo(id, bounds, options = {}) {
    const img = await this.loadImage(BrandLogo);
    const scale = Math.min(
      bounds.width / img.width,
      bounds.height / img.height,
      1
    );

    img.set({
      id,
      scaleX: scale,
      scaleY: scale,
      selectable: false,
      ...options,
    });

    this.canvas.add(img);
    img.setCoords();
    return img;
  }

  async fixDefaultDesign() {
    // 替换品牌logo
    const logo = this.canvas.getObjectById('FE_LOGO');
    if (logo) {
      const frontLogo = this.canvas.getObjectById('logoFront-0');
      const backLogo = this.canvas.getObjectById('logoBack-1');
      if (frontLogo) this.canvas.remove(frontLogo);
      if (backLogo) this.canvas.remove(backLogo);
      const { originX, originY } = logo;
      const { width, height, left, top } = logo.getBoundingRect();
      await this.addDefaultLogo('logoFront-0', { width, height }, {
        id: 'logoFront-0',
        left,
        top,
        scaleX: this.canvasSize == 1024 ? 0.165/2 : 0.165,
        scaleY: this.canvasSize == 1024 ? 0.165/2 : 0.165,
        originX,
        originY,
        selectable: false,
      });
      if (this.options.type !== 'pant') {
        await this.addDefaultLogo('logoBack-1', { width, height }, {
          id: 'logoBack-1',
          left: left + width,
          top: top + height,
          scaleX: this.canvasSize == 1024 ? 0.165/2 : 0.165,
          scaleY: this.canvasSize == 1024 ? 0.165/2 : 0.165,
          originX: 'right',
          originY: 'bottom',
          selectable: false,
        });
      }
      this.canvas.remove(logo);
    }
    // 添加洗水唛
    const carel = this.canvas.getObjectById(CareLabel.id);
    if (!carel) {
      const careObj = JSON.parse(JSON.stringify(CareLabel));
      if (this.canvasSize === 1024) {
        careObj.left = careObj.left / 2;
        careObj.top = careObj.top / 2;
        careObj.fontSize = careObj.fontSize / 2;
      }
      fabric.util.enlivenObjects([careObj]).then((objects) => {
        const textObj = objects[0];
        textObj.selectable = false;
        this.canvas.add(textObj);
        // this.canvas.setActiveObject(textObj);
      });
    }

    const bgMask = this.canvas.getObjectById("FE_LOGO_BACKGROUND");
    if (bgMask) {
      this.canvas.remove(bgMask);
    }
  }

  /**
   * 替换 Fabric.Image 的内容（不创建新对象）
   * 支持：
   *  - 普通图片 URL
   *  - SVG URL
   *  - SVG 字符串
   *
   * @param {fabric.Image} imgObj   需要被替换的 Image 对象
   * @param {string} source         url 或 svg 字符串
   */
  async replaceFabricImage(imgObj, source) {
    if (!imgObj || !source) return;
    const canvas = this.canvas;
    // 记录原对象状态
    const { id, left, top, angle, scaleX, scaleY, originX, originY } = imgObj;

    // 旧对象「可视尺寸」
    const oldMaxSide = Math.max(
      imgObj.getScaledWidth(),
      imgObj.getScaledHeight()
    );

    const newImg = await this.loadImage(source);
    // 3️⃣ 计算比例（关键）
    const newMaxSide = Math.max(newImg.width, newImg.height);
    const scale = oldMaxSide / newMaxSide;
    newImg.set({
      id,
      left,
      top,
      angle,
      scaleX: scale,
      scaleY: scale,
      originX,
      originY,
    });

    newImg.setCoords();

    // 4️⃣ 删除旧对象，添加新对象
    canvas.remove(imgObj);
    canvas.add(newImg);
    canvas.setActiveObject(newImg);

    canvas.requestRenderAll();
  }

  destroy() {
    this.fabricMagnifer.destroy();
    this.canvas.dispose();
    this.canvas = null;
  }
}

export default FabricEditor;
