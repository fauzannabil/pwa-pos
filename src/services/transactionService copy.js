import db from '../db/db';

import api from '../api/api';

let syncInProgress = false;

export async function saveLocalTransaction(transaction) {

  await db.transactions.add({

    ...transaction,

    sync_status: 'pending',

    created_at: new Date(),

  });

}

export async function getPendingTransactions() {

  return await db.transactions
    .where('sync_status')
    .equals('pending')
    .toArray();

}

export async function syncPendingTransactions() {

  // prevent double sync

  if (syncInProgress) {

    return 0;

  }

  syncInProgress = true;

  try {

    const pendingTransactions =
      await getPendingTransactions();

    let syncedCount = 0;

    for (const trx of pendingTransactions) {

      try {

        await db.transactions.update(
          trx.id,
          {
            sync_status: 'syncing'
          }
        );

        await api.post(
          '/pos-transactions',
          {

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

        await db.transactions.update(
          trx.id,
          {

            sync_status: 'synced',

            synced_at:
              new Date(),

          }
        );

        syncedCount++;

      } catch (error) {

        console.log(error);

        await db.transactions.update(
          trx.id,
          {
            sync_status: 'failed'
          }
        );

      }

    }

    return syncedCount;

  } finally {

    syncInProgress = false;

  }

}

export async function getTransactions() {

  const response =
    await api.get('/transactions');

  return response.data;

}