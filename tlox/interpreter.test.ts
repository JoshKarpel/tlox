import {
  Assign,
  Binary,
  Block,
  Expr,
  Expression,
  Grouping,
  If,
  Literal,
  Print,
  Stmt,
  Unary,
  Var,
  Variable,
} from "./ast"
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

  const environmentCases: Array<[Array<Stmt>, Record<string, LoxObject>]> = [
    [[], {}],
    [[new Var({ type: "IDENTIFIER", lexeme: "a", line: 1 })], { a: null }],
    [[new Var({ type: "IDENTIFIER", lexeme: "a", line: 1 }, new Literal(1))], { a: 1 }],
    [
      [
        new Var(
          { type: "IDENTIFIER", lexeme: "a", line: 1 },
          new Binary(new Literal(1), { type: "PLUS", lexeme: "+", line: 1 }, new Literal(2)),
        ),
      ],
      { a: 3 },
    ],
    [
      [
        new Var({ type: "IDENTIFIER", lexeme: "a", line: 1 }, new Literal(1)),
        new Expression(new Assign({ type: "IDENTIFIER", lexeme: "a", line: 1 }, new Literal(2))),
      ],
      { a: 2 },
    ],
    [
      [
        new Var({ type: "IDENTIFIER", lexeme: "a", line: 1 }, new Literal(1)),
        new Block([
          new Expression(new Assign({ type: "IDENTIFIER", lexeme: "a", line: 1 }, new Literal(2))),
        ]),
      ],
      { a: 2 },
    ],
    [
      [
        new Var({ type: "IDENTIFIER", lexeme: "a", line: 1 }, new Literal(1)),
        new Var(
          { type: "IDENTIFIER", lexeme: "b", line: 1 },
          new Binary(
            new Variable({ type: "IDENTIFIER", lexeme: "a", line: 1 }),
            { type: "PLUS", lexeme: "+", line: 1 },
            new Literal(1),
          ),
        ),
      ],
      { a: 1, b: 2 },
    ],
    [
      [
        new Var({ type: "IDENTIFIER", lexeme: "a", line: 1 }, new Literal(1)),
        new Block([
          new Var(
            { type: "IDENTIFIER", lexeme: "b", line: 1 },
            new Binary(
              new Variable({ type: "IDENTIFIER", lexeme: "a", line: 1 }),
              { type: "PLUS", lexeme: "+", line: 1 },
              new Literal(1),
            ),
          ),
          new Print(new Variable({ type: "IDENTIFIER", lexeme: "b", line: 2 })),
        ]),
      ],
      { a: 1 },
    ],
    [
      [
        new Var({ type: "VAR", lexeme: "a", line: 1 }),
        new If(
          new Literal(true),
          new Expression(new Assign({ type: "IDENTIFIER", lexeme: "a", line: 1 }, new Literal(1))),
          new Expression(new Assign({ type: "IDENTIFIER", lexeme: "a", line: 1 }, new Literal(2))),
        ),
      ],
      { a: 1 },
    ],
    [
      [
        new Var({ type: "VAR", lexeme: "a", line: 1 }),
        new If(
          new Literal(false),
          new Expression(new Assign({ type: "IDENTIFIER", lexeme: "a", line: 1 }, new Literal(1))),
          new Expression(new Assign({ type: "IDENTIFIER", lexeme: "a", line: 1 }, new Literal(2))),
        ),
      ],
      { a: 2 },
    ],
  ]
  for (const [stmts, values] of environmentCases) {
    test(`Running ${JSON.stringify(stmts)} produces the environment ${JSON.stringify(
      values,
    )}`, () => {
      const interpreter = new Interpreter()
      interpreter.interpret(stmts)

      expect(interpreter.environment.values).toStrictEqual(new Map(Object.entries(values)))
    })
  }

  const runtimeErrorExprs: Array<Expr> = [
    // can't add string and number
    new Binary(new Literal(1), { type: "PLUS", lexeme: "+", line: 1 }, new Literal("bar")),
    // both expressions for - must be numbers
    new Binary(new Literal(1), { type: "MINUS", lexeme: "-", line: 1 }, new Literal("bar")),
    // * is not a legal unary operator
    new Unary({ type: "STAR", lexeme: "*", line: 1 }, new Literal(1)),
    // ! is not a legal binary operator
    new Binary(new Literal(1), { type: "BANG", lexeme: "!", line: 1 }, new Literal("bar")),
    // undefined variable
    new Assign({ type: "VAR", lexeme: "a", line: 1 }, new Literal(1)),
  ]
  for (const expr of runtimeErrorExprs) {
    test(`Evaluating ${JSON.stringify(expr)} throws a runtime error`, () => {
      const interpreter = new Interpreter()

      expect(() => interpreter.evaluate(expr)).toThrowError(LoxRuntimeError)
    })
  }

  const runtimeErrorStmts: Array<Array<Stmt>> = [
    [
      new Block([
        new Expression(
          new Binary(
            new Variable({ type: "VAR", lexeme: "a", line: 1 }),
            { type: "PLUS", lexeme: "+", line: 1 },
            new Literal(1),
          ),
        ),
      ]),
    ],
  ]
  for (const stmts of runtimeErrorStmts) {
    test(`Interpreting ${JSON.stringify(stmts)} throws a runtime error`, () => {
      const interpreter = new Interpreter()

      expect(() => interpreter.interpret(stmts)).toThrowError(LoxRuntimeError)
    })
  }
})
