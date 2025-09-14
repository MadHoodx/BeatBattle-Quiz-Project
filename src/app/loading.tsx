export default function Loading() {
  // This component renders at the server level while route segments load.
  // The I18nProvider (and its client hook) may not be mounted yet, so
  // avoid calling client-only hooks here. We show a neutral fallback text.
  return (
    <div className="flex items-center justify-center min-h-[50vh] flex-col gap-4 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-transparent" />
      <div className="text-sm text-white/60">Loading...</div>
    </div>
  );
}
