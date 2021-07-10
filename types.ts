export interface IFilterProps {
  animeFolders: IAnimeFolder[];
  emitEntry: (incorrectFolder: IIncorrectFolder) => void;
}

export type IFilterReturnType = Promise<{
  refinedFolders: IAnimeFolder[];
  incorrectFolders: IIncorrectFolder[];
}>;

export interface IIncorrectFolder {
  id: number;
  name: string;
  reason:
    | "name"
    | "episodes"
    | "regex"
    | "empty"
    | "anilist"
    | "folder"
    | "extension";
  description: string;
}

export interface IAnimeFolder {
  id: number;
  name: string;
  files: Deno.DirEntry[];
  folderName: string;
  anilist?: IAnilistData;
  correct?: boolean;
  checked: boolean;
}

export interface IAnilistData {
  data: {
    Media: {
      id: number;
      title: { romaji: string };
      episodes: number;
    };
  };
}
