import { LiteralToken, scan, SyntaxError, Token } from "./scanner"

describe("scanner", () => {
  const cases: Array<[string, Array<Token | LiteralToken>]> = [
    [
      "1 + 2 - 3 * 4 / 5",
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
        { type: "EOF", lexeme: "", line: 1 },
      ],
    ],
    [
      "foo",
      [
        { type: "IDENTIFIER", lexeme: "foo", line: 1 },
        { type: "EOF", lexeme: "", line: 1 },
      ],
    ],
    [
      "foo\nBAR_baz\nfiz.bang",
      [
        { type: "IDENTIFIER", lexeme: "foo", line: 1 },
        { type: "IDENTIFIER", lexeme: "BAR_baz", line: 2 },
        { type: "IDENTIFIER", lexeme: "fiz", line: 3 },
        { type: "DOT", lexeme: ".", line: 3 },
        { type: "IDENTIFIER", lexeme: "bang", line: 3 },
        { type: "EOF", lexeme: "", line: 3 },
      ],
    ],
    [
      "foo and 5",
      [
        { type: "IDENTIFIER", lexeme: "foo", line: 1 },
        { type: "AND", lexeme: "and", line: 1 },
        { type: "NUMBER", lexeme: "5", value: 5, line: 1 },
        { type: "EOF", lexeme: "", line: 1 },
      ],
    ],
    [
      "123",
      [
        { type: "NUMBER", lexeme: "123", value: 123, line: 1 },
        { type: "EOF", lexeme: "", line: 1 },
      ],
    ],
    [
      "123.456",
      [
        { type: "NUMBER", lexeme: "123.456", value: 123.456, line: 1 },
        { type: "EOF", lexeme: "", line: 1 },
      ],
    ],
    [
      "()",
      [
        { type: "LEFT_PAREN", lexeme: "(", line: 1 },
        { type: "RIGHT_PAREN", lexeme: ")", line: 1 },
        { type: "EOF", lexeme: "", line: 1 },
      ],
    ],
    [
      "{}",
      [
        { type: "LEFT_BRACE", lexeme: "{", line: 1 },
        { type: "RIGHT_BRACE", lexeme: "}", line: 1 },
        { type: "EOF", lexeme: "", line: 1 },
      ],
    ],
    [
      "fun add(a, b) { print a + b; }",
      [
        { type: "FUN", lexeme: "fun", line: 1 },
        { type: "IDENTIFIER", lexeme: "add", line: 1 },
        { type: "LEFT_PAREN", lexeme: "(", line: 1 },
        { type: "IDENTIFIER", lexeme: "a", line: 1 },
        { type: "COMMA", lexeme: ",", line: 1 },
        { type: "IDENTIFIER", lexeme: "b", line: 1 },
        { type: "RIGHT_PAREN", lexeme: ")", line: 1 },
        { type: "LEFT_BRACE", lexeme: "{", line: 1 },
        { type: "PRINT", lexeme: "print", line: 1 },
        { type: "IDENTIFIER", lexeme: "a", line: 1 },
        { type: "PLUS", lexeme: "+", line: 1 },
        { type: "IDENTIFIER", lexeme: "b", line: 1 },
        { type: "SEMICOLON", lexeme: ";", line: 1 },
        { type: "RIGHT_BRACE", lexeme: "}", line: 1 },
        { type: "EOF", lexeme: "", line: 1 },
      ],
    ],
    [
      "!(true and false) or true == false",
      [
        { type: "BANG", lexeme: "!", line: 1 },
        { type: "LEFT_PAREN", lexeme: "(", line: 1 },
        { type: "TRUE", lexeme: "true", line: 1 },
        { type: "AND", lexeme: "and", line: 1 },
        { type: "FALSE", lexeme: "false", line: 1 },
        { type: "RIGHT_PAREN", lexeme: ")", line: 1 },
        { type: "OR", lexeme: "or", line: 1 },
        { type: "TRUE", lexeme: "true", line: 1 },
        { type: "EQUAL_EQUAL", lexeme: "==", line: 1 },
        { type: "FALSE", lexeme: "false", line: 1 },
        { type: "EOF", lexeme: "", line: 1 },
      ],
    ],
    [
      "1 < 2 and 2 <= 3 and 3 >= 2 and 2 > 1 and 1 != 2",
      [
        { type: "NUMBER", lexeme: "1", value: 1, line: 1 },
        { type: "LESS", lexeme: "<", line: 1 },
        { type: "NUMBER", lexeme: "2", value: 2, line: 1 },
        { type: "AND", lexeme: "and", line: 1 },
        { type: "NUMBER", lexeme: "2", value: 2, line: 1 },
        { type: "LESS_EQUAL", lexeme: "<=", line: 1 },
        { type: "NUMBER", lexeme: "3", value: 3, line: 1 },
        { type: "AND", lexeme: "and", line: 1 },
        { type: "NUMBER", lexeme: "3", value: 3, line: 1 },
        { type: "GREATER_EQUAL", lexeme: ">=", line: 1 },
        { type: "NUMBER", lexeme: "2", value: 2, line: 1 },
        { type: "AND", lexeme: "and", line: 1 },
        { type: "NUMBER", lexeme: "2", value: 2, line: 1 },
        { type: "GREATER", lexeme: ">", line: 1 },
        { type: "NUMBER", lexeme: "1", value: 1, line: 1 },
        { type: "AND", lexeme: "and", line: 1 },
        { type: "NUMBER", lexeme: "1", value: 1, line: 1 },
        { type: "BANG_EQUAL", lexeme: "!=", line: 1 },
        { type: "NUMBER", lexeme: "2", value: 2, line: 1 },
        { type: "EOF", lexeme: "", line: 1 },
      ],
    ],
    [
      'a = "foo"',
      [
        { type: "IDENTIFIER", lexeme: "a", line: 1 },
        { type: "EQUAL", lexeme: "=", line: 1 },
        { type: "STRING", lexeme: '"foo"', value: "foo", line: 1 },
        { type: "EOF", lexeme: "", line: 1 },
      ],
    ],
    [
      "hi // comment",
      [
        { type: "IDENTIFIER", lexeme: "hi", line: 1 },
        { type: "EOF", lexeme: "", line: 1 },
      ],
    ],
    [
      "\r\n\t\nfoo\n\t\r",
      [
        { type: "IDENTIFIER", lexeme: "foo", line: 3 },
        { type: "EOF", lexeme: "", line: 4 },
      ],
    ],
    [
      '"strIng"',
      [
        { type: "STRING", lexeme: '"strIng"', value: "strIng", line: 1 },
        { type: "EOF", lexeme: "", line: 1 },
      ],
    ],
    [
      '"strIng\nnext line"',
      [
        { type: "STRING", lexeme: '"strIng\nnext line"', value: "strIng\nnext line", line: 2 },
        { type: "EOF", lexeme: "", line: 2 },
      ],
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
