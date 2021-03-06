import chalk from "chalk"

import { Interpreter, LoxRuntimeError } from "./interpreter"
import { Logger } from "./logger"
import { parse } from "./parser"
import { Resolver } from "./resolver"
import { scan, SyntaxError } from "./scanner"

const logger = Logger.context({ module: "run" })

export function run(interpreter: Interpreter, source: string): void {
  logger.log({ source: source })

  try {
    const tokens = scan(source)
    const ast = parse(tokens)

    const resolver = new Resolver(interpreter)
    resolver.resolveMany(ast)

    interpreter.interpret(ast)
  } catch (e: unknown) {
    if (e instanceof SyntaxError) {
      console.log(chalk.red(`Syntax Error on line ${e.line}; ${e.message}`))
    } else if (e instanceof LoxRuntimeError) {
      console.log(chalk.red(`Runtime Error at ${JSON.stringify(e.token)}: ${e.message}`))
    }
    throw e
  }
}
