import db from '../db/db';
import api from '../api/api';
import { reduceLocalStock } from './productService';
import { addAuditLog } from './auditService';


let syncInProgress = false;

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

  await db.transaction(

    'rw',

    db.transactions,
    db.products,
    db.audit_logs,

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

        last_error: null,

        last_sync_at: null,

        created_at: new Date(),

        //tambah field void (pembatalan)
        void_status: false,
        void_at: null,
        void_reason: null,
        void_by: null,

      });

      await addAuditLog(
        transaction.transaction_uuid,
        'TRANSACTION_CREATED'
      );


      /*
      |----------------------------
      | Reduce Stock
      |----------------------------
      */

      await reduceLocalStock(
        transaction.items,
        transaction.invoice_no
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
getPendingTransactions() {

  return await db.transactions

    .where('sync_status')

    .anyOf(
      'pending',
      'retry',
      'failed'
    )

    .toArray();

}

/*
|--------------------------------
| Count Pending Transactions
|--------------------------------
*/

export async function
countPendingTransactions() {

  return await db.transactions

    .where('sync_status')

    .anyOf(
      'pending',
      'retry',
      'failed'
    )

    .count();

}

/*
|--------------------------------
| Sync Pending Transactions
|--------------------------------
*/

export async function
  syncPendingTransactions() {

  // prevent double sync

  if (syncInProgress) {

    return 0;

  }

  syncInProgress = true;

  try {

    const pendingTransactions =

      await getPendingTransactions();

    let syncedCount = 0;

    const MAX_RETRY = 10;

    for (
      const trx
      of pendingTransactions
    ) {

      try {

        // max retry protection

        if (

          Number(
            trx.retry_count || 0
          ) >= MAX_RETRY

        ) {

          console.log(
            'Max retry reached:',
            trx.invoice
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

            cashier_id:
              trx.cashier_id,

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

    console.log(error);

    /*
    |--------------------------------
    | Detect Conflict Error
    |--------------------------------
    */

    const errorMessage =

      error?.response?.data?.error ||

      error?.message ||

      'Sync failed';

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

        }

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

    if ( statusCode === 422 ||
        statusCode === 400 ) 
     {

        await db.transactions.update(

          trx.id,

            {

              sync_status:
                'failed',

              last_error:

                error?.response?.data?.message ||

                error.message ||

                'Validation failed',

              last_sync_at:
                new Date(),

            }

        );

            console.log(
              'Hard failed:',
              trx.invoice_no
            );

      }

      /*
      |--------------------------------
      | Retryable Error
      |--------------------------------
      */

        else {

            await db.transactions.update(

              trx.id,

              {

                sync_status:
                  'retry',

                retry_count:

                  Number(
                    trx.retry_count || 0
                  ) + 1,

                last_error:

                  error.message ||

                  'Sync failed',

                last_sync_at:
                  new Date(),

              }

            );

            await addAuditLog(

              trx.transaction_uuid,

              'TRANSACTION_RETRY',

              error.message

            );

            if (
              Number(trx.retry_count || 0) + 1 >= MAX_RETRY
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

/*
|--------------------------------
| Get Local Transactions
|--------------------------------
*/

export async function
getLocalTransactions() {

  return await db.transactions

    .orderBy('transaction_time') //.orderBy('created_at')

    .reverse()

    .toArray();

}

/*
|--------------------------------
| Get Transactions
|--------------------------------
*/

export async function
getTransactions() {

  try {

    return await getLocalTransactions();

  } catch (error) {

    console.log(error);

    return [];

  }

}

/*
|--------------------------------
| Today Transactions
|--------------------------------
*/

export async function
getTodayTransactions() {

  const transactions =

    await db.transactions
      .toArray();

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
getTodayRevenue() {

  const transactions =

    await getTodayTransactions();

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
getTopProducts() {

  const transactions =

    await db.transactions
      .toArray();

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
getPendingCount() {

  const transactions =

    await db.transactions
      .where('sync_status')
      .equals('pending')
      .toArray();

  return transactions.length;

}

/*
|--------------------------------
| Weekly Sales
|--------------------------------
*/

export async function
getWeeklySales() {

  const transactions =

    await db.transactions
      .toArray();

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
forceRetryTransaction(id) {

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
deleteTransaction(id) {

  return await db.transactions
    .delete(id);

}

/*
|--------------------------------
| Hourly Sales Today
|--------------------------------
*/

export async function
getHourlySales() {

  const transactions =

    await getTodayTransactions();

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
  reason
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

  await db.transaction(

    'rw',

    db.transactions,
    db.products,

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

        }

      }

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
            'void'

        }

      );

    }

  );

    await addAuditLog(

      trx.transaction_uuid,

      'TRANSACTION_VOIDED',

      JSON.stringify({

        reason

      })

    );

  return true;

}