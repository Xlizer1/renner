import { NcsGroup, NcsItem } from "@/src/core/types/ncs";
import { RENNER_ASSETS } from "./rennerAssets";

import CHROMA_LIST from "@/assets/images/renner/CHROMA/list.json";
import CS_LIST from "@/assets/images/renner/CS/list.json";
import TM_LIST from "@/assets/images/renner/TM-M006/list.json";

const COLLECTIONS: Record<string, { list: any[]; folder: string }> = {
  chroma: { list: CHROMA_LIST, folder: "CHROMA" },
  cs: { list: CS_LIST, folder: "CS" },
  tm: { list: TM_LIST, folder: "TM-M006" },
};

const normalize = (list: any[], folderName: string): NcsItem[] => {
  return list.map((item) => {
    const key = item.code || item.revision || "Unknown";
    const parts = item.url.split("renner/");
    const mapKey = parts[1];
    const assetId = RENNER_ASSETS[mapKey];

    return {
      key: key,
      hex: assetId,
      isTexture: true,
      blackness: "00",
      chromatines: "00",
      hue: folderName,
    } as NcsItem & { isTexture?: boolean };
  });
};

export const RennerRepository = {
  getColors: (collectionId: string): Promise<NcsGroup[]> => {
    const target = COLLECTIONS[collectionId];

    if (!target) {
      console.error(`Collection ${collectionId} not found`);
      return Promise.resolve([]);
    }

    const groups: NcsGroup[] = [];
    const items = normalize(target.list, target.folder);

    // --- CHANGE IS HERE ---
    // Change loop to i += 4 to put 4 items on a strip
    const ITEMS_PER_STRIP = 4;

    for (let i = 0; i < items.length; i += ITEMS_PER_STRIP) {
      groups.push({
        hueFamily: target.folder,
        strip: items.slice(i, i + ITEMS_PER_STRIP),
      });
    }
    // ----------------------

    return Promise.resolve(groups);
  },
};
