import {
  useEffect,
  useCallback,
  useMemo,
  useState
} from 'react';

import db from '../db/db';

import {  
  syncPendingTransactions,
  syncPendingVoids,
  forceRetryTransaction,
  deleteTransaction,
  filterTransactionsByScope,
  getTransactionScope
  } from '../services/transactionService';

import { addAuditLog } from '../services/auditService';

import { Link } from 'react-router-dom';
import { exportTransactionsToExcel  } from '../services/exportService';
import useAuthStore from '../stores/authStore';
import {
  countTransactionsByCategory,
  getEffectiveTransactionStatus,
  getTransactionStatusClass,
  getTransactionStatusLabel,
  matchesTransactionStatusFilter
} from '../utils/transactionStatus';
import {
  filterTransactionsForUser
} from '../utils/authz';
import {
  showToast
} from '../utils/uiFeedback';
import ConfirmDialog
  from '../components/ui/ConfirmDialog';

export default function
SyncDashboardPage() {

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

  const [transactions,
    setTransactions] =
      useState([]);

  const [loading,
    setLoading] =
      useState(false);

  const [filter,
    setFilter] =
      useState('all');

  const [
    deleteTarget,
    setDeleteTarget
  ] = useState(null);

  const loadTransactions =
    useCallback(async () => {

    const data =

      await db.transactions

        .orderBy(
          'created_at'
        )

        .reverse()

        .toArray();

    setTransactions(
      filterTransactionsForUser(
        filterTransactionsByScope(
          data,
          context
        ),
        user
      )
    );

  }, [
    context,
    user
  ]);

    useEffect(() => {

      loadTransactions();

      const interval = setInterval(

        () => {

          loadTransactions();

        },

        5000

      );



      return () => clearInterval(interval);

    }, [loadTransactions]);

  async function
  handleRetry() {

    setLoading(true);

    try {

      await syncPendingTransactions(context);

      await syncPendingVoids(context);

      await loadTransactions();

      showToast({
        title:
          'Sync selesai',
        message:
          'Transaksi pending sudah diproses.',
        tone:
          'success',
      });

    } catch (error) {

      showToast({
        title:
          'Sync gagal',
        message:
          error?.message ||
          'Periksa status tenant, toko, terminal, dan koneksi backend.',
        tone:
          'error',
      });

    } finally {

      setLoading(false);

    }

  }

  async function
    handleForceRetry(id) {

      await forceRetryTransaction(
        id,
        context
      );

      await loadTransactions();

  }

  function
      handleDelete(trx) {

        setDeleteTarget(trx);

    }

  async function
      confirmDeleteTransaction() {

        if (!deleteTarget) {

          return;

        }

        try {

          await deleteTransaction(
            deleteTarget.id,
            context
          );

          await addAuditLog(

            deleteTarget.transaction_uuid,

            'TRANSACTION_DELETED',

            null,

            context

          );

          await loadTransactions();

          setDeleteTarget(null);

        } catch {}

    }

  const statusSummary =
    countTransactionsByCategory(
      transactions
    );

  const countEffectiveStatus =
    (statuses) =>
      transactions.filter(
        (trx) =>
          statuses.includes(
            getEffectiveTransactionStatus(trx)
          )
      ).length;

  const pendingCount =
    statusSummary.pending +
    statusSummary.void_pending;

  const retryCount =
    countEffectiveStatus([
      'retry',
      'void_retry',
    ]);

  const conflictCount =
    statusSummary.conflict;

  const blockedCount =
    statusSummary.blocked;

  const syncedCount =
    statusSummary.synced;

    const failedCount =
      statusSummary.failed;

    const syncingCount =
      countEffectiveStatus([
        'syncing',
        'void_syncing',
      ]);

    const totalCount = statusSummary.total;

          const filteredTransactions =

        filter === 'all'

          ? transactions

          : transactions.filter(

              trx =>

                matchesTransactionStatusFilter(
                  trx,
                  filter
                )

         );

  return (

    <div className="min-h-screen bg-slate-50 px-3 pb-28 pt-4 sm:px-6 sm:pb-8">

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus transaksi lokal?"
        message={`Invoice ${deleteTarget?.invoice_no || '-'} akan dihapus dari IndexedDB lokal.`}
        confirmLabel="Hapus"
        tone="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteTransaction}
      />

      <div
        className="
          mb-4
          flex
          flex-col
          items-start
          justify-between
          gap-3
          sm:mb-6
          sm:flex-row
          sm:items-center
        "
       >

        <h1
          className="
            text-xl
            font-bold
            text-slate-950
            sm:text-3xl
          "
        >

          Sync Dashboard

        </h1>

<div className="flex w-full gap-2 overflow-x-auto pb-1 sm:w-auto sm:flex-wrap sm:overflow-visible sm:pb-0">

  <button

    onClick={loadTransactions}

    className="
      shrink-0
      bg-gray-600
      text-white
      px-3
      py-2
      rounded-xl
      text-xs
      font-bold
      sm:px-4
      sm:text-sm
    "

  >

    Refresh

  </button>

  <button

    onClick={handleRetry}

    disabled={loading}

    className="
      shrink-0
      bg-blue-600
      text-white
      px-3
      py-2
      rounded-xl
      text-xs
      font-bold
      sm:px-4
      sm:text-sm
    "

  >

    {

      loading
        ? 'Syncing...'
        : 'Retry Sync'

    }

  </button>

  <button

      onClick={() =>

        exportTransactionsToExcel(
          transactions
        )

      }

      className="
        shrink-0
        bg-green-600
        text-white
        px-3
        py-2
        rounded-xl
        text-xs
        font-bold
        sm:px-4
        sm:text-sm
      "

    >

      Export Excel

  </button>

  <Link
    to="/"
    className="
      shrink-0
      bg-blue-600
      text-white
      px-3
      py-2
      rounded-xl
      text-xs
      font-bold
      sm:px-4
      sm:text-sm
    "
  >

    Main POS

  </Link>

  <Link
    to="/conflicts"
    className="
      shrink-0
      bg-red-600
      text-white
      px-3
      py-2
      rounded-xl
      text-xs
      font-bold
      sm:px-4
      sm:text-sm
    "
  >

    Conflicts

  </Link>
  
</div>

      </div>

    <div
        className="
          mb-4
          grid
          grid-cols-2
          gap-2
          sm:mb-6
          sm:grid-cols-4
          sm:gap-4
          xl:grid-cols-8
        "
      >

        {/* Pending */}

        <div
          className="
            bg-yellow-100
            rounded-2xl
            p-3
            sm:p-4
          "
        >

          <div className="text-sm">

            Pending

          </div>

          <div
            className="
              text-2xl
              font-bold
              sm:text-3xl
            "
          >

            {pendingCount}

          </div>

        </div>

        {/* Retry */}

        <div
          className="
            bg-orange-100
            rounded-2xl
            p-3
            sm:p-4
          "
        >

          <div className="text-sm">

            Retry

          </div>

          <div
            className="
              text-2xl
              font-bold
              sm:text-3xl
            "
          >

            {retryCount}

          </div>



        </div>

        {/* Conflict */}

        <div
          className="
            bg-red-100
            rounded-2xl
            p-3
            sm:p-4
          "
        >

          <div className="text-sm">

            Conflict

          </div>

          <div
            className="
              text-2xl
              font-bold
              sm:text-3xl
            "
          >

            {conflictCount}

          </div>

        </div>

        {/* Blocked */}

        <div
          className="
            bg-rose-100
            rounded-2xl
            p-3
            sm:p-4
          "
        >

          <div className="text-sm">

            Blocked

          </div>

          <div
            className="
              text-2xl
              font-bold
              sm:text-3xl
            "
          >

            {blockedCount}

          </div>

        </div>

        {/* Failed */}

        <div
          className="
            bg-gray-200
            rounded-2xl
            p-3
            sm:p-4
          "
        >

          <div className="text-sm">

            Failed

          </div>

          <div
            className="
              text-2xl
              font-bold
              sm:text-3xl
            "
          >

            {failedCount}

          </div>

        </div>

        {/* Synced */}

        <div
          className="
            bg-green-100
            rounded-2xl
            p-3
            sm:p-4
          "
        >

          <div className="text-sm">

            Synced

          </div>

          <div
            className="
              text-2xl
              font-bold
              sm:text-3xl
            "
          >

            {syncedCount}

          </div>

        </div>

        <div
          className="
            bg-blue-100
            p-4
            rounded-xl
          "
         >

          <div className="text-sm">

            Syncing

          </div>

          <div
            className="
              text-3xl
              font-bold
            "
           >

            {syncingCount}

          </div>

        </div>

        <div
            className="
              bg-slate-100
              rounded-2xl
              p-3
              sm:p-4
            "
          >

            <div className="text-sm">

              Total

            </div>

            <div
              className="
                text-2xl
                font-bold
                sm:text-3xl
              "
            >

              {totalCount}

            </div>

          </div>

      </div>

      <div
        className="
          -mx-3
          mb-4
          flex
          gap-2
          overflow-x-auto
          px-3
          pb-1
          sm:mx-0
          sm:mb-6
          sm:flex-wrap
          sm:overflow-visible
          sm:px-0
        "
       >

        {

          [

            'all',

            'pending',

            'void_pending',

            'conflict',

            'blocked',

            'failed',

            'synced',

            'void',

            'unknown'

          ].map(status => (

            <button

              key={status}

              onClick={() =>

                setFilter(status)

              }

              className={`

                shrink-0
                px-3
                py-2
                rounded-full
                text-xs
                font-bold
                sm:px-4
                sm:text-sm

                ${

                  filter === status

                  ? 'bg-blue-600 text-white'

                  : 'bg-white text-slate-600 border border-slate-200'

                }

              `}

            >

              {status}

            </button>

          ))

        }

      </div>

      <div
        className="
          space-y-4
        "
      >

        {
          filteredTransactions.map(
            (trx) => (

              <div

                key={trx.id}

                className="
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-3
                  shadow-sm
                  sm:p-4
                "
              >

                <div
                  className="
                    flex
                    flex-col
                    justify-between
                    mb-2
                    gap-2
                    sm:flex-row
                  "
                >

                  <div>

                    <div
                      className="
                        font-bold
                        text-sm
                        leading-tight
                        text-slate-950
                        sm:text-base
                      "
                    >

                      {
                        trx.invoice_no
                      }

                    </div>

                    <div
                      className="
                        text-xs
                        text-slate-500
                        sm:text-sm
                      "
                    >

                      {
                        trx.transaction_time
                      }

                    </div>

                  </div>

                  <div
                    className={`
                      w-fit
                      px-2.5
                      py-1
                      rounded-full
                      text-[11px]
                      font-bold
                      sm:text-sm
                      ${getTransactionStatusClass(trx)}
                    `}
                  >

                    {getTransactionStatusLabel(trx)}

                  </div>

                </div>

                <div
                  className="
                    text-xs
                    text-slate-600
                    sm:text-sm
                  "
                 >

                  Retry:
                  {' '}
                  {
                    trx.retry_count || 0
                  }

                </div>



                <div
                  className="
                    flex
                    flex-wrap
                    gap-2
                    mt-3
                  "
                >

                  <Link

                    to={`/transaction/${trx.id}`}

                    className="
                      bg-blue-500
                      text-white
                      px-3
                      py-1.5
                      rounded-xl
                      text-xs
                      font-bold
                      sm:text-sm
                    "

                  >

                    Detail

                  </Link>

                 <button

                      onClick={() =>
                        handleForceRetry(
                          trx.id
                        )
                      }

                      disabled={
                        ![
                          'conflict',
                          'blocked',
                          'void_blocked',
                          'void_failed'
                        ].includes(
                          trx.sync_status
                        )
                      }

                      className={`
                        px-3
                        py-1.5
                        rounded-xl
                        text-xs
                        font-bold
                        text-white
                        sm:text-sm

                        ${
                          [
                            'conflict',
                            'blocked',
                            'void_blocked',
                            'void_failed'
                          ].includes(
                            trx.sync_status
                          )
                          ? 'bg-red-500'
                          : 'bg-gray-400 cursor-not-allowed'
                        }
                      `}
                    >

                      Force Sync

                    </button>

                                    <button

                    onClick={() =>
                      handleDelete(trx)
                    }

                    disabled={
                      trx.sync_status !== 'failed'
                    }

                    className={`
                    text-xs
                      px-3
                      py-1.5
                      rounded-xl
                      font-bold
                      text-white
                      sm:text-sm

                      ${
                        trx.sync_status === 'failed'
                        ? 'bg-red-600'
                        : 'bg-gray-400 cursor-not-allowed'
                      }
                    `}
                  >

                    Delete

                  </button>

                </div>

                {

                  trx.last_error && (

                    <div
                      className="
                        text-red-500
                        text-sm
                        mt-2
                      "
                    >

                      {
                        trx.last_error
                      }

                    </div>

                  )

                }

              </div>

            )
          )
        }

      </div>

    </div>

  );

}
