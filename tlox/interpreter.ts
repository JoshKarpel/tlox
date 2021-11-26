import chalk from "chalk"
import { isDeepStrictEqual } from "util"

import {
  Assign,
  Binary,
  Block,
  Expr,
  Expression,
  ExpressionVisitor,
  Grouping,
  Literal,
  LiteralValue,
  Print,
  StatementVisitor,
  Stmt,
  Unary,
  Var,
  Variable,
} from "./ast"
import { AstPrinter } from "./astPrinter"
import { Logger } from "./logger"
import { salmon } from "./pretty"
import { Token } from "./scanner"

const logger = Logger.context({ module: "interpreter" })

export type LoxObject = LiteralValue

export class LoxRuntimeError extends Error {
  token: Token
  message: string

  constructor({ token, message }: { token: Token; message: string }) {
    super()

    this.token = token
    this.message = message
  }
}

export function isTruthy(object: LoxObject): boolean {
  if (object === null) {
    return false
  } else if (typeof object == "boolean") {
    return object
  } else {
    return true
  }
}

export function mustBeNumber(token: Token, n: LoxObject): asserts n is number {
  if (typeof n !== "number") {
    throw new LoxRuntimeError({
      token: token,
      message: `Expected ${n} to be a number, but it was a ${typeof n}`,
    })
  }
}

export function isEqual(left: LoxObject, right: LoxObject): boolean {
  return isDeepStrictEqual(left, right)
}

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
}

export class Interpreter implements ExpressionVisitor<LoxObject>, StatementVisitor<void> {
  environment: Environment
  printer: AstPrinter

  constructor() {
    this.environment = new Environment()
    this.printer = new AstPrinter()
  }

  interpret(statements: Array<Stmt>, environment?: Environment): void {
    const previous = this.environment
    try {
      if (environment !== undefined) {
        this.environment = environment
      }
      for (const stmt of statements) {
        console.log(salmon(`Statement: ${this.printer.format([stmt])}`))
        this.execute(stmt)
        console.log(
          salmon(`Environment: ${JSON.stringify(Object.fromEntries(this.environment.values))}`),
        )
      }
    } finally {
      this.environment = previous
    }
  }

  evaluate(expr: Expr): LoxObject {
    const obj = expr.accept(this)
    logger.log({ expr: expr, value: obj })
    return obj
  }

  execute(stmt: Stmt): void {
    logger.log({ stmt: stmt })
    stmt.accept(this)
  }

  visitAssign(expr: Assign): LoxObject {
    const value = this.evaluate(expr.value)
    this.environment.assign(expr.name, value)
    return value
  }

  visitBinary(expr: Binary): LoxObject {
    const left = this.evaluate(expr.left)
    const right = this.evaluate(expr.right)

    switch (expr.operator.type) {
      case "PLUS":
        if (typeof left === "number" && typeof right === "number") {
          return left + right
        } else if (typeof left === "string" && typeof right === "string") {
          return left + right
        } else {
          throw new LoxRuntimeError({
            token: expr.operator,
            message: `Can only add strings to strings and numbers to numbers, not ${salmon(
              left,
            )} (${salmon(typeof left)}) to ${salmon(right)} (${salmon(typeof right)})`,
          })
        }
      case "MINUS":
        mustBeNumber(expr.operator, left)
        mustBeNumber(expr.operator, right)
        return left - right
      case "SLASH":
        mustBeNumber(expr.operator, left)
        mustBeNumber(expr.operator, right)
        return left / right
      case "STAR":
        mustBeNumber(expr.operator, left)
        mustBeNumber(expr.operator, right)
        return left * right
      case "GREATER":
        mustBeNumber(expr.operator, left)
        mustBeNumber(expr.operator, right)
        return left > right
      case "GREATER_EQUAL":
        mustBeNumber(expr.operator, left)
        mustBeNumber(expr.operator, right)
        return left >= right
      case "LESS":
        mustBeNumber(expr.operator, left)
        mustBeNumber(expr.operator, right)
        return left < right
      case "LESS_EQUAL":
        mustBeNumber(expr.operator, left)
        mustBeNumber(expr.operator, right)
        return left <= right
      case "EQUAL_EQUAL":
        return isEqual(left, right)
      case "BANG_EQUAL":
        return !isEqual(left, right)
      default:
        throw new LoxRuntimeError({ token: expr.operator, message: "unreachable" })
    }
  }

  visitGrouping(expr: Grouping): LoxObject {
    return this.evaluate(expr.expression)
  }

  visitLiteral(expr: Literal): LoxObject {
    return expr.value
  }

  visitUnary(expr: Unary): LoxObject {
    const right = this.evaluate(expr.right)
    switch (expr.operator.type) {
      case "MINUS":
        mustBeNumber(expr.operator, right)
        return -right
      case "BANG":
        return !isTruthy(right)
      default:
        throw new LoxRuntimeError({
          token: expr.operator,
          message: `cannot apply operator ${expr.operator.lexeme} as unary to ${right}`,
        })
    }
  }

  visitVariable(expr: Variable): LoxObject {
    return this.environment.lookup(expr.name)
  }

  visitExpressionStmt(stmt: Expression): void {
    this.evaluate(stmt.expression)
  }

  visitPrintStmt(stmt: Print): void {
    console.log(chalk(this.evaluate(stmt.expression)))
  }

  visitVarStmt(stmt: Var): void {
    this.environment.define(
      stmt.name.lexeme,
      stmt.initializer !== undefined ? this.evaluate(stmt.initializer) : null,
    )
  }

  visitBlockStmt(stmt: Block): void {
    this.interpret(stmt.statements, new Environment(this.environment))
  }
}
