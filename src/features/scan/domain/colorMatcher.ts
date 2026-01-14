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
  const r = r255 / 255,
    g = g255 / 255,
    b = b255 / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
};

// --- 2. VIBRANCE & EXPOSURE BIASED MATCHING ---
const getBiasedDistance = (targetHex: string, dbHex: string) => {
  const t = hexToHsl(targetHex); // Camera
  const d = hexToHsl(dbHex);     // Database

  // 1. AUTO-EXPOSURE
  // Force the camera target to be at least 75% lightness.
  // This tells the math: "I am looking for a bright color."
  const targetL = Math.max(t.l, 75);

  // 2. VIBRANCE HANDLING
  let dS = 0;
  if (d.s < t.s) {
    dS = Math.abs(t.s - d.s); // Penalize if DB is duller
  } else {
    dS = 0; // FREE PASS if DB is more vibrant
  }

  // 3. HUE DIFFERENCE
  let dH = Math.abs(t.h - d.h);
  if (dH > 180) dH = 360 - dH;

  // 4. LIGHTNESS DIFFERENCE
  const dL = Math.abs(targetL - d.l);

  // --- THE FIX: NEON BONUS ---
  // Sticky notes are unique: High Saturation (>70) AND High Lightness (>70).
  // If the DB color fits this profile, we artificially reduce its "Distance".
  // This acts like a magnet, pulling neon colors to the top.
  let neonBonus = 0;
  if (d.s > 70 && d.l > 70) {
    neonBonus = 30; // Massive discount for neon colors
  }

  // --- WEIGHTS ---
  // Hue: Lowered to 1.5 to allow drifting from Green -> Lime
  // Lightness: Increased to 1.0 to prioritize the Brightness Match
  const rawDistance = Math.sqrt(
    Math.pow(dH * 1.5, 2) + 
    Math.pow(dS * 1.0, 2) + 
    Math.pow(dL * 1.0, 2)
  );

  // Subtract the bonus (Distance can go negative, which is fine for sorting)
  return rawDistance - neonBonus;
};

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
      distance: getBiasedDistance(targetHex, color.hex.toString()),
    }));

    ranked.sort((a, b) => a.distance - b.distance);

    return ranked.slice(0, limit);
  },
};
