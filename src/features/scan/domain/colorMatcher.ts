import { NcsItem } from "@/src/core/types/ncs";
import { getAllStrips } from "@/utils/ncsData";

// --- 1. CONVERSION HELPERS ---

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

// Standard sRGB to Lab conversion
const rgbToLab = (r: number, g: number, b: number) => {
  let rB = r / 255,
    gB = g / 255,
    bB = b / 255;

  rB = rB > 0.04045 ? Math.pow((rB + 0.055) / 1.055, 2.4) : rB / 12.92;
  gB = gB > 0.04045 ? Math.pow((gB + 0.055) / 1.055, 2.4) : gB / 12.92;
  bB = bB > 0.04045 ? Math.pow((bB + 0.055) / 1.055, 2.4) : bB / 12.92;

  let x = (rB * 0.4124 + gB * 0.3576 + bB * 0.1805) / 0.95047;
  let y = (rB * 0.2126 + gB * 0.7152 + bB * 0.0722) / 1.0;
  let z = (rB * 0.0193 + gB * 0.1192 + bB * 0.9505) / 1.08883;

  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;

  return { l: 116 * y - 16, a: 500 * (x - y), b: 200 * (y - z) };
};

// --- 2. MEDIAN LOGIC (The Short Term Fix) ---

/**
 * Calculates the "Median" color from a list of pixels to remove noise/shadows.
 * We sort by "Luma" (brightness) and pick the middle pixel.
 * This is much better than Average (Mean) which gets ruined by white speckles.
 */
export const calculateMedianColor = (
  pixels: { r: number; g: number; b: number }[]
) => {
  if (pixels.length === 0) return "#000000";

  // Sort by perceived brightness (Luma)
  pixels.sort((p1, p2) => {
    const luma1 = 0.299 * p1.r + 0.587 * p1.g + 0.114 * p1.b;
    const luma2 = 0.299 * p2.r + 0.587 * p2.g + 0.114 * p2.b;
    return luma1 - luma2;
  });

  // Pick the middle one
  const medianPixel = pixels[Math.floor(pixels.length / 2)];

  // Convert back to Hex
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(medianPixel.r)}${toHex(medianPixel.g)}${toHex(
    medianPixel.b
  )}`;
};

// --- 3. DELTA E 2000 (The Immediate Fix) ---
// This is the industry standard formula for perceptual color difference.
// Source: http://www.brucelindbloom.com/index.html?Eqn_DeltaE_CIE2000.html

const degreesToRadians = (degrees: number) => degrees * (Math.PI / 180);
const radiansToDegrees = (radians: number) => radians * (180 / Math.PI);

const getDeltaE2000 = (hex1: string, hex2: string) => {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const lab1 = rgbToLab(rgb1.r, rgb1.g, rgb1.b);
  const lab2 = rgbToLab(rgb2.r, rgb2.g, rgb2.b);

  const L1 = lab1.l,
    a1 = lab1.a,
    b1 = lab1.b;
  const L2 = lab2.l,
    a2 = lab2.a,
    b2 = lab2.b;

  const LAvg = (L1 + L2) / 2;
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const CAvg = (C1 + C2) / 2;

  const G =
    0.5 *
    (1 - Math.sqrt(Math.pow(CAvg, 7) / (Math.pow(CAvg, 7) + Math.pow(25, 7))));
  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);

  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);

  const h1p =
    a1p === 0 && b1 === 0
      ? 0
      : Math.atan2(b1, a1p) >= 0
      ? radiansToDegrees(Math.atan2(b1, a1p))
      : radiansToDegrees(Math.atan2(b1, a1p)) + 360;
  const h2p =
    a2p === 0 && b2 === 0
      ? 0
      : Math.atan2(b2, a2p) >= 0
      ? radiansToDegrees(Math.atan2(b2, a2p))
      : radiansToDegrees(Math.atan2(b2, a2p)) + 360;

  const CAvgp = (C1p + C2p) / 2;
  const hAvgp =
    Math.abs(h1p - h2p) > 180 ? (h1p + h2p + 360) / 2 : (h1p + h2p) / 2;

  const T =
    1 -
    0.17 * Math.cos(degreesToRadians(hAvgp - 30)) +
    0.24 * Math.cos(degreesToRadians(2 * hAvgp)) +
    0.32 * Math.cos(degreesToRadians(3 * hAvgp + 6)) -
    0.2 * Math.cos(degreesToRadians(4 * hAvgp - 63));

  const dhp =
    Math.abs(h2p - h1p) <= 180
      ? h2p - h1p
      : h2p <= h1p
      ? h2p - h1p + 360
      : h2p - h1p - 360;
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(degreesToRadians(dhp) / 2);
  const dLp = L2 - L1;
  const dCp = C2p - C1p;

  const SL =
    1 +
    (0.015 * Math.pow(LAvg - 50, 2)) / Math.sqrt(20 + Math.pow(LAvg - 50, 2));
  const SC = 1 + 0.045 * CAvgp;
  const SH = 1 + 0.015 * CAvgp * T;

  const dTheta = 30 * Math.exp(-Math.pow((hAvgp - 275) / 25, 2));
  const RC =
    2 * Math.sqrt(Math.pow(CAvgp, 7) / (Math.pow(CAvgp, 7) + Math.pow(25, 7)));
  const RT = -Math.sin(degreesToRadians(2 * dTheta)) * RC;

  return Math.sqrt(
    Math.pow(dLp / SL, 2) +
      Math.pow(dCp / SC, 2) +
      Math.pow(dHp / SH, 2) +
      RT * (dCp / SC) * (dHp / SH)
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
      distance: getDeltaE2000(targetHex, color.hex), // Using New Algo
    }));

    ranked.sort((a, b) => a.distance - b.distance);

    return ranked.slice(0, limit);
  },
};
