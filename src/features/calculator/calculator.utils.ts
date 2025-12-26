// Calculator utilities
export const isNumber = (char: string): boolean => {
  return !isNaN(Number(char))
}

export const isOperator = (char: string): boolean => {
  return ['+', '-', '*', '/'].includes(char)
}

export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}
