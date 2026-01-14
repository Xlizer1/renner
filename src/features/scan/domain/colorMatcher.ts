import { NcsItem } from "@/src/core/types/ncs";
import { getAllStrips } from "@/utils/ncsData";

// --- 1. CONVERSION HELPERS ---

const hexToRgb = (hex: string) => {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return { r, g, b };
};

const hexToHsl = (hex: string) => {
  const { r: r255, g: g255, b: b255 } = hexToRgb(hex);
  const r = r255 / 255, g = g255 / 255, b = b255 / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
};

// --- 2. ADAPTIVE MATCHING ALGORITHM ---

const getAdaptiveDistance = (targetHex: string, dbHex: string) => {
  const t = hexToHsl(targetHex); // Camera
  const d = hexToHsl(dbHex);     // Database

  // --- LOGIC SPLIT: IS IT EARTHY OR VIBRANT? ---
  // Wood/Cardboard usually has Saturation < 60.
  // Sticky Notes/Plastics usually have Saturation > 70.
  const isEarthy = t.s < 60;

  // 1. ADAPTIVE BRIGHTNESS
  let targetL = t.l;
  if (isEarthy) {
    // WOOD MODE: Trust the camera more. 
    // Only boost slightly to avoid pitch black shadows.
    // If scanning Kraft Paper (L=57), this keeps it around 57-60.
    targetL = Math.max(t.l, 50); 
  } else {
    // NEON MODE: Boost aggressively because neon reflects light poorly in photos.
    targetL = Math.max(t.l, 70);
  }

  // 2. ADAPTIVE SATURATION
  let dS = 0;
  if (d.s < t.s) {
    dS = Math.abs(t.s - d.s); // Always punish if DB is duller than scan
  } else {
    // DB is MORE vibrant than scan.
    if (isEarthy) {
      // WOOD MODE: Punish this! 
      // If I scan Cardboard (S=50), I DO NOT want Neon Orange (S=90).
      // We apply a partial penalty.
      dS = (d.s - t.s) * 0.5; 
    } else {
      // NEON MODE: Reward this!
      // If I scan Sticky Note (S=60), I WANT Neon Green (S=90).
      dS = 0; 
    }
  }

  // 3. HUE HANDLING (Camera Shift Correction)
  // Indoor cameras often shift Orange/Brown (30-40°) towards Red (10-20°).
  // If we see Red-Orange, gently nudge it towards Yellow-Orange.
  let cameraHue = t.h;
  if (isEarthy && cameraHue > 10 && cameraHue < 35) {
    cameraHue += 5; // Nudge towards yellow/brown
  }

  let dH = Math.abs(cameraHue - d.h);
  if (dH > 180) dH = 360 - dH;

  // 4. LIGHTNESS DIFFERENCE
  const dL = Math.abs(targetL - d.l);

  // --- WEIGHTS ---
  // For Wood/Earthy tones, Hue and Lightness are crucial.
  // For Neon, Hue is everything.
  
  const wHue = isEarthy ? 3.0 : 2.5; 
  const wLit = isEarthy ? 2.0 : 1.0; // Care more about lightness for wood
  const wSat = 1.0;

  return Math.sqrt(
    Math.pow(dH * wHue, 2) + 
    Math.pow(dS * wSat, 2) + 
    Math.pow(dL * wLit, 2)
  );
};

// --- EXPORT ---

export interface ColorMatch {
  item: NcsItem;
  distance: number;
}

export const ColorMatcher = {
  findClosestMatches: (targetHex: string, limit: number = 5): ColorMatch[] => {
    const allGroups = getAllStrips();
    const allColors: NcsItem[] = [];
    allGroups.forEach((g) => g.strip.forEach((c) => allColors.push(c)));

    const ranked = allColors.map((color) => ({
      item: color,
      distance: getAdaptiveDistance(targetHex, color.hex.toString()), 
    }));

    ranked.sort((a, b) => a.distance - b.distance);

    return ranked.slice(0, limit);
  },
};