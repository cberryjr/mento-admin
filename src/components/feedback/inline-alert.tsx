type InlineAlertProps = {
  title: string;
  message: string;
};

export function InlineAlert({ title, message }: InlineAlertProps) {
  return (
    <section
      role="alert"
      className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900"
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{message}</p>
    </section>
  );
}
