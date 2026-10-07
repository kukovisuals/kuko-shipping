'use client'

import { useSummary } from '@/lib/hooks/useSummary'
import Bar from './Bar'
import { fmt } from './format'

export default function Total() {
  const { data } = useSummary()
  const total = data?.total

  return (
    <section className="total" aria-label="Total">
      <div className="eyebrow">Total</div>
      <div className="total-number">{total ? fmt(total.count) : '–'}</div>
      <Bar name="Total" onTime={total?.onTime ?? 0} late={total?.late ?? 0} />
      <div className="bar-counts">
        <span style={{ flexGrow: total?.onTime ?? 1 }}>{total ? fmt(total.onTime) : ''}</span>
        <span className="late-count" style={{ flexGrow: total?.late ?? 0 }}>
          {total ? fmt(total.late) : ''}
        </span>
      </div>
    </section>
  )
}
