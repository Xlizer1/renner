import { NcsColor, ncsColors, ncsHues } from "../assets/ncs/ncsList";

export type NcsColorWithKey = NcsColor & { key: string };
export type NcsStrip = NcsColorWithKey[];

/**
 * Optimized helper to get specific hue strips fast
 */
export const getStripsByHue = (hueKey: string): NcsStrip[] => {
  // 1. Filter
  const colors = Object.entries(ncsColors)
    .filter(([_, data]) => data.hue === hueKey)
    .map(([key, data]) => ({ key, ...data }));

  // 2. Sort
  colors.sort((a, b) => {
    const blacknessDiff = parseInt(a.blackness) - parseInt(b.blackness);
    if (blacknessDiff !== 0) return blacknessDiff;
    return parseInt(a.chromatines) - parseInt(b.chromatines);
  });

  // 3. Chunk
  const strips: NcsStrip[] = [];
  for (let i = 0; i < colors.length; i += 5) {
    strips.push(colors.slice(i, i + 5));
  }
  return strips;
};

/**
 * HIGH PERFORMANCE LOADER
 * Generates the master list in one single pass through the data.
 */
export const getAllStrips = (): { strip: NcsStrip; hueFamily: string }[] => {
  // 1. Create Buckets for each Hue to avoid repeated filtering
  const buckets: Record<string, NcsColorWithKey[]> = {};
  ncsHues.forEach((h) => (buckets[h] = []));

  // 2. Single Pass: Sort every color into its hue bucket
  Object.entries(ncsColors).forEach(([key, color]) => {
    // Safety check: ensure the hue exists in our list
    if (buckets[color.hue]) {
      buckets[color.hue].push({ key, ...color });
    }
  });

  let allStrips: { strip: NcsStrip; hueFamily: string }[] = [];

  // 3. Process each bucket (Sort & Chunk)
  ncsHues.forEach((hue) => {
    const colors = buckets[hue];

    // Sort this bucket
    colors.sort((a, b) => {
      const blacknessDiff = parseInt(a.blackness) - parseInt(b.blackness);
      if (blacknessDiff !== 0) return blacknessDiff;
      return parseInt(a.chromatines) - parseInt(b.chromatines);
    });

    // Chunk into strips of 5
    for (let i = 0; i < colors.length; i += 5) {
      allStrips.push({
        strip: colors.slice(i, i + 5),
        hueFamily: hue,
      });
    }
  });

  return allStrips;
};
