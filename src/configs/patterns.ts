export interface PatternItem {
  id: string;
  name: string;
  category: 'Lines' | 'Texture' | 'Shapes' | 'Classic' | 'Camo' | 'Tech' | 'Artwork';
  tileWidth: number;
  tileHeight: number;
  svgContent: string;
  url: string;
}

function svgToDataUrl(svg: string): string {
  const cleaned = svg
    .replace(/\s+/g, ' ')
    .replace(/"/g, "'")
    .replace(/#/g, '%23')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E');
  return `data:image/svg+xml,${cleaned}`;
}

const p1_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'><line x1='0' y1='0' x2='60' y2='60' stroke='#ffffff' stroke-width='6' opacity='0.85'/><line x1='-10' y1='50' x2='20' y2='80' stroke='#ffffff' stroke-width='6' opacity='0.85'/><line x1='40' y1='-20' x2='70' y2='10' stroke='#ffffff' stroke-width='6' opacity='0.85'/></svg>`;
const p2_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><path d='M0 0 L20 20 L40 0 M0 20 L20 40 L40 20' fill='none' stroke='#ffffff' stroke-width='4' opacity='0.85'/></svg>`;
const p3_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><line x1='0' y1='0' x2='48' y2='0' stroke='#ffffff' stroke-width='6' stroke-dasharray='16 8' opacity='0.8'/><line x1='0' y1='24' x2='48' y2='24' stroke='#ffffff' stroke-width='6' stroke-dasharray='16 8' stroke-dashoffset='12' opacity='0.8'/></svg>`;

const p4_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><rect x='0' y='0' width='12' height='12' fill='#ffffff' opacity='0.25'/><rect x='12' y='12' width='12' height='12' fill='#ffffff' opacity='0.25'/><circle cx='6' cy='6' r='2' fill='#ffffff' opacity='0.6'/><circle cx='18' cy='18' r='2' fill='#ffffff' opacity='0.6'/></svg>`;
const p5_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><path d='M0 8 L16 0 L32 8 L32 24 L16 32 L0 24 Z' fill='none' stroke='#ffffff' stroke-width='2' opacity='0.6'/><path d='M16 0 L16 32 M0 8 L32 24 M32 8 L0 24' stroke='#ffffff' stroke-width='1' opacity='0.3'/></svg>`;

const p6_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'><polygon points='25,0 46,12 46,38 25,50 4,38 4,12' fill='none' stroke='#ffffff' stroke-width='3' opacity='0.75'/><circle cx='25' cy='25' r='5' fill='#ffffff' opacity='0.8'/></svg>`;
const p7_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><polygon points='20,0 40,20 20,40 0,20' fill='#ffffff' opacity='0.4'/><polygon points='20,6 34,20 20,34 6,20' fill='none' stroke='#ffffff' stroke-width='2' opacity='0.8'/></svg>`;

const p8_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'><circle cx='18' cy='18' r='8' fill='#ffffff' opacity='0.8'/><circle cx='0' cy='0' r='4' fill='#ffffff' opacity='0.8'/><circle cx='36' cy='0' r='4' fill='#ffffff' opacity='0.8'/><circle cx='0' cy='36' r='4' fill='#ffffff' opacity='0.8'/><circle cx='36' cy='36' r='4' fill='#ffffff' opacity='0.8'/></svg>`;
const p9_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 30 30'><polygon points='0,0 15,0 0,15' fill='#ffffff' opacity='0.85'/><polygon points='15,0 30,15 15,30 0,15' fill='#ffffff' opacity='0.3'/><polygon points='15,15 30,15 15,30' fill='#ffffff' opacity='0.85'/></svg>`;

const p10_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><path d='M10 20 Q 25 5 45 25 T 70 30 T 50 60 T 20 70 Z' fill='#ffffff' opacity='0.4'/><path d='M30 40 Q 50 35 60 55 T 40 75 T 15 50 Z' fill='#ffffff' opacity='0.6'/><circle cx='65' cy='15' r='8' fill='#ffffff' opacity='0.35'/></svg>`;
const p11_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'><rect x='0' y='0' width='30' height='20' fill='#ffffff' opacity='0.35'/><rect x='30' y='20' width='30' height='20' fill='#ffffff' opacity='0.5'/><rect x='10' y='40' width='20' height='20' fill='#ffffff' opacity='0.25'/><rect x='40' y='0' width='20' height='15' fill='#ffffff' opacity='0.4'/></svg>`;

const p12_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'><path d='M0 32 H 24 L 32 40 H 48 L 56 32 H 64 M32 0 V 16 L 40 24 V 48 L 32 56 V 64' fill='none' stroke='#ffffff' stroke-width='3' opacity='0.75'/><circle cx='24' cy='32' r='3' fill='#ffffff'/><circle cx='48' cy='40' r='3' fill='#ffffff'/><circle cx='40' cy='24' r='3' fill='#ffffff'/></svg>`;
const p13_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><circle cx='20' cy='20' r='16' fill='none' stroke='#ffffff' stroke-width='2' opacity='0.6'/><path d='M20 4 V 12 M20 28 V 36 M4 20 H 12 M28 20 H 36' stroke='#ffffff' stroke-width='2' opacity='0.8'/><circle cx='20' cy='20' r='3' fill='#ffffff'/></svg>`;

const p14_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='70' height='70' viewBox='0 0 70 70'><circle cx='20' cy='20' r='10' fill='#ffffff' opacity='0.7'/><polygon points='45,15 60,35 35,40' fill='#ffffff' opacity='0.5'/><path d='M10 50 Q 25 40 40 50 T 60 50' fill='none' stroke='#ffffff' stroke-width='4' opacity='0.8'/><rect x='50' y='45' width='10' height='10' fill='#ffffff' opacity='0.6' transform='rotate(20 55 50)'/></svg>`;
const p15_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='40' viewBox='0 0 80 40'><path d='M0 40 A 40 40 0 0 1 80 40 M10 40 A 30 30 0 0 1 70 40 M20 40 A 20 20 0 0 1 60 40 M30 40 A 10 10 0 0 1 50 40' fill='none' stroke='#ffffff' stroke-width='2.5' opacity='0.75'/></svg>`;

export const PatternPresets: PatternItem[] = [
  // Lines
  {
    id: 'lines-diagonal-bold',
    name: 'Diagonal Stride',
    category: 'Lines',
    tileWidth: 60,
    tileHeight: 60,
    svgContent: p1_svg,
    url: svgToDataUrl(p1_svg),
  },
  {
    id: 'lines-chevron-speed',
    name: 'Chevron Velocity',
    category: 'Lines',
    tileWidth: 40,
    tileHeight: 40,
    svgContent: p2_svg,
    url: svgToDataUrl(p2_svg),
  },
  {
    id: 'lines-dash-pacing',
    name: 'Dynamic Dashes',
    category: 'Lines',
    tileWidth: 48,
    tileHeight: 48,
    svgContent: p3_svg,
    url: svgToDataUrl(p3_svg),
  },

  // Texture
  {
    id: 'tex-carbon-fiber',
    name: 'Carbon Twill',
    category: 'Texture',
    tileWidth: 24,
    tileHeight: 24,
    svgContent: p4_svg,
    url: svgToDataUrl(p4_svg),
  },
  {
    id: 'tex-isometric-grid',
    name: 'Isometric Mesh',
    category: 'Texture',
    tileWidth: 32,
    tileHeight: 32,
    svgContent: p5_svg,
    url: svgToDataUrl(p5_svg),
  },

  // Shapes
  {
    id: 'shapes-hex-armor',
    name: 'Honeycomb Hex',
    category: 'Shapes',
    tileWidth: 50,
    tileHeight: 50,
    svgContent: p6_svg,
    url: svgToDataUrl(p6_svg),
  },
  {
    id: 'shapes-diamond-glint',
    name: 'Prism Diamond',
    category: 'Shapes',
    tileWidth: 40,
    tileHeight: 40,
    svgContent: p7_svg,
    url: svgToDataUrl(p7_svg),
  },

  // Classic
  {
    id: 'classic-polka',
    name: 'Classic Dot Matrix',
    category: 'Classic',
    tileWidth: 36,
    tileHeight: 36,
    svgContent: p8_svg,
    url: svgToDataUrl(p8_svg),
  },
  {
    id: 'classic-houndstooth',
    name: 'Sport Houndstooth',
    category: 'Classic',
    tileWidth: 30,
    tileHeight: 30,
    svgContent: p9_svg,
    url: svgToDataUrl(p9_svg),
  },

  // Camo
  {
    id: 'camo-organic-geo',
    name: 'Modern Camouflage',
    category: 'Camo',
    tileWidth: 80,
    tileHeight: 80,
    svgContent: p10_svg,
    url: svgToDataUrl(p10_svg),
  },
  {
    id: 'camo-digital-pixel',
    name: 'Digital Pixel Camo',
    category: 'Camo',
    tileWidth: 60,
    tileHeight: 60,
    svgContent: p11_svg,
    url: svgToDataUrl(p11_svg),
  },

  // Tech
  {
    id: 'tech-circuit-trace',
    name: 'Cyber Circuit',
    category: 'Tech',
    tileWidth: 64,
    tileHeight: 64,
    svgContent: p12_svg,
    url: svgToDataUrl(p12_svg),
  },
  {
    id: 'tech-radar-crosshair',
    name: 'Sonar Reticle',
    category: 'Tech',
    tileWidth: 40,
    tileHeight: 40,
    svgContent: p13_svg,
    url: svgToDataUrl(p13_svg),
  },

  // Artwork
  {
    id: 'art-memphis-pop',
    name: 'Memphis Neo-Pop',
    category: 'Artwork',
    tileWidth: 70,
    tileHeight: 70,
    svgContent: p14_svg,
    url: svgToDataUrl(p14_svg),
  },
  {
    id: 'art-japanese-wave',
    name: 'Seigaiha Tide',
    category: 'Artwork',
    tileWidth: 80,
    tileHeight: 40,
    svgContent: p15_svg,
    url: svgToDataUrl(p15_svg),
  },
];
