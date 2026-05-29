import db from '../db/db';

import api from '../api/api';

let syncInProgress = false;

export async function
saveLocalTransaction(
  transaction
) {

  await db.transactions.add({

    ...transaction,

    sync_status:
      'pending',

    retry_count: 0,

    last_error: null,

    last_sync_at: null,

    created_at:
      new Date(),

  });

}

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
            trx.invoice_no
          );

          continue;

        }

        // set syncing status

        await db.transactions.update(

          trx.id,

          {

            sync_status:
              'syncing',

            last_sync_at:
              new Date(),

          }

        );

        // sync to backend

        await api.post(

          '/pos-transactions',

          {
            transaction_uuid: trx.transaction_uuid, // Pastikan UUID ikut dikirim
            
            cashier_id: trx.cashier_id,        // [TAMBAHKAN INI]

            invoice_no: //tabel db pake invoice saja
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

          }

        );

        syncedCount++;

      } catch (error) {

        console.log(error);

        // retry state

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

      }

    }

    return syncedCount;

  } finally {

    syncInProgress = false;

  }

}

export async function
getLocalTransactions() {

  return await db.transactions

    .orderBy('created_at')

    .reverse()

    .toArray();

}

export async function
getTransactions() {

  try {

    const response =

      await api.get(
        '/transactions'
      );

    return response.data;

  } catch (error) {

    console.log(error);

    return await getLocalTransactions();

  }

}

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

        item.product_title ||

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