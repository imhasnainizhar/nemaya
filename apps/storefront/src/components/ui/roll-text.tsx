/** Letter-by-letter "roll" on hover/focus of the parent link (see .ny-roll in globals.css). */
export function RollText({ children }: { children: string }) {
  const chars = [...children]
  const line = (clone: boolean) => (
    <span aria-hidden={clone || undefined}>
      {chars.map((c, i) => (
        <span key={i} className="ny-roll-char" style={{ ["--ci" as any]: i }}>
          {c === " " ? " " : c}
        </span>
      ))}
    </span>
  )
  return (
    <span className="ny-roll" aria-label={children}>
      {line(false)}
      {line(true)}
    </span>
  )
}
