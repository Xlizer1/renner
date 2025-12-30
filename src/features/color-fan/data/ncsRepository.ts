import { NcsGroup } from "@/src/core/types/ncs";
import { getAllStrips } from "@/utils/ncsData";

export const NcsRepository = {
  getColors: (): Promise<NcsGroup[]> => {
    // We simulate an async call even though it's sync,
    // to make it future-proof for APIs.
    return new Promise((resolve) => {
      const data = getAllStrips();
      resolve(data);
    });
  },
};
