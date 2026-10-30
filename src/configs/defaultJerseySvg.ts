/**
 * Professional Athletic Jersey SVG Template
 * Designed with precise panel boundaries corresponding to:
 * - COLOUR_BASE (Front Torso Body)
 * - COLOUR_SECONDARY (Raglan Sleeves & Shoulder)
 * - COLOUR_PRIMARY (Lateral Side Flanks & Collar Band)
 * - COLOUR_HEM (Bottom Waist Hem & Cuff Trims)
 * - COLOUR_TERTIARY (V-Neck Insert & Chest Chevron)
 * - COLOUR_BASE_REVERSE (Back Torso)
 * - COLOUR_SECONDARY_REVERSE (Back Sleeves)
 * - COLOUR_PRIMARY_REVERSE (Back Side Panels)
 */

export const DEFAULT_JERSEY_SVG_FRONT = `
<svg id="jersey-front" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <!-- Shadow and stitching filters -->
    <filter id="soft-shadow" x="-5%" y="-5%" width="115%" height="115%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.35" />
    </filter>
  </defs>

  <g id="jersey-container" filter="url(#soft-shadow)">
    <!-- 1. BASE COLOR: Main Chest & Torso Body -->
    <path id="COLOUR_BASE" d="M 285 160 L 335 220 L 465 220 L 515 160 L 525 310 L 515 670 L 285 670 L 275 310 Z" fill="#1E293B" stroke="#0F172A" stroke-width="2" />

    <!-- 2. TERTIARY COLOR: Collar V-Neck Insert & Chest Chevron -->
    <path id="COLOUR_TERTIARY" d="M 335 150 L 400 240 L 465 150 L 450 140 C 420 160 380 160 350 140 Z" fill="#F59E0B" stroke="#B45309" stroke-width="2" />

    <!-- 3. SECONDARY COLOR: Left & Right Raglan Sleeves & Shoulder Yoke -->
    <!-- Left Sleeve -->
    <path id="COLOUR_SECONDARY_L" d="M 285 160 L 350 140 C 310 135 250 145 200 170 L 110 320 L 190 375 L 255 270 L 275 310 Z" fill="#3B82F6" stroke="#1D4ED8" stroke-width="2" />
    <!-- Right Sleeve -->
    <path id="COLOUR_SECONDARY_R" d="M 515 160 L 450 140 C 490 135 550 145 600 170 L 690 320 L 610 375 L 545 270 L 525 310 Z" fill="#3B82F6" stroke="#1D4ED8" stroke-width="2" />
    <!-- Combined alias for single object mapping -->
    <path id="COLOUR_SECONDARY" d="M 285 160 L 350 140 C 310 135 250 145 200 170 L 110 320 L 190 375 L 255 270 L 275 310 Z M 515 160 L 450 140 C 490 135 550 145 600 170 L 690 320 L 610 375 L 545 270 L 525 310 Z" fill="#3B82F6" stroke="#1D4ED8" stroke-width="2" />

    <!-- 4. PRIMARY COLOR: Left & Right Side Rib Panels & Outer Collar Band -->
    <!-- Left Rib Panel -->
    <path id="COLOUR_PRIMARY_L" d="M 275 310 L 255 270 L 285 670 L 245 670 L 240 370 Z" fill="#EF4444" stroke="#B91C1C" stroke-width="2" />
    <!-- Right Rib Panel -->
    <path id="COLOUR_PRIMARY_R" d="M 525 310 L 545 270 L 515 670 L 555 670 L 560 370 Z" fill="#EF4444" stroke="#B91C1C" stroke-width="2" />
    <path id="COLOUR_PRIMARY" d="M 275 310 L 255 270 L 285 670 L 245 670 L 240 370 Z M 525 310 L 545 270 L 515 670 L 555 670 L 560 370 Z" fill="#EF4444" stroke="#B91C1C" stroke-width="2" />

    <!-- 5. HEM COLOR: Bottom Waist Hem & Sleeve Cuffs -->
    <!-- Bottom Hem -->
    <path id="COLOUR_HEM_BOTTOM" d="M 245 670 L 555 670 L 555 700 L 245 700 Z" fill="#0F172A" stroke="#020617" stroke-width="2" />
    <!-- Left Cuff -->
    <path id="COLOUR_HEM_CUFF_L" d="M 110 320 L 190 375 L 180 392 L 95 335 Z" fill="#0F172A" stroke="#020617" stroke-width="2" />
    <!-- Right Cuff -->
    <path id="COLOUR_HEM_CUFF_R" d="M 690 320 L 610 375 L 620 392 L 705 335 Z" fill="#0F172A" stroke="#020617" stroke-width="2" />
    <path id="COLOUR_HEM" d="M 245 670 L 555 670 L 555 700 L 245 700 Z M 110 320 L 190 375 L 180 392 L 95 335 Z M 690 320 L 610 375 L 620 392 L 705 335 Z" fill="#0F172A" stroke="#020617" stroke-width="2" />

    <!-- Outer Collar Rib Trim -->
    <path id="COLOUR_COLLAR" d="M 350 140 C 370 155 430 155 450 140 C 440 120 360 120 350 140 Z" fill="#3B82F6" stroke="#1E293B" stroke-width="1.5" />

    <!-- Athletic Stitching Overlay details -->
    <g id="stitching-details" stroke="#ffffff" stroke-width="1.2" stroke-dasharray="3,3" opacity="0.35" fill="none">
      <path d="M 285 160 L 515 160" />
      <path d="M 275 315 L 285 665" />
      <path d="M 525 315 L 515 665" />
      <path d="M 250 673 L 550 673" />
    </g>
  </g>
</svg>
`;

export const DEFAULT_JERSEY_SVG_BACK = `
<svg id="jersey-back" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <filter id="soft-shadow-back" x="-5%" y="-5%" width="115%" height="115%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.35" />
    </filter>
  </defs>

  <g id="jersey-container-back" filter="url(#soft-shadow-back)">
    <!-- 1. BASE COLOR REVERSE: Back Torso Body -->
    <path id="COLOUR_BASE_REVERSE" d="M 285 150 C 350 165 450 165 515 150 L 525 310 L 515 670 L 285 670 L 275 310 Z" fill="#1E293B" stroke="#0F172A" stroke-width="2" />

    <!-- 2. SECONDARY COLOR REVERSE: Back Sleeves & Yoke -->
    <!-- Left Sleeve Back -->
    <path id="COLOUR_SECONDARY_REVERSE_L" d="M 285 150 C 240 140 180 155 110 320 L 190 375 L 255 270 L 275 310 Z" fill="#3B82F6" stroke="#1D4ED8" stroke-width="2" />
    <!-- Right Sleeve Back -->
    <path id="COLOUR_SECONDARY_REVERSE_R" d="M 515 150 C 560 140 620 155 690 320 L 610 375 L 545 270 L 525 310 Z" fill="#3B82F6" stroke="#1D4ED8" stroke-width="2" />
    <path id="COLOUR_SECONDARY_REVERSE" d="M 285 150 C 240 140 180 155 110 320 L 190 375 L 255 270 L 275 310 Z M 515 150 C 560 140 620 155 690 320 L 610 375 L 545 270 L 525 310 Z" fill="#3B82F6" stroke="#1D4ED8" stroke-width="2" />

    <!-- 3. PRIMARY COLOR REVERSE: Back Side Flank Ribs -->
    <path id="COLOUR_PRIMARY_REVERSE" d="M 275 310 L 255 270 L 285 670 L 245 670 L 240 370 Z M 525 310 L 545 270 L 515 670 L 555 670 L 560 370 Z" fill="#EF4444" stroke="#B91C1C" stroke-width="2" />

    <!-- 4. HEM COLOR: Bottom Waist Hem & Cuffs -->
    <path id="COLOUR_HEM_BACK" d="M 245 670 L 555 670 L 555 700 L 245 700 Z M 110 320 L 190 375 L 180 392 L 95 335 Z M 690 320 L 610 375 L 620 392 L 705 335 Z" fill="#0F172A" stroke="#020617" stroke-width="2" />

    <!-- Back Collar Band -->
    <path id="COLOUR_COLLAR_BACK" d="M 330 135 C 370 148 430 148 470 135 C 460 118 340 118 330 135 Z" fill="#3B82F6" stroke="#1E293B" stroke-width="1.5" />

    <!-- Back Player Name & Number Placement Guide (Subtle watermark) -->
    <text x="400" y="270" text-anchor="middle" fill="#ffffff" fill-opacity="0.15" font-family="'Plus Jakarta Sans', sans-serif" font-weight="bold" font-size="28" letter-spacing="4">PLAYER NAME</text>
    <text x="400" y="440" text-anchor="middle" fill="#ffffff" fill-opacity="0.15" font-family="'JetBrains Mono', monospace" font-weight="900" font-size="140">10</text>
  </g>
</svg>
`;
