'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useLocalStorage } from '../hooks/useLocalStorage'
import PWAInstaller from './PWAInstaller'

interface HabitData {
  [habitIndex: number]: {
    [date: string]: boolean
  }
}

interface Habit {
  id: string
  name: string
  color: string
  emoji: string
  streak: number
  bestStreak: number
  createdAt: string
}

interface Todo {
  id: string
  text: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  dueDate?: string
}

export default function HabitTracker() {
  const [habits, setHabits] = useLocalStorage<Habit[]>('focuslab-habits', [])
  const [habitData, setHabitData] = useLocalStorage<HabitData>('focuslab-data', {})
  const [todos, setTodos] = useLocalStorage<Todo[]>('focuslab-todos', [])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useLocalStorage<'today' | 'week' | 'stats' | 'todos'>('focuslab-view', 'today')
  const [showAddHabit, setShowAddHabit] = useState(false)
  const [showAddTodo, setShowAddTodo] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  const [newTodoText, setNewTodoText] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('🎯')
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [notificationTime, setNotificationTime] = useLocalStorage('focuslab-notification-time', '01:00')
  const [notificationsEnabled, setNotificationsEnabled] = useLocalStorage('focuslab-notifications', false)
  
  const emojis = ['🎯', '💪', '📚', '🏃', '💧', '🧘', '🎨', '💼', '🌱', '⚡', '🔥', '✨']
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  const generateId = () => Math.random().toString(36).substr(2, 9)
  const formatDate = (date: Date) => date.toISOString().split('T')[0]

  const getTodayStats = () => {
    const today = formatDate(new Date())
    const completedHabits = habits.filter((_, index) => habitData[index]?.[today]).length
    const totalHabits = habits.length
    const completedTodos = todos.filter(todo => todo.completed).length
    const totalTodos = todos.length
    
    const habitPercentage = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0
    const todoPercentage = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0
    const overallPercentage = Math.round(((completedHabits + completedTodos) / (totalHabits + totalTodos)) * 100) || 0
    
    return { 
      habits: { completed: completedHabits, total: totalHabits, percentage: habitPercentage },
      todos: { completed: completedTodos, total: totalTodos, percentage: todoPercentage },
      overall: { percentage: overallPercentage, completed: completedHabits + completedTodos, total: totalHabits + totalTodos }
    }
  }

  const getHabitStats = (habitIndex: number, days: number = 30) => {
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - (days - 1) * 24 * 60 * 60 * 1000)
    const habitCreated = new Date(habits[habitIndex]?.createdAt || endDate)
    const actualStartDate = startDate > habitCreated ? startDate : habitCreated
    
    let completed = 0
    let total = 0
    
    for (let d = new Date(actualStartDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = formatDate(d)
      total++
      if (habitData[habitIndex]?.[dateStr]) {
        completed++
      }
    }
    
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
    return { completed, total, percentage, notDone: total - completed }
  }

  const getWeekDays = () => {
    const start = new Date(currentDate)
    start.setDate(start.getDate() - start.getDay())
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      return date
    })
  }

  const getProgressData = () => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date
    })
    
    return days.map(date => {
      const dateStr = formatDate(date)
      const completed = habits.filter((_, index) => habitData[index]?.[dateStr]).length
      const total = habits.length
      return {
        day: date.getDate(),
        completion: total > 0 ? Math.round((completed / total) * 100) : 0,
        completed,
        total
      }
    })
  }

  const calculateStreak = (habitIndex: number) => {
    let streak = 0
    let date = new Date()
    
    while (true) {
      const dateStr = formatDate(date)
      if (habitData[habitIndex]?.[dateStr]) {
        streak++
      } else {
        if (streak === 0 && formatDate(date) === formatDate(new Date())) {
          break
        }
        if (streak > 0) {
          break
        }
      }
      date.setDate(date.getDate() - 1)
      if (streak > 365) break
    }
    return streak
  }

  const addHabit = () => {
    if (!newHabitName.trim()) return
    
    const newHabit: Habit = {
      id: generateId(),
      name: newHabitName.trim(),
      color: colors[habits.length % colors.length],
      emoji: selectedEmoji,
      streak: 0,
      bestStreak: 0,
      createdAt: new Date().toISOString()
    }
    
    setHabits([...habits, newHabit])
    setNewHabitName('')
    setShowAddHabit(false)
  }

  const addTodo = () => {
    if (!newTodoText.trim()) return
    
    const newTodo: Todo = {
      id: generateId(),
      text: newTodoText.trim(),
      completed: false,
      priority: selectedPriority,
      createdAt: new Date().toISOString()
    }
    
    setTodos([...todos, newTodo])
    setNewTodoText('')
    setShowAddTodo(false)
  }

  const toggleTodo = (todoId: string) => {
    setTodos(todos.map(todo => 
      todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const deleteTodo = (todoId: string) => {
    setTodos(todos.filter(todo => todo.id !== todoId))
  }

  const deleteHabit = (index: number) => {
    setHabits(habits.filter((_, i) => i !== index))
    const newData = { ...habitData }
    delete newData[index]
    setHabitData(newData)
  }

  const toggleHabit = (habitIndex: number, date: Date) => {
    const dateStr = formatDate(date)
    const wasCompleted = habitData[habitIndex]?.[dateStr] || false
    
    setHabitData(prev => ({
      ...prev,
      [habitIndex]: {
        ...prev[habitIndex],
        [dateStr]: !wasCompleted
      }
    }))
    
    setTimeout(() => {
      const updatedHabits = habits.map((habit, index) => {
        if (index === habitIndex) {
          const currentStreak = calculateStreak(index)
          return {
            ...habit,
            streak: currentStreak,
            bestStreak: Math.max(habit.bestStreak || 0, currentStreak)
          }
        }
        return habit
      })
      setHabits(updatedHabits)
    }, 50)
  }

  const todayStats = getTodayStats()
  const weekDays = getWeekDays()
  const progressData = getProgressData()

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444'
      case 'medium': return '#f59e0b'
      case 'low': return '#10b981'
      default: return '#6b7280'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴'
      case 'medium': return '🟡'
      case 'low': return '🟢'
      default: return '⚪'
    }
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        setNotificationsEnabled(true)
        scheduleNotification()
      }
    }
  }

  const scheduleNotification = () => {
    if (notificationsEnabled) {
      const [hours, minutes] = notificationTime.split(':').map(Number)
      const now = new Date()
      const scheduledTime = new Date()
      scheduledTime.setHours(hours, minutes, 0, 0)
      
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1)
      }
      
      const timeUntilNotification = scheduledTime.getTime() - now.getTime()
      
      setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification('🎯 FocusLab Reminder', {
            body: 'Time to check your daily habits!'
          })
        }
        scheduleNotification()
      }, timeUntilNotification)
    }
  }

  useEffect(() => {
    if (notificationsEnabled) {
      scheduleNotification()
    }
  }, [notificationTime, notificationsEnabled])

  return (
    <div className="habit-app">
      <PWAInstaller />
      
      {/* Onboarding for new users */}
      {habits.length === 0 && todos.length === 0 && (
        <div className="onboarding-overlay">
          <div className="onboarding-content">
            <div className="onboarding-icon">🎯</div>
            <h2>Welcome to FocusLab!</h2>
            <p>Start building better habits and managing tasks effectively</p>
            <div className="onboarding-steps">
              <div className="step">
                <span className="step-number">1</span>
                <span>Add your first habit</span>
              </div>
              <div className="step">
                <span className="step-number">2</span>
                <span>Track daily progress</span>
              </div>
              <div className="step">
                <span className="step-number">3</span>
                <span>Build lasting streaks</span>
              </div>
            </div>
            <button className="onboarding-cta" onClick={() => setShowAddHabit(true)}>
              Create Your First Habit
            </button>
          </div>
        </div>
      )}
      
      {/* Enhanced Header with Overall Progress */}
      <div className="app-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🎯 FocusLab</h1>
            <p className="header-subtitle">Stay focused, build habits</p>
          </div>
          <div className="overall-progress">
            <div className="progress-ring">
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path
                  className="circle-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="circle"
                  strokeDasharray={`${todayStats.overall.percentage}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <text x="18" y="20.35" className="percentage">{todayStats.overall.percentage}%</text>
              </svg>
            </div>
            <div className="progress-details">
              <div className="progress-main">{todayStats.overall.completed}/{todayStats.overall.total}</div>
              <div className="progress-label">Overall</div>
            </div>
          </div>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card habits">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <div className="stat-number">{todayStats.habits.completed}/{todayStats.habits.total}</div>
              <div className="stat-label">Habits</div>
              <div className="stat-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${todayStats.habits.percentage}%` }}></div>
                </div>
                <span className="progress-percent">{todayStats.habits.percentage}%</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card todos">
            <div className="stat-icon">📝</div>
            <div className="stat-info">
              <div className="stat-number">{todayStats.todos.completed}/{todayStats.todos.total}</div>
              <div className="stat-label">Tasks</div>
              <div className="stat-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${todayStats.todos.percentage}%` }}></div>
                </div>
                <span className="progress-percent">{todayStats.todos.percentage}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {notificationsEnabled === false && (
        <div className="notification-banner">
          <div className="notification-content">
            <span className="notification-icon">🔔</span>
            <div className="notification-text">
              <div className="notification-title">Enable Reminders</div>
              <div className="notification-subtitle">Get daily habit reminders</div>
            </div>
            <button className="notification-btn" onClick={requestNotificationPermission}>
              Enable
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Navigation */}
      <div className="nav-tabs">
        <button 
          className={`nav-tab ${viewMode === 'today' ? 'active' : ''}`}
          onClick={() => setViewMode('today')}
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Today</span>
        </button>
        <button 
          className={`nav-tab ${viewMode === 'todos' ? 'active' : ''}`}
          onClick={() => setViewMode('todos')}
        >
          <span className="nav-icon">📝</span>
          <span className="nav-label">Tasks</span>
        </button>
        <button 
          className={`nav-tab ${viewMode === 'week' ? 'active' : ''}`}
          onClick={() => setViewMode('week')}
        >
          <span className="nav-icon">📅</span>
          <span className="nav-label">Week</span>
        </button>
        <button 
          className={`nav-tab ${viewMode === 'stats' ? 'active' : ''}`}
          onClick={() => setViewMode('stats')}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">Stats</span>
        </button>
      </div>

      {/* Today View */}
      {viewMode === 'today' && (
        <div className="content-view">
          <div className="section-header">
            <h2>Today's Habits</h2>
            <span className="section-count">{habits.length}</span>
          </div>
          
          {habits.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>No habits yet</h3>
              <p>Create your first habit to start building better routines</p>
              <button className="empty-cta" onClick={() => setShowAddHabit(true)}>
                <span className="cta-icon">+</span>
                Add Your First Habit
              </button>
            </div>
          ) : (
            <div className="habits-grid">
              {habits.map((habit, index) => {
                const today = formatDate(new Date())
                const isCompleted = habitData[index]?.[today] || false
                const stats = getHabitStats(index, 7)
                
                return (
                  <div 
                    key={habit.id} 
                    className={`habit-card modern ${isCompleted ? 'completed' : ''}`}
                    onClick={() => {
                      toggleHabit(index, new Date())
                      if (!isCompleted) {
                        const card = document.querySelector(`[data-habit-id="${habit.id}"]`)
                        card?.classList.add('success-pulse')
                        setTimeout(() => card?.classList.remove('success-pulse'), 600)
                      }
                    }}
                    data-habit-id={habit.id}
                  >
                    <div className="card-header">
                      <div className="habit-icon" style={{ backgroundColor: habit.color }}>
                        {habit.emoji}
                      </div>
                      <div className="habit-info">
                        <h3>{habit.name}</h3>
                        <div className="habit-meta">
                          <span className="streak">🔥 {habit.streak} days</span>
                          <span className="completion">{stats.percentage}% this week</span>
                        </div>
                      </div>
                      <div className="completion-check">
                        <div className={`check-circle ${isCompleted ? 'checked' : ''}`}>
                          {isCompleted && <span className="check-mark">✓</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="progress-section">
                      <div className="progress-bar-container">
                        <div className="progress-bar-bg">
                          <div 
                            className="progress-bar-fill animated" 
                            style={{ 
                              width: `${stats.percentage}%`,
                              backgroundColor: habit.color 
                            }}
                          ></div>
                        </div>
                        <span className="progress-text">{stats.completed}/{stats.total}</span>
                      </div>
                    </div>
                    
                    <button 
                      className="delete-btn-separated"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteHabit(index)
                      }}
                    >
                      <span>×</span>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* To-Do List View */}
      {viewMode === 'todos' && (
        <div className="content-view">
          <div className="section-header">
            <h2>Tasks</h2>
            <span className="section-count">{todos.length}</span>
          </div>
          
          {todos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No tasks yet</h3>
              <p>Add tasks to stay organized and productive</p>
              <button className="empty-cta" onClick={() => setShowAddTodo(true)}>
                <span className="cta-icon">+</span>
                Add Your First Task
              </button>
            </div>
          ) : (
            <div className="todos-grid">
              {todos.map((todo) => (
                <div 
                  key={todo.id} 
                  className={`todo-card ${todo.completed ? 'completed' : ''}`}
                  data-todo-id={todo.id}
                >
                  <div className="todo-content" onClick={() => {
                    toggleTodo(todo.id)
                    if (!todo.completed) {
                      const card = document.querySelector(`[data-todo-id="${todo.id}"]`)
                      card?.classList.add('success-pulse')
                      setTimeout(() => card?.classList.remove('success-pulse'), 600)
                    }
                  }}>
                    <div className="todo-check">
                      <div className={`check-circle ${todo.completed ? 'checked' : ''}`}>
                        {todo.completed && <span className="check-mark">✓</span>}
                      </div>
                    </div>
                    <div className="todo-info">
                      <p className="todo-text">{todo.text}</p>
                      <div className="todo-meta">
                        <span className="priority" style={{ color: getPriorityColor(todo.priority) }}>
                          {getPriorityIcon(todo.priority)} {todo.priority}
                        </span>
                        <span className="created-date">
                          {new Date(todo.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    className="delete-btn"
                    onClick={() => deleteTodo(todo.id)}
                  >
                    <span>×</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="content-view">
          <div className="week-navigation">
            <button className="nav-arrow" onClick={() => setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000))}>
              ←
            </button>
            <h2>Week of {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</h2>
            <button className="nav-arrow" onClick={() => setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000))}>
              →
            </button>
          </div>
          
          <div className="week-container">
            <div className="week-header">
              {weekDays.map(date => (
                <div key={date.toISOString()} className="day-column">
                  <div className="day-name">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div className="day-number">{date.getDate()}</div>
                </div>
              ))}
            </div>
            
            {habits.map((habit, habitIndex) => {
              const weekStats = getHabitStats(habitIndex, 7)
              return (
                <div key={habit.id} className="habit-week-row">
                  <div className="habit-info-column">
                    <div className="habit-icon-small" style={{ backgroundColor: habit.color }}>
                      {habit.emoji}
                    </div>
                    <div className="habit-details">
                      <span className="habit-name">{habit.name}</span>
                      <div className="week-progress">
                        <div className="mini-progress-bar">
                          <div 
                            className="mini-progress-fill" 
                            style={{ 
                              width: `${weekStats.percentage}%`,
                              backgroundColor: habit.color 
                            }}
                          ></div>
                        </div>
                        <span className="progress-percentage">{weekStats.percentage}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="week-checks">
                    {weekDays.map(date => {
                      const dateStr = formatDate(date)
                      const isCompleted = habitData[habitIndex]?.[dateStr] || false
                      const isPastDate = date < new Date(new Date().setHours(0, 0, 0, 0))
                      
                      return (
                        <button
                          key={date.toISOString()}
                          className={`day-check ${isCompleted ? 'completed' : ''} ${isPastDate ? 'disabled' : ''}`}
                          onClick={() => !isPastDate && toggleHabit(habitIndex, date)}
                          style={{ borderColor: habit.color }}
                          disabled={isPastDate}
                        >
                          {isCompleted && <span className="check-mark">✓</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Stats View */}
      {viewMode === 'stats' && (
        <div className="content-view">
          <div className="section-header">
            <h2>Statistics</h2>
          </div>
          
          {habits.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3>No data to show</h3>
              <p>Add some habits to see your progress statistics</p>
              <button className="empty-cta" onClick={() => setViewMode('today')}>
                <span className="cta-icon">🎯</span>
                Go to Habits
              </button>
            </div>
          ) : (
            <>
              <div className="chart-card">
                <div className="chart-header">
                  <h3>7-Day Progress Trend</h3>
                  <div className="chart-legend">
                    <div className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: '#6366f1' }}></div>
                      <span>Completion %</span>
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={progressData}>
                    <XAxis 
                      dataKey="day" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                    />
                    <Bar 
                      dataKey="completion" 
                      fill="#6366f1" 
                      radius={[4, 4, 0, 0]}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
                <div className="chart-insights">
                  <div className="insight">
                    <span className="insight-label">Average:</span>
                    <span className="insight-value">
                      {Math.round(progressData.reduce((sum, day) => sum + day.completion, 0) / progressData.length)}%
                    </span>
                  </div>
                  <div className="insight">
                    <span className="insight-label">Best Day:</span>
                    <span className="insight-value">
                      {Math.max(...progressData.map(d => d.completion))}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="habits-stats-grid">
                {habits.map((habit, index) => {
                  const stats = getHabitStats(index, 30)
                  return (
                    <div key={habit.id} className="habit-stat-card">
                      <div className="stat-card-header">
                        <div className="habit-icon-stat" style={{ backgroundColor: habit.color }}>
                          {habit.emoji}
                        </div>
                        <div className="stat-info">
                          <h4>{habit.name}</h4>
                          <div className="stat-metrics">
                            <span className="metric success">✅ {stats.completed}</span>
                            <span className="metric missed">❌ {stats.notDone}</span>
                            <span className="metric percentage">{stats.percentage}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="stat-progress-bar">
                        <div className="stat-bar-bg">
                          <div 
                            className="stat-bar-fill" 
                            style={{ 
                              width: `${stats.percentage}%`,
                              backgroundColor: habit.color 
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="stat-achievements">
                        <div className="achievement">
                          <span className="achievement-icon">🔥</span>
                          <span>Current: {habit.streak} days</span>
                        </div>
                        <div className="achievement">
                          <span className="achievement-icon">🏆</span>
                          <span>Best: {habit.bestStreak} days</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="fab-container">
        {viewMode === 'today' && (
          <button 
            className="fab primary"
            onClick={() => setShowAddHabit(true)}
          >
            <span className="fab-icon">+</span>
            <span className="fab-label">Add Habit</span>
          </button>
        )}
        {viewMode === 'todos' && (
          <button 
            className="fab primary"
            onClick={() => setShowAddTodo(true)}
          >
            <span className="fab-icon">+</span>
            <span className="fab-label">Add Task</span>
          </button>
        )}
      </div>

      {/* Add Habit Modal */}
      {showAddHabit && (
        <div className="modal-overlay" onClick={() => setShowAddHabit(false)}>
          <div className="modal-content modern" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Habit</h3>
              <button className="modal-close" onClick={() => setShowAddHabit(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Choose Icon</label>
                <div className="emoji-grid">
                  {emojis.map(emoji => (
                    <button
                      key={emoji}
                      className={`emoji-option ${selectedEmoji === emoji ? 'selected' : ''}`}
                      onClick={() => setSelectedEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="form-group">
                <label>Habit Name</label>
                <input
                  type="text"
                  placeholder="e.g., Drink 8 glasses of water"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  className="form-input"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setShowAddHabit(false)}>
                Cancel
              </button>
              <button className="btn primary" onClick={addHabit}>
                Create Habit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Todo Modal */}
      {showAddTodo && (
        <div className="modal-overlay" onClick={() => setShowAddTodo(false)}>
          <div className="modal-content modern" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Task</h3>
              <button className="modal-close" onClick={() => setShowAddTodo(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Task Description</label>
                <input
                  type="text"
                  placeholder="e.g., Buy groceries for dinner"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  className="form-input"
                  autoFocus
                />
              </div>
              
              <div className="form-group">
                <label>Priority Level</label>
                <div className="priority-options">
                  {(['low', 'medium', 'high'] as const).map(priority => (
                    <button
                      key={priority}
                      className={`priority-option ${selectedPriority === priority ? 'selected' : ''}`}
                      onClick={() => setSelectedPriority(priority)}
                      style={{ borderColor: getPriorityColor(priority) }}
                    >
                      <span className="priority-icon">{getPriorityIcon(priority)}</span>
                      <span className="priority-label">{priority}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setShowAddTodo(false)}>
                Cancel
              </button>
              <button className="btn primary" onClick={addTodo}>
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}