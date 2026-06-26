import {
  useEffect,
  useCallback,
  useMemo,
  useState
} from 'react';

import {
  Link
} from 'react-router-dom';

import db from '../db/db';

import {
  addAuditLog
} from '../services/auditService';

import {
  deleteTransaction,
  forceRetryTransaction,
  markTransactionFailed,
  filterTransactionsByScope,
  getTransactionScope
} from '../services/transactionService';

import useAuthStore
  from '../stores/authStore';
import ConfirmDialog
  from '../components/ui/ConfirmDialog';

export default function
ConflictResolutionPage() {

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

  const [
    transactions,
    setTransactions
  ] = useState([]);

  const [
    pendingAction,
    setPendingAction
  ] = useState(null);

  const loadConflicts =
    useCallback(async () => {

    const data =

      await db.transactions
        .where('sync_status')
        .equals('conflict')
        .toArray();

    const scopedData =
      filterTransactionsByScope(
        data,
        context
      );

    setTransactions(

      scopedData.sort(
        (a, b) =>
          new Date(
            b.updated_at ||
            b.transaction_time ||
            b.created_at ||
            0
          ) -
          new Date(
            a.updated_at ||
            a.transaction_time ||
            a.created_at ||
            0
          )
      )

    );

  }, [context]);

  useEffect(() => {

    loadConflicts();

    const interval =

      setInterval(
        loadConflicts,
        5000
      );

    return () =>
      clearInterval(interval);

  }, [loadConflicts]);

  async function runPendingAction() {

    if (!pendingAction) {
      return;
    }

    const {
      type,
      transaction: trx,
    } = pendingAction;

    setPendingAction(null);

    if (type === 'force_retry') {

    await forceRetryTransaction(
      trx.id,
      context
    );

    await addAuditLog(

      trx.transaction_uuid,

      'TRANSACTION_CONFLICT_FORCE_RETRY',

      trx.last_error || null,

      context

    );

    await loadConflicts();

      return;

    }

    if (type === 'mark_failed') {

      await markTransactionFailed(
        trx.id,
        context
      );

      await addAuditLog(

        trx.transaction_uuid,

        'TRANSACTION_CONFLICT_MARK_FAILED',

        trx.last_error || null,

        context

      );

      await loadConflicts();

      return;

    }

    if (type === 'delete_local') {

      await addAuditLog(

        trx.transaction_uuid,

        'TRANSACTION_CONFLICT_DELETED',

        trx.last_error || null,

        context

      );

      await deleteTransaction(
        trx.id,
        context
      );

      await loadConflicts();

    }

  }

  function handleForceRetry(trx) {

    setPendingAction({
      type: 'force_retry',
      transaction: trx,
    });

  }

  function handleMarkFailed(trx) {

    setPendingAction({
      type: 'mark_failed',
      transaction: trx,
    });

  }

  function handleDeleteLocal(trx) {

    setPendingAction({
      type: 'delete_local',
      transaction: trx,
    });

  }

  return (

    <div className="p-6">

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={
          pendingAction?.type === 'force_retry'
            ? 'Force retry transaksi?'
            : pendingAction?.type === 'mark_failed'
              ? 'Tandai transaksi gagal?'
              : 'Hapus transaksi lokal?'
        }
        message={`Invoice ${pendingAction?.transaction?.invoice_no || '-'} akan diproses. Aksi ini memengaruhi status sync lokal.`}
        confirmLabel={
          pendingAction?.type === 'delete_local'
            ? 'Hapus'
            : 'Lanjutkan'
        }
        tone={
          pendingAction?.type === 'delete_local'
            ? 'danger'
            : 'info'
        }
        onCancel={() => setPendingAction(null)}
        onConfirm={runPendingAction}
      />

      <div
        className="
          flex
          justify-between
          items-center
          mb-6
        "
      >

        <div>

          <h1
            className="
              text-3xl
              font-bold
            "
          >
            Conflict Resolution
          </h1>

          <div className="text-sm text-gray-500">
            Transactions blocked by stock or product sync conflict
          </div>

        </div>

        <div className="flex gap-2">

          <Link
            to="/"
            className="
              bg-blue-600
              text-white
              px-4
              py-2
              rounded-lg
            "
          >
            Main POS
          </Link>

          <button
            onClick={loadConflicts}
            className="
              bg-gray-600
              text-white
              px-4
              py-2
              rounded-lg
            "
          >
            Refresh
          </button>

          <Link
            to="/sync-dashboard"
            className="
              bg-orange-600
              text-white
              px-4
              py-2
              rounded-lg
            "
          >
            Sync Dashboard
          </Link>

        </div>

      </div>

      {
        transactions.length === 0 && (

          <div
            className="
              bg-white
              rounded-xl
              shadow
              p-6
              text-gray-500
            "
          >
            No conflict transactions.
          </div>

        )
      }

      <div className="space-y-4">

        {
          transactions.map((trx) => (

            <div
              key={trx.id}
              className="
                bg-white
                rounded-xl
                shadow
                p-4
              "
            >

              <div
                className="
                  flex
                  justify-between
                  gap-4
                "
              >

                <div>

                  <div
                    className="
                      font-bold
                      text-lg
                    "
                  >
                    {trx.invoice_no}
                  </div>

                  <div className="text-sm text-gray-500">
                    UUID: {trx.transaction_uuid}
                  </div>

                  <div className="text-sm text-gray-500">
                    Cashier: {trx.cashier_name || '-'}
                  </div>

                  <div className="text-sm text-gray-500">
                    Retry: {trx.retry_count || 0}
                  </div>

                </div>

                <div className="text-right">

                  <div
                    className="
                      text-red-600
                      font-bold
                    "
                  >
                    CONFLICT
                  </div>

                  <div
                    className="
                      font-bold
                      text-blue-600
                    "
                  >
                    Rp {
                      Number(
                        trx.total || 0
                      ).toLocaleString()
                    }
                  </div>

                  <div className="text-sm text-gray-500">
                    {
                      trx.transaction_time
                        ? new Date(
                            trx.transaction_time
                          ).toLocaleString()
                        : '-'
                    }
                  </div>

                </div>

              </div>

              {
                trx.last_error && (

                  <div
                    className="
                      mt-4
                      bg-red-50
                      text-red-700
                      p-3
                      rounded-lg
                      text-sm
                    "
                  >
                    {trx.last_error}
                  </div>

                )
              }

              <div className="mt-4">

                <div className="font-bold mb-2">
                  Items
                </div>

                <div className="space-y-1">

                  {
                    (trx.items || []).map(
                      (item, index) => (

                        <div
                          key={index}
                          className="
                            flex
                            justify-between
                            border-t
                            py-1
                            text-sm
                          "
                        >

                          <div>
                            {
                              item.product_name ||
                              item.product_title ||
                              item.title ||
                              'Unknown Product'
                            }
                            {' '}
                            x
                            {' '}
                            {item.qty}
                          </div>

                          <div>
                            Rp {
                              Number(
                                item.price || 0
                              ).toLocaleString()
                            }
                          </div>

                        </div>

                      )
                    )
                  }

                </div>

              </div>

              <div
                className="
                  flex
                  gap-2
                  mt-4
                  flex-wrap
                "
              >

                <Link
                  to={`/transaction/${trx.id}`}
                  className="
                    bg-blue-600
                    text-white
                    px-3
                    py-2
                    rounded-lg
                    text-sm
                  "
                >
                  View Detail
                </Link>

                <button
                  onClick={() =>
                    handleForceRetry(trx)
                  }
                  className="
                    bg-orange-600
                    text-white
                    px-3
                    py-2
                    rounded-lg
                    text-sm
                  "
                >
                  Force Retry
                </button>

                <button
                  onClick={() =>
                    handleMarkFailed(trx)
                  }
                  className="
                    bg-gray-700
                    text-white
                    px-3
                    py-2
                    rounded-lg
                    text-sm
                  "
                >
                  Mark Failed
                </button>

                <button
                  onClick={() =>
                    handleDeleteLocal(trx)
                  }
                  className="
                    bg-red-600
                    text-white
                    px-3
                    py-2
                    rounded-lg
                    text-sm
                  "
                >
                  Delete Local
                </button>

              </div>

            </div>

          ))
        }

      </div>

    </div>

  );

}
