import {
  Assign,
  Binary,
  Block,
  Call,
  Expr,
  Expression,
  ExpressionVisitor,
  Fun,
  Grouping,
  If,
  Literal,
  Logical,
  Print,
  Return,
  StatementVisitor,
  Stmt,
  Unary,
  Var,
  Variable,
  While,
} from "./ast"
import { Interpreter } from "./interpreter"
import { ParseError } from "./parser"
import { Token } from "./scanner"

type Scope = Map<string, boolean>

export class Resolver implements ExpressionVisitor<void>, StatementVisitor<void> {
  interpreter: Interpreter
  scopes: Array<Scope>

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter

    this.scopes = []
  }

  currentScope(): Scope | undefined {
    if (this.scopes.length === 0) {
      return undefined
    }
    return this.scopes[this.scopes.length - 1]
  }

  resolve(node: Stmt | Expr | undefined): void {
    if (node !== undefined) {
      node.accept(this)
    }
  }

  resolveMany(nodes: Array<Stmt | Expr>): void {
    for (const node of nodes) {
      this.resolve(node)
    }
  }

  resolveLocal(expr: Expr, name: Token): void {
    // walk backwards
    for (const [depth, scope] of [...this.scopes].reverse().entries()) {
      if (scope.has(name.lexeme)) {
        this.interpreter.resolve(expr, depth) // report the number of scopes we had to look through
        return
      }
    }
    // falling through is fine - that means it's a global
  }

  resolveFunction(stmt: Fun): void {
    this.beginScope()
    for (const param of stmt.params) {
      this.declare(param)
      this.define(param)
    }
    this.resolveMany(stmt.body)
    this.endScope()
  }

  beginScope(): void {
    this.scopes.push(new Map())
  }

  endScope(): void {
    this.scopes.pop()
  }

  declare(name: Token): void {
    const scope = this.currentScope()
    if (scope === undefined) {
      return
    } else {
      scope.set(name.lexeme, false) // false means "not ready yet"
    }
  }

  define(name: Token): void {
    const scope = this.currentScope()
    if (scope === undefined) {
      return
    } else {
      scope.set(name.lexeme, true) // true means "ready for use"
    }
  }

  visitBlockStmt(stmt: Block): void {
    this.beginScope()
    this.resolveMany(stmt.statements)
    this.endScope()
  }

  visitVarStmt(stmt: Var): void {
    this.declare(stmt.name)
    if (stmt.initializer !== undefined) {
      this.resolve(stmt.initializer)
    }
    this.define(stmt.name)
  }

  visitVariable(expr: Variable): void {
    const scope = this.currentScope()
    if (scope !== undefined && scope.get(expr.name.lexeme) === false) {
      throw new ParseError(
        expr.name,
        `Cannot read local variable ${expr.name.lexeme} in its own initializer.`,
      )
    }

    this.resolveLocal(expr, expr.name)
  }

  visitAssign(expr: Assign): void {
    this.resolve(expr.value)
    this.resolveLocal(expr, expr.name)
  }

  visitFunStmt(stmt: Fun): void {
    this.declare(stmt.name)
    this.define(stmt.name)
    this.resolveFunction(stmt)
  }

  // boring stuff below, just need to walk through the whole tree

  visitExpressionStmt(stmt: Expression): void {
    this.resolve(stmt.expression)
  }

  visitIfStmt(stmt: If): void {
    this.resolve(stmt.condition)
    this.resolve(stmt.thenBranch)
    if (stmt.elseBranch !== undefined) {
      this.resolve(stmt.elseBranch)
    }
  }

  visitPrintStmt(stmt: Print): void {
    this.resolve(stmt.expression)
  }

  visitReturnStmt(stmt: Return): void {
    this.resolve(stmt.expression)
  }

  visitWhileStmt(stmt: While): void {
    this.resolve(stmt.condition)
    this.resolve(stmt.body)
  }

  visitBinary(expr: Binary): void {
    this.resolve(expr.left)
    this.resolve(expr.right)
  }

  visitCall(expr: Call): void {
    this.resolve(expr.callee)
    for (const arg of expr.args) {
      this.resolve(arg)
    }
  }

  visitGrouping(expr: Grouping): void {
    this.resolve(expr.expression)
  }

  visitLiteral(_expr: Literal): void {}

  visitLogical(expr: Logical): void {
    this.resolve(expr.left)
    this.resolve(expr.right)
  }

  visitUnary(expr: Unary): void {
    this.resolve(expr.right)
  }
}