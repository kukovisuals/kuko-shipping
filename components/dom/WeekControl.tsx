'use client'

import { useStore } from '@/lib/store'
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion'

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

// Play/pause for the weekly loop, with a day counter. The clock itself runs in 3D (wiki 11);
// this only flips `weekPlaying` and shows `weekDay`. With reduced motion there is nothing to play.
export default function WeekControl() {
  const playing = useStore((s) => s.weekPlaying)
  const day = useStore((s) => s.weekDay)
  const toggle = useStore((s) => s.toggleWeekPlaying)
  const reduced = usePrefersReducedMotion()
  if (reduced) return null

  return (
    <div className="week-control" role="group" aria-label="Week replay">
      <button type="button" aria-pressed={playing} onClick={toggle}>
        {playing ? 'Pause' : 'Play week'}
      </button>
      <ol className="week-days" aria-label="Day of the week">
        {WEEK_DAYS.map((d, i) => (
          <li key={d} aria-current={playing && i === day ? 'step' : undefined}>
            {d}
          </li>
        ))}
      </ol>
    </div>
  )
}
