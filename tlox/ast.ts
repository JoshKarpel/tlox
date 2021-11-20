import { Token } from "./scanner"

export interface ExpressionVisitor<T> {
  visitBinary(expr: Binary): T
  visitGrouping(expr: Grouping): T
  visitLiteral(expr: Literal): T
  visitUnary(expr: Unary): T
}

export interface Expr {
  accept<T>(visitor: ExpressionVisitor<T>): T
}

export class Binary implements Expr {
  left: Expr
  operator: Token
  right: Expr

  constructor(left: Expr, operator: Token, right: Expr) {
    this.left = left
    this.operator = operator
    this.right = right
  }

  accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitBinary(this)
  }
}

export class Grouping implements Expr {
  expression: Expr

  constructor(expression: Expr) {
    this.expression = expression
  }

  accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitGrouping(this)
  }
}

export type LiteralValue = string | number | boolean | null

export class Literal implements Expr {
  value: LiteralValue

  constructor(value: LiteralValue) {
    this.value = value
  }

  accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitLiteral(this)
  }
}

export class Unary implements Expr {
  operator: Token
  right: Expr

  constructor(operator: Token, right: Expr) {
    this.operator = operator
    this.right = right
  }

  accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitUnary(this)
  }
}

export interface StatementVisitor<T> {
  visitExpressionStmt(stmt: Expression): T
  visitPrintStmt(stmt: Print): T
}

export interface Stmt {
  accept<T>(visitor: StatementVisitor<T>): T
}

export class Expression implements Stmt {
  expression: Expr

  constructor(expr: Expr) {
    this.expression = expr
  }

  accept<T>(visitor: StatementVisitor<T>): T {
    return visitor.visitExpressionStmt(this)
  }
}

export class Print implements Stmt {
  expression: Expr

  constructor(expr: Expr) {
    this.expression = expr
  }

  accept<T>(visitor: StatementVisitor<T>): T {
    return visitor.visitPrintStmt(this)
  }
}
