import {

  syncPendingTransactions
  ,
  syncPendingVoids

} from './transactionService';

import {

  syncProducts

} from './productService';

import useAuthStore
  from '../stores/authStore';

import {
  getTransactionScope
} from './transactionService';
import {
  getApiUrl
} from '../config/apiConfig';
import {
  dispatchSaasAccessBlocked,
  validatePosContext,
  validateSyncContext
} from '../utils/saasContext';

let syncInterval = null;

let syncRunning = false;
let lastContextAlertAt = 0;

function notifyContextBlocked(message) {

  const now =
    Date.now();

  if (now - lastContextAlertAt < 60000) {

    return;

  }

  lastContextAlertAt = now;

  dispatchSaasAccessBlocked({
    title:
      'Auto sync tertahan',
    message,
  });

}

async function
isBackendReachable() {

  try {

    const response =

      await fetch(

        getApiUrl('ping'),

        {
          method: 'GET',
        }

      );

    return response.ok;

  } catch {

    return false;

  }

}

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

    const {
      token,
      tenant,
      store,
      terminal,
      subscription,
    } = useAuthStore.getState();

    if (!token) {

      return;

    }

    const posValidation =
      validatePosContext({
        tenant,
        store,
        terminal,
        subscription,
      });

    if (!posValidation.ok) {

      notifyContextBlocked(
        posValidation.reason
      );

      return;

    }

    /*
    |--------------------------------
    | Check Backend
    |--------------------------------
    */

    const backendOnline = await isBackendReachable();

    if (!backendOnline) {

        return;

    }

  syncRunning = true;

  try {

    // sync transactions

    const context =
      getTransactionScope({
        tenant,
        store,
        terminal,
      });

    const syncValidation =
      validateSyncContext(
        context
      );

    if (!syncValidation.ok) {

      notifyContextBlocked(
        syncValidation.reason
      );

      return;

    }

    const synced =

      await syncPendingTransactions(context);

    const voidSynced =

      await syncPendingVoids(context);

    // refresh products

    if (
      synced > 0 ||
      voidSynced > 0
    ) {

      await syncProducts(context);

    }

  } catch {

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
