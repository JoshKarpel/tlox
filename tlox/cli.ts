#!/usr/bin/env node

import yargs from "yargs"
import { hideBin } from "yargs/helpers"

yargs(hideBin(process.argv))
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
  .parse()
