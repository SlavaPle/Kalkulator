import { ICalculationScheme, CalculationResult } from './ICalculationScheme'
import { User } from '../../types'

export class MixedScheme implements ICalculationScheme {
  id = 'mixed'
  name = 'Mixed calculation'
  description = 'Combines different pricing strategies for optimal cost distribution'

  calculate(users: User[], settings: any): CalculationResult {
    const totalSlices = users.reduce((sum, user) => sum + user.minSlices, 0)

    // Use a mix of small and large pizzas for optimal cost
    const largePizzaCount = Math.floor(totalSlices / settings.largePizzaSlices)
    const remainingSlices = totalSlices % settings.largePizzaSlices
    const smallPizzaCount = remainingSlices > 0 ? 1 : 0

    const totalPizzaCount = largePizzaCount + smallPizzaCount
    const freePizzaCount = settings.useFreePizza ? Math.floor(totalPizzaCount / settings.freePizzaThreshold) : 0
    const regularPizzaCount = totalPizzaCount - freePizzaCount

    // Create pizza list
    const optimalPizzas = []
    let pizzaIndex = 0

    // Add large pizzas
    for (let i = 0; i < largePizzaCount; i++) {
      const isFree = pizzaIndex < freePizzaCount
      optimalPizzas.push({
        id: `pizza-${pizzaIndex}`,
        type: 'Margherita',
        size: 'large',
        price: settings.largePizzaPrice,
        slices: settings.largePizzaSlices,
        isFree
      })
      pizzaIndex++
    }

    // Add small pizza if needed
    if (smallPizzaCount > 0) {
      const isFree = pizzaIndex < freePizzaCount
      const smallPizzaPrice = settings.largePizzaPrice * settings.smallPizzaPricePercent / 100
      optimalPizzas.push({
        id: `pizza-${pizzaIndex}`,
        type: 'Margherita',
        size: 'small',
        price: smallPizzaPrice,
        slices: settings.smallPizzaSlices,
        isFree
      })
    }

    // Distribute slices among users
    const userSlicesDistribution: { [userId: string]: number } = {}
    users.forEach(user => {
      userSlicesDistribution[user.id] = user.minSlices
    })

    const totalCost = optimalPizzas
      .filter(pizza => !pizza.isFree)
      .reduce((sum, pizza) => sum + pizza.price, 0)

    const freePizzaValue = optimalPizzas
      .filter(pizza => pizza.isFree)
      .reduce((sum, pizza) => sum + pizza.price, 0)

    return {
      optimalPizzas,
      totalCost,
      freePizzaValue,
      totalUsers: users.length,
      totalSlices,
      pizzaCount: totalPizzaCount,
      freePizzaCount,
      regularPizzaCount,
      userSlicesDistribution
    }
  }
}



