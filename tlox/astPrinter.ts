import {
  Binary,
  Expr,
  Expression,
  ExpressionVisitor,
  Grouping,
  Literal,
  Print,
  StatementVisitor,
  Stmt,
  Unary,
  Var,
  Variable,
} from "./ast"
import { salmon } from "./pretty"

export class AstPrinter implements ExpressionVisitor<string>, StatementVisitor<string> {
  print(statements: Array<Stmt>): void {
    for (const stmt of statements) {
      console.log(salmon(this.visitStatement(stmt)))
    }
  }

  format(statements: Array<Stmt>): Array<string> {
    return statements.map((stmt) => this.visitStatement(stmt))
  }

  visit(expr: Expr): string {
    return expr.accept(this)
  }

  visitStatement(stmt: Stmt): string {
    return stmt.accept(this)
  }

  parenthesize(name: string, ...exprs: Array<Expr>): string {
    return `(${name} ${exprs.map((e) => e.accept(this)).join(` `)})`
  }

  visitBinary(expr: Binary): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right)
  }

  visitGrouping(expr: Grouping): string {
    return this.parenthesize("group", expr.expression)
  }

  visitLiteral(expr: Literal): string {
    return expr.value?.toString() ?? "nil"
  }

  visitUnary(expr: Unary): string {
    return this.parenthesize(expr.operator.lexeme, expr.right)
  }

  visitVariable(expr: Variable): string {
    return expr.name.lexeme
  }

  visitPrintStmt(stmt: Print): string {
    return this.parenthesize("print", stmt.expression)
  }

  visitExpressionStmt(stmt: Expression): string {
    return this.parenthesize("expr", stmt.expression)
  }

  visitVarStmt(stmt: Var): string {
    return this.parenthesize(
      `var ${stmt.name.lexeme}`,
      stmt.initializer ?? new Literal("UNINITIALIZED"),
    )
  }
}
