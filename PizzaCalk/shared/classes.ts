import { Pizza, PizzaSlice, Sauce, User, Order, CalculationResult, PizzaSize, SauceSize } from './types';

export class PizzaCalculator {
  private order: Order;

  constructor(order: Order) {
    this.order = order;
  }

  /**
   * Основной метод расчета оптимального количества пицц
   */
  public calculateOptimalOrder(): CalculationResult {
    const totalSlicesNeeded = this.calculateTotalSlicesNeeded();
    const optimalPizzas = this.calculateOptimalPizzas(totalSlicesNeeded);
    const userCosts = this.calculateUserCosts(optimalPizzas);
    const distribution = this.distributeSlices(optimalPizzas);

    return {
      optimalPizzas,
      userCosts,
      totalCost: this.calculateTotalCost(optimalPizzas),
      freePizzaValue: this.calculateFreePizzaValue(optimalPizzas),
      distribution
    };
  }

  /**
   * Расчет общего количества необходимых кусков
   */
  private calculateTotalSlicesNeeded(): number {
    return this.order.users.reduce((total, user) => {
      return total + user.maxSlices;
    }, 0);
  }

  /**
   * Расчет оптимального количества пицц
   */
  private calculateOptimalPizzas(totalSlicesNeeded: number): Pizza[] {
    const pizzas: Pizza[] = [];
    let remainingSlices = totalSlicesNeeded;
    let pizzaCount = 0;

    // Базовый расчет количества пицц
    while (remainingSlices > 0) {
      const pizza = this.createPizza(pizzaCount);
      pizzas.push(pizza);
      remainingSlices -= pizza.slices;
      pizzaCount++;
    }

    // Проверка на бесплатные пиццы
    const freePizzaCount = Math.floor(pizzaCount / this.getFreePizzaThreshold());
    if (freePizzaCount > 0) {
      // Добавляем бесплатные пиццы меньшего размера
      for (let i = 0; i < freePizzaCount; i++) {
        const freePizza = this.createFreePizza(pizzaCount + i);
        pizzas.push(freePizza);
      }
    }

    return pizzas;
  }

  /**
   * Создание обычной пиццы
   */
  private createPizza(index: number): Pizza {
    const size: PizzaSize = 'large'; // По умолчанию большая пицца
    return {
      id: `pizza-${index}`,
      type: 'Маргарита',
      size,
      price: this.getPizzaPrice(size),
      slices: this.getPizzaSlices(size),
      isFree: false
    };
  }

  /**
   * Создание бесплатной пиццы
   */
  private createFreePizza(index: number): Pizza {
    const size: PizzaSize = 'medium'; // Бесплатная пицца обычно меньше
    return {
      id: `free-pizza-${index}`,
      type: 'Маргарита',
      size,
      price: 0, // Бесплатная
      slices: this.getPizzaSlices(size),
      isFree: true
    };
  }

  /**
   * Расчет стоимости для каждого пользователя
   */
  private calculateUserCosts(pizzas: Pizza[]): { [userId: string]: number } {
    const userCosts: { [userId: string]: number } = {};
    const totalSlices = pizzas.reduce((sum, pizza) => sum + pizza.slices, 0);
    const totalCost = pizzas.reduce((sum, pizza) => sum + pizza.price, 0);

    // Распределяем стоимость пропорционально количеству кусков
    this.order.users.forEach(user => {
      const userSliceRatio = user.maxSlices / totalSlices;
      userCosts[user.id] = totalCost * userSliceRatio;
    });

    return userCosts;
  }

  /**
   * Распределение кусков между пользователями
   */
  private distributeSlices(pizzas: Pizza[]): { [userId: string]: { slices: PizzaSlice[], cost: number, sauces: Sauce[] } } {
    const distribution: { [userId: string]: { slices: PizzaSlice[], cost: number, sauces: Sauce[] } } = {};

    // Инициализация распределения для каждого пользователя
    this.order.users.forEach(user => {
      distribution[user.id] = {
        slices: [],
        cost: 0,
        sauces: user.personalSauces
      };
    });

    // Распределение кусков
    let sliceIndex = 0;
    pizzas.forEach(pizza => {
      for (let i = 0; i < pizza.slices; i++) {
        const user = this.order.users[sliceIndex % this.order.users.length];
        const pizzaSlice: PizzaSlice = {
          id: `slice-${sliceIndex}`,
          pizzaId: pizza.id,
          type: pizza.type,
          price: pizza.price / pizza.slices,
          size: pizza.size,
          userAssigned: user.id
        };
        
        distribution[user.id].slices.push(pizzaSlice);
        distribution[user.id].cost += pizzaSlice.price;
        sliceIndex++;
      }
    });

    return distribution;
  }

  /**
   * Расчет общей стоимости
   */
  private calculateTotalCost(pizzas: Pizza[]): number {
    return pizzas.reduce((sum, pizza) => sum + pizza.price, 0);
  }

  /**
   * Расчет стоимости бесплатных пицц для пропорционального распределения
   */
  private calculateFreePizzaValue(pizzas: Pizza[]): number {
    const freePizzas = pizzas.filter(pizza => pizza.isFree);
    return freePizzas.reduce((sum, pizza) => {
      return sum + this.getPizzaPrice(pizza.size);
    }, 0);
  }

  // Вспомогательные методы
  private getPizzaPrice(size: PizzaSize): number {
    const prices = {
      small: 500,
      medium: 700,
      large: 900,
      xlarge: 1200
    };
    return prices[size];
  }

  private getPizzaSlices(size: PizzaSize): number {
    const slices = {
      small: 4,
      medium: 6,
      large: 8,
      xlarge: 10
    };
    return slices[size];
  }

  private getFreePizzaThreshold(): number {
    return 3; // Каждая 3-я пицца бесплатная
  }
}

export class UserManager {
  private users: User[] = [];

  addUser(name: string, minSlices: number, maxSlices: number, preferredTypes?: string[]): User {
    const user: User = {
      id: `user-${Date.now()}`,
      name,
      minSlices,
      maxSlices,
      preferredTypes,
      personalSauces: [],
      totalCost: 0,
      assignedSlices: []
    };
    
    this.users.push(user);
    return user;
  }

  removeUser(userId: string): boolean {
    const index = this.users.findIndex(user => user.id === userId);
    if (index !== -1) {
      this.users.splice(index, 1);
      return true;
    }
    return false;
  }

  updateUser(userId: string, updates: Partial<User>): boolean {
    const user = this.users.find(user => user.id === userId);
    if (user) {
      Object.assign(user, updates);
      return true;
    }
    return false;
  }

  getUsers(): User[] {
    return [...this.users];
  }

  getUser(userId: string): User | undefined {
    return this.users.find(user => user.id === userId);
  }
}

export class SauceManager {
  private sauces: Sauce[] = [];

  addSauce(type: string, price: number, size: SauceSize, isPersonal: boolean = false, userId?: string): Sauce {
    const sauce: Sauce = {
      id: `sauce-${Date.now()}`,
      type,
      price,
      size,
      isPersonal,
      userId
    };
    
    this.sauces.push(sauce);
    return sauce;
  }

  removeSauce(sauceId: string): boolean {
    const index = this.sauces.findIndex(sauce => sauce.id === sauceId);
    if (index !== -1) {
      this.sauces.splice(index, 1);
      return true;
    }
    return false;
  }

  getSauces(): Sauce[] {
    return [...this.sauces];
  }

  getPersonalSauces(userId: string): Sauce[] {
    return this.sauces.filter(sauce => sauce.isPersonal && sauce.userId === userId);
  }

  getSharedSauces(): Sauce[] {
    return this.sauces.filter(sauce => !sauce.isPersonal);
  }
}





