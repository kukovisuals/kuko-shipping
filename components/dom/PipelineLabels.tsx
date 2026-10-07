import { useStore } from '@/lib/store'
import { fmt } from './format'

// Text beside the 3D stacks (wiki 09). Plain presentational pieces: they take a value and
// show it. The 3D scene decides where each one sits (drei <Html>), and the numbers come
// from /api/pipeline, never computed here.

export const StackCount = ({ value }: { value: number }) => <span className="pl-count">{fmt(value)}</span>

export const RegionName = ({ name }: { name: string }) => <span className="pl-name">{name}</span>

// Stage titles (ORDERED, BACKORDER, PACKED).
export const StageTitle = ({ text }: { text: string }) => <span className="pl-stage">{text}</span>

// Small note on a flow arrow ("no stock", "restocked").
export const FlowNote = ({ text }: { text: string }) => <span className="pl-note">{text}</span>

// One big count for a collapsed stage (callout ①).
export const StageTotal = ({ value }: { value: number }) => <span className="pl-total">{fmt(value)}</span>

// Text inside the Store and In transit circles.
export const CircleLabel = ({ text }: { text: string }) => <span className="pl-circle">{text}</span>

// Callout ① (wiki 11): clicking Store collapses Ordered and Packed into one count each.
// A real button, so it works from the keyboard. The 3D scene pins it and must let it take clicks.
export function StoreButton() {
  const collapsed = useStore((s) => s.pipelineCollapsed)
  const toggle = useStore((s) => s.togglePipelineCollapsed)
  return (
    <button
      type="button"
      className="pl-store"
      aria-pressed={collapsed}
      aria-label="Store: combine the stacks into one count each"
      onClick={toggle}
    >
      <span className="callout" aria-hidden="true">①</span>
      Store
    </button>
  )
}
