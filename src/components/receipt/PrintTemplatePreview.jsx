import {
  useMemo,
  useState
} from 'react';

import {
  PRINT_TEMPLATES,
  buildReceiptHtml,
  printTransactionReceipt
} from '../../utils/receiptPrinter';

export default function PrintTemplatePreview({
  transaction,
  message = '',
  onClose
}) {
  const [
    selectedTemplate,
    setSelectedTemplate
  ] = useState('receipt58');

  const previewHtml =
    useMemo(
      () =>
        buildReceiptHtml(
          transaction,
          selectedTemplate
        ),
      [
        transaction,
        selectedTemplate
      ]
    );

  if (!transaction) {
    return null;
  }

  const selected =
    PRINT_TEMPLATES.find(
      (template) =>
        template.key === selectedTemplate
    );

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-950/70 p-2 backdrop-blur-sm print:hidden sm:p-5 lg:items-center">
      <div className="flex min-h-[calc(100dvh-1rem)] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:min-h-0 lg:h-[calc(100dvh-2.5rem)]">
        <div className="shrink-0 flex flex-col gap-3 border-b border-slate-200 px-3 py-3 sm:px-4 sm:py-4 lg:flex-row lg:items-center lg:justify-between lg:px-5">
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-wide text-blue-600">
              Preview bukti transaksi
            </div>
            <h2 className="truncate text-lg font-bold text-slate-900">
              {transaction.invoice_no || transaction.invoice || '-'}
            </h2>
            {message && (
              <p className="mt-1 text-sm font-medium text-slate-600">
                {message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={() =>
                printTransactionReceipt(
                  transaction,
                  selectedTemplate,
                  { onAfterPrint: onClose }
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"
                />
              </svg>
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Kembali ke POS
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[300px,1fr] lg:overflow-hidden">
          <aside className="shrink-0 border-b border-slate-200 bg-slate-50 p-2 sm:p-3 lg:min-h-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              {PRINT_TEMPLATES.map((template) => {
                const active =
                  selectedTemplate === template.key;

                return (
                  <button
                    key={template.key}
                    type="button"
                    onClick={() =>
                      setSelectedTemplate(template.key)
                    }
                    className={`
                      rounded-lg
                      border
                      p-2.5
                      text-left
                      transition
                      sm:p-3
                      ${
                        active
                          ? 'border-blue-500 bg-white shadow-sm ring-2 ring-blue-100'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-slate-900">
                        {template.label}
                      </div>
                      {active && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          Aktif
                        </span>
                      )}
                    </div>
                    <p className="mt-1 hidden text-xs leading-snug text-slate-500 sm:block">
                      {template.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs font-medium leading-relaxed text-amber-800 sm:mt-3 sm:p-3">
              Pilih template dulu, periksa preview, lalu tekan Print. Jendela print hanya terbuka setelah tombol Print ditekan.
            </div>
          </aside>

          <main className="flex min-h-[62dvh] flex-col bg-slate-200 p-2 sm:p-3 lg:min-h-0 lg:p-5">
            <div className="mb-2 shrink-0 flex items-center justify-between gap-3 sm:mb-3">
              <div>
                <div className="text-sm font-bold text-slate-800">
                  {selected?.label}
                </div>
                <div className="text-xs text-slate-500">
                  Preview mengikuti ukuran kertas template.
                </div>
              </div>
            </div>

            <div className="min-h-[58dvh] flex-1 overflow-hidden rounded-lg border border-slate-300 bg-white shadow-inner lg:min-h-0">
              <iframe
                title="Preview print transaksi"
                srcDoc={previewHtml}
                className="h-full w-full bg-white"
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
