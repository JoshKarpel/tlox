import chalk from "chalk"

import {
  Assign,
  Binary,
  Block,
  Expr,
  Expression,
  Grouping,
  Literal,
  Print,
  Stmt,
  Unary,
  Var,
  Variable,
} from "./ast"
import { isLiteralToken, Token, TokenType } from "./scanner"

export function parse(tokens: Array<Token>): Array<Stmt> {
  const parser = new Parser(tokens)
  return parser.parse()
}

export class Parser {
  tokens: Array<Token>
  current: number
  errors: Array<ParseError>

  constructor(tokens: Array<Token>) {
    this.tokens = tokens

    this.current = 0
    this.errors = []
  }

  parse(): Array<Stmt> {
    const statements = []
    const errors = []

    while (!this.isAtEnd()) {
      const d = this.declaration()
      if (d !== null) {
        statements.push(d)
      }
    }

    if (errors.length > 0) {
      throw this.errors[0]
    }

    return statements
  }

  declaration(): Stmt | null {
    try {
      if (this.match("VAR")) {
        return this.varDeclaration()
      } else {
        return this.statement()
      }
    } catch (e: unknown) {
      if (e instanceof ParseError) {
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

  statement(): Stmt {
    if (this.match("PRINT")) {
      return this.printStatement()
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

  printStatement(): Stmt {
    const expr = this.expression()
    this.consume("SEMICOLON", "Expected a ; after value.")
    return new Print(expr)
  }

  expressionStatement(): Stmt {
    const expr = this.expression()
    this.consume("SEMICOLON", "Expected a ; after value.")
    return new Expression(expr)
  }

  expression(): Expr {
    return this.assignment()
  }

  assignment(): Expr {
    const expr = this.equality()

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

    return this.primary()
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

  error(token: Token, message: string): ParseError {
    console.log(chalk.red(`Parse Error on line ${token.line} at ${token.lexeme}; ${message}`))
    const error = new ParseError(this.peek(), message)
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

class ParseError extends Error {
  token: Token
  message: string

  constructor(token: Token, message: string) {
    super()

    this.token = token
    this.message = message
  }
}
