import { User } from '../../types'

export interface CalculationResult {
  optimalPizzas: Array<{
    id: string
    type: string
    size: string
    price: number
    slices: number
    isFree: boolean
  }>
  totalCost: number
  freePizzaValue: number
  totalUsers: number
  totalSlices: number
  pizzaCount: number
  freePizzaCount: number
  regularPizzaCount: number
  userSlicesDistribution: { [userId: string]: number }
}

export interface ICalculationScheme {
  id: string
  name: string
  description: string
  calculate(users: User[], settings: any): CalculationResult
}



