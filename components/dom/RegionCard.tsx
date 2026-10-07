import Bar from './Bar'
import { fmt } from './format'

// The card over each region of the map (wiki 01, 09): name, total, one proportional bar, two counts.
// Plain props, no fetching and no status logic. The 3D scene pins it with drei <Html> and passes
// `dimmed` for every region except the selected one (callout ②).
type Props = { name: string; count: number; onTime: number; late: number; dimmed?: boolean }

export default function RegionCard({ name, count, onTime, late, dimmed }: Props) {
  return (
    <div className="region-card" data-dimmed={dimmed || undefined}>
      <div className="eyebrow">{name}</div>
      <div className="region-card-total">{fmt(count)}</div>
      <Bar name={name} onTime={onTime} late={late} />
      <div className="bar-counts">
        <span style={{ flexGrow: onTime }}>{fmt(onTime)}</span>
        <span className="late-count" style={{ flexGrow: late }}>
          {fmt(late)}
        </span>
      </div>
    </div>
  )
}
