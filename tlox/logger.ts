import chalk from "chalk"

type Data = Record<string, unknown>

export class Logger {
  data: Data

  constructor(data?: Data) {
    this.data = { ...data } ?? {}
  }

  context(data?: Data): Logger {
    return new Logger({ ...this.data, ...data })
  }

  static context(data?: Data): Logger {
    return new Logger(data)
  }

  log(data: Data): void {
    console.log(chalk.dim.blackBright(Logger.format({ ...this.data, ...data })))
  }

  private static format(data: Data): string {
    return JSON.stringify(data)
  }
}

export const logger = new Logger()
