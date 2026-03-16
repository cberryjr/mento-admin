export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">404</p>
      <h1 className="text-3xl font-semibold text-neutral-900">Page not found</h1>
      <p className="text-neutral-600">The page you are looking for does not exist.</p>
    </main>
  );
}
