import { Binary, Expression, Grouping, Literal, Stmt, Unary } from "./ast"
import { AstPrinter } from "./astPrinter"
import { parse } from "./parser"
import { LiteralToken, Token } from "./scanner"

describe("parser", () => {
  const cases: Array<[Array<Token | LiteralToken>, Array<Stmt>]> = [
    [
      [
        { type: "NUMBER", lexeme: "1", value: 1, line: 1 },
        { type: "PLUS", lexeme: "+", line: 1 },
        { type: "NUMBER", lexeme: "2", value: 2, line: 1 },
        { type: "MINUS", lexeme: "-", line: 1 },
        { type: "NUMBER", lexeme: "3", value: 3, line: 1 },
        { type: "STAR", lexeme: "*", line: 1 },
        { type: "NUMBER", lexeme: "4", value: 4, line: 1 },
        { type: "SLASH", lexeme: "/", line: 1 },
        { type: "NUMBER", lexeme: "5", value: 5, line: 1 },
        { type: "SEMICOLON", lexeme: ";", line: 1 },
        { type: "EOF", lexeme: "", line: 1 },
      ],
      [
        new Expression(
          new Binary(
            new Binary(new Literal(1), { type: "PLUS", lexeme: "+", line: 1 }, new Literal(2)),
            { type: "MINUS", lexeme: "-", line: 1 },
            new Binary(
              new Binary(new Literal(3), { type: "STAR", lexeme: "*", line: 1 }, new Literal(4)),
              { type: "SLASH", lexeme: "/", line: 1 },
              new Literal(5),
            ),
          ),
        ),
      ],
    ],
    [
      [
        { type: "NUMBER", lexeme: "1", value: 1, line: 1 },
        { type: "GREATER", lexeme: ">", line: 1 },
        { type: "NUMBER", lexeme: "2", value: 2, line: 1 },
        { type: "SEMICOLON", lexeme: ";", line: 1 },
        { type: "EOF", lexeme: "", line: 1 },
      ],
      [
        new Expression(
          new Binary(new Literal(1), { type: "GREATER", lexeme: ">", line: 1 }, new Literal(2)),
        ),
      ],
    ],
    [
      [
        { type: "NUMBER", lexeme: "4", value: 4, line: 1 },
        { type: "EQUAL_EQUAL", lexeme: "==", line: 1 },
        { type: "NUMBER", lexeme: "2", value: 2, line: 1 },
        { type: "STAR", lexeme: "*", line: 1 },
        { type: "NUMBER", lexeme: "2", value: 2, line: 1 },
        { type: "SEMICOLON", lexeme: ";", line: 1 },
        { type: "EOF", lexeme: "", line: 1 },
      ],
      [
        new Expression(
          new Binary(
            new Literal(4),
            { type: "EQUAL_EQUAL", lexeme: "==", line: 1 },
            new Binary(new Literal(2), { type: "STAR", lexeme: "*", line: 1 }, new Literal(2)),
          ),
        ),
      ],
    ],
    [
      [
        { type: "BANG", lexeme: "4", line: 1 },
        { type: "TRUE", lexeme: "true", line: 1 },
        { type: "BANG_EQUAL", lexeme: "!=", line: 1 },
        { type: "BANG", lexeme: "4", line: 1 },
        { type: "FALSE", lexeme: "false", line: 1 },
        { type: "SEMICOLON", lexeme: ";", line: 1 },
        { type: "EOF", lexeme: "", line: 1 },
      ],
      [
        new Expression(
          new Binary(
            new Unary({ type: "BANG", lexeme: "4", line: 1 }, new Literal(true)),
            { type: "BANG_EQUAL", lexeme: "!=", line: 1 },
            new Unary({ type: "BANG", lexeme: "4", line: 1 }, new Literal(false)),
          ),
        ),
      ],
    ],
    [
      [
        { type: "LEFT_PAREN", lexeme: "(", line: 1 },
        { type: "NIL", lexeme: "nil", line: 1 },
        { type: "RIGHT_PAREN", lexeme: ")", line: 1 },
        { type: "SEMICOLON", lexeme: ";", line: 1 },
        { type: "EOF", lexeme: "", line: 1 },
      ],
      [new Expression(new Grouping(new Literal(null)))],
    ],
  ]

  for (const [tokens, stmt] of cases) {
    const printer = new AstPrinter()
    test(`Parse to ${printer.print(stmt)}`, () => {
      expect(parse(tokens)).toEqual(stmt)
    })
  }
})
