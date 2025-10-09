import { Sauce, User, Order, CalculationResult, SauceSize } from './types';
export declare class PizzaCalculator {
    private order;
    constructor(order: Order);
    calculateOptimalOrder(): CalculationResult;
    private calculateTotalSlicesNeeded;
    private calculateOptimalPizzas;
    private createPizza;
    private createFreePizza;
    private calculateUserCosts;
    private distributeSlices;
    private calculateTotalCost;
    private calculateFreePizzaValue;
    private getPizzaPrice;
    private getPizzaSlices;
    private getFreePizzaThreshold;
}
export declare class UserManager {
    private users;
    addUser(name: string, minSlices: number, maxSlices: number, preferredTypes?: string[]): User;
    removeUser(userId: string): boolean;
    updateUser(userId: string, updates: Partial<User>): boolean;
    getUsers(): User[];
    getUser(userId: string): User | undefined;
}
export declare class SauceManager {
    private sauces;
    addSauce(type: string, price: number, size: SauceSize, isPersonal?: boolean, userId?: string): Sauce;
    removeSauce(sauceId: string): boolean;
    getSauces(): Sauce[];
    getPersonalSauces(userId: string): Sauce[];
    getSharedSauces(): Sauce[];
}
//# sourceMappingURL=classes.d.ts.map