import { colors } from 'https:/deno.land/x/cliffy@v0.23.0/ansi/mod.ts';
import { Command } from 'https:/deno.land/x/cliffy@v0.23.0/command/mod.ts';
import { keypress } from 'https:/deno.land/x/cliffy@v0.23.0/keypress/mod.ts';
import { Checkbox } from 'https:/deno.land/x/cliffy@v0.23.0/prompt/checkbox.ts';
import { Input, prompt } from 'https:/deno.land/x/cliffy@v0.23.0/prompt/mod.ts';
import { Table } from 'https:/deno.land/x/cliffy@v0.23.0/table/mod.ts';
import ProgressBar from 'https:/deno.land/x/progress@v1.2.5/mod.ts';
import { sleep } from 'https:/deno.land/x/sleep@v1.2.1/mod.ts';
import { wait } from 'https:/deno.land/x/wait@0.1.12/mod.ts';

import { actionRenameFolder } from './actions/actionRenameFolder.ts';
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
import { filter } from './utils.ts';

await new Command()
  .name("animeOrganizer")
  .version("0.1.0")
  .description("Command line framework for Deno")
  .parse(Deno.args);

console.clear();

const result = await prompt([
  {
    name: "dir",
    message: "What directory do you want to scan?",
    type: Input,
  },
]);

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
  .padding(2)
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
console.clear();

if (result.dir) {
  const spinner = wait(`Reading: ${colors.blue(result.dir)}`).start();
  const foldersToProcess: Deno.DirEntry[] = [];
  for (const dirEntry of Deno.readDirSync(result.dir)) {
    foldersToProcess.push(dirEntry);
  }
  spinner.stop();

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
        `${result.dir}/${dirEntry.name}`.replace("//", "/")
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
        reason: "regex",
        description: `Folder name: ${dirEntry.name}`,
      });
    currentIndex++;
    progress.render(currentIndex);
  }
} else {
  console.log("Plese specify directory to scan");
}

const renderIncorrectFolder = (incorrectFolder: IIncorrectFolder) => {
  table.push([
    colors.gray((incorrectFolder.data?.id ?? 0).toString()),
    incorrectFolder.data?.name ?? "Unknown",
    incorrectFolder.reason,
    incorrectFolder.description,
  ]);
};

filter(
  renderIncorrectFolder,
  [
    fetchAnilistData,
    filterIncorrectName,
    filterEmptyFolder,
    filterContainsFolders,
    filterFileTypes,
    filterTotalEpisodes,
  ],
  animeFolders
).then(async ({ incorrectFolderStore }) => {
  console.clear();
  const actions: string[] = await Checkbox.prompt({
    message: "Select what actions you want to perform.",
    options: [
      { name: "Display results", value: "display" },
      {
        name: "Rename Folders",
        value: "rename",
        disabled: !incorrectFolderStore.find(
          (folder) => folder.reason === "name"
        ),
      },
      // Checkbox.separator("--------"),
    ],
  });

  for (const action of actions) {
    switch (action) {
      case "display":
        console.clear();
        table.render();
        break;
      case "rename":
        await actionRenameFolder(incorrectFolderStore, result.dir ?? "Unknown");

        break;

      default:
        break;
    }
  }

  await keypress();
});

async function fetchAnilistData({
  animeFolders,
  emitEntry,
}: IFilterProps): IFilterReturnType {
  const refinedFolders: IAnimeFolder[] = [];
  const incorrectFolders: IIncorrectFolder[] = [];
  console.clear();
  const progress = new ProgressBar({
    title: "Fetching Anilist data",
    total: animeFolders.length,
  });

  let currentIndex = 1;
  let rlTime = new Date();
  let rlReqRemaining = 1;
  for (const folder of animeFolders) {
    if (!rlReqRemaining) {
      console.log("\n");
      const spinner = wait(`Waiting for rate limiting`).start();
      await sleep(61 - (new Date().getTime() - rlTime.getTime()) / 1000);
      spinner.stop();
      console.clear();
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
          reason: "anilist",
          description: `Invalid Anilist data received`,
          data: folder,
        };

        incorrectFolders.push(incorrectFolder);
        emitEntry(incorrectFolder);
      }
    } else {
      const incorrectFolder: IIncorrectFolder = {
        reason: "anilist",
        description: `Failed to fetch Anilist data`,
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
