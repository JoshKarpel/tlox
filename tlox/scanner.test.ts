import { scan, SyntaxError, Token } from "./scanner"

describe("scanner", () => {
  const cases: Array<[string, Array<Token>]> = [
    [
      "1 + 2 - 3 * 4 / 5",
      [
        { type: "NUMBER", lexeme: "1", value: 1, line: 1 },
        {
          type: "PLUS",
          lexeme: "+",
          value: undefined,
          line: 1,
        },
        { type: "NUMBER", lexeme: "2", value: 2, line: 1 },
        {
          type: "MINUS",
          lexeme: "-",
          value: undefined,
          line: 1,
        },
        { type: "NUMBER", lexeme: "3", value: 3, line: 1 },
        {
          type: "STAR",
          lexeme: "*",
          value: undefined,
          line: 1,
        },
        { type: "NUMBER", lexeme: "4", value: 4, line: 1 },
        {
          type: "SLASH",
          lexeme: "/",
          value: undefined,
          line: 1,
        },
        { type: "NUMBER", lexeme: "5", value: 5, line: 1 },
        { type: "EOF", lexeme: "", value: undefined, line: 1 },
      ],
    ],
    [
      "foo",
      [
        { type: "IDENTIFIER", lexeme: "foo", value: undefined, line: 1 },
        {
          type: "EOF",
          lexeme: "",
          value: undefined,
          line: 1,
        },
      ],
    ],
    [
      "foo\nBAR_baz\nfiz.bang",
      [
        { type: "IDENTIFIER", lexeme: "foo", value: undefined, line: 1 },
        {
          type: "IDENTIFIER",
          lexeme: "BAR_baz",
          value: undefined,
          line: 2,
        },
        {
          type: "IDENTIFIER",
          lexeme: "fiz",
          value: undefined,
          line: 3,
        },
        { type: "DOT", lexeme: ".", value: undefined, line: 3 },
        {
          type: "IDENTIFIER",
          lexeme: "bang",
          value: undefined,
          line: 3,
        },
        { type: "EOF", lexeme: "", value: undefined, line: 3 },
      ],
    ],
    [
      "foo and 5",
      [
        { type: "IDENTIFIER", lexeme: "foo", value: undefined, line: 1 },
        {
          type: "AND",
          lexeme: "and",
          value: undefined,
          line: 1,
        },
        {
          type: "NUMBER",
          lexeme: "5",
          value: 5,
          line: 1,
        },
        { type: "EOF", lexeme: "", value: undefined, line: 1 },
      ],
    ],
    [
      "123",
      [
        { type: "NUMBER", lexeme: "123", value: 123, line: 1 },
        {
          type: "EOF",
          lexeme: "",
          value: undefined,
          line: 1,
        },
      ],
    ],
    [
      "123.456",
      [
        { type: "NUMBER", lexeme: "123.456", value: 123.456, line: 1 },
        {
          type: "EOF",
          lexeme: "",
          value: undefined,
          line: 1,
        },
      ],
    ],
    [
      "()",
      [
        { type: "LEFT_PAREN", lexeme: "(", value: undefined, line: 1 },
        {
          type: "RIGHT_PAREN",
          lexeme: ")",
          value: undefined,
          line: 1,
        },
        { type: "EOF", lexeme: "", value: undefined, line: 1 },
      ],
    ],
    [
      "{}",
      [
        { type: "LEFT_BRACE", lexeme: "{", value: undefined, line: 1 },
        {
          type: "RIGHT_BRACE",
          lexeme: "}",
          value: undefined,
          line: 1,
        },
        { type: "EOF", lexeme: "", value: undefined, line: 1 },
      ],
    ],
    [
      "fun add(a, b) { print a + b; }",
      [
        { type: "FUN", lexeme: "fun", value: undefined, line: 1 },
        { type: "IDENTIFIER", lexeme: "add", value: undefined, line: 1 },
        { type: "LEFT_PAREN", lexeme: "(", value: undefined, line: 1 },
        { type: "IDENTIFIER", lexeme: "a", value: undefined, line: 1 },
        { type: "COMMA", lexeme: ",", value: undefined, line: 1 },
        { type: "IDENTIFIER", lexeme: "b", value: undefined, line: 1 },
        { type: "RIGHT_PAREN", lexeme: ")", value: undefined, line: 1 },
        { type: "LEFT_BRACE", lexeme: "{", value: undefined, line: 1 },
        { type: "PRINT", lexeme: "print", value: undefined, line: 1 },
        { type: "IDENTIFIER", lexeme: "a", value: undefined, line: 1 },
        { type: "PLUS", lexeme: "+", value: undefined, line: 1 },
        { type: "IDENTIFIER", lexeme: "b", value: undefined, line: 1 },
        { type: "SEMICOLON", lexeme: ";", value: undefined, line: 1 },
        { type: "RIGHT_BRACE", lexeme: "}", value: undefined, line: 1 },
        {
          type: "EOF",
          lexeme: "",
          value: undefined,
          line: 1,
        },
      ],
    ],
    [
      "!(true and false) or true == false",
      [
        { type: "BANG", lexeme: "!", value: undefined, line: 1 },
        { type: "LEFT_PAREN", lexeme: "(", value: undefined, line: 1 },
        { type: "TRUE", lexeme: "true", value: undefined, line: 1 },
        { type: "AND", lexeme: "and", value: undefined, line: 1 },
        { type: "FALSE", lexeme: "false", value: undefined, line: 1 },
        { type: "RIGHT_PAREN", lexeme: ")", value: undefined, line: 1 },
        { type: "OR", lexeme: "or", value: undefined, line: 1 },
        { type: "TRUE", lexeme: "true", value: undefined, line: 1 },
        { type: "EQUAL_EQUAL", lexeme: "==", value: undefined, line: 1 },
        { type: "FALSE", lexeme: "false", value: undefined, line: 1 },
        {
          type: "EOF",
          lexeme: "",
          value: undefined,
          line: 1,
        },
      ],
    ],
    [
      "1 < 2 and 2 <= 3 and 3 >= 2 and 2 > 1 and 1 != 2",
      [
        { type: "NUMBER", lexeme: "1", value: 1, line: 1 },
        { type: "LESS", lexeme: "<", value: undefined, line: 1 },
        { type: "NUMBER", lexeme: "2", value: 2, line: 1 },
        { type: "AND", lexeme: "and", value: undefined, line: 1 },
        { type: "NUMBER", lexeme: "2", value: 2, line: 1 },
        { type: "LESS_EQUAL", lexeme: "<=", value: undefined, line: 1 },
        { type: "NUMBER", lexeme: "3", value: 3, line: 1 },
        { type: "AND", lexeme: "and", value: undefined, line: 1 },
        { type: "NUMBER", lexeme: "3", value: 3, line: 1 },
        { type: "GREATER_EQUAL", lexeme: ">=", value: undefined, line: 1 },
        { type: "NUMBER", lexeme: "2", value: 2, line: 1 },
        { type: "AND", lexeme: "and", value: undefined, line: 1 },
        { type: "NUMBER", lexeme: "2", value: 2, line: 1 },
        { type: "GREATER", lexeme: ">", value: undefined, line: 1 },
        { type: "NUMBER", lexeme: "1", value: 1, line: 1 },
        { type: "AND", lexeme: "and", value: undefined, line: 1 },
        { type: "NUMBER", lexeme: "1", value: 1, line: 1 },
        { type: "BANG_EQUAL", lexeme: "!=", value: undefined, line: 1 },
        { type: "NUMBER", lexeme: "2", value: 2, line: 1 },
        { type: "EOF", lexeme: "", value: undefined, line: 1 },
      ],
    ],
    [
      'a = "foo"',
      [
        { type: "IDENTIFIER", lexeme: "a", value: undefined, line: 1 },
        { type: "EQUAL", lexeme: "=", value: undefined, line: 1 },
        { type: "STRING", lexeme: '"foo"', value: "foo", line: 1 },
        {
          type: "EOF",
          lexeme: "",
          value: undefined,
          line: 1,
        },
      ],
    ],
    [
      "hi // comment",
      [
        { type: "IDENTIFIER", lexeme: "hi", value: undefined, line: 1 },
        {
          type: "EOF",
          lexeme: "",
          value: undefined,
          line: 1,
        },
      ],
    ],
    [
      "\r\n\t\nfoo\n\t\r",
      [
        { type: "IDENTIFIER", lexeme: "foo", value: undefined, line: 3 },
        {
          type: "EOF",
          lexeme: "",
          value: undefined,
          line: 4,
        },
      ],
    ],
    [
      '"strIng"',
      [
        { type: "STRING", lexeme: '"strIng"', value: "strIng", line: 1 },
        {
          type: "EOF",
          lexeme: "",
          value: undefined,
          line: 1,
        },
      ],
    ],
    [
      '"strIng\nnext line"',
      [
        { type: "STRING", lexeme: '"strIng\nnext line"', value: "strIng\nnext line", line: 2 },
        {
          type: "EOF",
          lexeme: "",
          value: undefined,
          line: 2,
        },
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
