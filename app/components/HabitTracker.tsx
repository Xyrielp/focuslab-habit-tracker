'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface HabitData {
  [habitIndex: number]: {
    [date: string]: boolean
  }
}

export default function HabitTracker() {
  const [habits, setHabits] = useState<string[]>([''])
  const [habitData, setHabitData] = useState<HabitData>({})
  const [currentMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [currentWeek, setCurrentWeek] = useState(0)

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

  const addHabit = () => {
    setHabits([...habits, ''])
  }

  const updateHabit = (index: number, value: string) => {
    const newHabits = [...habits]
    newHabits[index] = value
    setHabits(newHabits)
  }

  const toggleHabit = (habitIndex: number, date: string) => {
    setHabitData(prev => ({
      ...prev,
      [habitIndex]: {
        ...prev[habitIndex],
        [date]: !prev[habitIndex]?.[date]
      }
    }))
  }

  const getProgressData = () => {
    const days = viewMode === 'week' ? getCurrentWeekDays().filter(d => d !== null) : getDaysInMonth()
    return days.map(day => {
      const date = formatDate(day)
      const completedHabits = habits.filter((habit, index) => 
        habit.trim() && habitData[index]?.[date]
      ).length
      const totalHabits = habits.filter(habit => habit.trim()).length
      
      return {
        day,
        completion: totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0
      }
    })
  }

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const weekNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weeks = getWeeksInMonth()

  return (
    <div className="habit-tracker">
      <div className="header">
        <h1>FocusLab Habit Tracker</h1>
        <p>{monthName}</p>
        <div style={{ marginTop: '10px' }}>
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
            <div style={{ marginTop: '10px' }}>
              <button 
                className="nav-btn"
                onClick={() => setCurrentWeek(Math.max(0, currentWeek - 1))}
                disabled={currentWeek === 0}
              >
                ← Prev
              </button>
              <span style={{ margin: '0 15px', color: 'white' }}>Week {currentWeek + 1}</span>
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
          <h3 style={{ marginBottom: '15px', color: '#374151' }}>Habits</h3>
          {habits.map((habit, index) => (
            <input
              key={index}
              type="text"
              className="habit-input"
              placeholder="Enter habit..."
              value={habit}
              onChange={(e) => updateHabit(index, e.target.value)}
            />
          ))}
          <button className="add-habit-btn" onClick={addHabit}>
            + Add Habit
          </button>
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
                habit.trim() ? getDaysInMonth().map(day => {
                  const date = formatDate(day)
                  return (
                    <div key={`${habitIndex}-${day}`} className="checkbox-cell">
                      <input
                        type="checkbox"
                        checked={habitData[habitIndex]?.[date] || false}
                        onChange={() => toggleHabit(habitIndex, date)}
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
                habit.trim() ? (
                  <div key={habitIndex} className="week-habit-row">
                    <div className="week-habit-name">{habit}</div>
                    <div className="week-checkboxes">
                      {getCurrentWeekDays().map((day, dayIndex) => {
                        if (day === null) return <div key={dayIndex} className="empty-cell"></div>
                        const date = formatDate(day)
                        return (
                          <div key={dayIndex} className="week-checkbox-cell">
                            <input
                              type="checkbox"
                              checked={habitData[habitIndex]?.[date] || false}
                              onChange={() => toggleHabit(habitIndex, date)}
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

      <div className="progress-section">
        <h3 className="progress-title">Monthly Progress</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={getProgressData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(value) => [`${value}%`, 'Completion']} />
            <Line 
              type="monotone" 
              dataKey="completion" 
              stroke="#2563eb" 
              strokeWidth={2}
              dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}