'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { useLocalStorage } from '../hooks/useLocalStorage'

interface HabitData {
  [habitIndex: number]: {
    [date: string]: boolean
  }
}

interface Habit {
  id: string
  name: string
  color: string
  category: string
  streak: number
  bestStreak: number
  createdAt: string
}

type Theme = 'light' | 'dark'
type ViewMode = 'month' | 'week'
type ChartType = 'line' | 'bar' | 'pie'

export default function HabitTracker() {
  const [habits, setHabits] = useLocalStorage<Habit[]>('focuslab-habits', [])
  const [habitData, setHabitData] = useLocalStorage<HabitData>('focuslab-data', {})
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>('focuslab-view', 'month')
  const [currentWeek, setCurrentWeek] = useState(0)
  const [theme, setTheme] = useLocalStorage<Theme>('focuslab-theme', 'light')
  const [chartType, setChartType] = useState<ChartType>('line')
  const [showStats, setShowStats] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Health')
  const [showAnalytics, setShowAnalytics] = useState(false)
  
  const categories = ['Health', 'Productivity', 'Learning', 'Social', 'Personal']
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16']

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return Array.from({ length: daysInMonth }, (_, i) => i + 1)
  }

  const getWeeksInMonth = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const weeks = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= lastDay) {
      const week = []
      for (let i = 0; i < 7; i++) {
        if (currentDate.getMonth() === month) {
          week.push(currentDate.getDate())
        } else {
          week.push(null)
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }
      weeks.push(week)
    }
    return weeks
  }

  const getCurrentWeekDays = () => {
    const weeks = getWeeksInMonth()
    return weeks[currentWeek] || []
  }

  const formatDate = (day: number) => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    return new Date(year, month, day).toISOString().split('T')[0]
  }

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const calculateStreak = (habitIndex: number) => {
    const today = new Date()
    let streak = 0
    let date = new Date(today)
    
    while (date >= new Date(habits[habitIndex]?.createdAt || today)) {
      const dateStr = date.toISOString().split('T')[0]
      if (habitData[habitIndex]?.[dateStr]) {
        streak++
      } else if (streak > 0) {
        break
      }
      date.setDate(date.getDate() - 1)
    }
    return streak
  }

  const updateStreaks = () => {
    const updatedHabits = habits.map((habit, index) => {
      const currentStreak = calculateStreak(index)
      return {
        ...habit,
        streak: currentStreak,
        bestStreak: Math.max(habit.bestStreak || 0, currentStreak)
      }
    })
    setHabits(updatedHabits)
  }

  const addHabit = () => {
    if (!newHabitName.trim()) return
    
    const newHabit: Habit = {
      id: generateId(),
      name: newHabitName.trim(),
      color: colors[habits.length % colors.length],
      category: selectedCategory,
      streak: 0,
      bestStreak: 0,
      createdAt: new Date().toISOString()
    }
    
    setHabits([...habits, newHabit])
    setNewHabitName('')
  }

  const deleteHabit = (index: number) => {
    const newHabits = habits.filter((_, i) => i !== index)
    setHabits(newHabits)
    
    const newData = { ...habitData }
    delete newData[index]
    setHabitData(newData)
  }

  const toggleHabit = (habitIndex: number, date: string) => {
    setHabitData(prev => ({
      ...prev,
      [habitIndex]: {
        ...prev[habitIndex],
        [date]: !prev[habitIndex]?.[date]
      }
    }))
    setTimeout(updateStreaks, 100)
  }

  const getProgressData = () => {
    const days = viewMode === 'week' ? getCurrentWeekDays().filter(d => d !== null) : getDaysInMonth()
    return days.map(day => {
      const date = formatDate(day)
      const completedHabits = habits.filter((habit, index) => 
        habit.name && habitData[index]?.[date]
      ).length
      const totalHabits = habits.filter(habit => habit.name).length
      
      return {
        day,
        completion: totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0,
        completed: completedHabits,
        total: totalHabits
      }
    })
  }

  const getAnalyticsData = () => {
    const categoryStats = categories.map(category => {
      const categoryHabits = habits.filter(h => h.category === category)
      const completed = categoryHabits.reduce((sum, habit, index) => {
        const today = new Date().toISOString().split('T')[0]
        return sum + (habitData[habits.indexOf(habit)]?.[today] ? 1 : 0)
      }, 0)
      
      return {
        name: category,
        value: completed,
        total: categoryHabits.length,
        percentage: categoryHabits.length > 0 ? Math.round((completed / categoryHabits.length) * 100) : 0
      }
    }).filter(stat => stat.total > 0)
    
    return categoryStats
  }

  const getTotalStats = () => {
    const totalHabits = habits.length
    const totalStreaks = habits.reduce((sum, habit) => sum + (habit.streak || 0), 0)
    const avgStreak = totalHabits > 0 ? Math.round(totalStreaks / totalHabits) : 0
    const bestStreak = Math.max(...habits.map(h => h.bestStreak || 0), 0)
    
    const today = new Date().toISOString().split('T')[0]
    const todayCompleted = habits.filter((_, index) => habitData[index]?.[today]).length
    const todayCompletion = totalHabits > 0 ? Math.round((todayCompleted / totalHabits) * 100) : 0
    
    return { totalHabits, avgStreak, bestStreak, todayCompletion, todayCompleted }
  }

  useEffect(() => {
    updateStreaks()
  }, [habitData])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const weekNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weeks = getWeeksInMonth()
  const stats = getTotalStats()
  const analyticsData = getAnalyticsData()
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className={`habit-tracker ${theme}`}>
      <div className="header">
        <div className="header-top">
          <h1>🎯 FocusLab</h1>
          <div className="header-controls">
            <button className="icon-btn" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button className="icon-btn" onClick={() => setShowStats(!showStats)}>📊</button>
            <button className="icon-btn" onClick={() => setShowAnalytics(!showAnalytics)}>📈</button>
          </div>
        </div>
        
        {showStats && (
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-value">{stats.todayCompleted}/{stats.totalHabits}</span>
              <span className="stat-label">Today</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.avgStreak}</span>
              <span className="stat-label">Avg Streak</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.bestStreak}</span>
              <span className="stat-label">Best Streak</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.todayCompletion}%</span>
              <span className="stat-label">Completion</span>
            </div>
          </div>
        )}
        
        <div className="month-nav">
          <button className="nav-btn" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
            ← Prev
          </button>
          <h2>{monthName}</h2>
          <button className="nav-btn" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
            Next →
          </button>
        </div>
        
        <div className="view-controls">
          <button 
            className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            Month
          </button>
          <button 
            className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => setViewMode('week')}
          >
            Week
          </button>
          {viewMode === 'week' && (
            <div className="week-nav">
              <button 
                className="nav-btn"
                onClick={() => setCurrentWeek(Math.max(0, currentWeek - 1))}
                disabled={currentWeek === 0}
              >
                ← Prev
              </button>
              <span>Week {currentWeek + 1}</span>
              <button 
                className="nav-btn"
                onClick={() => setCurrentWeek(Math.min(weeks.length - 1, currentWeek + 1))}
                disabled={currentWeek === weeks.length - 1}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid-container">
        <div className="habits-column">
          <div className="habits-header">
            <h3>Habits ({habits.length})</h3>
          </div>
          
          <div className="add-habit-form">
            <input
              type="text"
              className="habit-input"
              placeholder="Enter new habit..."
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addHabit()}
            />
            <select 
              className="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button className="add-habit-btn" onClick={addHabit}>
              + Add
            </button>
          </div>
          
          <div className="habits-list">
            {habits.map((habit, index) => (
              <div key={habit.id} className="habit-item-card">
                <div className="habit-info">
                  <div className="habit-name" style={{ color: habit.color }}>
                    {habit.name}
                  </div>
                  <div className="habit-meta">
                    <span className="habit-category">{habit.category}</span>
                    <span className="habit-streak">🔥 {habit.streak}</span>
                  </div>
                </div>
                <button 
                  className="delete-btn"
                  onClick={() => deleteHabit(index)}
                  title="Delete habit"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          {viewMode === 'month' ? (
            <div className="calendar-grid" style={{ 
              gridTemplateColumns: `repeat(${getDaysInMonth().length}, 1fr)` 
            }}>
              {getDaysInMonth().map(day => (
                <div key={day} className="date-header">
                  {day}
                </div>
              ))}
              
              {habits.map((habit, habitIndex) => 
                habit.name ? getDaysInMonth().map(day => {
                  const date = formatDate(day)
                  const isChecked = habitData[habitIndex]?.[date] || false
                  return (
                    <div key={`${habitIndex}-${day}`} className={`checkbox-cell ${isChecked ? 'completed' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleHabit(habitIndex, date)}
                        style={{ accentColor: habit.color }}
                      />
                    </div>
                  )
                }) : null
              )}
            </div>
          ) : (
            <div className="week-view">
              <div className="week-header">
                {getCurrentWeekDays().map((day, index) => (
                  <div key={index} className="week-day-header">
                    <div>{weekNames[index]}</div>
                    <div>{day || ''}</div>
                  </div>
                ))}
              </div>
              
              {habits.map((habit, habitIndex) => 
                habit.name ? (
                  <div key={habitIndex} className="week-habit-row">
                    <div className="week-habit-name" style={{ borderLeft: `4px solid ${habit.color}` }}>
                      <div>{habit.name}</div>
                      <div className="habit-streak-mini">🔥 {habit.streak}</div>
                    </div>
                    <div className="week-checkboxes">
                      {getCurrentWeekDays().map((day, dayIndex) => {
                        if (day === null) return <div key={dayIndex} className="empty-cell"></div>
                        const date = formatDate(day)
                        const isChecked = habitData[habitIndex]?.[date] || false
                        return (
                          <div key={dayIndex} className={`week-checkbox-cell ${isChecked ? 'completed' : ''}`}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleHabit(habitIndex, date)}
                              style={{ accentColor: habit.color }}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>
      </div>

      {showAnalytics && (
        <div className="analytics-section">
          <div className="analytics-header">
            <h3>Analytics Dashboard</h3>
            <div className="chart-controls">
              <button 
                className={`chart-btn ${chartType === 'line' ? 'active' : ''}`}
                onClick={() => setChartType('line')}
              >
                Line
              </button>
              <button 
                className={`chart-btn ${chartType === 'bar' ? 'active' : ''}`}
                onClick={() => setChartType('bar')}
              >
                Bar
              </button>
              <button 
                className={`chart-btn ${chartType === 'pie' ? 'active' : ''}`}
                onClick={() => setChartType('pie')}
              >
                Pie
              </button>
            </div>
          </div>
          
          <div className="charts-grid">
            <div className="chart-container">
              <h4>Daily Progress</h4>
              <ResponsiveContainer width="100%" height={200}>
                {chartType === 'line' ? (
                  <LineChart data={getProgressData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Completion']} />
                    <Line 
                      type="monotone" 
                      dataKey="completion" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={getProgressData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Completion']} />
                    <Bar dataKey="completion" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
            
            {analyticsData.length > 0 && (
              <div className="chart-container">
                <h4>Category Performance</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={analyticsData}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {analyticsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="progress-section">
        <h3 className="progress-title">{viewMode === 'week' ? 'Weekly' : 'Monthly'} Progress</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={getProgressData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(value, name, props) => [
              `${value}% (${props.payload.completed}/${props.payload.total})`, 
              'Completion'
            ]} />
            <Line 
              type="monotone" 
              dataKey="completion" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}