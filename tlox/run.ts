import chalk from "chalk"

import { AstPrinter } from "./astPrinter"
import { Logger } from "./logger"
import { parse } from "./parser"
import { scan, SyntaxError } from "./scanner"

const logger = Logger.context({ module: "run" })

export function run(source: string): void {
  logger.log({ source: source })

  try {
    const tokens = scan(source)
    const ast = parse(tokens)

    const printer = new AstPrinter()

    console.log(printer.visit(ast))
  } catch (e: unknown) {
    if (e instanceof SyntaxError) {
      console.log(chalk.red(`Syntax Error on line ${e.line}; ${e.message}`))
      throw e
    } else {
      throw e
    }
  }
}
