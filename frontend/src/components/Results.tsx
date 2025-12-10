import { useState, useMemo } from 'react'
import { User } from '../types'
import { ArrowLeft, RotateCcw, Users } from 'lucide-react'

interface ResultsProps {
  result: any
  users: User[]
  onBack: () => void
  onNew: () => void
}

const Results = ({ result, users, onBack, onNew }: ResultsProps) => {
  const [orderAmount, setOrderAmount] = useState<string>('')
  const [splitCommonSlices, setSplitCommonSlices] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Подсчитываем общее количество кусков
  const totalSlices = useMemo(() => {
    return result.optimalPizzas.reduce((sum: number, pizza: any) => sum + pizza.slices, 0)
  }, [result.optimalPizzas])

  // Цена одного куска
  const pricePerSlice = useMemo(() => {
    const amount = parseFloat(orderAmount) || 0
    return amount > 0 ? amount / totalSlices : 0
  }, [orderAmount, totalSlices])

  // Распределяем куски между пользователями
  const userSlicesDistribution = useMemo(() => {
    // Используем данные из переданного результата, если они есть
    if (result.userSlicesDistribution) {
      return result.userSlicesDistribution
    }
    // Иначе используем minSlices как запасной вариант
    const distribution: { [key: string]: number } = {}
    users.forEach(user => {
      distribution[user.id] = user.minSlices
    })
    return distribution
  }, [users, result.userSlicesDistribution])

  // Подсчитываем общие куски (лишние)
  const totalUserSlices = useMemo(() => {
    return Object.values(userSlicesDistribution).reduce((sum, val) => sum + val, 0)
  }, [userSlicesDistribution])

  const commonSlices = totalSlices - totalUserSlices

  // Стоимость общих кусков
  const commonSlicesCost = commonSlices * pricePerSlice

  // Стоимость для каждого пользователя
  const getUserCost = (userId: string) => {
    const userSlices = userSlicesDistribution[userId] || 0
    let cost = userSlices * pricePerSlice
    
    if (splitCommonSlices && users.length > 0) {
      cost += commonSlicesCost / users.length
    }
    
    return cost
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Calculation result
        </h1>
      </div>

      {/* Основная статистика */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-pizza-600 mb-1">
            {result.pizzaCount}
          </div>
          <div className="text-sm text-gray-600">Pizzas</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {result.freePizzaCount}
          </div>
          <div className="text-sm text-gray-600">Free</div>
        </div>
      </div>

      {/* Поле ввода суммы заказа */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Order amount
        </label>
        <input
          type="number"
          value={orderAmount}
          onChange={(e) => setOrderAmount(e.target.value)}
          placeholder="Enter order amount"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pizza-500 focus:border-pizza-500 text-lg"
        />
        
        {pricePerSlice > 0 && (
          <div className="mt-4 text-center">
            <div className="text-gray-600 text-sm mb-1">Price per slice</div>
            <div className="text-2xl font-bold text-pizza-600">
              {formatCurrency(pricePerSlice)}
            </div>
          </div>
        )}
      </div>

      {/* Участники */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <h3 className="font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Participants ({users.length})</span>
        </h3>
        
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="font-medium text-gray-900">{user.name}</div>
                {/* Визуализация кусков пиццы */}
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: userSlicesDistribution[user.id] || 0 }).map((_, i) => (
                    <span key={i} className="text-lg" title="Pizza slice">🍕</span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg text-pizza-600">
                  {pricePerSlice > 0 ? formatCurrency(getUserCost(user.id)) : '—'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Общие куски */}
      {commonSlices > 0 && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="font-medium text-green-900">Shared slices</span>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: commonSlices }).map((_, i) => (
                  <span key={i} className="text-lg" title="Shared slice">🍕</span>
                ))}
              </div>
            </div>
            <div className="font-bold text-lg text-green-700">
              {pricePerSlice > 0 ? formatCurrency(commonSlicesCost) : '—'}
            </div>
          </div>
          
          <button
            onClick={() => setSplitCommonSlices(!splitCommonSlices)}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              splitCommonSlices
                ? 'bg-green-600 text-white'
                : 'bg-white text-green-700 border-2 border-green-300 hover:bg-green-100'
            }`}
          >
            {splitCommonSlices ? '✓ Split among all' : 'Split among all'}
          </button>
        </div>
      )}

      {/* Кнопки действий */}
      <div className="space-y-3">
        <button
          onClick={onNew}
          className="w-full bg-pizza-600 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center space-x-2"
        >
          <RotateCcw className="h-5 w-5" />
          <span>New calculation</span>
        </button>
        
        <button
          onClick={onBack}
          className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium flex items-center justify-center space-x-2"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to editing</span>
        </button>
      </div>
    </div>
  )
}

export default Results


