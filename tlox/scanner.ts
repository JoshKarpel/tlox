import { LiteralValue } from "./ast"
import { Logger } from "./logger"

const logger = Logger.context({ module: "scanner" })

export type TokenType =
  | "LEFT_PAREN"
  | "RIGHT_PAREN"
  | "LEFT_BRACE"
  | "RIGHT_BRACE"
  | "COMMA"
  | "DOT"
  | "MINUS"
  | "PLUS"
  | "SEMICOLON"
  | "SLASH"
  | "STAR"
  | "BANG"
  | "BANG_EQUAL"
  | "EQUAL"
  | "EQUAL_EQUAL"
  | "GREATER"
  | "GREATER_EQUAL"
  | "LESS"
  | "LESS_EQUAL"
  // literals
  | "IDENTIFIER"
  | "STRING"
  | "NUMBER"
  // keywords
  | "AND"
  | "CLASS"
  | "ELSE"
  | "FALSE"
  | "FUN"
  | "FOR"
  | "IF"
  | "NIL"
  | "OR"
  | "PRINT"
  | "RETURN"
  | "SUPER"
  | "THIS"
  | "TRUE"
  | "VAR"
  | "WHILE"
  | "EOF"

const KEYWORDS: Record<string, TokenType> = {
  and: "AND",
  class: "CLASS",
  else: "ELSE",
  false: "FALSE",
  for: "FOR",
  fun: "FUN",
  if: "IF",
  nil: "NIL",
  or: "OR",
  print: "PRINT",
  return: "RETURN",
  super: "SUPER",
  this: "THIS",
  true: "TRUE",
  var: "VAR",
  while: "WHILE",
}

export interface Token {
  readonly type: TokenType
  readonly lexeme: string
  readonly value: LiteralValue
  readonly line: number
}

class Scanner {
  source: string
  tokens: Array<Token>

  start: number
  current: number
  line: number

  constructor(source: string) {
    this.source = source
    this.tokens = []

    this.start = 0
    this.current = 0
    this.line = 1
  }

  scanTokens(): Array<Token> {
    while (!this.isAtEnd()) {
      this.start = this.current
      this.scanToken()
    }

    this.start = this.current
    this.addToken("EOF")

    return this.tokens
  }

  isAtEnd(): boolean {
    return this.current >= this.source.length
  }

  scanToken(): void {
    const c = this.advance()

    switch (c) {
      case "(":
        this.addToken("LEFT_PAREN")
        break
      case ")":
        this.addToken("RIGHT_PAREN")
        break
      case "{":
        this.addToken("LEFT_BRACE")
        break
      case "}":
        this.addToken("RIGHT_BRACE")
        break
      case ",":
        this.addToken("COMMA")
        break
      case ".":
        this.addToken("DOT")
        break
      case "-":
        this.addToken("MINUS")
        break
      case "+":
        this.addToken("PLUS")
        break
      case ";":
        this.addToken("SEMICOLON")
        break
      case "*":
        this.addToken("STAR")
        break
      case "!":
        this.addToken(this.match("=") ? "BANG_EQUAL" : "BANG")
        break
      case "=":
        this.addToken(this.match("=") ? "EQUAL_EQUAL" : "EQUAL")
        break
      case "<":
        this.addToken(this.match("=") ? "LESS_EQUAL" : "LESS")
        break
      case ">":
        this.addToken(this.match("=") ? "GREATER_EQUAL" : "GREATER")
        break
      case "/":
        if (this.match("/")) {
          while (this.peek() != "\n" && !this.isAtEnd()) {
            this.advance()
          }
        } else {
          this.addToken("SLASH")
        }
        break
      case " ":
        break
      case "\r":
        break
      case "\t":
        break
      case "\n":
        this.line += 1
        break
      case '"':
        this.string()
        break
      default:
        if (isDigit(c)) {
          this.number()
        } else if (isAlpha(c)) {
          this.identifier()
        } else {
          throw new SyntaxError({ line: this.line, message: `Unexpected character: ${c}` })
        }
    }
  }

  advance(): string {
    const char = this.source[this.current]
    this.current += 1
    return char
  }

  match(expected: string): boolean {
    if (this.isAtEnd() || this.source[this.current] !== expected) {
      return false
    } else {
      this.current += 1
      return true
    }
  }

  peek(): string {
    return this.source[this.current]
  }

  peekNext(): string {
    return this.source[this.current + 1]
  }

  string(): void {
    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === "\n") {
        this.line += 1
      }
      this.advance()
    }

    if (this.isAtEnd()) {
      throw new SyntaxError({ line: this.line, message: "Unterminated string" })
    }

    this.advance()

    this.addToken("STRING", this.source.slice(this.start + 1, this.current - 1))
  }

  number(): void {
    while (isDigit(this.peek())) {
      this.advance()
    }

    if (this.peek() === "." && isDigit(this.peekNext())) {
      this.advance()

      while (isDigit(this.peek())) {
        this.advance()
      }
    }

    this.addToken("NUMBER", Number.parseFloat(this.source.slice(this.start, this.current)))
  }

  identifier(): void {
    while (isAlphaNumeric(this.peek())) {
      this.advance()
    }

    const lexeme = this.source.slice(this.start, this.current)
    const type = KEYWORDS[lexeme]
    if (type === undefined) {
      this.addToken("IDENTIFIER")
    } else {
      this.addToken(type)
    }
  }

  addToken(type: TokenType, literal?: string | number | boolean | undefined): void {
    const t: Token = {
      type: type,
      lexeme: this.source.slice(this.start, this.current),
      value: literal,
      line: this.line,
    }
    logger.log({ token: t, current: this.current })
    this.tokens.push(t)
  }
}

function isDigit(char: string): boolean {
  return char >= "0" && char <= "9"
}

function isAlpha(char: string): boolean {
  return (char >= "a" && char <= "z") || (char >= "A" && char <= "Z") || char == "_"
}

function isAlphaNumeric(char: string): boolean {
  return isAlpha(char) || isDigit(char)
}

export class SyntaxError extends Error {
  line: number
  message: string

  constructor({ line, message }: { line: number; message: string }) {
    super()

    this.line = line
    this.message = message
  }
}

export function scan(source: string): Array<Token> {
  const scanner = new Scanner(source)
  return scanner.scanTokens()
}
