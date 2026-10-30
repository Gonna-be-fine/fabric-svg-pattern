import { Canvas } from 'fabric';
import { TileConfig } from '../types';

/**
 * Extracts inner SVG elements from Fabric Canvas toSVG output
 */
export function getTileInnerSVG(canvas: Canvas, config: TileConfig): string {
  // Fabric canvas.toSVG returns full <svg ...><g>...</g></svg>
  const fullSvg = canvas.toSVG({
    width: `${config.width}px`,
    height: `${config.height}px`,
    viewBox: {
      x: 0,
      y: 0,
      width: config.width,
      height: config.height,
    },
  });

  // Extract content between <svg ...> and </svg>
  const match = fullSvg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  let innerContent = match ? match[1].trim() : '';

  // Remove XML declaration or defs if present inside
  innerContent = innerContent.replace(/<\?xml[\s\S]*?\?>/i, '');

  return innerContent;
}

/**
 * Builds standard SVG pattern XML
 */
export function generateFullSVGPattern(
  canvas: Canvas,
  config: TileConfig,
  viewportWidth = 800,
  viewportHeight = 600
): string {
  const innerTileContent = getTileInnerSVG(canvas, config);
  const patternId = 'fabric-svg-pattern';
  const { width, height, backgroundColor, transparentBackground, repeatMode, rowShift = 0.5, colShift = 0.5 } = config;

  const bgRect = !transparentBackground
    ? `<rect width="100%" height="100%" fill="${backgroundColor}" />`
    : '';

  let patternUnitsWidth = width;
  let patternUnitsHeight = height;
  let patternInnerShapes = '';

  if (repeatMode === 'brick-row') {
    // 2-row repeat structure for standard SVG brick repetition
    patternUnitsWidth = width;
    patternUnitsHeight = height * 2;
    const shiftX = width * rowShift;

    patternInnerShapes = `
      <!-- Row 1 -->
      <g transform="translate(0, 0)">
        ${innerTileContent}
      </g>
      <!-- Row 2 (Shifted) -->
      <g transform="translate(${shiftX}, ${height})">
        ${innerTileContent}
      </g>
      <!-- Wrap-around fill for seam coverage -->
      <g transform="translate(${shiftX - width}, ${height})">
        ${innerTileContent}
      </g>
    `;
  } else if (repeatMode === 'brick-col') {
    // 2-column repeat structure for brick column
    patternUnitsWidth = width * 2;
    patternUnitsHeight = height;
    const shiftY = height * colShift;

    patternInnerShapes = `
      <!-- Column 1 -->
      <g transform="translate(0, 0)">
        ${innerTileContent}
      </g>
      <!-- Column 2 (Shifted) -->
      <g transform="translate(${width}, ${shiftY})">
        ${innerTileContent}
      </g>
      <!-- Wrap-around fill for seam coverage -->
      <g transform="translate(${width}, ${shiftY - height})">
        ${innerTileContent}
      </g>
    `;
  } else {
    // Standard Grid
    patternUnitsWidth = width;
    patternUnitsHeight = height;
    patternInnerShapes = innerTileContent;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${viewportWidth}" height="${viewportHeight}" viewBox="0 0 ${viewportWidth} ${viewportHeight}">
  <defs>
    <pattern id="${patternId}" width="${patternUnitsWidth}" height="${patternUnitsHeight}" patternUnits="userSpaceOnUse">
      ${bgRect}
      ${patternInnerShapes}
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#${patternId})" />
</svg>`;
}

/**
 * Generates standalone single-tile SVG
 */
export function generateSingleTileSVG(canvas: Canvas, config: TileConfig): string {
  const innerTileContent = getTileInnerSVG(canvas, config);
  const { width, height, backgroundColor, transparentBackground } = config;

  const bgRect = !transparentBackground
    ? `<rect width="${width}" height="${height}" fill="${backgroundColor}" />`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${bgRect}
  ${innerTileContent}
</svg>`;
}

/**
 * Generates CSS background snippet
 */
export function generateCSSBackground(svgString: string): string {
  // Clean & encode for CSS data URI
  const cleaned = svgString
    .replace(/\s+/g, ' ')
    .replace(/"/g, "'")
    .replace(/#/g, '%23')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/&/g, '%26');

  return `background-color: transparent;\nbackground-image: url("data:image/svg+xml,${cleaned}");\nbackground-repeat: repeat;`;
}

/**
 * Generates React JSX SVG component code
 */
export function generateReactComponent(canvas: Canvas, config: TileConfig): string {
  const svg = generateFullSVGPattern(canvas, config, 800, 600);
  return `import React from 'react';

export const PatternBackground: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => {
  return (
    <div 
      className={className}
      style={{
        backgroundImage: \`${generateCSSBackground(svg).split('\n')[1].replace('background-image: ', '').replace(';', '')}\`,
        backgroundRepeat: 'repeat'
      }}
    />
  );
};
`;
}

/**
 * Downloads string as file
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
