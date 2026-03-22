import Link from "next/link";

export default function WorkspaceSettingsPage() {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-zinc-900">Settings and Defaults</h2>
      <p className="mt-2 text-sm text-zinc-600">
        Manage studio details, quote terms, and invoice payment instructions.
      </p>
      <Link
        href="/settings"
        className="mt-4 inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
      >
        Open settings
      </Link>
    </section>
  );
}
