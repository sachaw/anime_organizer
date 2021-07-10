import { colors } from 'https:/deno.land/x/cliffy@v0.19.2/ansi/mod.ts';

import type {
  IAnimeFolder,
  IFilterProps,
  IFilterReturnType,
  IIncorrectFolder,
} from '../types.ts';
import { truncate } from '../utils.ts';

export async function filterFileTypes({
  animeFolders,
  emitEntry,
}: IFilterProps): IFilterReturnType {
  const refinedFolders: IAnimeFolder[] = [];
  const incorrectFolders: IIncorrectFolder[] = [];

  for (const folder of animeFolders) {
    const invalidFileTypes: string[] = [];
    for await (const file of folder.files) {
      const name = file.name.split(".");

      if (name[name.length - 1] !== "mkv") {
        invalidFileTypes.push(name[name.length - 1]);
      }
    }
    if (!invalidFileTypes.length) {
      refinedFolders.push(folder);
    } else {
      const incorrectFolder: IIncorrectFolder = {
        id: folder.anilist?.data.Media.id ?? 0,
        name: colors.blue(
          truncate(folder.anilist?.data.Media.title.romaji ?? "Unknown")
        ),
        reason: "extension",
        description: `Invalid filetypes: ${invalidFileTypes.join(", ")}`,
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
