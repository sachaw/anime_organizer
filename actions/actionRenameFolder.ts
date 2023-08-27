import { colors } from "https:/deno.land/x/cliffy@v1.0.0-rc.3/ansi/mod.ts";
import { Toggle } from "https:/deno.land/x/cliffy@v1.0.0-rc.3/prompt/toggle.ts";

import type { IIncorrectFolder } from "../types.ts";
import { getCorrectName } from "../utils.ts";

export async function actionRenameFolder(
  animeFolders: IIncorrectFolder[],
  basePath: string,
) {
  for (
    const folder of animeFolders.filter(
      (folder) => folder.reason === "name",
    )
  ) {
    const correctName = getCorrectName(
      folder.data?.anilist?.data.Media.id ?? 0,
      folder.data?.anilist?.data.Media.title.romaji ?? "Unknown",
      folder.data?.folderName.match(/\[(.*?)\]/)?.[1] || "Unknown",
    );

    if (
      await Toggle.prompt(
        `Rename:\n${
          colors.red(
            folder.data?.folderName ?? "Unknown",
          )
        }\n${colors.green(correctName)}`,
      )
    ) {
      Deno.renameSync(
        `${basePath}/${folder.data?.folderName}`,
        `${basePath}/${correctName}`,
      );
    }
    console.clear();
  }
}
// Deno.
