type LoadingBlockProps = {
  label?: string;
};

export function LoadingBlock({ label = "Loading..." }: LoadingBlockProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600"
    >
      {label}
    </div>
  );
}
