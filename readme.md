# Anime Organizer

[![Open in Visual Studio Code](https://open.vscode.dev/badges/open-in-vscode.svg)](https://open.vscode.dev/sachaw/anime_organizer)

## Introduction

This CLI tool is meant to be used in conjunction with the [Anilist metadata provider for Plex](https://github.com/sachaw/anilist.bundle) for curating local anime collections to be consumed via [Plex](https://plex.tv).

## Functionality

The CLI provides directory scanning and reporting based on predefined filters:
| Filter | Description |
| ----------- | ----------- |
| Base | Performs REGEX matching on folder names to enable identification via Anilist ID's |
| Fetch data | Fetches all required data from the Anilist API |
| Incomplete name | Validates the filename save naming convention based on the Anilist API response |
| Contains folder | Checks if any subdirectories are present |
| Filetype | Checks if all files are MKV's |
| Total episodes | Compares the number of files with the total reported from the Anilist API |
