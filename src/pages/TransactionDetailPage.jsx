import {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Link,
  useParams
} from 'react-router-dom';

import db from '../db/db';

import { getAuditLogs } from '../services/auditService';

import { voidTransaction } from '../services/transactionService';
import {
  getTransactionScope,
  matchesTransactionScope
} from '../services/transactionService';

import PrintTemplatePreview
from '../components/receipt/PrintTemplatePreview';

import useAuthStore
  from '../stores/authStore';
import {
  canUseManagerTools,
  canViewTransaction
} from '../utils/authz';
import {
  showToast
} from '../utils/uiFeedback';
import ConfirmDialog
  from '../components/ui/ConfirmDialog';

export default function
TransactionDetailPage() {


  const { id } =
    useParams();

  const tenant =
    useAuthStore(
      (state) =>
        state.tenant
    );

  const store =
    useAuthStore(
      (state) =>
        state.store
    );

  const terminal =
    useAuthStore(
      (state) =>
        state.terminal
    );

  const user =
    useAuthStore(
      (state) =>
        state.user
    );

  const context =
    useMemo(() =>
      getTransactionScope({
      tenant,
      store,
      terminal,
    }), [
      tenant,
      store,
      terminal
    ]);

  const [transaction,
    setTransaction] =
      useState(null);

  const [auditLogs,
    setAuditLogs] =
      useState([]);

  const [notFound,
    setNotFound] =
      useState(false);

  const [
    showPrintPreview,
    setShowPrintPreview
  ] = useState(false);

  const [
    showVoidDialog,
    setShowVoidDialog
  ] = useState(false);

  const [
    voidReason,
    setVoidReason
  ] = useState('');

  /*
  |--------------------------------
  | PRINT PREVIEW
  |--------------------------------
  */

  function openPrintPreview() {

    setShowPrintPreview(
      true
    );

  }

  function handleVoid() {

    setVoidReason('');
    setShowVoidDialog(true);

  }

  async function confirmVoidTransaction() {

    const reason =
      voidReason.trim();

    if (!reason) {

      showToast({
        title:
          'Alasan wajib diisi',
        message:
          'Masukkan alasan pembatalan transaksi.',
        tone:
          'error',
      });

      return;

    }

    try {

      await voidTransaction(

        transaction.id,

        reason,

        context,

        canUseManagerTools(user)
          ? null
          : user

      );

      showToast({
        title:
          'Transaction voided',
        message:
          'Pembatalan transaksi berhasil disimpan.',
        tone:
          'success',
      });

      setShowVoidDialog(false);
      setVoidReason('');

      window.location.reload();

    } catch (error) {

      showToast({
        title:
          'Void gagal',
        message:
          error.message,
        tone:
          'error',
      });

    }

  }


  useEffect(() => {

    async function loadData() {

      const trx =
        await db.transactions.get(
          Number(id)
        );

      if (
        trx &&
        (
          !matchesTransactionScope(
            trx,
            context
          ) ||
          !canViewTransaction(
            trx,
            user
          )
        )
      ) {

        setNotFound(true);
        setTransaction(null);
        setAuditLogs([]);

        return;

      }

      if (!trx) {

        setNotFound(true);
        setTransaction(null);
        setAuditLogs([]);

        return;

      }

      setNotFound(false);
      setTransaction(trx);

      const logs =
        await getAuditLogs();

      setAuditLogs(

        logs.filter(

          log =>

            log.transaction_uuid ===
            trx?.transaction_uuid
            &&
            matchesTransactionScope(
              log,
              context
            )

        )

      );

    }

    loadData();

  }, [
    id,
    context,
    user
  ]);

  if (notFound) {

    return (

      <div className="p-6">

        Transaction not found.

      </div>

    );

  }

  if (!transaction) {

    return (

      <div className="p-6">

        Loading...

      </div>

    );

  }

  const formatCurrency = (value) =>
    `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

  const formatDateTime = (value) => {
    if (!value) {
      return '-';
    }

    return new Date(value).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusKey =
    String(transaction.sync_status || 'unknown')
      .toLowerCase();

  const statusClass =
    {
      synced:
        'bg-emerald-50 text-emerald-700 ring-emerald-200',
      pending:
        'bg-amber-50 text-amber-700 ring-amber-200',
      retry:
        'bg-orange-50 text-orange-700 ring-orange-200',
      failed:
        'bg-rose-50 text-rose-700 ring-rose-200',
      conflict:
        'bg-red-50 text-red-700 ring-red-200',
      void:
        'bg-slate-100 text-slate-700 ring-slate-200',
      void_synced:
        'bg-slate-100 text-slate-700 ring-slate-200',
    }[statusKey] ||
    'bg-slate-100 text-slate-700 ring-slate-200';

  const summaryItems = [
    {
      label: 'Total Transaksi',
      value: formatCurrency(transaction.total),
      tone: 'text-blue-700',
    },
    {
      label: 'Jumlah Bayar',
      value: formatCurrency(transaction.paid_amount),
      tone: 'text-slate-900',
    },
    {
      label: 'Kembalian',
      value: formatCurrency(transaction.change_amount),
      tone: 'text-emerald-700',
    },
  ];

  const detailItems = [
    {
      label: 'Invoice',
      value: transaction.invoice_no,
      strong: true,
    },
    {
      label: 'UUID Transaksi',
      value: transaction.transaction_uuid,
      mono: true,
    },
    {
      label: 'Kasir',
      value: transaction.cashier_name || 'Administrator',
    },
    {
      label: 'Metode Bayar',
      value: transaction.payment_method || 'cash',
    },
    {
      label: 'Retry Count',
      value: transaction.retry_count || 0,
    },
    {
      label: 'Waktu Transaksi',
      value: formatDateTime(transaction.transaction_time || transaction.created_at),
    },
    {
      label: 'Void Status',
      value: transaction.void_status ? 'YES' : 'NO',
    },
    ...(transaction.void_status
      ? [
          {
            label: 'Void Sync',
            value: transaction.void_sync_status || '-',
          },
          {
            label: 'Void Reason',
            value: transaction.void_reason || '-',
          },
          {
            label: 'Void At',
            value: formatDateTime(transaction.void_at),
          },
        ]
      : []),
  ];

  return (

    <div className="min-h-screen bg-slate-100 p-4 text-slate-900 sm:p-6">

      <ConfirmDialog
        open={showVoidDialog}
        title="Void transaksi?"
        message={`Invoice ${transaction?.invoice_no || '-'} akan dibatalkan. Stok lokal akan dikembalikan sesuai item transaksi.`}
        confirmLabel="Void transaksi"
        tone="danger"
        inputLabel="Alasan void"
        inputValue={voidReason}
        inputPlaceholder="Contoh: salah input item atau pelanggan membatalkan pembelian"
        onInputChange={setVoidReason}
        onCancel={() => setShowVoidDialog(false)}
        onConfirm={confirmVoidTransaction}
      />

      <div
        className="
          mx-auto
          max-w-6xl
          space-y-6
        "
      >

      <div
        className="
          flex
          flex-col
          gap-4
          rounded-xl
          border
          border-slate-200
          bg-white
          p-5
          shadow-sm
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-wide text-blue-600">
            Transaction Detail
          </div>
          <h1
            className="
              mt-1
              truncate
              text-2xl
              font-black
              text-slate-950
              sm:text-3xl
            "
          >
            {transaction.invoice_no}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`
                inline-flex
                items-center
                rounded-full
                px-3
                py-1
                text-xs
                font-bold
                uppercase
                ring-1
                ${statusClass}
              `}
            >
              {transaction.sync_status || 'unknown'}
            </span>
            <span className="text-sm font-medium text-slate-500">
              {formatDateTime(transaction.transaction_time || transaction.created_at)}
            </span>
          </div>
        </div>

        <div
          className="
            flex
            flex-wrap
            gap-2
          "
        >

        <Link
          to="/sync-dashboard"
          className="
            rounded-lg
            bg-slate-700
            px-4
            py-2
            font-semibold
            text-white
            hover:bg-slate-800
          "
        >
          Back Sync Dashboard
        </Link>

        <button

            onClick={openPrintPreview}

            className="
            bg-green-600
            text-white
            px-4
            py-2
            rounded-lg
            font-semibold
            "

        >

            Print Receipt

        </button>

        <button

            onClick={handleVoid}

            disabled={transaction.void_status}

            className={`

              px-4
              py-2
              rounded-lg
              text-white
              font-semibold

              ${

                transaction.void_status

                ? 'bg-gray-400'

                : 'bg-red-600'

              }

            `}

          >

            {

              transaction.void_status

                ? 'VOIDED'

                : 'Void Transaction'

            }

        </button>

        </div>
      </div>

      <div
        className="
          bg-white
          rounded-xl
          border
          border-slate-200
          shadow-sm
          overflow-hidden
        "
      >

        <div className="border-b border-slate-200 bg-slate-900 px-5 py-4 text-white">
          <div className="text-xs font-bold uppercase tracking-wide text-blue-200">
            Ringkasan Pembayaran
          </div>
          <div className="mt-1 text-sm text-slate-300">
            Status dan nilai transaksi kasir
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-3">
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className="
                rounded-lg
                border
                border-slate-200
                bg-slate-50
                p-4
              "
            >
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {item.label}
              </div>
              <div className={`mt-2 text-2xl font-black ${item.tone}`}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <div className="grid border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-3">
          {detailItems.map((item) => (
            <div
              key={item.label}
              className="
                border-b
                border-slate-200
                px-5
                py-4
                last:border-b-0
                sm:border-r
                lg:[&:nth-child(3n)]:border-r-0
              "
            >
              <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
                {item.label}
              </div>
              <div
                className={`
                  mt-1
                  break-words
                  text-sm
                  ${
                    item.strong
                      ? 'font-black text-slate-950'
                      : 'font-semibold text-slate-700'
                  }
                  ${item.mono ? 'font-mono text-xs' : ''}
                `}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>

      </div>

      <div
        className="
          bg-white
          rounded-xl
          border
          border-slate-200
          shadow-sm
          overflow-hidden
        "
      >

        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-black text-slate-900">
            Items
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Produk yang tercatat pada transaksi ini
          </p>
        </div>

        <div className="overflow-x-auto">

        <table
          className="
            w-full
            min-w-[520px]
            text-sm
          "
        >

          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">

            <tr>

              <th className="px-5 py-3 text-left">Product</th>

              <th className="px-5 py-3 text-center">Qty</th>

              <th className="px-5 py-3 text-right">Price</th>

            </tr>

          </thead>

          <tbody>

            {

              transaction.items?.map(

                (item,index)=>(

                  <tr
                    key={index}
                    className="border-t border-slate-100"
                  >

                    <td className="px-5 py-3 font-semibold text-slate-800">

                      {

                        item.product_name

                        ||

                        item.title

                      }

                    </td>

                    <td className="px-5 py-3 text-center text-slate-600">

                      {item.qty}

                    </td>

                    <td className="px-5 py-3 text-right font-bold text-slate-900">

                      {formatCurrency(item.price)}

                    </td>

                  </tr>

                )

              )

            }

          </tbody>

        </table>

        </div>

      </div>

      <div
        className="
          bg-white
          rounded-xl
          border
          border-slate-200
          shadow-sm
          p-5
        "
      >

        <h2
          className="
            font-bold
            mb-4
          "
        >

          Audit Logs

        </h2>

        {

          auditLogs.map(

            log => (

              <div
                key={log.id}
                className="
                  border-b
                  py-2
                "
              >

                <div>

                  {log.event}

                </div>

                <div
                  className="
                    text-sm
                    text-gray-500
                  "
                >

                  {

                    new Date(
                      log.created_at
                    )
                    .toLocaleString()

                  }

                </div>

              </div>

            )

          )

        }

      </div>

      <PrintTemplatePreview
        transaction={
          showPrintPreview
            ? {
                ...transaction,
                store_name:
                  store?.name,
                store_address:
                  store?.address,
                store_phone:
                  store?.phone,
                store_email:
                  store?.email,
                store_website:
                  store?.website,
                tenant_name:
                  tenant?.name,
                terminal_name:
                  terminal?.name,
              }
            : null
        }
        message="Pilih template bukti transaksi sebelum mencetak."
        onClose={() =>
          setShowPrintPreview(false)
        }
      />

      </div>

    </div>

  );

}
