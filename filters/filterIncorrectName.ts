import { colors } from "https:/deno.land/x/cliffy@v1.0.0-rc.3/ansi/mod.ts";

import type {
  IAnimeFolder,
  IFilterProps,
  IFilterReturnType,
  IIncorrectFolder,
} from "../types.ts";
import { getCorrectName } from "../utils.ts";

export async function filterIncorrectName({
  animeFolders,
  emitEntry,
}: IFilterProps): IFilterReturnType {
  const refinedFolders: IAnimeFolder[] = [];
  const incorrectFolders: IIncorrectFolder[] = [];

  for await (const folder of animeFolders) {
    const correctName = getCorrectName(
      folder.anilist?.data.Media.id ?? 0,
      folder.anilist?.data.Media.title.romaji ?? "Unknown",
      folder.folderName.match(/\[(.*?)\]/)?.[1] || "Unknown",
    );
    if (folder.folderName === correctName) {
      refinedFolders.push(folder);
    } else {
      const incorrectFolder: IIncorrectFolder = {
        reason: "name",
        description: `Should be: ${colors.blue(correctName)}`,
        data: folder,
      };

      incorrectFolders.push(incorrectFolder);
      emitEntry(incorrectFolder);
    }
  }
  return {
    refinedFolders: refinedFolders,
    incorrectFolders: incorrectFolders,
  };
}
