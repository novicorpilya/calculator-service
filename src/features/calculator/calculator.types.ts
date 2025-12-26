// Calculator types
export interface CalculatorState {
  display: string
  result: number | null
  lastOperator: string | null
  operandStack: number[]
}

export type OperatorType = '+' | '-' | '*' | '/'
