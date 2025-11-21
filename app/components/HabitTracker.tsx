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

export default function HabitTracker() {
  const [habits, setHabits] = useLocalStorage<Habit[]>('focuslab-habits', [])
  const [habitData, setHabitData] = useLocalStorage<HabitData>('focuslab-data', {})
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useLocalStorage<'today' | 'week' | 'stats'>('focuslab-view', 'today')
  const [showAddHabit, setShowAddHabit] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('🎯')
  
  const emojis = ['🎯', '💪', '📚', '🏃', '💧', '🧘', '🎨', '💼', '🌱', '⚡', '🔥', '✨']
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  const generateId = () => Math.random().toString(36).substr(2, 9)
  const formatDate = (date: Date) => date.toISOString().split('T')[0]

  const getTodayStats = () => {
    const today = formatDate(new Date())
    const completed = habits.filter((_, index) => habitData[index]?.[today]).length
    const total = habits.length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
    const notDone = total - completed
    return { completed, total, percentage, notDone }
  }

  const getHabitStats = (habitIndex: number, days: number = 30) => {
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - (days - 1) * 24 * 60 * 60 * 1000)
    
    let completed = 0
    let total = 0
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
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

  const todayStats = getTodayStats()
  const weekDays = getWeekDays()
  const progressData = getProgressData()

  return (
    <div className="habit-app">
      <PWAInstaller />
      {/* Header with Progress */}
      <div className="app-header">
        <div className="header-content">
          <h1>🎯 FocusLab</h1>
          <div className="today-progress">
            <div className="progress-circle">
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path
                  className="circle-bg"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="circle"
                  strokeDasharray={`${todayStats.percentage}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <text x="18" y="20.35" className="percentage">{todayStats.percentage}%</text>
              </svg>
            </div>
            <div className="progress-text">
              <div className="progress-main">{todayStats.completed}/{todayStats.total}</div>
              <div className="progress-label">Today</div>
            </div>
          </div>
        </div>
        
        <div className="stats-overview">
          <div className="stat-pill completed">
            <span className="stat-icon">✅</span>
            <span className="stat-text">Done: {todayStats.completed}</span>
          </div>
          <div className="stat-pill pending">
            <span className="stat-icon">⏳</span>
            <span className="stat-text">Left: {todayStats.notDone}</span>
          </div>
          <div className="stat-pill total">
            <span className="stat-icon">📊</span>
            <span className="stat-text">Total: {todayStats.total}</span>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="view-toggle">
        <button 
          className={`toggle-btn ${viewMode === 'today' ? 'active' : ''}`}
          onClick={() => setViewMode('today')}
        >
          <span className="toggle-icon">📅</span>
          Today
        </button>
        <button 
          className={`toggle-btn ${viewMode === 'week' ? 'active' : ''}`}
          onClick={() => setViewMode('week')}
        >
          <span className="toggle-icon">📆</span>
          Week
        </button>
        <button 
          className={`toggle-btn ${viewMode === 'stats' ? 'active' : ''}`}
          onClick={() => setViewMode('stats')}
        >
          <span className="toggle-icon">📈</span>
          Stats
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
              const stats = getHabitStats(index, 7)
              
              return (
                <div 
                  key={habit.id} 
                  className={`habit-card ${isCompleted ? 'completed' : ''}`}
                  onClick={() => toggleHabit(index, new Date())}
                >
                  <div className="habit-main">
                    <div className="habit-icon" style={{ backgroundColor: habit.color }}>
                      {habit.emoji}
                    </div>
                    <div className="habit-info">
                      <h3>{habit.name}</h3>
                      <div className="habit-meta">
                        <span className="habit-streak">🔥 {habit.streak}</span>
                        <span className="habit-completion">{stats.percentage}% this week</span>
                      </div>
                    </div>
                    <div className="habit-check">
                      {isCompleted ? '✅' : '⭕'}
                    </div>
                  </div>
                  
                  <div className="habit-progress-bar">
                    <div className="progress-bar-bg">
                      <div 
                        className="progress-bar-fill" 
                        style={{ 
                          width: `${stats.percentage}%`,
                          backgroundColor: habit.color 
                        }}
                      ></div>
                    </div>
                    <div className="progress-stats">
                      <span>{stats.completed}/{stats.total} days</span>
                    </div>
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
            <h2>Week of {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</h2>
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
            
            {habits.map((habit, habitIndex) => {
              const weekStats = getHabitStats(habitIndex, 7)
              return (
                <div key={habit.id} className="habit-week-row">
                  <div className="habit-label">
                    <span className="habit-emoji">{habit.emoji}</span>
                    <div className="habit-details">
                      <span className="habit-name">{habit.name}</span>
                      <div className="week-progress-bar">
                        <div className="progress-bar-bg">
                          <div 
                            className="progress-bar-fill" 
                            style={{ 
                              width: `${weekStats.percentage}%`,
                              backgroundColor: habit.color 
                            }}
                          ></div>
                        </div>
                        <span className="progress-text">{weekStats.percentage}%</span>
                      </div>
                    </div>
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
              )
            })}
          </div>
        </div>
      )}

      {/* Stats View */}
      {viewMode === 'stats' && (
        <div className="stats-view">
          <div className="stats-header">
            <h2>📊 Statistics</h2>
          </div>
          
          <div className="chart-container">
            <h3>7-Day Progress</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={progressData}>
                <XAxis dataKey="day" />
                <YAxis domain={[0, 100]} />
                <Bar dataKey="completion" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="habits-stats">
            <h3>Habit Performance (30 days)</h3>
            {habits.map((habit, index) => {
              const stats = getHabitStats(index, 30)
              return (
                <div key={habit.id} className="habit-stat-card">
                  <div className="habit-stat-header">
                    <div className="habit-icon-small" style={{ backgroundColor: habit.color }}>
                      {habit.emoji}
                    </div>
                    <div className="habit-stat-info">
                      <h4>{habit.name}</h4>
                      <div className="stat-numbers">
                        <span className="completed-stat">✅ {stats.completed}</span>
                        <span className="missed-stat">❌ {stats.notDone}</span>
                        <span className="percentage-stat">{stats.percentage}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="habit-stat-bar">
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
                  <div className="habit-achievements">
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
        </div>
      )}

      {/* Add Habit FAB */}
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