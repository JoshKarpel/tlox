#!/usr/bin/env node

import { readFileSync } from "fs"
import * as readline from "readline"
import yargs from "yargs"

import { Interpreter } from "./interpreter"
import { Logger } from "./logger"
import { salmon } from "./pretty"
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

      const interpreter = new Interpreter()

      if (argv.path !== undefined) {
        run(interpreter, readFileSync(argv.path).toString())
      } else {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
          terminal: false,
          prompt: salmon("> "),
        })

        rl.prompt()

        rl.on("line", (line) => {
          logger.log({ input: line })
          try {
            run(interpreter, line)
          } catch (e: unknown) {}
          rl.prompt()
        })
      }
    },
  )
  .recommendCommands()
