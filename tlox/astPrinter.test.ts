import { Binary, Grouping, Literal, Unary } from "./ast"
import { AstPrinter } from "./astPrinter"

describe("astPrinter", () => {
  test("it produces correct output", () => {
    const expr = new Binary(
      new Unary({ type: "MINUS", lexeme: "-", value: undefined, line: 1 }, new Literal(123)),
      { type: "STAR", lexeme: "*", value: undefined, line: 1 },
      new Grouping(new Literal(45.67)),
    )

    const printer = new AstPrinter()

    expect(printer.visit(expr)).toEqual("(* (- 123) (group 45.67))")
  })
})
