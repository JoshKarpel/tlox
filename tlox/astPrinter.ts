import { Binary, Expr, Grouping, Literal, Unary, Visitor } from "./ast"

export class AstPrinter implements Visitor<string> {
  visit(expr: Expr): string {
    return expr.accept(this)
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
}
