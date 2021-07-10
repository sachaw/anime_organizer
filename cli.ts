import { colors } from 'https:/deno.land/x/cliffy@v0.19.2/ansi/mod.ts';
import { Command } from 'https:/deno.land/x/cliffy@v0.19.2/command/mod.ts';
import { keypress } from 'https:/deno.land/x/cliffy@v0.19.2/keypress/mod.ts';
import { Input, prompt } from 'https:/deno.land/x/cliffy@v0.19.2/prompt/mod.ts';
import { Table } from 'https:/deno.land/x/cliffy@v0.19.2/table/mod.ts';
import ProgressBar from 'https:/deno.land/x/progress@v1.0.0/mod.ts';
import { sleep } from 'https:/deno.land/x/sleep@v1.2.0/mod.ts';

import { filterContainsFolders } from './filters/filterContainsFolders.ts';
import { filterEmptyFolder } from './filters/filterEmptyFolder.ts';
import { filterFileTypes } from './filters/filterFileTypes.ts';
import { filterIncorrectName } from './filters/filterIncorrectName.ts';
import { filterTotalEpisodes } from './filters/filterTotalEpisodes.ts';
import type {
  IAnilistData,
  IAnimeFolder,
  IFilterProps,
  IFilterReturnType,
  IIncorrectFolder,
} from './types.ts';
import { truncate } from './utils.ts';

await new Command()
  .name("animeOrganizer")
  .version("0.1.0")
  .description("Command line framework for Deno")
  .parse(Deno.args);

const result = prompt([
  {
    name: "dir",
    message: "What directory do you want to scan?",
    type: Input,
  },
]);

async function filter(
  emitEntry: (incorrectFolder: IIncorrectFolder) => void,
  filters: (({ animeFolders, emitEntry }: IFilterProps) => IFilterReturnType)[]
) {
  let folderStore: IAnimeFolder[] = animeFolders;
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

const animeFolders: IAnimeFolder[] = [];
const incorrectFolders: IIncorrectFolder[] = [];
const table = new Table()
  .header([
    colors.gray("ID"),
    colors.gray("Name"),
    colors.gray("Reason"),
    colors.gray("Description"),
  ])
  .body([])
  .border(true)
  .padding(3)
  .chars({
    top: "",
    bottom: "",
    left: "",
    right: "",
    mid: "",
    midMid: "",
    middle: "",
    topLeft: "",
    bottomLeft: "",
    topRight: "",
    bottomRight: "",
    topMid: "",
    bottomMid: "",
    leftMid: "",
    rightMid: "",
  });
result
  .then((results) => {
    if (results.dir) {
      const foldersToProcess: Deno.DirEntry[] = [];
      for (const dirEntry of Deno.readDirSync(results.dir)) {
        foldersToProcess.push(dirEntry);
      }

      const progress = new ProgressBar({
        title: "Reading folder contents",
        total: foldersToProcess.length,
      });

      let currentIndex = 0;

      for (const dirEntry of foldersToProcess) {
        const regex = new RegExp(/^(?<id>[0-9]*?) - (?<name>.*$)/).exec(
          dirEntry.name
        );

        if (regex && regex?.groups) {
          const files: Deno.DirEntry[] = [];
          for (const file of Deno.readDirSync(
            `${results.dir}/${dirEntry.name}`.replace("//", "/")
          )) {
            files.push(file);
          }
          animeFolders.push({
            id: parseInt(regex?.groups["id"]),
            name: regex?.groups["name"],
            files: files,
            folderName: dirEntry.name,
            checked: false,
          });
        } else
          incorrectFolders.push({
            id: 0,
            name: "Unknown",
            reason: "regex",
            description: `Folder name: ${dirEntry.name}`,
          });
        currentIndex++;
        progress.render(currentIndex);
      }
    } else {
      console.log("Plese specify directory to scan");
    }
  })
  .then(() => {
    const renderIncorrectFolder = (incorrectFolder: IIncorrectFolder) => {
      table.push([
        colors.gray(incorrectFolder.id.toString()),
        incorrectFolder.name,
        incorrectFolder.reason,
        incorrectFolder.description,
      ]);
    };

    filter(renderIncorrectFolder, [
      fetchAnilistData,
      filterIncorrectName,
      filterEmptyFolder,
      filterContainsFolders,
      filterFileTypes,
      filterTotalEpisodes,
    ]).then(async (_) => {
      console.clear();
      table.render();

      await keypress();
    });
  });

async function fetchAnilistData({
  animeFolders,
  emitEntry,
}: IFilterProps): IFilterReturnType {
  const refinedFolders: IAnimeFolder[] = [];
  const incorrectFolders: IIncorrectFolder[] = [];
  const progress = new ProgressBar({
    title: "Fetching Anilist data",
    total: animeFolders.length,
  });

  let currentIndex = 1;
  let rlTime = new Date();
  let rlReqRemaining = 1;
  for (const folder of animeFolders) {
    if (!rlReqRemaining) {
      await sleep(61 - (new Date().getTime() - rlTime.getTime()) / 1000);
      rlTime = new Date();
    }

    progress.render(currentIndex);
    const response = await fetch("https://graphql.anilist.co/", {
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
          id: folder.id,
        },
      }),
    });

    const data: IAnilistData = await response.json();
    rlReqRemaining = parseInt(
      response.headers.get("x-ratelimit-remaining") ?? "1"
    );

    currentIndex++;

    if (data.data !== null) {
      if (data.data.Media !== null) {
        folder.anilist = data;
        refinedFolders.push(folder);
      } else {
        const incorrectFolder: IIncorrectFolder = {
          id: folder.id,
          name: truncate(folder.anilist?.data.Media.title.romaji ?? "Unknown"),
          reason: "anilist",
          description: `Invalid Anilist data received`,
        };

        incorrectFolders.push(incorrectFolder);
        emitEntry(incorrectFolder);
      }
    } else {
      const incorrectFolder: IIncorrectFolder = {
        id: folder.id,
        name: truncate(folder.anilist?.data.Media.title.romaji ?? "Unknown"),
        reason: "anilist",
        description: `Failed to fetch Anilist data`,
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
