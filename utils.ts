import type {
  IAnimeFolder,
  IFilterProps,
  IFilterReturnType,
  IIncorrectFolder,
} from "./types.ts";

export function truncate(input: string): string {
  return input.length > 27 ? `${input.substring(0, 24)}...` : input;
}
export function getCorrectName(
  id: number,
  name: string,
  group: string,
): string {
  return `${id} - ${
    name
      .replace(" : ", " - ")
      .replace(": ", " - ")
      .replace(":", "-")
      .replace(" / ", " ")
      .replace("/ ", " ")
      .replace("/", " ")
      .replace(/\\|\/|\*|\?|"|<|>\|/g, "")
      .replace(/\.*$/g, "")
  } [${group}]`;
}

export async function filter(
  emitEntry: (incorrectFolder: IIncorrectFolder) => void,
  filters: (({ animeFolders, emitEntry }: IFilterProps) => IFilterReturnType)[],
  folders: IAnimeFolder[],
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

export function aniListQuery(id: number) {
  return fetch("https://graphql.anilist.co/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query: `query ($id: Int) {
            Media (id: $id, type: ANIME) {
              id
              title {
                romaji
              }
              episodes
            }
          }`,
      variables: {
        id,
      },
    }),
  });
}
