// One proportional bar (wiki 01 rule 3): same length everywhere, split by ratio.
// On time is solid, late is hatched; numbers live beside it, never state words.
type Props = { name: string; onTime: number; late: number }

export default function Bar({ name, onTime, late }: Props) {
  return (
    <div className="bar" role="img" aria-label={`${name}: ${onTime} on time, ${late} late.`}>
      <span className="fill-on" style={{ flexGrow: onTime }} />
      <span className="fill-late" style={{ flexGrow: late }} />
    </div>
  )
}
