import { Scanner, Token } from "./scanner"

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
      "foo\nbar",
      [
        { type: "IDENTIFIER", lexeme: "foo", literal: undefined, line: 1 },
        {
          type: "IDENTIFIER",
          lexeme: "bar",
          literal: undefined,
          line: 2,
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
  ]

  for (const [source, tokens] of cases) {
    test(`scan ${source.replace(/\n/g, "\\n")}`, () => {
      const scanner = new Scanner(source)
      expect(scanner.scanTokens()).toEqual(tokens)
    })
  }
})
