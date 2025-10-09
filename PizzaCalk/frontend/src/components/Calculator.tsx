import { useState } from 'react'
import { User } from '../types'
import { Plus, Users, Trash2, Calculator, Minus, Settings } from 'lucide-react'
import SettingsModal, { PizzaSettings } from './SettingsModal'

interface CalculatorProps {
  users: User[]
  setUsers: (users: User[]) => void
  onShowResults: () => void
}

const CalculatorComponent = ({ users, setUsers, onShowResults }: CalculatorProps) => {
  const [formData, setFormData] = useState({
    name: '',
    slices: 3,
    canBeMore: false
  })
  const [savedUsers, setSavedUsers] = useState<string[]>(() => {
    const saved = localStorage.getItem('savedUsers')
    return saved ? JSON.parse(saved) : []
  })
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<'current' | 'reduced' | 'small'>('current')
  
  // Настройки пиццы (из localStorage или значения по умолчанию)
  const [pizzaSettings, setPizzaSettings] = useState<PizzaSettings>(() => {
    const saved = localStorage.getItem('pizzaSettings')
    return saved ? JSON.parse(saved) : {
      smallPizzaSlices: 6,
      largePizzaSlices: 8,
      largePizzaPrice: 800,
      smallPizzaPricePercent: 65,
      freePizzaThreshold: 3,
      useFreePizza: true
    }
  })

  const handleAddUser = () => {
    if (formData.slices < 1) {
      alert('Количество кусков должно быть не менее 1')
      return
    }

    if (formData.slices > 20) {
      alert('Количество кусков не может быть больше 20')
      return
    }

    // Автоматическое имя, если не указано
    const userName = formData.name.trim() || `User ${users.length + 1}`

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: userName,
      minSlices: formData.slices,
      canBeMore: formData.canBeMore,
      personalSauces: [],
      totalCost: 0,
      assignedSlices: []
    }

    setUsers([...users, newUser])
    
    // Сохраняем имя пользователя, если оно введено вручную
    if (formData.name.trim() && !savedUsers.includes(userName)) {
      const updatedSavedUsers = [...savedUsers, userName]
      setSavedUsers(updatedSavedUsers)
      localStorage.setItem('savedUsers', JSON.stringify(updatedSavedUsers))
    }
    
    setFormData({ name: '', slices: 3, canBeMore: false })
    setShowSuggestions(false)
  }

  const handleRemoveUser = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId))
  }

  const handleUpdateUserSlices = (userId: string, delta: number) => {
    setUsers(users.map(user => {
      if (user.id === userId) {
        const newValue = Math.max(1, Math.min(20, user.minSlices + delta))
        return { 
          ...user, 
          minSlices: newValue
        }
      }
      return user
    }))
  }

  const handleToggleCanBeMore = (userId: string) => {
    setUsers(users.map(user => {
      if (user.id === userId) {
        return {
          ...user,
          canBeMore: !user.canBeMore
        }
      }
      return user
    }))
  }

  // Получение актуальной цены маленькой пиццы с учетом процента
  const getActualSmallPizzaPrice = (): number => {
    return Math.round(pizzaSettings.largePizzaPrice * pizzaSettings.smallPizzaPricePercent / 100)
  }
  
  // Эта функция будет использоваться при добавлении маленьких пицц в будущем

  // Создание списка пицц
  const createPizzaList = (count: number, useSmall: boolean = false) => {
    const pizzas = []
    const slices = useSmall ? pizzaSettings.smallPizzaSlices : pizzaSettings.largePizzaSlices
    const price = useSmall ? getActualSmallPizzaPrice() : pizzaSettings.largePizzaPrice
    
    for (let i = 0; i < count; i++) {
      const isFree = pizzaSettings.useFreePizza && (i + 1) % pizzaSettings.freePizzaThreshold === 0
      pizzas.push({
        id: `pizza-${i}`,
        slices: slices,
        price: price,
        isFree: isFree,
        size: useSmall ? 'small' : 'large'
      })
    }
    return pizzas
  }
  
  // Функция расчета для выбранного варианта на основе списка пицц
  const calculateDistribution = (pizzaList: any[]) => {
    // Суммируем куски всех пицц в списке (каждая может иметь разное количество)
    const totalPizzaSlices = pizzaList.reduce((sum, pizza) => sum + pizza.slices, 0)
    let pieces = totalPizzaSlices - totalMinSlices  // Лишние куски
    const distribution: { [key: string]: number } = {}
    
    // Инициализация - каждый получает минимум
    users.forEach(user => {
      distribution[user.id] = user.minSlices
    })
    
    // Распределяем лишние куски по схеме
    // Распределяем оставшиеся кусочки по кругу
    while (pieces > 0) {
      let distributed = false
      
      for (const user of users) {
        if (pieces <= 0) break // Проверка на 0 или отрицательное значение
        
        if (user.canBeMore) {
          // Добавляем по 1 кусочку
          distribution[user.id]++
          pieces--
          distributed = true
        }
      }
      
      // Если никому не удалось распределить, выходим из цикла
      if (!distributed) break
    }
    
    return {
      distribution,
      extraSlices: pieces,
      totalSlices: Object.values(distribution).reduce((sum, val) => sum + val, 0),
      pizzaList
    }
  }
  
  // Расчет на лету
  // Шаг 1: Получаем общее количество желаемых кусков
  const totalMinSlices = users.reduce((sum, user) => sum + user.minSlices, 0)
  
  // Шаг 2: Находим ближайшее оптимальное количество пицц (большие)
  const largePizzaCount = Math.ceil(totalMinSlices / pizzaSettings.largePizzaSlices)
  const largePizzaList = createPizzaList(largePizzaCount, false)
  
  // Шаг 3: Если маленькие пиццы отличаются, делаем дополнительный расчет
  const smallPizzaCount = Math.ceil(totalMinSlices / pizzaSettings.smallPizzaSlices)
  const smallPizzaList = createPizzaList(smallPizzaCount, true)
  
  // Определяем, показывать ли вариант с маленькими пиццами
  const showSmallPizzaOption = pizzaSettings.smallPizzaSlices !== pizzaSettings.largePizzaSlices
  
  // Основной расчет (большие пиццы или выбранный вариант)
  let pizzaList = largePizzaList
  let pizzaCount = largePizzaCount
  let freePizzaCount = largePizzaList.filter(p => p.isFree).length
  
  if (selectedVariant === 'small') {
    pizzaList = smallPizzaList
    pizzaCount = smallPizzaCount
    freePizzaCount = smallPizzaList.filter(p => p.isFree).length
  }
  
  // Шаг 4: Теперь распределяем куски на человека на основе pizzaList
  const currentCalc = calculateDistribution(pizzaList)
  const actualSlices = currentCalc.distribution
  const extraSlices = currentCalc.extraSlices
  
  // Расчеты для маленьких пицц
  const smallCalc = showSmallPizzaOption ? calculateDistribution(smallPizzaList) : null
  
  // Альтернативный расчет (если убрать лишние куски) - только для больших
  const altPizzaCount = largePizzaCount - 1
  const altPizzaList = createPizzaList(altPizzaCount, false)
  const altFreePizzaCount = altPizzaList.filter(p => p.isFree).length
  const altCalc = calculateDistribution(altPizzaList)
  const altMissingSlices = altCalc.extraSlices < 0 ? Math.abs(altCalc.extraSlices) : 0
  
  // Если выбран альтернативный вариант, используем его
  if (selectedVariant === 'reduced') {
    Object.assign(actualSlices, altCalc.distribution)
  }
  
  const totalSlices = currentCalc.totalSlices

  const filteredSuggestions = savedUsers.filter(name => 
    name.toLowerCase().includes(formData.name.toLowerCase())
  )

  return (
    <div className="space-y-6 pb-20">
      {/* Заголовок */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Калькулятор пиццы
        </h1>
        <p className="text-gray-600">
          Добавьте участников и рассчитайте заказ
        </p>
      </div>

      {/* Список участников */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-gray-700">
          <Users className="h-5 w-5" />
          <span className="font-medium">Участники ({users.length})</span>
        </div>
        
        {users.length > 0 && (
          <div className="space-y-3">
          
          {users.map((user, index) => {
            const userRequiredSlices = user.minSlices  // Количество требуемых кусков
            const userActualSlices = actualSlices[user.id] || user.minSlices  // Фактическое после распределения
            const gotExtra = userActualSlices > userRequiredSlices
            
            return (
              <div key={user.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Номер */}
                    <div className="w-8 h-8 bg-pizza-100 text-pizza-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    
                    {/* Имя */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{user.name}</p>
                    </div>
                    
                    {/* Кнопки +/- */}
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleUpdateUserSlices(user.id, -1)}
                        disabled={user.minSlices <= 1}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                          user.minSlices <= 1 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                      >
                        <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                      <span className="w-6 sm:w-8 text-center font-medium text-sm text-gray-900">
                        {userRequiredSlices}
                      </span>
                      <button
                        onClick={() => handleUpdateUserSlices(user.id, 1)}
                        disabled={user.minSlices >= 20}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                          user.minSlices >= 20 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                    
                    {/* Чекбокс "Можно больше" */}
                    <label className="flex items-center cursor-pointer flex-shrink-0" title="Можно больше">
                      <input
                        type="checkbox"
                        checked={user.canBeMore}
                        onChange={() => handleToggleCanBeMore(user.id)}
                        className="rounded border-gray-300 text-pizza-600 focus:ring-pizza-500 w-4 h-4 sm:w-5 sm:h-5"
                      />
                    </label>
                    
                    {/* Кнопка удалить */}
                    <button
                      onClick={() => handleRemoveUser(user.id)}
                      className="text-red-600 hover:text-red-800 p-1 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {/* Визуализация кусков пиццы */}
                <div className="px-3 pb-3">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {/* Основные куски (цветные) */}
                      {Array.from({ length: userRequiredSlices }).map((_, i) => (
                        <span key={`main-${i}`} className="text-xl" title="Основной кусок">🍕</span>
                      ))}
                      {/* Дополнительные куски (черно-белые) */}
                      {gotExtra && Array.from({ length: userActualSlices - userRequiredSlices }).map((_, i) => (
                        <span key={`extra-${i}`} className="text-xl grayscale" title="Дополнительный кусок">🍕</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          </div>
        )}

        {/* Поле для добавления участника */}
      <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Номер */}
          <div className="w-8 h-8 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
            {users.length + 1}
          </div>
          
          {/* Имя с автодополнением */}
          <div className="flex-1 min-w-0 relative">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                setShowSuggestions(savedUsers.length > 0 && e.target.value.length > 0)
              }}
              onFocus={() => setShowSuggestions(savedUsers.length > 0 && formData.name.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddUser()}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pizza-500 text-sm"
              placeholder={`User ${users.length + 1}`}
            />
            
            {/* Выпадающий список */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                {filteredSuggestions.map((name, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setFormData({ ...formData, name })
                      setShowSuggestions(false)
                    }}
                    className="px-3 py-2 hover:bg-pizza-50 cursor-pointer text-sm"
                  >
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Кнопки +/- */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={() => setFormData({ ...formData, slices: Math.max(1, formData.slices - 1) })}
              disabled={formData.slices <= 1}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                formData.slices <= 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
            <span className="w-6 sm:w-8 text-center font-medium text-sm text-gray-900">{formData.slices}</span>
            <button
              onClick={() => setFormData({ ...formData, slices: Math.min(20, formData.slices + 1) })}
              disabled={formData.slices >= 20}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                formData.slices >= 20 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </div>
          
          {/* Чекбокс "Можно больше" */}
          <label className="flex items-center cursor-pointer flex-shrink-0">
            <input
              type="checkbox"
              checked={formData.canBeMore}
              onChange={(e) => setFormData({ ...formData, canBeMore: e.target.checked })}
              className="rounded border-gray-300 text-pizza-600 focus:ring-pizza-500 w-4 h-4 sm:w-5 sm:h-5"
            />
          </label>
          
          {/* Кнопка добавить */}
          <button
            onClick={handleAddUser}
            className="bg-pizza-600 text-white p-1.5 sm:p-2 rounded-md hover:bg-pizza-700 flex-shrink-0"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>
      </div>

      {/* Расчет на лету */}
      {users.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>Расчет на лету</span>
          </h3>
          
          {showSmallPizzaOption || (extraSlices > 0 && extraSlices <= 4) ? (
            // Варианты расчета (кликабельные)
            <div className={`grid gap-3 ${showSmallPizzaOption ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {/* Вариант 1: Маленькие пиццы (если отличаются) - ВСЕГДА СЛЕВА */}
              {showSmallPizzaOption && smallCalc && (
                <button
                  onClick={() => setSelectedVariant('small')}
                  className={`border-2 rounded-lg p-3 transition-all ${
                    selectedVariant === 'small'
                      ? 'border-pizza-500 bg-pizza-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-xs text-gray-600 mb-2 text-center font-medium">Маленькие</div>
                  <div className="space-y-2">
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">{smallPizzaCount}</div>
                      <div className="text-xs text-gray-600">Пицц</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{smallPizzaList.filter(p => p.isFree).length}</div>
                      <div className="text-xs text-gray-600">Бесплатных</div>
                    </div>
                    {smallCalc.extraSlices > 0 && (
                      <div className="text-center">
                        <div className="text-sm font-bold text-orange-600">{smallCalc.extraSlices}</div>
                        <div className="text-xs text-orange-800">Лишних</div>
                      </div>
                    )}
                  </div>
                </button>
              )}
              
              {/* Вариант 2: Большие пиццы */}
              <button
                onClick={() => setSelectedVariant('current')}
                className={`border-2 rounded-lg p-3 transition-all ${
                  selectedVariant === 'current'
                    ? 'border-pizza-500 bg-pizza-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-xs text-gray-600 mb-2 text-center font-medium">Большие</div>
                <div className="space-y-2">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">{largePizzaCount}</div>
                    <div className="text-xs text-gray-600">Пицц</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{largePizzaList.filter(p => p.isFree).length}</div>
                    <div className="text-xs text-gray-600">Бесплатных</div>
                  </div>
                  {selectedVariant === 'current' && extraSlices > 0 && (
                    <div className="text-center">
                      <div className="text-sm font-bold text-orange-600">{extraSlices}</div>
                      <div className="text-xs text-orange-800">Лишних</div>
                    </div>
                  )}
                </div>
              </button>
              
              {/* Вариант 3: Убрать лишние (только если есть лишние 1-4 куска и результат > 0) */}
              {extraSlices > 0 && extraSlices <= 4 && altPizzaCount > 0 && (
                <button
                  onClick={() => setSelectedVariant('reduced')}
                  className={`border-2 rounded-lg p-3 transition-all ${
                    selectedVariant === 'reduced'
                      ? 'border-pizza-500 bg-pizza-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-xs text-gray-600 mb-2 text-center font-medium">-1 пицца</div>
                  <div className="space-y-2">
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">{altPizzaCount}</div>
                      <div className="text-xs text-gray-600">Пицц</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{altFreePizzaCount}</div>
                      <div className="text-xs text-gray-600">Бесплатных</div>
                    </div>
                    {altMissingSlices > 0 && (
                      <div className="text-center">
                        <div className="text-sm font-bold text-red-600">-{altMissingSlices}</div>
                        <div className="text-xs text-red-800">Не хватит</div>
                      </div>
                    )}
                  </div>
                </button>
              )}
            </div>
          ) : (
            // Обычный расчет
            <div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-pizza-600">{totalSlices}</div>
                  <div className="text-xs text-gray-600">Нужно кусков</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{pizzaCount}</div>
                  <div className="text-xs text-gray-600">Пицц</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{freePizzaCount}</div>
                  <div className="text-xs text-gray-600">Бесплатных</div>
                </div>
              </div>
              
              {extraSlices > 4 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">{extraSlices}</div>
                    <div className="text-sm text-orange-800">Лишних кусков (больше половины пиццы)</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Информация */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">
          Как это работает?
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Каждый участник указывает желаемое количество кусков</li>
          <li>• Система рассчитывает оптимальное количество пицц</li>
          <li>• Учитываются бесплатные пиццы (каждая 3-я)</li>
          <li>• Стоимость распределяется пропорционально</li>
        </ul>
      </div>

      {/* Фиксированная панель снизу */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="mx-auto px-4 py-3" style={{ maxWidth: '800px' }}>
          <div className="flex items-center justify-between gap-3">
            {/* Кнопка показа результатов */}
            {users.length > 0 && (
              <button
                onClick={onShowResults}
                className="flex-1 bg-pizza-600 text-white py-2.5 px-6 rounded-lg font-medium flex items-center justify-center space-x-2"
              >
                <Calculator className="h-5 w-5" />
                <span>Показать результат</span>
              </button>
            )}
            
            {/* Пустое пространство для выравнивания */}
            {users.length === 0 && <div className="flex-1"></div>}
            
            {/* Кнопка настроек справа */}
            <button
              onClick={() => setShowSettings(true)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2.5 rounded-lg flex items-center justify-center flex-shrink-0"
              title="Настройки"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Модальное окно настроек */}
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={pizzaSettings}
        onSave={(newSettings: PizzaSettings) => {
          setPizzaSettings(newSettings)
          localStorage.setItem('pizzaSettings', JSON.stringify(newSettings))
          setShowSettings(false)
        }}
      />
    </div>
  )
}

export default CalculatorComponent

