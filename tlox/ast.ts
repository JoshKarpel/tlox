import { Token } from "./scanner"

export interface ExpressionVisitor<T> {
  visitAssign(expr: Assign): T
  visitBinary(expr: Binary): T
  visitGrouping(expr: Grouping): T
  visitLiteral(expr: Literal): T
  visitUnary(expr: Unary): T
  visitVariable(expr: Variable): T
  visitLogical(expr: Logical): T
  visitCall(expr: Call): T
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

export class Call implements Expr {
  callee: Expr
  paren: Token
  args: Array<Expr>

  constructor(callee: Expr, paren: Token, args: Array<Expr>) {
    this.callee = callee
    this.paren = paren
    this.args = args
  }

  accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitCall(this)
  }
}

export interface StatementVisitor<T> {
  visitExpressionStmt(stmt: Expression): T
  visitPrintStmt(stmt: Print): T
  visitReturnStmt(stmt: Return): T
  visitVarStmt(stmt: Var): T
  visitFunStmt(stmt: Fun): T
  visitBlockStmt(stmt: Block): T
  visitClassStmt(stmt: Class): T
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

export class Return implements Stmt {
  keyword: Token
  expression: Expr

  constructor(keyword: Token, expr: Expr) {
    this.keyword = keyword
    this.expression = expr
  }

  accept<T>(visitor: StatementVisitor<T>): T {
    return visitor.visitReturnStmt(this)
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

export class Fun implements Stmt {
  name: Token
  params: Array<Token>
  body: Array<Stmt>

  constructor(name: Token, params: Array<Token>, body: Array<Stmt>) {
    this.name = name
    this.params = params
    this.body = body
  }

  accept<T>(visitor: StatementVisitor<T>): T {
    return visitor.visitFunStmt(this)
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

export class Class implements Stmt {
  name: Token
  methods: Array<Fun>

  constructor(name: Token, methods: Array<Fun>) {
    this.name = name
    this.methods = methods
  }

  accept<T>(visitor: StatementVisitor<T>): T {
    return visitor.visitClassStmt(this)
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
