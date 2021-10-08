import { Token } from "./scanner"

export interface Visitor<T> {
  visitBinary(expr: Binary): T
  visitGrouping(expr: Grouping): T
  visitLiteral(expr: Literal): T
  visitUnary(expr: Unary): T
}

export interface Expr {
  accept<T>(visitor: Visitor<T>): T
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

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitBinary(this)
  }
}

export class Grouping implements Expr {
  expression: Expr

  constructor(expression: Expr) {
    this.expression = expression
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitGrouping(this)
  }
}

export class Literal implements Expr {
  value: string | number | boolean

  constructor(value: string | number | boolean) {
    this.value = value
  }

  accept<T>(visitor: Visitor<T>): T {
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

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitUnary(this)
  }
}
