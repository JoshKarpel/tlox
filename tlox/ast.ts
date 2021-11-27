import { Token } from "./scanner"

export interface ExpressionVisitor<T> {
  visitAssign(expr: Assign): T
  visitBinary(expr: Binary): T
  visitGrouping(expr: Grouping): T
  visitLiteral(expr: Literal): T
  visitUnary(expr: Unary): T
  visitVariable(expr: Variable): T
  visitLogical(expr: Logical): T
}

export interface Expr {
  accept<T>(visitor: ExpressionVisitor<T>): T
}

export class Assign implements Expr {
  name: Token
  value: Expr

  constructor(name: Token, value: Expr) {
    this.name = name
    this.value = value
  }

  accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitAssign(this)
  }
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

export class Variable implements Expr {
  name: Token

  constructor(name: Token) {
    this.name = name
  }

  accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitVariable(this)
  }
}

export class Logical implements Expr {
  left: Expr
  operator: Token
  right: Expr

  constructor(left: Expr, operator: Token, right: Expr) {
    this.left = left
    this.operator = operator
    this.right = right
  }

  accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitLogical(this)
  }
}

export interface StatementVisitor<T> {
  visitExpressionStmt(stmt: Expression): T
  visitPrintStmt(stmt: Print): T
  visitVarStmt(stmt: Var): T
  visitBlockStmt(stmt: Block): T
  visitIfStmt(stmt: If): T
  visitWhileStmt(stmt: While): T
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

export class Var implements Stmt {
  name: Token
  initializer?: Expr

  constructor(name: Token, initializer?: Expr) {
    this.name = name
    this.initializer = initializer
  }

  accept<T>(visitor: StatementVisitor<T>): T {
    return visitor.visitVarStmt(this)
  }
}

export class Block implements Stmt {
  statements: Array<Stmt>

  constructor(statements: Array<Stmt>) {
    this.statements = statements
  }

  accept<T>(visitor: StatementVisitor<T>): T {
    return visitor.visitBlockStmt(this)
  }
}

export class If implements Stmt {
  condition: Expr
  thenBranch: Stmt
  elseBranch: Stmt | undefined

  constructor(condition: Expr, thenBranch: Stmt, elseBranch?: Stmt) {
    this.condition = condition
    this.thenBranch = thenBranch
    this.elseBranch = elseBranch
  }

  accept<T>(visitor: StatementVisitor<T>): T {
    return visitor.visitIfStmt(this)
  }
}

export class While implements Stmt {
  condition: Expr
  body: Stmt

  constructor(condition: Expr, body: Stmt) {
    this.condition = condition
    this.body = body
  }

  accept<T>(visitor: StatementVisitor<T>): T {
    return visitor.visitWhileStmt(this)
  }
}
