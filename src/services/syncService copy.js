import {

  syncPendingTransactions

} from './transactionService';

import {

  syncProducts

} from './productService';

let syncInterval = null;

let syncRunning = false;

export async function
runAutoSync() {

  // prevent double sync

  if (syncRunning) {

    return;

  }

  // browser offline

  if (!navigator.onLine) {

    return;

  }

  syncRunning = true;

  try {

    console.log(
      'Running auto sync...'
    );

    // sync transactions

    const synced =

      await syncPendingTransactions();

    // refresh products

    if (synced > 0) {

      await syncProducts();

    }

    console.log(
      'Auto sync done:',
      synced
    );

  } catch (error) {

    console.log(error);

  } finally {

    syncRunning = false;

  }

}

export function
startAutoSync() {

  // prevent duplicate interval

  if (syncInterval) {

    return;

  }

  // online event

  window.addEventListener(

    'online',

    async () => {

      console.log(
        'Back online'
      );

      await runAutoSync();

    }

  );

  // periodic sync

  syncInterval = setInterval(

    async () => {

      await runAutoSync();

    },

    30000 // 30 sec

  );

  console.log(
    'Auto sync started'
  );

}

export function
stopAutoSync() {

  if (syncInterval) {

    clearInterval(
      syncInterval
    );

    syncInterval = null;

  }

}