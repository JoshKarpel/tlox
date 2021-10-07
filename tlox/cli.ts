#!/usr/bin/env node

import chalk from "chalk"
import { readFileSync } from "fs"
import * as readline from "readline"
import yargs from "yargs"

import { Logger } from "./logger"
import { run } from "./run"

const logger = Logger.context({ module: "cli" })

export const cli = yargs
  .strict(true)
  .scriptName("tlox")
  .command(
    ["run [path]", "$0"],
    "Run a tlox script.",
    (yargs) => {
      return yargs.positional("path", {
        describe: "The path to the script.",
        type: "string",
        normalize: true,
      })
    },
    (argv) => {
      logger.log({ subcommand: "run", argv: argv })
      if (argv.path !== undefined) {
        run(readFileSync(argv.path).toString())
      } else {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
          terminal: false,
          prompt: chalk.bold.rgb(250, 128, 114)("> "),
        })

        rl.prompt()

        rl.on("line", (line) => {
          logger.log({ input: line })
          try {
            run(line)
          } catch (e: unknown) {}
          rl.prompt()
        })
      }
    },
  )
  .recommendCommands()
