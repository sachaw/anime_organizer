import type {
  IAnimeFolder,
  IFilterProps,
  IFilterReturnType,
  IIncorrectFolder,
} from "../types.ts";

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
        if (file.name === "Extras") {
          continue;
        }
        hasFolder = true;
      }
    }

    if (!hasFolder) {
      refinedFolders.push(folder);
    } else {
      const incorrectFolder: IIncorrectFolder = {
        reason: "folder",
        description: `Directory contains folders ${
          folder.files.map((file) => file.isDirectory ? file.name : "").filter((
            file,
          ) => file !== "").join(", ")
        }`,
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
