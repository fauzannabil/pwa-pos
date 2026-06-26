export const SALE_ACTIVE_SYNC_STATUSES = [
  'pending',
  'retry',
  'syncing',
];

export const VOID_ACTIVE_SYNC_STATUSES = [
  'void_pending',
  'void_retry',
  'void_syncing',
];

export const BLOCKED_SYNC_STATUSES = [
  'blocked',
  'void_blocked',
];

export const FAILED_SYNC_STATUSES = [
  'failed',
  'void_failed',
];

export const CONFLICT_SYNC_STATUSES = [
  'conflict',
  'void_conflict',
];

export const SYNCED_STATUSES = [
  'synced',
  'void_synced',
];

export function getEffectiveTransactionStatus(transaction = {}) {
  if (transaction.void_sync_status) {
    return `void_${transaction.void_sync_status}`;
  }

  return transaction.sync_status || 'unknown';
}

export function getTransactionStatusCategory(transaction = {}) {
  const status =
    getEffectiveTransactionStatus(transaction);

  if (SYNCED_STATUSES.includes(status)) {
    return 'synced';
  }

  if (SALE_ACTIVE_SYNC_STATUSES.includes(status)) {
    return 'pending';
  }

  if (VOID_ACTIVE_SYNC_STATUSES.includes(status)) {
    return 'void_pending';
  }

  if (BLOCKED_SYNC_STATUSES.includes(status)) {
    return 'blocked';
  }

  if (FAILED_SYNC_STATUSES.includes(status)) {
    return 'failed';
  }

  if (CONFLICT_SYNC_STATUSES.includes(status)) {
    return 'conflict';
  }

  if (status === 'void') {
    return 'void';
  }

  return 'unknown';
}

export function getTransactionStatusLabel(transaction = {}) {
  const status =
    getEffectiveTransactionStatus(transaction);

  return status
    .replace(/_/g, ' ')
    .toUpperCase();
}

export function getTransactionStatusClass(transaction = {}) {
  const category =
    getTransactionStatusCategory(transaction);

  if (category === 'synced') {
    return 'bg-emerald-500 text-white';
  }

  if (category === 'blocked') {
    return 'bg-rose-600 text-white';
  }

  if (category === 'failed') {
    return 'bg-red-500 text-white';
  }

  if (category === 'conflict') {
    return 'bg-purple-600 text-white';
  }

  if (category === 'void' || category === 'void_pending') {
    return 'bg-slate-700 text-white';
  }

  if (category === 'pending') {
    return 'bg-amber-500 text-white';
  }

  return 'bg-slate-400 text-white';
}

export function countTransactionsByCategory(transactions = []) {
  return transactions.reduce(
    (summary, transaction) => {
      const category =
        getTransactionStatusCategory(transaction);

      summary.total += 1;
      summary[category] =
        (summary[category] || 0) + 1;

      return summary;
    },
    {
      total: 0,
      synced: 0,
      pending: 0,
      void_pending: 0,
      blocked: 0,
      failed: 0,
      conflict: 0,
      void: 0,
      unknown: 0,
    }
  );
}

export function matchesTransactionStatusFilter(
  transaction,
  filter = 'all'
) {
  if (filter === 'all') {
    return true;
  }

  return getTransactionStatusCategory(transaction) === filter;
}
