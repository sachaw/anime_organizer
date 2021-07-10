import type {
  IAnimeFolder,
  IFilterProps,
  IFilterReturnType,
  IIncorrectFolder,
} from '../types.ts';
import { truncate } from '../utils.ts';

export async function filterEmptyFolder({
  animeFolders,
  emitEntry,
}: IFilterProps): IFilterReturnType {
  const refinedFolders: IAnimeFolder[] = [];
  const incorrectFolders: IIncorrectFolder[] = [];
  for (const folder of animeFolders) {
    let files = 0;
    for await (const _file of folder.files) {
      files++;
    }
    if (files) {
      refinedFolders.push(folder);
    } else {
      const incorrectFolder: IIncorrectFolder = {
        id: folder.anilist?.data.Media.id ?? 0,
        name: truncate(folder.anilist?.data.Media.title.romaji ?? "Unknown"),
        reason: "empty",
        description: `Folder is empty`,
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
