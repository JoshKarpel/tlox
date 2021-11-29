import chalk from "chalk"

import {
  Assign,
  Binary,
  Block,
  Call,
  Expr,
  Expression,
  Fun,
  Grouping,
  If,
  Literal,
  Logical,
  Print,
  Return,
  Stmt,
  Unary,
  Var,
  Variable,
  While,
} from "./ast"
import { Logger } from "./logger"
import { isLiteralToken, Token, TokenType } from "./scanner"

const logger = Logger.context({ module: "parser" })

export function parse(tokens: Array<Token>): Array<Stmt> {
  const parser = new Parser(tokens)
  return parser.parse()
}

export class Parser {
  tokens: Array<Token>
  current: number
  errors: Array<LoxParseError>

  constructor(tokens: Array<Token>) {
    this.tokens = tokens

    this.current = 0
    this.errors = []
  }

  parse(): Array<Stmt> {
    const statements = []

    while (!this.isAtEnd()) {
      const d = this.declaration()
      if (d !== null) {
        logger.log({ parsed: d })
        statements.push(d)
      }
    }

    if (this.errors.length > 0) {
      throw this.errors[0]
    }

    return statements
  }

  declaration(): Stmt | null {
    try {
      if (this.match("VAR")) {
        return this.varDeclaration()
      } else if (this.match("FUN")) {
        return this.funDeclaration("function")
      } else {
        return this.statement()
      }
    } catch (e: unknown) {
      if (e instanceof LoxParseError) {
        this.synchronize()
        return null
      } else throw e
    }
  }

  varDeclaration(): Stmt {
    const name = this.consume("IDENTIFIER", "Expected variable name.")

    const initializer = this.match("EQUAL") ? this.expression() : undefined

    this.consume("SEMICOLON", "Expected semicolon after variable declaration.")

    return new Var(name, initializer)
  }

  funDeclaration(kind: "function" | "method"): Stmt {
    const name = this.consume("IDENTIFIER", `Expected ${kind} name.`)

    this.consume("LEFT_PAREN", `Expected ( after ${kind} name.`)

    const params = []
    if (!this.check("RIGHT_PAREN")) {
      params.push(this.consume("IDENTIFIER", `${kind} parameters must be identifiers.`))
      while (this.match("COMMA")) {
        params.push(this.consume("IDENTIFIER", `${kind} parameters must be identifiers.`))

        if (params.length > 255) {
          this.error(this.peek(), "Can't have more than 255 parameters.")
        }
      }
    }

    this.consume("RIGHT_PAREN", "Expected ) after parameters.")
    this.consume("LEFT_BRACE", `Expected { before ${kind} body.`)

    const body = this.block()

    return new Fun(name, params, body)
  }

  statement(): Stmt {
    if (this.match("FOR")) {
      return this.forStatement()
    } else if (this.match("IF")) {
      return this.ifStatement()
    } else if (this.match("PRINT")) {
      return this.printStatement()
    } else if (this.match("RETURN")) {
      return this.returnStatement()
    } else if (this.match("WHILE")) {
      return this.whileStatement()
    } else if (this.match("LEFT_BRACE")) {
      return new Block(this.block())
    } else {
      return this.expressionStatement()
    }
  }

  block(): Array<Stmt> {
    const stmts = []

    while (!this.check("RIGHT_BRACE") && !this.isAtEnd()) {
      const decl = this.declaration()
      if (decl !== null) {
        stmts.push(decl)
      }
    }

    this.consume("RIGHT_BRACE", "Expected } after block.")

    return stmts
  }

  forStatement(): Stmt {
    // desugar for loops into equivalent while loops
    this.consume("LEFT_PAREN", "Expected ( after for.")

    const initializer = this.match("SEMICOLON")
      ? undefined
      : this.match("VAR")
      ? this.varDeclaration()
      : this.expressionStatement()

    const condition =
      (!this.check("SEMICOLON") ? this.expression() : undefined) ?? new Literal(true)
    this.consume("SEMICOLON", "Expected ; after for loop condition.")

    const increment = !this.check("RIGHT_PAREN") ? this.expression() : undefined
    this.consume("RIGHT_PAREN", "Expected ) after for loop increment.")

    let body = this.statement()

    if (increment !== undefined) {
      body = new Block([body, new Expression(increment)])
    }

    body = new While(condition, body)

    body = initializer !== undefined ? new Block([initializer, body]) : body

    return body
  }

  ifStatement(): Stmt {
    this.consume("LEFT_PAREN", "Expected ( before if condition.")
    const condition = this.expression()
    this.consume("RIGHT_PAREN", "Expected ) after if condition.")

    const thenBranch = this.statement()
    const elseBranch = this.match("ELSE") ? this.statement() : undefined

    return new If(condition, thenBranch, elseBranch)
  }

  printStatement(): Stmt {
    const expr = this.expression()
    this.consume("SEMICOLON", "Expected a ; after expression in print statement.")
    return new Print(expr)
  }

  returnStatement(): Stmt {
    const keyword = this.previous()

    const expr = this.check("SEMICOLON") ? new Literal(null) : this.expression()
    this.consume("SEMICOLON", "Expected a ; after expression in return statement.")

    return new Return(keyword, expr)
  }

  whileStatement(): Stmt {
    this.consume("LEFT_PAREN", "Expected ( before while condition.")
    const condition = this.expression()
    this.consume("RIGHT_PAREN", "Expected ) after while condition.")

    const body = this.statement()

    return new While(condition, body)
  }

  expressionStatement(): Stmt {
    const expr = this.expression()
    this.consume("SEMICOLON", "Expected a ; after value in expression statement.")
    return new Expression(expr)
  }

  expression(): Expr {
    return this.assignment()
  }

  assignment(): Expr {
    const expr = this.or()

    // handle assignment; the "expr" is now the assignment target
    if (this.match("EQUAL")) {
      const equals = this.previous()
      const value = this.expression()

      if (expr instanceof Variable) {
        const name = expr.name
        return new Assign(name, value)
      } else {
        throw this.error(equals, `Invalid assignment target ${JSON.stringify(expr)}`)
      }
    } else {
      return expr
    }
  }

  or(): Expr {
    let expr = this.and()

    while (this.match("OR")) {
      const operator = this.previous()
      const right = this.and()
      expr = new Logical(expr, operator, right)
    }

    return expr
  }

  and(): Expr {
    let expr = this.equality()

    while (this.match("AND")) {
      const operator = this.previous()
      const right = this.equality()
      expr = new Logical(expr, operator, right)
    }

    return expr
  }

  equality(): Expr {
    let expr = this.comparison()

    while (this.match("BANG_EQUAL", "EQUAL_EQUAL")) {
      const operator = this.previous()
      const right = this.comparison()
      expr = new Binary(expr, operator, right)
    }

    return expr
  }

  comparison(): Expr {
    let expr = this.term()

    while (this.match("GREATER", "GREATER_EQUAL", "LESS", "LESS_EQUAL")) {
      const operator = this.previous()
      const right = this.term()
      expr = new Binary(expr, operator, right)
    }

    return expr
  }

  term(): Expr {
    let expr = this.factor()

    while (this.match("PLUS", "MINUS")) {
      const operator = this.previous()
      const right = this.factor()
      expr = new Binary(expr, operator, right)
    }

    return expr
  }

  factor(): Expr {
    let expr = this.unary()

    while (this.match("SLASH", "STAR")) {
      const operator = this.previous()
      const right = this.unary()
      expr = new Binary(expr, operator, right)
    }

    return expr
  }

  unary(): Expr {
    if (this.match("BANG", "MINUS")) {
      const operator = this.previous()
      const right = this.primary()
      return new Unary(operator, right)
    }

    return this.call()
  }

  call(): Expr {
    let expr = this.primary()

    while (true) {
      if (this.match("LEFT_PAREN")) {
        expr = this.finishCall(expr)
      } else {
        break
      }
    }

    return expr
  }

  finishCall(callee: Expr): Expr {
    const args: Array<Expr> = []

    if (!this.check("RIGHT_PAREN")) {
      args.push(this.expression())
      while (this.match("COMMA")) {
        args.push(this.expression())

        if (args.length > 255) {
          this.error(this.peek(), "Can't have more than 255 arguments.")
        }
      }
    }

    const paren = this.consume("RIGHT_PAREN", "Expected ) after function arguments.")

    return new Call(callee, paren, args)
  }

  primary(): Expr {
    if (this.match("FALSE")) {
      return new Literal(false)
    } else if (this.match("TRUE")) {
      return new Literal(true)
    } else if (this.match("NIL")) {
      return new Literal(null)
    } else if (this.match("NUMBER", "STRING")) {
      const t = this.previous()
      if (isLiteralToken(t)) {
        return new Literal(t.value)
      } else {
        throw this.error(t, "Expected a number or string.")
      }
    } else if (this.match("IDENTIFIER")) {
      return new Variable(this.previous())
    } else if (this.match("LEFT_PAREN")) {
      const expr = this.expression()
      this.consume("RIGHT_PAREN", "Expected ')' after expression")
      return new Grouping(expr)
    } else {
      throw this.error(this.peek(), "Expected an expression.")
    }
  }

  match(...types: Array<TokenType>): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance()
        return true
      }
    }

    return false
  }

  check(type: TokenType): boolean {
    if (this.isAtEnd()) {
      return false
    } else {
      return this.peek().type === type
    }
  }

  advance(): Token {
    if (!this.isAtEnd()) {
      this.current += 1
    }
    return this.previous()
  }

  isAtEnd(): boolean {
    return this.peek().type == "EOF"
  }

  peek(): Token {
    return this.tokens[this.current]
  }

  previous(): Token {
    return this.tokens[this.current - 1]
  }

  consume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance()
    } else {
      throw this.error(this.peek(), message)
    }
  }

  error(token: Token, message: string): LoxParseError {
    message = `Parse Error on line ${token.line} at ${token.lexeme}; ${message}`
    console.log(chalk.red(message))
    const error = new LoxParseError(this.peek(), message)
    this.errors.push(error)
    return error
  }

  synchronize(): void {
    this.advance()

    while (!this.isAtEnd()) {
      if (this.previous().type === "SEMICOLON") {
        return
      }

      switch (this.peek().type) {
        case "CLASS":
        case "FOR":
        case "FUN":
        case "IF":
        case "PRINT":
        case "RETURN":
        case "VAR":
        case "WHILE":
          return
      }

      this.advance()
    }
  }
}

export class LoxParseError extends Error {
  token: Token
  message: string

  constructor(token: Token, message: string) {
    super()

    this.token = token
    this.message = message
  }
}
