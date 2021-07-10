import type {
  IAnimeFolder,
  IFilterProps,
  IFilterReturnType,
  IIncorrectFolder,
} from '../types.ts';

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
        reason: "empty",
        description: `Folder is empty`,
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
