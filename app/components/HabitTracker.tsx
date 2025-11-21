'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
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
  emoji: string
  streak: number
  bestStreak: number
  createdAt: string
}

export default function HabitTracker() {
  const [habits, setHabits] = useLocalStorage<Habit[]>('focuslab-habits', [])
  const [habitData, setHabitData] = useLocalStorage<HabitData>('focuslab-data', {})
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useLocalStorage<'today' | 'week' | 'month'>('focuslab-view', 'today')
  const [showAddHabit, setShowAddHabit] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('🎯')
  const [showStats, setShowStats] = useState(false)
  
  const emojis = ['🎯', '💪', '📚', '🏃', '💧', '🧘', '🎨', '💼', '🌱', '⚡', '🔥', '✨']
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const formatDate = (date: Date) => date.toISOString().split('T')[0]

  const getTodayStats = () => {
    const today = formatDate(new Date())
    const completed = habits.filter((_, index) => habitData[index]?.[today]).length
    const total = habits.length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
    return { completed, total, percentage }
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

  const getMonthDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1))
  }

  const calculateStreak = (habitIndex: number) => {
    let streak = 0
    let date = new Date()
    
    while (true) {
      const dateStr = formatDate(date)
      if (habitData[habitIndex]?.[dateStr]) {
        streak++
        date.setDate(date.getDate() - 1)
      } else {
        break
      }
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

  const deleteHabit = (index: number) => {
    setHabits(habits.filter((_, i) => i !== index))
    const newData = { ...habitData }
    delete newData[index]
    setHabitData(newData)
  }

  const toggleHabit = (habitIndex: number, date: Date) => {
    const dateStr = formatDate(date)
    setHabitData(prev => ({
      ...prev,
      [habitIndex]: {
        ...prev[habitIndex],
        [dateStr]: !prev[habitIndex]?.[dateStr]
      }
    }))
    
    // Update streaks
    setTimeout(() => {
      const updatedHabits = habits.map((habit, index) => {
        const currentStreak = calculateStreak(index)
        return {
          ...habit,
          streak: currentStreak,
          bestStreak: Math.max(habit.bestStreak || 0, currentStreak)
        }
      })
      setHabits(updatedHabits)
    }, 100)
  }

  const getProgressData = () => {
    const days = viewMode === 'week' ? getWeekDays() : getMonthDays()
    return days.slice(-7).map(date => {
      const dateStr = formatDate(date)
      const completed = habits.filter((_, index) => habitData[index]?.[dateStr]).length
      const total = habits.length
      return {
        day: date.getDate(),
        completion: total > 0 ? Math.round((completed / total) * 100) : 0
      }
    })
  }

  const todayStats = getTodayStats()
  const weekDays = getWeekDays()
  const monthDays = getMonthDays()

  return (
    <div className="habit-app">
      {/* Header */}
      <div className="app-header">
        <div className="header-content">
          <h1>🎯 FocusLab</h1>
          <button 
            className="stats-btn"
            onClick={() => setShowStats(!showStats)}
          >
            📊
          </button>
        </div>
        
        {showStats && (
          <div className="stats-card">
            <div className="stat-item">
              <span className="stat-number">{todayStats.completed}/{todayStats.total}</span>
              <span className="stat-label">Today</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{todayStats.percentage}%</span>
              <span className="stat-label">Complete</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{habits.reduce((sum, h) => sum + h.streak, 0)}</span>
              <span className="stat-label">Total Streaks</span>
            </div>
          </div>
        )}
      </div>

      {/* View Toggle */}
      <div className="view-toggle">
        <button 
          className={`toggle-btn ${viewMode === 'today' ? 'active' : ''}`}
          onClick={() => setViewMode('today')}
        >
          Today
        </button>
        <button 
          className={`toggle-btn ${viewMode === 'week' ? 'active' : ''}`}
          onClick={() => setViewMode('week')}
        >
          Week
        </button>
        <button 
          className={`toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
          onClick={() => setViewMode('month')}
        >
          Month
        </button>
      </div>

      {/* Today View */}
      {viewMode === 'today' && (
        <div className="today-view">
          <div className="date-header">
            <h2>{new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}</h2>
          </div>
          
          <div className="habits-grid">
            {habits.map((habit, index) => {
              const today = formatDate(new Date())
              const isCompleted = habitData[index]?.[today] || false
              
              return (
                <div 
                  key={habit.id} 
                  className={`habit-card ${isCompleted ? 'completed' : ''}`}
                  onClick={() => toggleHabit(index, new Date())}
                >
                  <div className="habit-icon" style={{ backgroundColor: habit.color }}>
                    {habit.emoji}
                  </div>
                  <div className="habit-info">
                    <h3>{habit.name}</h3>
                    <span className="habit-streak">🔥 {habit.streak} days</span>
                  </div>
                  <div className="habit-check">
                    {isCompleted ? '✅' : '⭕'}
                  </div>
                  <button 
                    className="delete-habit"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteHabit(index)
                    }}
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="week-view">
          <div className="week-header">
            <button onClick={() => setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000))}>
              ←
            </button>
            <h2>Week of {weekDays[0].toLocaleDateString()}</h2>
            <button onClick={() => setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000))}>
              →
            </button>
          </div>
          
          <div className="week-grid">
            <div className="week-days">
              {weekDays.map(date => (
                <div key={date.toISOString()} className="day-header">
                  <div className="day-name">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div className="day-number">{date.getDate()}</div>
                </div>
              ))}
            </div>
            
            {habits.map((habit, habitIndex) => (
              <div key={habit.id} className="habit-week-row">
                <div className="habit-label">
                  <span className="habit-emoji">{habit.emoji}</span>
                  <span className="habit-name">{habit.name}</span>
                </div>
                <div className="habit-checks">
                  {weekDays.map(date => {
                    const dateStr = formatDate(date)
                    const isCompleted = habitData[habitIndex]?.[dateStr] || false
                    
                    return (
                      <button
                        key={date.toISOString()}
                        className={`check-btn ${isCompleted ? 'completed' : ''}`}
                        onClick={() => toggleHabit(habitIndex, date)}
                        style={{ borderColor: habit.color }}
                      >
                        {isCompleted ? '✓' : ''}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="month-view">
          <div className="month-header">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>
              ←
            </button>
            <h2>{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>
              →
            </button>
          </div>
          
          <div className="progress-chart">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={getProgressData()}>
                <XAxis dataKey="day" />
                <YAxis domain={[0, 100]} />
                <Line 
                  type="monotone" 
                  dataKey="completion" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Add Habit Button */}
      <button 
        className="add-habit-fab"
        onClick={() => setShowAddHabit(true)}
      >
        +
      </button>

      {/* Add Habit Modal */}
      {showAddHabit && (
        <div className="modal-overlay" onClick={() => setShowAddHabit(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Add New Habit</h3>
            
            <div className="emoji-picker">
              {emojis.map(emoji => (
                <button
                  key={emoji}
                  className={`emoji-btn ${selectedEmoji === emoji ? 'selected' : ''}`}
                  onClick={() => setSelectedEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
            
            <input
              type="text"
              placeholder="Habit name..."
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              className="habit-name-input"
              autoFocus
            />
            
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowAddHabit(false)}>
                Cancel
              </button>
              <button className="add-btn" onClick={addHabit}>
                Add Habit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}