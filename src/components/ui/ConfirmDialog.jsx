export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Lanjutkan',
  cancelLabel = 'Batal',
  tone = 'danger',
  inputLabel = '',
  inputValue = '',
  inputPlaceholder = '',
  onInputChange = () => {},
  onCancel,
  onConfirm,
}) {
  if (!open) {
    return null;
  }

  const confirmClass =
    tone === 'danger'
      ? 'bg-red-600 hover:bg-red-700'
      : 'bg-blue-600 hover:bg-blue-700';

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 px-4 py-6">
      <section className="w-full max-w-md rounded-2xl bg-white p-5 text-slate-900 shadow-2xl">
        <h2 className="text-lg font-bold">
          {title}
        </h2>

        {message && (
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {message}
          </p>
        )}

        {inputLabel && (
          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              {inputLabel}
            </span>
            <textarea
              value={inputValue}
              onChange={(event) =>
                onInputChange(event.target.value)
              }
              placeholder={inputPlaceholder}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            />
          </label>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-sm font-bold text-white ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
