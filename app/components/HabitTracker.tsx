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

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return Array.from({ length: daysInMonth }, (_, i) => i + 1)
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
    const days = getDaysInMonth()
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

  return (
    <div className="habit-tracker">
      <div className="header">
        <h1>FocusLab Habit Tracker</h1>
        <p>{monthName}</p>
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