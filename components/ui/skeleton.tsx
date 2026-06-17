export const Skeleton = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <div
    className={`animate-pulse rounded ${className ?? ""}`}
    style={{ background: "var(--color-bg-elevated)", ...style }}
  />
);
