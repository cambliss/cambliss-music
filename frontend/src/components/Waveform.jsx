export default function Waveform({ active = false, bars = 5, className = "" }) {
  return (
    <span className={`inline-flex items-end gap-[2px] h-4 ${className}`}>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-sm bg-amber ${active ? "waveform-bar" : ""}`}
          style={{
            height: active ? "100%" : `${20 + ((i * 37) % 60)}%`,
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
    </span>
  );
}
