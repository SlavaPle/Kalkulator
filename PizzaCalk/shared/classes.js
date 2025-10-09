"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SauceManager = exports.UserManager = exports.PizzaCalculator = void 0;
class PizzaCalculator {
    constructor(order) {
        this.order = order;
    }
    calculateOptimalOrder() {
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
    calculateTotalSlicesNeeded() {
        return this.order.users.reduce((total, user) => {
            return total + user.maxSlices;
        }, 0);
    }
    calculateOptimalPizzas(totalSlicesNeeded) {
        const pizzas = [];
        let remainingSlices = totalSlicesNeeded;
        let pizzaCount = 0;
        while (remainingSlices > 0) {
            const pizza = this.createPizza(pizzaCount);
            pizzas.push(pizza);
            remainingSlices -= pizza.slices;
            pizzaCount++;
        }
        const freePizzaCount = Math.floor(pizzaCount / this.getFreePizzaThreshold());
        if (freePizzaCount > 0) {
            for (let i = 0; i < freePizzaCount; i++) {
                const freePizza = this.createFreePizza(pizzaCount + i);
                pizzas.push(freePizza);
            }
        }
        return pizzas;
    }
    createPizza(index) {
        const size = 'large';
        return {
            id: `pizza-${index}`,
            type: 'Маргарита',
            size,
            price: this.getPizzaPrice(size),
            slices: this.getPizzaSlices(size),
            isFree: false
        };
    }
    createFreePizza(index) {
        const size = 'medium';
        return {
            id: `free-pizza-${index}`,
            type: 'Маргарита',
            size,
            price: 0,
            slices: this.getPizzaSlices(size),
            isFree: true
        };
    }
    calculateUserCosts(pizzas) {
        const userCosts = {};
        const totalSlices = pizzas.reduce((sum, pizza) => sum + pizza.slices, 0);
        const totalCost = pizzas.reduce((sum, pizza) => sum + pizza.price, 0);
        this.order.users.forEach(user => {
            const userSliceRatio = user.maxSlices / totalSlices;
            userCosts[user.id] = totalCost * userSliceRatio;
        });
        return userCosts;
    }
    distributeSlices(pizzas) {
        const distribution = {};
        this.order.users.forEach(user => {
            distribution[user.id] = {
                slices: [],
                cost: 0,
                sauces: user.personalSauces
            };
        });
        let sliceIndex = 0;
        pizzas.forEach(pizza => {
            for (let i = 0; i < pizza.slices; i++) {
                const user = this.order.users[sliceIndex % this.order.users.length];
                const pizzaSlice = {
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
    calculateTotalCost(pizzas) {
        return pizzas.reduce((sum, pizza) => sum + pizza.price, 0);
    }
    calculateFreePizzaValue(pizzas) {
        const freePizzas = pizzas.filter(pizza => pizza.isFree);
        return freePizzas.reduce((sum, pizza) => {
            return sum + this.getPizzaPrice(pizza.size);
        }, 0);
    }
    getPizzaPrice(size) {
        const prices = {
            small: 500,
            medium: 700,
            large: 900,
            xlarge: 1200
        };
        return prices[size];
    }
    getPizzaSlices(size) {
        const slices = {
            small: 4,
            medium: 6,
            large: 8,
            xlarge: 10
        };
        return slices[size];
    }
    getFreePizzaThreshold() {
        return 3;
    }
}
exports.PizzaCalculator = PizzaCalculator;
class UserManager {
    constructor() {
        this.users = [];
    }
    addUser(name, minSlices, maxSlices, preferredTypes) {
        const user = {
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
    removeUser(userId) {
        const index = this.users.findIndex(user => user.id === userId);
        if (index !== -1) {
            this.users.splice(index, 1);
            return true;
        }
        return false;
    }
    updateUser(userId, updates) {
        const user = this.users.find(user => user.id === userId);
        if (user) {
            Object.assign(user, updates);
            return true;
        }
        return false;
    }
    getUsers() {
        return [...this.users];
    }
    getUser(userId) {
        return this.users.find(user => user.id === userId);
    }
}
exports.UserManager = UserManager;
class SauceManager {
    constructor() {
        this.sauces = [];
    }
    addSauce(type, price, size, isPersonal = false, userId) {
        const sauce = {
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
    removeSauce(sauceId) {
        const index = this.sauces.findIndex(sauce => sauce.id === sauceId);
        if (index !== -1) {
            this.sauces.splice(index, 1);
            return true;
        }
        return false;
    }
    getSauces() {
        return [...this.sauces];
    }
    getPersonalSauces(userId) {
        return this.sauces.filter(sauce => sauce.isPersonal && sauce.userId === userId);
    }
    getSharedSauces() {
        return this.sauces.filter(sauce => !sauce.isPersonal);
    }
}
exports.SauceManager = SauceManager;
//# sourceMappingURL=classes.js.map