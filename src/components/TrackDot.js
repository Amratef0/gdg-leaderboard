export default function TrackDot({ color, name, size = 8 }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block flex-shrink-0 rounded-full" style={{ width: size, height: size, backgroundColor: color || "#4285F4" }} />
      {name && <span>{name}</span>}
    </span>
  );
}
