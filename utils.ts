import type {
  IAnimeFolder,
  IFilterProps,
  IFilterReturnType,
  IIncorrectFolder,
} from './types.ts';

export function truncate(input: string): string {
  return input.length > 27 ? `${input.substring(0, 24)}...` : input;
}
export function getCorrectName(id: number, name: string): string {
  return `${id} - ${name
    .replace(" : ", " - ")
    .replace(": ", " - ")
    .replace(":", "-")
    .replace(" / ", " ")
    .replace("/ ", " ")
    .replace("/", " ")
    .replace(/\\|\/|\*|\?|"|<|>\|/g, "")
    .replace(/\.*$/g, "")}`;
}
export async function filter(
  emitEntry: (incorrectFolder: IIncorrectFolder) => void,
  filters: (({ animeFolders, emitEntry }: IFilterProps) => IFilterReturnType)[],
  folders: IAnimeFolder[]
) {
  let folderStore: IAnimeFolder[] = folders;
  const incorrectFolderStore: IIncorrectFolder[] = [];

  for (const filter of filters) {
    await filter({
      animeFolders: folderStore,
      emitEntry,
    }).then(({ incorrectFolders, refinedFolders }) => {
      folderStore = refinedFolders;
      incorrectFolderStore.push(...incorrectFolders);
    });
  }

  return {
    folderStore,
    incorrectFolderStore,
  };
}
