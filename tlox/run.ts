import chalk from "chalk"

import { Logger } from "./logger"
import { scan, SyntaxError } from "./scanner"

const logger = Logger.context({ module: "run" })

export function run(source: string): void {
  logger.log({ source: source })

  try {
    const tokens = scan(source)

    for (const token of tokens) {
      console.log(token)
    }
  } catch (e: unknown) {
    if (e instanceof SyntaxError) {
      console.log(chalk.red(`Syntax Error on line ${e.line}; ${e.message}`))
      throw e
    } else {
      throw e
    }
  }
}
