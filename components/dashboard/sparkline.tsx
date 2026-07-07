import React from 'react'

interface SparklineProps {
  data: number[]
  color?: string
}

export function Sparkline({ data, color }: SparklineProps) {
  if (!data || data.length === 0) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min === 0 ? 1 : max - min
  const height = 40
  const width = 100
  const padding = 2

  const points = data
    .map((val, index) => {
      const x = (index / (data.length - 1)) * (width - padding * 2) + padding
      const y = height - ((val - min) / range) * (height - padding * 2) - padding
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
      <polyline
        fill="none"
        stroke={color || 'var(--primary)'}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}
