import type {
  IAnimeFolder,
  IFilterProps,
  IFilterReturnType,
  IIncorrectFolder,
} from '../types.ts';
import { truncate } from '../utils.ts';

export async function filterContainsFolders({
  animeFolders,
  emitEntry,
}: IFilterProps): IFilterReturnType {
  const refinedFolders: IAnimeFolder[] = [];
  const incorrectFolders: IIncorrectFolder[] = [];

  for (const folder of animeFolders) {
    let hasFolder = false;

    for await (const file of folder.files) {
      if (file.isDirectory) {
        hasFolder = true;
      }
    }
    if (!hasFolder) {
      refinedFolders.push(folder);
    } else {
      const incorrectFolder: IIncorrectFolder = {
        id: folder.anilist?.data.Media.id ?? 0,
        name: truncate(folder.anilist?.data.Media.title.romaji ?? "Unknown"),
        reason: "folder",
        description: `Directory contains folders`,
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
