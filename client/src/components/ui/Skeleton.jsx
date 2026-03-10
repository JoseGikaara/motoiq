export function Skeleton({ width = "100%", height = "16px", radius = "6px", className = "" }) {
  return <div className={"shimmer " + className} style={{ width, height, borderRadius: radius }} />;
}

export function CardSkeleton() {
  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-3">
      <Skeleton height="12px" width="40%" />
      <Skeleton height="32px" width="60%" />
      <Skeleton height="10px" width="80%" />
    </div>
  );
}
