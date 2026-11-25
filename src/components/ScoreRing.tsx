import { useId } from 'react'

// Progress ring. Shows a share of items (e.g. reviewed), never a "compliance score" (SPEC 11.5).
export function ScoreRing({
  value,
  total,
  label,
  hint,
  size = 76,
}: {
  value: number
  total: number
  label: string
  hint?: string
  size?: number
}) {
  const gid = useId()
  const stroke = 7
  const r = (size - stroke) / 2
  const len = 2 * Math.PI * r
  const share = total > 0 ? value / total : 0
  const pct = Math.round(share * 100)
  return (
    <div className="flex items-center gap-4">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${label}: ${value} / ${total}`}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle
          className="ring-track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          className="ring-value"
          stroke={`url(#${gid})`}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={len}
          strokeDashoffset={len * (1 - share)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ ['--ring-len' as string]: `${len}` }}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          className="fill-[var(--text)] text-[16px] font-semibold tabular-nums"
        >
          {pct}%
        </text>
      </svg>
      <div className="flex flex-col">
        <span className="text-[14px] text-[var(--muted)]">{label}</span>
        <span className="text-[24px] leading-tight font-semibold tabular-nums">
          {value}
          <span className="text-[16px] font-normal text-[var(--muted)]"> / {total}</span>
        </span>
        {hint ? <span className="text-[13px] text-[var(--muted)]">{hint}</span> : null}
      </div>
    </div>
  )
}
