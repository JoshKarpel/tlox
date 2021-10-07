import { scan, SyntaxError, Token } from "./scanner"

describe("scanner", () => {
  const cases: Array<[string, Array<Token>]> = [
    [
      "1 + 2 - 3 * 4 / 5",
      [
        { type: "NUMBER", lexeme: "1", literal: 1, line: 1 },
        {
          type: "PLUS",
          lexeme: "+",
          literal: undefined,
          line: 1,
        },
        { type: "NUMBER", lexeme: "2", literal: 2, line: 1 },
        {
          type: "MINUS",
          lexeme: "-",
          literal: undefined,
          line: 1,
        },
        { type: "NUMBER", lexeme: "3", literal: 3, line: 1 },
        {
          type: "STAR",
          lexeme: "*",
          literal: undefined,
          line: 1,
        },
        { type: "NUMBER", lexeme: "4", literal: 4, line: 1 },
        {
          type: "SLASH",
          lexeme: "/",
          literal: undefined,
          line: 1,
        },
        { type: "NUMBER", lexeme: "5", literal: 5, line: 1 },
      ],
    ],
    ["foo", [{ type: "IDENTIFIER", lexeme: "foo", literal: undefined, line: 1 }]],
    [
      "foo\nBAR_baz\nfiz.bang",
      [
        { type: "IDENTIFIER", lexeme: "foo", literal: undefined, line: 1 },
        {
          type: "IDENTIFIER",
          lexeme: "BAR_baz",
          literal: undefined,
          line: 2,
        },
        {
          type: "IDENTIFIER",
          lexeme: "fiz",
          literal: undefined,
          line: 3,
        },
        { type: "DOT", lexeme: ".", literal: undefined, line: 3 },
        {
          type: "IDENTIFIER",
          lexeme: "bang",
          literal: undefined,
          line: 3,
        },
      ],
    ],
    [
      "foo and 5",
      [
        { type: "IDENTIFIER", lexeme: "foo", literal: undefined, line: 1 },
        {
          type: "AND",
          lexeme: "and",
          literal: undefined,
          line: 1,
        },
        {
          type: "NUMBER",
          lexeme: "5",
          literal: 5,
          line: 1,
        },
      ],
    ],
    ["123", [{ type: "NUMBER", lexeme: "123", literal: 123, line: 1 }]],
    ["123.456", [{ type: "NUMBER", lexeme: "123.456", literal: 123.456, line: 1 }]],
    [
      "()",
      [
        { type: "LEFT_PAREN", lexeme: "(", literal: undefined, line: 1 },
        {
          type: "RIGHT_PAREN",
          lexeme: ")",
          literal: undefined,
          line: 1,
        },
      ],
    ],
    [
      "{}",
      [
        { type: "LEFT_BRACE", lexeme: "{", literal: undefined, line: 1 },
        {
          type: "RIGHT_BRACE",
          lexeme: "}",
          literal: undefined,
          line: 1,
        },
      ],
    ],
    [
      "fun add(a, b) { print a + b; }",
      [
        { type: "FUN", lexeme: "fun", literal: undefined, line: 1 },
        { type: "IDENTIFIER", lexeme: "add", literal: undefined, line: 1 },
        { type: "LEFT_PAREN", lexeme: "(", literal: undefined, line: 1 },
        { type: "IDENTIFIER", lexeme: "a", literal: undefined, line: 1 },
        { type: "COMMA", lexeme: ",", literal: undefined, line: 1 },
        { type: "IDENTIFIER", lexeme: "b", literal: undefined, line: 1 },
        { type: "RIGHT_PAREN", lexeme: ")", literal: undefined, line: 1 },
        { type: "LEFT_BRACE", lexeme: "{", literal: undefined, line: 1 },
        { type: "PRINT", lexeme: "print", literal: undefined, line: 1 },
        { type: "IDENTIFIER", lexeme: "a", literal: undefined, line: 1 },
        { type: "PLUS", lexeme: "+", literal: undefined, line: 1 },
        { type: "IDENTIFIER", lexeme: "b", literal: undefined, line: 1 },
        { type: "SEMICOLON", lexeme: ";", literal: undefined, line: 1 },
        { type: "RIGHT_BRACE", lexeme: "}", literal: undefined, line: 1 },
      ],
    ],
    [
      "!(true and false) or true == false",
      [
        { type: "BANG", lexeme: "!", literal: undefined, line: 1 },
        { type: "LEFT_PAREN", lexeme: "(", literal: undefined, line: 1 },
        { type: "TRUE", lexeme: "true", literal: undefined, line: 1 },
        { type: "AND", lexeme: "and", literal: undefined, line: 1 },
        { type: "FALSE", lexeme: "false", literal: undefined, line: 1 },
        { type: "RIGHT_PAREN", lexeme: ")", literal: undefined, line: 1 },
        { type: "OR", lexeme: "or", literal: undefined, line: 1 },
        { type: "TRUE", lexeme: "true", literal: undefined, line: 1 },
        { type: "EQUAL_EQUAL", lexeme: "==", literal: undefined, line: 1 },
        { type: "FALSE", lexeme: "false", literal: undefined, line: 1 },
      ],
    ],
    [
      "1 < 2 and 2 <= 3 and 3 >= 2 and 2 > 1 and 1 != 2",
      [
        { type: "NUMBER", lexeme: "1", literal: 1, line: 1 },
        { type: "LESS", lexeme: "<", literal: undefined, line: 1 },
        { type: "NUMBER", lexeme: "2", literal: 2, line: 1 },
        { type: "AND", lexeme: "and", literal: undefined, line: 1 },
        { type: "NUMBER", lexeme: "2", literal: 2, line: 1 },
        { type: "LESS_EQUAL", lexeme: "<=", literal: undefined, line: 1 },
        { type: "NUMBER", lexeme: "3", literal: 3, line: 1 },
        { type: "AND", lexeme: "and", literal: undefined, line: 1 },
        { type: "NUMBER", lexeme: "3", literal: 3, line: 1 },
        { type: "GREATER_EQUAL", lexeme: ">=", literal: undefined, line: 1 },
        { type: "NUMBER", lexeme: "2", literal: 2, line: 1 },
        { type: "AND", lexeme: "and", literal: undefined, line: 1 },
        { type: "NUMBER", lexeme: "2", literal: 2, line: 1 },
        { type: "GREATER", lexeme: ">", literal: undefined, line: 1 },
        { type: "NUMBER", lexeme: "1", literal: 1, line: 1 },
        { type: "AND", lexeme: "and", literal: undefined, line: 1 },
        { type: "NUMBER", lexeme: "1", literal: 1, line: 1 },
        { type: "BANG_EQUAL", lexeme: "!=", literal: undefined, line: 1 },
        { type: "NUMBER", lexeme: "2", literal: 2, line: 1 },
      ],
    ],
    [
      'a = "foo"',
      [
        { type: "IDENTIFIER", lexeme: "a", literal: undefined, line: 1 },
        { type: "EQUAL", lexeme: "=", literal: undefined, line: 1 },
        { type: "STRING", lexeme: '"foo"', literal: "foo", line: 1 },
      ],
    ],
    ["hi // comment", [{ type: "IDENTIFIER", lexeme: "hi", literal: undefined, line: 1 }]],
    ["\r\n\t\nfoo\n\t\r", [{ type: "IDENTIFIER", lexeme: "foo", literal: undefined, line: 3 }]],
    ['"strIng"', [{ type: "STRING", lexeme: '"strIng"', literal: "strIng", line: 1 }]],
    [
      '"strIng\nnext line"',
      [{ type: "STRING", lexeme: '"strIng\nnext line"', literal: "strIng\nnext line", line: 2 }],
    ],
  ]

  for (const [source, tokens] of cases) {
    test(`scan ${source.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")}`, () => {
      expect(scan(source)).toEqual(tokens)
    })
  }

  test("unexpected character is a syntax error", () => {
    expect(() => {
      scan("&")
    }).toThrow(SyntaxError)
  })

  test("unterminated string is a syntax error", () => {
    expect(() => {
      scan('"foo')
    }).toThrow(SyntaxError)
    expect(() => {
      scan('"foo\nnext line')
    }).toThrow(SyntaxError)
  })
})
