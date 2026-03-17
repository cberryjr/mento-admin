import { InlineAlert } from "@/components/feedback/inline-alert";
import { StudioDefaultsForm } from "@/features/studio-defaults/components/studio-defaults-form";
import { updateStudioDefaults } from "@/features/studio-defaults/server/actions/update-studio-defaults";
import { getStudioDefaults } from "@/features/studio-defaults/server/queries/get-studio-defaults";

export default async function SettingsPage() {
  const result = await getStudioDefaults();

  if (!result.ok) {
    return (
      <InlineAlert
        title="Could not load studio defaults"
        message="Refresh the page and try again."
      />
    );
  }

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Settings and Defaults</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Maintain studio details, quote terms, and invoice payment instructions used to
          prefill future records.
        </p>
      </div>

      <StudioDefaultsForm
        initialValues={result.data.studioDefaults}
        submitAction={updateStudioDefaults}
      />
    </section>
  );
}
