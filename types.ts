export interface IFilterProps {
  animeFolders: IAnimeFolder[];
  emitEntry: (incorrectFolder: IIncorrectFolder) => void;
}

export type IFilterReturnType = Promise<{
  refinedFolders: IAnimeFolder[];
  incorrectFolders: IIncorrectFolder[];
}>;

export interface IIncorrectFolder {
  reason:
    | "name"
    | "episodes"
    | "regex"
    | "empty"
    | "anilist"
    | "folder"
    | "extension";
  description: string;
  data?: IAnimeFolder;
}

export interface IAnimeFolder {
  id: number;
  name: string;
  files: Deno.DirEntry[];
  folderName: string;
  hasExtras: boolean;
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
