import type {
  IAnimeFolder,
  IFilterProps,
  IFilterReturnType,
  IIncorrectFolder,
} from "../types.ts";

export async function filterTotalEpisodes({
  animeFolders,
  emitEntry,
}: IFilterProps): IFilterReturnType {
  const refinedFolders: IAnimeFolder[] = [];
  const incorrectFolders: IIncorrectFolder[] = [];

  for await (const folder of animeFolders) {
    let files = 0;
    for await (const _file of folder.files) {
      if (_file.isFile) {
        files++;
      }
    }

    if (files === folder.anilist?.data.Media.episodes) {
      refinedFolders.push(folder);
    } else {
      const incorrectFolder: IIncorrectFolder = {
        reason: "episodes",
        description:
          `Invalid number of files: ${files}, should be: ${folder.anilist?.data.Media.episodes}`,
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
