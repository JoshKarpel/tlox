import chalk from "chalk"
import { isDeepStrictEqual } from "util"

import {
  Assign,
  Binary,
  Block,
  Call,
  Class,
  Expr,
  Expression,
  ExpressionVisitor,
  Fun,
  Get,
  Grouping,
  If,
  Literal,
  LiteralValue,
  Logical,
  Print,
  Return,
  SetExpr,
  StatementVisitor,
  Stmt,
  This,
  Unary,
  Var,
  Variable,
  While,
} from "./ast"
import { AstPrinter } from "./astPrinter"
import { Environment } from "./environment"
import { Logger } from "./logger"
import { salmon } from "./pretty"
import { Token } from "./scanner"
import { zip } from "./utils"

const logger = Logger.context({ module: "interpreter" })

export type LoxObject = LiteralValue | LoxCallable | LoxClass | LoxInstance

interface LoxCallable {
  call(interpreter: Interpreter, args: Array<LoxObject>): LoxObject
  arity(): number
}

class ReturnValue extends Error {
  value: LoxObject

  constructor(value: LoxObject) {
    super()

    this.value = value
  }
}

class LoxFunction implements LoxCallable {
  declaration: Fun
  closure: Environment

  constructor(declaration: Fun, closure: Environment) {
    this.declaration = declaration
    this.closure = closure
  }

  arity(): number {
    return this.declaration.params.length
  }

  call(interpreter: Interpreter, args: Array<LoxObject>): LoxObject {
    const environment = new Environment(this.closure)

    for (const [arg, param] of zip(args, this.declaration.params)) {
      environment.define(param.lexeme, arg)
    }

    try {
      interpreter.interpret(this.declaration.body, environment)
    } catch (e: unknown) {
      if (e instanceof ReturnValue) {
        return e.value
      } else {
        throw e
      }
    }

    return null
  }

  bind(instance: LoxInstance): LoxFunction {
    const environment = new Environment(this.closure)
    environment.define("this", instance)
    return new LoxFunction(this.declaration, environment)
  }
}

export class LoxClass implements LoxCallable {
  name: string
  methods: Map<string, LoxFunction>

  constructor(name: string, methods: Map<string, LoxFunction>) {
    this.name = name
    this.methods = methods
  }

  arity(): number {
    return 0
  }

  call(_interpreter: Interpreter, _args: Array<LoxObject>): LoxObject {
    return new LoxInstance(this)
  }

  findMethod(name: string): LoxFunction | undefined {
    return this.methods.get(name)
  }
}

export class LoxInstance {
  cls: LoxClass
  fields: Map<string, LoxObject>

  constructor(cls: LoxClass) {
    this.cls = cls
    this.fields = new Map()
  }

  get(name: Token): LoxObject {
    const r = this.fields.get(name.lexeme)

    if (r === undefined) {
      const method = this.cls.findMethod(name.lexeme)

      if (method !== undefined) {
        return method.bind(this)
      }

      throw new LoxRuntimeError({
        token: name,
        message: `Undefined property ${name.lexeme} on ${this}`,
      })
    }

    return r
  }

  set(name: Token, value: LoxObject): void {
    this.fields.set(name.lexeme, value)
  }
}

export function isLoxCallable(obj: LoxObject): obj is LoxCallable {
  return (
    obj instanceof LoxFunction ||
    obj instanceof LoxClass ||
    (typeof obj === "object" && obj !== null && obj.hasOwnProperty("call"))
  )
}

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
  stdout: (chunk: string) => void
  environment: Environment
  globals: Environment
  locals: Map<Expr, number>
  printer: AstPrinter

  constructor(stdout: (chunk: string) => void = process.stdout.write.bind(process.stdout)) {
    this.stdout = stdout

    this.environment = this.globals = new Environment()
    this.globals.define("clock", {
      arity: () => 0,
      call(_interpreter: Interpreter, _args: Array<LoxObject>): LoxObject {
        return Date.now() / 1000
      },
    })

    this.locals = new Map()

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

  resolve(expr: Expr, depth: number): void {
    this.locals.set(expr, depth)
    console.log(expr, depth)
  }

  lookupVariable(name: Token, expr: Expr): LoxObject {
    const distance = this.locals.get(expr)
    if (distance !== undefined) {
      return this.environment.getAt(distance, name)
    } else {
      return this.globals.lookup(name)
    }
  }

  visitAssign(expr: Assign): LoxObject {
    const value = this.evaluate(expr.value)

    const distance = this.locals.get(expr)
    if (distance !== undefined) {
      this.environment.assignAt(distance, expr.name, value)
    } else {
      this.globals.assign(expr.name, value)
    }

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

  visitThis(expr: This): LoxObject {
    return this.lookupVariable(expr.keyword, expr)
  }

  visitVariable(expr: Variable): LoxObject {
    return this.lookupVariable(expr.name, expr)
  }

  visitLogical(expr: Logical): LoxObject {
    const left = this.evaluate(expr.left)
    const truthy = isTruthy(left)

    if (expr.operator.type == "OR") {
      return truthy ? left : this.evaluate(expr.right)
    } else {
      return truthy ? this.evaluate(expr.right) : left
    }
  }

  visitCall(expr: Call): LoxObject {
    const callee = this.evaluate(expr.callee)

    if (!isLoxCallable(callee)) {
      throw new LoxRuntimeError({
        token: expr.paren,
        message: `${JSON.stringify(callee)} is not callable.`,
      })
    }

    const args = expr.args.map((arg) => this.evaluate(arg))

    if (args.length !== callee.arity()) {
      throw new LoxRuntimeError({
        token: expr.paren,
        message: `${JSON.stringify(callee)} has arity of ${callee.arity()} but was called with ${
          args.length
        } arguments.`,
      })
    }

    return callee.call(this, args)
  }

  visitGet(expr: Get): LoxObject {
    const object = this.evaluate(expr.object)

    if (object instanceof LoxInstance) {
      return object.get(expr.name)
    } else {
      throw new LoxRuntimeError({ token: expr.name, message: "Only instances have properties." })
    }
  }

  visitSet(expr: SetExpr): LoxObject {
    const object = this.evaluate(expr.object)
    if (object instanceof LoxInstance) {
      const value = this.evaluate(expr.value)
      object.set(expr.name, value)
      return value
    } else {
      throw new LoxRuntimeError({ token: expr.name, message: "Only instances have properties." })
    }
  }

  visitExpressionStmt(stmt: Expression): void {
    this.evaluate(stmt.expression)
  }

  visitPrintStmt(stmt: Print): void {
    const value = this.evaluate(stmt.expression)
    const p = value === null ? "nil" : value
    this.stdout(chalk(p) + "\n")
  }

  visitReturnStmt(stmt: Return): void {
    throw new ReturnValue(stmt.expression !== undefined ? this.evaluate(stmt.expression) : null)
  }

  visitVarStmt(stmt: Var): void {
    this.environment.define(
      stmt.name.lexeme,
      stmt.initializer !== undefined ? this.evaluate(stmt.initializer) : null,
    )
  }

  visitFunStmt(stmt: Fun): void {
    this.environment.define(stmt.name.lexeme, new LoxFunction(stmt, this.environment))
  }

  visitBlockStmt(stmt: Block): void {
    this.interpret(stmt.statements, new Environment(this.environment))
  }

  visitClassStmt(stmt: Class): void {
    this.environment.define(stmt.name.lexeme, null)
    const methods = new Map()
    for (const method of stmt.methods) {
      const func = new LoxFunction(method, this.environment)
      methods.set(method.name.lexeme, func)
    }
    const cls = new LoxClass(stmt.name.lexeme, methods)
    this.environment.assign(stmt.name, cls)
  }

  visitIfStmt(stmt: If): void {
    if (isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch)
    } else if (stmt.elseBranch !== undefined) {
      this.execute(stmt.elseBranch)
    }
  }

  visitWhileStmt(stmt: While): void {
    while (isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body)
    }
  }
}
