import { colors } from 'https:/deno.land/x/cliffy@v0.19.2/ansi/mod.ts';

import type {
  IAnimeFolder,
  IFilterProps,
  IFilterReturnType,
  IIncorrectFolder,
} from '../types.ts';
import { truncate } from '../utils.ts';

export async function filterIncorrectName({
  animeFolders,
  emitEntry,
}: IFilterProps): IFilterReturnType {
  const refinedFolders: IAnimeFolder[] = [];
  const incorrectFolders: IIncorrectFolder[] = [];

  for await (const folder of animeFolders) {
    const correctName = `${
      folder.anilist?.data.Media.id
    } - ${folder.anilist?.data.Media.title.romaji
      .replace(" : ", " - ")
      .replace(": ", " - ")
      .replace(/\\|\/|\*|\?|"|<|>\|/g, "")}`;
    if (folder.folderName === correctName) {
      refinedFolders.push(folder);
    } else {
      const incorrectFolder: IIncorrectFolder = {
        id: folder.anilist?.data.Media.id ?? 0,
        name: truncate(folder.anilist?.data.Media.title.romaji ?? "Unknown"),
        reason: "name",
        description: `Should be: ${colors.blue(correctName)}`,
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
