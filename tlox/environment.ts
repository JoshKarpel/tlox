import { LoxObject, LoxRuntimeError } from "./interpreter"
import { Logger } from "./logger"
import { Token } from "./scanner"

const logger = Logger.context({ module: "environment" })

export class Environment {
  values: Map<string, LoxObject>
  enclosing: Environment | undefined

  constructor(enclosing?: Environment) {
    this.enclosing = enclosing
    this.values = new Map()
  }

  define(name: string, value: LoxObject): void {
    this.values.set(name, value)
  }

  assign(name: Token, value: LoxObject): void {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value)
    } else if (this.enclosing !== undefined) {
      this.enclosing.assign(name, value)
    } else {
      throw new LoxRuntimeError({ token: name, message: `Undefined variable ${name.lexeme}` })
    }
  }

  lookup(name: Token): LoxObject {
    const v = this.values.get(name.lexeme)
    if (v !== undefined) {
      return v
    } else if (this.enclosing !== undefined) {
      return this.enclosing.lookup(name)
    } else {
      throw new LoxRuntimeError({ token: name, message: `Undefined variable ${name.lexeme}` })
    }
  }

  getAt(distance: number, name: Token): LoxObject {
    logger.log({ distance: distance, ancestor: this.ancestor(distance), current: this })
    const val = this.ancestor(distance).values.get(name.lexeme)
    if (val === undefined) {
      throw new LoxRuntimeError({
        token: name,
        message: `Unresolvable local variable ${name.lexeme}.`,
      })
    }
    return val
  }

  assignAt(distance: number, name: Token, value: LoxObject): void {
    this.ancestor(distance).values.set(name.lexeme, value)
  }

  ancestor(distance: number): Environment {
    let environment: Environment = this
    for (let i = 0; i < distance; i++) {
      environment = environment.enclosing ?? environment
    }
    return environment
  }
}
