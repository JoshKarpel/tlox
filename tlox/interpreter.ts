import { isDeepStrictEqual } from "util"

import {
  Binary,
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
} from "./ast"
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

export class Interpreter implements ExpressionVisitor<LoxObject>, StatementVisitor<void> {
  interpret(statements: Array<Stmt>): void {
    for (const stmt of statements) {
      this.execute(stmt)
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

  visitExpressionStmt(stmt: Expression): void {
    this.evaluate(stmt.expression)
  }

  visitPrintStmt(stmt: Print): void {
    console.log(this.evaluate(stmt.expression))
  }
}
