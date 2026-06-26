import db from '../db/db';
import api from '../api/api';
import { reduceLocalStock } from './productService';
import { addAuditLog } from './auditService';
import {
  getApiErrorMessage,
  hasTenantContext,
  validateSyncContext
} from '../utils/saasContext';


let syncInProgress = false;

function getTransactionContextError(transaction) {

  const missing = [];

  if (!transaction?.tenant_id) missing.push('tenant_id');
  if (!transaction?.store_id) missing.push('store_id');
  if (!transaction?.terminal_id) missing.push('terminal_id');

  return missing.length > 0
    ? `Transaction context incomplete: ${missing.join(', ')}`
    : null;

}

function getTransactionContext(transaction) {

  return {
    tenant_id: transaction?.tenant_id || null,
    store_id: transaction?.store_id || null,
    terminal_id: transaction?.terminal_id || null,
  };

}

export function
getTransactionScope({
  tenant = null,
  store = null,
  terminal = null,
} = {}) {

  return {
    tenant_id:
      tenant?.id || null,
    store_id:
      store?.id || null,
    terminal_id:
      terminal?.id || null,
  };

}

function hasScope(context = null) {

  return Boolean(
    context?.tenant_id &&
    context?.store_id &&
    context?.terminal_id
  );

}

function sameId(a, b) {

  return String(a) === String(b);

}

export function
matchesTransactionScope(transaction, context = null) {

  if (!hasScope(context)) {

    return true;

  }

  return Boolean(
    transaction?.tenant_id &&
    transaction?.store_id &&
    transaction?.terminal_id &&
    sameId(transaction.tenant_id, context.tenant_id) &&
    sameId(transaction.store_id, context.store_id) &&
    sameId(transaction.terminal_id, context.terminal_id)
  );

}

function assertTransactionScope(
  transaction,
  context = null
) {

  if (
    context &&
    !matchesTransactionScope(
      transaction,
      context
    )
  ) {

    throw new Error(
      'Transaksi tidak berada dalam tenant/store/terminal aktif.'
    );

  }

}

export function
filterTransactionsByScope(transactions, context = null) {

  return (transactions || []).filter(
    (transaction) =>
      matchesTransactionScope(
        transaction,
        context
      )
  );

}

/*
|--------------------------------
| Save Local Transaction
|--------------------------------
*/


/*
|--------------------------------
| Atomic Local Checkout
|--------------------------------
*/

export async function
  saveTransactionAtomic(
    transaction
  ) {

  if (
    !hasTenantContext({
      tenant: { id: transaction.tenant_id },
      store: { id: transaction.store_id },
      terminal: { id: transaction.terminal_id },
    })
  ) {

    throw new Error(
      'POS context belum lengkap. Login ulang atau hubungi admin.'
    );

  }

  await db.transaction(

    'rw',

    db.transactions,
    db.products,
    db.audit_logs,
    db.stock_movements,

    async () => {

      /*
      |----------------------------
      | Save Transaction
      |----------------------------
      */

      await db.transactions.add({

        ...transaction,

        sync_status:
          'pending',

        retry_count: 0,

        void_retry_count: 0,

        last_error: null,

        last_sync_at: null,

        created_at: new Date(),

        //tambah field void (pembatalan)
        void_status: false,
        void_at: null,
        void_reason: null,
        void_by: null,
        void_sync_status: null,

      });

      await addAuditLog(
        transaction.transaction_uuid,
        'TRANSACTION_CREATED',
        null,
        getTransactionContext(transaction)
      );


      /*
      |----------------------------
      | Reduce Stock
      |----------------------------
      */

      await reduceLocalStock(
        transaction.items,
        transaction.invoice_no,
        getTransactionContext(transaction)
      );

    }

  );

}

/*
|--------------------------------
| Get Pending Transactions
|--------------------------------
*/

export async function
getPendingTransactions(context = null) {

  const transactions =

    await db.transactions

    .where('sync_status')

    .anyOf(
      'pending',
      'retry'
    )

    .toArray();

  return filterTransactionsByScope(
    transactions,
    context
  );

}

/*
|--------------------------------
| Count Pending Transactions
|--------------------------------
*/

export async function
countPendingTransactions(context = null) {

  const salePendingCount =

    filterTransactionsByScope(

      await db.transactions

      .where('sync_status')

      .anyOf(
        'pending',
        'retry'
      )

      .toArray(),

      context

    ).length;

  const voidPendingCount =

    filterTransactionsByScope(

      await db.transactions

      .where('void_sync_status')

      .anyOf(
        'pending',
        'retry'
      )

      .toArray(),

      context

    ).length;

  return salePendingCount + voidPendingCount;

}

/*
|--------------------------------
| Sync Pending Transactions
|--------------------------------
*/

export async function
  syncPendingTransactions(context = null) {

  const syncValidation =
    validateSyncContext(
      context
    );

  if (!syncValidation.ok) {

    throw new Error(
      syncValidation.reason
    );

  }

  // prevent double sync

  if (syncInProgress) {

    return 0;

  }

  syncInProgress = true;

  try {

    const pendingTransactions =

      await getPendingTransactions(context);

    let syncedCount = 0;

    const MAX_RETRY = 10;

    for (
      const trx
      of pendingTransactions
    ) {

      try {

        const contextError =
          getTransactionContextError(trx);

        if (contextError) {

          await db.transactions.update(

            trx.id,

            {

              sync_status:
                'failed',

              last_error:
                contextError,

              last_sync_at:
                new Date(),

              updated_at:
                new Date(),

            }

          );

          await addAuditLog(

            trx.transaction_uuid,

            'TRANSACTION_FAILED',

            contextError

          );

          continue;

        }

        // max retry protection

        if (

          Number(
            trx.retry_count || 0
          ) >= MAX_RETRY

        ) {

          await db.transactions.update(

            trx.id,

            {

              sync_status:
                'failed',

              last_error:
                'Max retry reached',

              last_sync_at:
                new Date(),

              updated_at:
                new Date(),

            }

          );

          await addAuditLog(

            trx.transaction_uuid,

            'TRANSACTION_FAILED',

            'Max retry reached'

          );

          continue;

        }

        // set syncing status

        await db.transactions.update(

          trx.id,

          {

            sync_status: 'syncing',

            last_sync_at: new Date(),

            updated_at: new Date(),

          }

        );

        // sync to backend

        await api.post(

          '/pos-transactions',

          {

            transaction_uuid:
              trx.transaction_uuid,

            tenant_id:
              trx.tenant_id,

            store_id:
              trx.store_id,

            terminal_id:
              trx.terminal_id,

            cashier_id:
              trx.cashier_id,

            cashier_shift_id:
              trx.cashier_shift_id,

            invoice_no:
              trx.invoice_no,

            customer_id:
              trx.customer_id,

            payment_method:
              trx.payment_method,

            paid_amount:
              trx.paid_amount,

            change_amount:
              trx.change_amount,

            total:
              trx.total,

            transaction_time:
              trx.transaction_time,

            items:
              trx.items,

          }

        );

        // success

        await db.transactions.update(

          trx.id,

          {

            sync_status:
              'synced',

            synced_at:
              new Date(),

            last_sync_at:
              new Date(),

            last_error:
              null,

            updated_at: new Date(),

          }

        );

        await addAuditLog(

          trx.transaction_uuid,

          'TRANSACTION_SYNCED'

        );

        syncedCount++;

      }
  catch (error) {

    /*
    |--------------------------------
    | Detect Conflict Error
    |--------------------------------
    */

    const errorMessage =

      getApiErrorMessage(
        error,
        'Sync failed'
      );

    const isConflict =

      errorMessage
        .toLowerCase()
        .includes('stock')

      ||

      errorMessage
        .toLowerCase()
        .includes('product not found');

    /*
    |--------------------------------
    | Conflict
    |--------------------------------
    */

    if (isConflict) {

      await db.transactions.update(

        trx.id,

        {

          sync_status:
            'conflict',

          last_error:
            errorMessage,

          last_sync_at:
            new Date(),

          updated_at:
            new Date(),

        }

      );

      await addAuditLog(

        trx.transaction_uuid,

        'TRANSACTION_CONFLICT',

        errorMessage

      );

      continue;

    }

      /*
      |--------------------------------
      | Detect Error Type
      |--------------------------------
      */

      const statusCode =

        error?.response?.status;

      /*
      |--------------------------------
      | Non Retryable Error
      |--------------------------------
      */

    if (
      statusCode === 402 ||
      statusCode === 403
    )
     {

        await db.transactions.update(

          trx.id,

          {

            sync_status:
              'blocked',

            last_error:
              errorMessage,

            last_sync_at:
              new Date(),

            updated_at:
              new Date(),

          }

        );

        await addAuditLog(

          trx.transaction_uuid,

          'TRANSACTION_BLOCKED',

          errorMessage

        );

      }

    else if (
      statusCode === 422 ||
      statusCode === 401 ||
      statusCode === 404 ||
      statusCode === 400
    )
     {

        await db.transactions.update(

          trx.id,

            {

              sync_status:
                'failed',

              last_error:

                errorMessage,

              last_sync_at:
                new Date(),

              updated_at:
                new Date(),

            }

        );

        await addAuditLog(

          trx.transaction_uuid,

          'TRANSACTION_FAILED',

          errorMessage

        );

      }

      /*
      |--------------------------------
      | Retryable Error
      |--------------------------------
      */

        else {

            const nextRetryCount =

              Number(
                trx.retry_count || 0
              ) + 1;

            const retryLimitReached =

              nextRetryCount >= MAX_RETRY;

            await db.transactions.update(

              trx.id,

              {

                sync_status:
                  retryLimitReached
                    ? 'failed'
                    : 'retry',

                retry_count:
                  nextRetryCount,

                last_error:

                  retryLimitReached
                    ? 'Max retry reached'
                    : errorMessage,

                last_sync_at:
                  new Date(),

                updated_at:
                  new Date(),

              }

            );

            await addAuditLog(

              trx.transaction_uuid,

              'TRANSACTION_RETRY',

              errorMessage

            );

            if (
              retryLimitReached
            ) {

              await addAuditLog(

                trx.transaction_uuid,

                'TRANSACTION_FAILED',

                'Max retry reached'

              );

            }

        }


     }

    }

    return syncedCount;

  } finally {

    syncInProgress = false;

  }

}

export async function
syncPendingVoids(context = null) {

  const syncValidation =
    validateSyncContext(
      context
    );

  if (!syncValidation.ok) {

    throw new Error(
      syncValidation.reason
    );

  }

  if (syncInProgress) {

    return 0;

  }

  syncInProgress = true;

  try {

    const pendingVoids =

      filterTransactionsByScope(

        await db.transactions

        .where('void_sync_status')

        .anyOf(
          'pending',
          'retry'
        )

        .toArray(),

        context

      );

    let syncedCount = 0;

    const MAX_RETRY = 10;

    for (const trx of pendingVoids) {

      const nextRetryCount =
        Number(trx.void_retry_count || 0) + 1;

      try {

        await db.transactions.update(
          trx.id,
          {
            sync_status:
              'void_syncing',
            void_sync_status:
              'syncing',
            last_sync_at:
              new Date(),
            updated_at:
              new Date(),
          }
        );

        await api.post(
          `/pos-transactions/${trx.transaction_uuid}/void`,
          {
            reason:
              trx.void_reason ||
              'Void from POS',
            voided_at:
              trx.void_at ||
              new Date().toISOString(),
          }
        );

        await db.transactions.update(
          trx.id,
          {
            sync_status:
              'void_synced',
            void_sync_status:
              'synced',
            synced_at:
              new Date(),
            last_sync_at:
              new Date(),
            last_error:
              null,
            updated_at:
              new Date(),
          }
        );

        await addAuditLog(
          trx.transaction_uuid,
          'TRANSACTION_VOID_SYNCED',
          null,
          getTransactionContext(trx)
        );

        syncedCount++;

      } catch (error) {

        const statusCode =
          error?.response?.status;

        const errorMessage =
          getApiErrorMessage(
            error,
            'Void sync failed'
          );

        if (
          statusCode === 402 ||
          statusCode === 403
        ) {

          await db.transactions.update(
            trx.id,
            {
              sync_status:
                'void_blocked',
              void_sync_status:
                'blocked',
              last_error:
                errorMessage,
              last_sync_at:
                new Date(),
              updated_at:
                new Date(),
            }
          );

          await addAuditLog(
            trx.transaction_uuid,
            'TRANSACTION_VOID_BLOCKED',
            errorMessage,
            getTransactionContext(trx)
          );

          continue;

        }

        const retryLimitReached =
          nextRetryCount >= MAX_RETRY;

        await db.transactions.update(
          trx.id,
          {
            sync_status:
              retryLimitReached
                ? 'void_failed'
                : 'void_retry',
            void_sync_status:
              retryLimitReached
                ? 'failed'
                : 'retry',
            void_retry_count:
              nextRetryCount,
            last_error:
              retryLimitReached
                ? 'Max void retry reached'
                : errorMessage,
            last_sync_at:
              new Date(),
            updated_at:
              new Date(),
          }
        );

        await addAuditLog(
          trx.transaction_uuid,
          retryLimitReached
            ? 'TRANSACTION_VOID_FAILED'
            : 'TRANSACTION_VOID_RETRY',
          retryLimitReached
            ? 'Max void retry reached'
            : errorMessage,
          getTransactionContext(trx)
        );

      }

    }

    return syncedCount;

  } finally {

    syncInProgress = false;

  }

}

/*
|--------------------------------
| Get Local Transactions
|--------------------------------
*/

export async function
getLocalTransactions(context = null) {

  const transactions =

    await db.transactions

    .orderBy('transaction_time') //.orderBy('created_at')

    .reverse()

    .toArray();

  return filterTransactionsByScope(
    transactions,
    context
  );

}

/*
|--------------------------------
| Get Transactions
|--------------------------------
*/

export async function
getTransactions(context = null) {

  try {

    return await getLocalTransactions(context);

  } catch {

    return [];

  }

}

/*
|--------------------------------
| Today Transactions
|--------------------------------
*/

export async function
getTodayTransactions(context = null) {

  const transactions =

    filterTransactionsByScope(

      await db.transactions
        .toArray(),

      context

    );

  const today =

    new Date()
      .toISOString()
      .slice(0, 10);

  return transactions.filter(
    (trx) =>

      trx.transaction_time
        ?.slice(0, 10)

      ===

      today
  );

}

/*
|--------------------------------
| Today Revenue
|--------------------------------
*/

export async function
getTodayRevenue(context = null) {

  const transactions =

    await getTodayTransactions(context);

  return transactions.reduce(

    (total, trx) =>

      total +

      Number(
        trx.total || 0
      ),

    0

  );

}

/*
|--------------------------------
| Top Products
|--------------------------------
*/

export async function
getTopProducts(context = null) {

  const transactions =

    filterTransactionsByScope(

      await db.transactions
        .toArray(),

      context

    );

  const map = {};

  for (const trx of transactions) {

    for (
      const item
      of trx.items || []
    ) {

      const name =

        item.product_name ||

        item.product?.title ||

        'Unknown';

      if (!map[name]) {

        map[name] = 0;

      }

      map[name] +=

        Number(item.qty);

    }

  }

  return Object.entries(map)

    .sort(
      (a, b) => b[1] - a[1]
    )

    .slice(0, 5);

}

/*
|--------------------------------
| Get Pending Count
|--------------------------------
*/

export async function
getPendingCount(context = null) {

  const transactions =

    filterTransactionsByScope(

      await db.transactions
      .where('sync_status')
      .equals('pending')
      .toArray(),

      context

    );

  return transactions.length;

}

/*
|--------------------------------
| Weekly Sales
|--------------------------------
*/

export async function
getWeeklySales(context = null) {

  const transactions =

    filterTransactionsByScope(

      await db.transactions
        .toArray(),

      context

    );

  const result = [];

  for (let i = 6; i >= 0; i--) {

    const date =

      new Date();

    date.setDate(
      date.getDate() - i
    );

    const day =

      date.toISOString()
        .slice(0, 10);

    const dailyTransactions =

      transactions.filter(
        (trx) =>

          trx.transaction_time
            ?.slice(0, 10)

          ===

          day
      );

    const total =

      dailyTransactions.reduce(

        (sum, trx) =>

          sum +

          Number(
            trx.total || 0
          ),

        0

      );

    result.push({

      day,

      total,

    });

  }

  return result;

}

/*
|--------------------------------
| Force Retry Transaction
|--------------------------------
*/

export async function
forceRetryTransaction(
  id,
  context = null
) {

  const trx =
    await db.transactions.get(
      Number(id)
    );

  if (!trx) {

    return;

  }

  assertTransactionScope(
    trx,
    context
  );

  if (trx.void_status) {

    await db.transactions.update(

      id,

      {

        sync_status: 'void_pending',

        void_sync_status: 'pending',

        void_retry_count: 0,

        last_error: null,

        updated_at: new Date(),

      }

    );

    return;

  }

  await db.transactions.update(

    id,

    {

      sync_status: 'pending',

      retry_count: 0,

      last_error: null,

      updated_at: new Date(),

    }

  );

}

/*
|--------------------------------
| Delete Transaction
|--------------------------------
*/

export async function
deleteTransaction(
  id,
  context = null
) {

  const trx =
    await db.transactions.get(
      Number(id)
    );

  if (!trx) {

    return 0;

  }

  assertTransactionScope(
    trx,
    context
  );

  return await db.transactions
    .delete(id);

}

export async function
markTransactionFailed(
  id,
  context = null
) {

  const trx =
    await db.transactions.get(
      Number(id)
    );

  if (!trx) {

    return;

  }

  assertTransactionScope(
    trx,
    context
  );

  await db.transactions.update(

    trx.id,

    {

      sync_status:
        'failed',

      updated_at:
        new Date(),

    }

  );

}

/*
|--------------------------------
| Hourly Sales Today
|--------------------------------
*/

export async function
getHourlySales(context = null) {

  const transactions =

    await getTodayTransactions(context);

  const result = [];

  for (let hour = 0; hour < 24; hour++) {

    const total =

      transactions

        .filter((trx) => {

          const trxHour =

            new Date(
              trx.transaction_time
            ).getHours();

          return trxHour === hour;

        })

        .reduce(

          (sum, trx) =>

            sum +

            Number(
              trx.total || 0
            ),

          0

        );

    result.push({

      hour:
        String(hour)
          .padStart(2, '0'),

      total,

    });

  }

  return result;

}


/*
|--------------------------------
|Void Transaction / Pembatalan Transaksi
|--------------------------------
*/

export async function voidTransaction(
  transactionId,
  reason,
  context = null,
  actor = null
) {

  const trx =

    await db.transactions.get(
      Number(transactionId)
    );

  if (!trx) {

    throw new Error(
      'Transaction not found'
    );

  }

  if (trx.void_status) {

    throw new Error(
      'Transaction already voided'
    );

  }

  if (
    context &&
    !matchesTransactionScope(
      trx,
      context
    )
  ) {

    throw new Error(
      'Transaction not found in active store.'
    );

  }

  if (
    actor?.id &&
    String(trx.cashier_id) !== String(actor.id)
  ) {

    throw new Error(
      'Anda tidak dapat membatalkan transaksi milik kasir lain.'
    );

  }

  await db.transaction(

    'rw',

    db.transactions,
    db.products,
    db.stock_movements,

    async () => {

      for (
        const item of trx.items
      ) {

        const product =

          await db.products.get(
            Number(item.product_id)
          );

        if (product) {

          await db.products.update(

              Number(item.product_id),

            {

              stock:

                Number(product.stock) +

                Number(item.qty)

            }

          );

          await db.stock_movements.add({

            ...getTransactionContext(trx),

            product_id:
              Number(item.product_id),

            product_name:
              product.title,

            type:
              'VOID',

            qty:
              Number(item.qty || 0),

            stock_before:
              Number(product.stock || 0),

            stock_after:
              Number(product.stock || 0) +
              Number(item.qty || 0),

            reference_no:
              trx.invoice_no,

            created_at:
              new Date()

          });

        }

      }

      const shouldSyncVoid =

        trx.sync_status === 'synced';

      await db.transactions.update(

        trx.id,

        {

          void_status: true,

          void_at:
            new Date(),

          void_reason:
            reason,

          void_by:

            trx.cashier_name ||

            'Administrator',

          sync_status:
            shouldSyncVoid
              ? 'void_pending'
              : 'void',

          void_sync_status:
            shouldSyncVoid
              ? 'pending'
              : 'not_required',

          void_retry_count:
            0

        }

      );

    }

  );

    await addAuditLog(

      trx.transaction_uuid,

      'TRANSACTION_VOIDED',

      JSON.stringify({

        reason

      }),

      getTransactionContext(trx)

    );

  return true;

}
