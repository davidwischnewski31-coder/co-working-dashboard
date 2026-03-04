'use client'

export function SparklineChart({
  points,
  stroke = '#f5a623',
  background = 'transparent',
  className = '',
}: {
  points: number[]
  stroke?: string
  background?: string
  className?: string
}) {
  const width = 120
  const height = 30

  const max = Math.max(1, ...points)
  const min = Math.min(...points, 0)
  const range = Math.max(1, max - min)

  const path = points
    .map((value, index) => {
      const x = (index / Math.max(1, points.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} role="img" aria-label="trend sparkline">
      {background !== 'transparent' ? <rect x="0" y="0" width={width} height={height} fill={background} rx="4" /> : null}
      <path d={path} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
