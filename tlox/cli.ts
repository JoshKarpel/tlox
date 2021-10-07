#!/usr/bin/env node

import yargs from "yargs"

export const cli = yargs
  .strict(true)
  .scriptName("tlox")
  .command(
    ["run <path>", "$0"],
    "Run a tlox script.",
    (yargs) => {
      return yargs.positional("path", {
        describe: "The path to the script.",
        type: "string",
        normalize: true,
      })
    },
    (argv) => {
      console.log(`Path: ${argv.path}`)
    },
  )
  .recommendCommands()
