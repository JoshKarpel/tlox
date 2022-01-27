import {
  Assign,
  Binary,
  Block,
  Call,
  Class,
  Expr,
  Expression,
  ExpressionVisitor,
  Fun,
  Get,
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

export class AstPrinter implements ExpressionVisitor<string>, StatementVisitor<string> {
  format(statements: Array<Stmt>): Array<string> {
    return statements.map((stmt) => this.visitStatement(stmt))
  }

  visit(expr: Expr): string {
    return expr.accept(this)
  }

  visitStatement(stmt: Stmt): string {
    return stmt.accept(this)
  }

  parenthesize(name: string, ...exprs: Array<Expr | Stmt>): string {
    return `(${name} ${exprs.map((e) => e.accept(this)).join(` `)})`
  }

  visitAssign(expr: Assign): string {
    return this.parenthesize(`assign ${expr.name.lexeme}`, expr.value)
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

  visitFunStmt(stmt: Fun): string {
    return this.parenthesize(`fun ${stmt.name}`, ...stmt.body)
  }

  visitCall(expr: Call): string {
    return this.parenthesize("call", expr.callee)
  }

  visitGet(expr: Get): string {
    return this.parenthesize(`get ${expr.name}`, expr.object)
  }

  visitPrintStmt(stmt: Print): string {
    return this.parenthesize("print", stmt.expression)
  }

  visitReturnStmt(stmt: Return): string {
    return this.parenthesize("return", stmt.expression)
  }

  visitClassStmt(stmt: Class): string {
    return this.parenthesize(`class ${stmt.name.lexeme}`, ...stmt.methods)
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

  visitBlockStmt(stmt: Block): string {
    return this.format(stmt.statements).join(" ")
  }

  visitIfStmt(stmt: If): string {
    if (stmt.elseBranch !== undefined) {
      return this.parenthesize("if", stmt.condition, stmt.thenBranch, stmt.elseBranch)
    } else {
      return this.parenthesize("if", stmt.condition, stmt.thenBranch)
    }
  }

  visitLogical(expr: Logical): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right)
  }

  visitWhileStmt(stmt: While): string {
    return this.parenthesize("while", stmt.condition, stmt.body)
  }
}
