import { Binary, Expr, Grouping, Literal, Unary } from "./ast"
import { Interpreter, isEqual, isTruthy, LoxObject, LoxRuntimeError } from "./interpreter"

expect.extend({
  toBeLoxEqual(received, right) {
    const pass = isEqual(received, right)
    if (pass) {
      return {
        message: () => `expected ${received} != ${right}`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} == ${right}`,
        pass: false,
      }
    }
  },
})

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeLoxEqual(right: LoxObject): R
    }
  }
}

describe("interpreter", () => {
  const truthinessCases = [
    [null, false],
    [false, false],
    [true, true],
    ["", true],
    ["hi", true],
    [0, true],
    [5, true],
  ]

  for (const [object, truthiness] of truthinessCases) {
    test(`The truthiness of ${object} is ${truthiness}`, () => {
      expect(isTruthy(object)).toEqual(truthiness)
    })
  }

  const equalityCases = [
    [null, null, true],
    [null, 0, false],
    [null, 5, false],
    [true, true, true],
    [true, false, false],
    [false, true, false],
    [false, false, true],
    [0, 0, true],
    [0, 5, false],
    [0, "0", false],
    ["0", "0", true],
    ["1", "0", false],
  ]

  for (const [left, right, equality] of equalityCases) {
    test(`${left} == ${right} is ${equality}`, () => {
      expect(isEqual(left, right)).toEqual(equality)
    })
  }

  const interpreterCases: Array<[Expr, LoxObject]> = [
    [
      new Binary(
        new Binary(new Literal(1), { type: "PLUS", lexeme: "+", line: 1 }, new Literal(2)),
        { type: "MINUS", lexeme: "-", line: 1 },
        new Binary(
          new Binary(new Literal(3), { type: "STAR", lexeme: "*", line: 1 }, new Literal(4)),
          { type: "SLASH", lexeme: "/", line: 1 },
          new Literal(5),
        ),
      ),
      1 + 2 - (3 * 4) / 5,
    ],
    [
      new Binary(new Literal("foo"), { type: "PLUS", lexeme: "+", line: 1 }, new Literal("bar")),
      "foobar",
    ],
    [new Binary(new Literal(1), { type: "GREATER", lexeme: ">", line: 1 }, new Literal(0)), true],
    [
      new Binary(new Literal(1), { type: "GREATER_EQUAL", lexeme: ">=", line: 1 }, new Literal(0)),
      true,
    ],
    [new Binary(new Literal(1), { type: "LESS", lexeme: "<", line: 1 }, new Literal(0)), false],
    [
      new Binary(new Literal(1), { type: "LESS_EQUAL", lexeme: "<=", line: 1 }, new Literal(0)),
      false,
    ],
    [
      new Binary(new Literal(1), { type: "EQUAL_EQUAL", lexeme: "==", line: 1 }, new Literal(0)),
      false,
    ],
    [
      new Binary(new Literal(1), { type: "BANG_EQUAL", lexeme: "!=", line: 1 }, new Literal(0)),
      true,
    ],
    [new Unary({ type: "MINUS", lexeme: "-", line: 1 }, new Literal(1)), -1],
    [new Unary({ type: "BANG", lexeme: "!", line: 1 }, new Literal(true)), false],
    [new Grouping(new Unary({ type: "BANG", lexeme: "!", line: 1 }, new Literal(false))), true],
  ]
  for (const [expr, value] of interpreterCases) {
    test(`${JSON.stringify(expr)} evaluates to ${value}`, () => {
      const interpreter = new Interpreter()
      const evaluated = interpreter.evaluate(expr)

      expect(evaluated).toBeLoxEqual(value)
    })
  }

  const runtimeErrorCases: Array<Expr> = [
    // can't add string and number
    new Binary(new Literal(1), { type: "PLUS", lexeme: "+", line: 1 }, new Literal("bar")),
    // both expressions for - must be numbers
    new Binary(new Literal(1), { type: "MINUS", lexeme: "-", line: 1 }, new Literal("bar")),
    // * is not a legal unary operator
    new Unary({ type: "STAR", lexeme: "*", line: 1 }, new Literal(1)),
    // ! is not a legal binary operator
    new Binary(new Literal(1), { type: "BANG", lexeme: "!", line: 1 }, new Literal("bar")),
  ]
  for (const expr of runtimeErrorCases) {
    test(`Evaluating ${JSON.stringify(expr)} throws a runtime error`, () => {
      const interpreter = new Interpreter()

      expect(() => interpreter.evaluate(expr)).toThrowError(LoxRuntimeError)
    })
  }
})
