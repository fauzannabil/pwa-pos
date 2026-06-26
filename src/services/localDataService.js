import db from '../db/db';

const AUTH_SCOPE_KEY = 'auth_scope';

const ACTIVE_SYNC_STATUSES = [
  'pending',
  'retry',
  'syncing',
  'failed',
  'conflict',
  'blocked',
  'void_pending',
  'void_retry',
  'void_syncing',
  'void_failed',
  'void_conflict',
  'void_blocked',
];

const ACTIVE_VOID_STATUSES = [
  'pending',
  'retry',
  'syncing',
  'failed',
  'conflict',
  'blocked',
];

function parseStoredJson(key) {
  try {
    return JSON.parse(
      localStorage.getItem(key)
    );
  } catch {
    return null;
  }
}

function normalizeId(value) {
  return value == null
    ? null
    : String(value);
}

export function buildAuthScope({
  tenant = null,
  store = null,
  terminal = null,
} = {}) {
  return {
    tenant_id: normalizeId(tenant?.id || tenant?.tenant_id),
    store_id: normalizeId(store?.id || store?.store_id),
    terminal_id: normalizeId(terminal?.id || terminal?.terminal_id),
  };
}

export function getStoredAuthScope() {
  const stored =
    parseStoredJson(AUTH_SCOPE_KEY);

  if (stored?.tenant_id || stored?.store_id || stored?.terminal_id) {
    return buildAuthScope({
      tenant: { id: stored.tenant_id },
      store: { id: stored.store_id },
      terminal: { id: stored.terminal_id },
    });
  }

  return buildAuthScope({
    tenant: parseStoredJson('tenant'),
    store: parseStoredJson('store'),
    terminal: parseStoredJson('terminal'),
  });
}

export function storeAuthScope(scope) {
  localStorage.setItem(
    AUTH_SCOPE_KEY,
    JSON.stringify(scope)
  );
}

export function clearStoredAuthScope() {
  localStorage.removeItem(
    AUTH_SCOPE_KEY
  );
}

export function hasCompleteScope(scope) {
  return Boolean(
    scope?.tenant_id &&
    scope?.store_id &&
    scope?.terminal_id
  );
}

export function isSameScope(a, b) {
  return (
    normalizeId(a?.tenant_id) === normalizeId(b?.tenant_id) &&
    normalizeId(a?.store_id) === normalizeId(b?.store_id) &&
    normalizeId(a?.terminal_id) === normalizeId(b?.terminal_id)
  );
}

function matchesTenantStore(record, scope) {
  return (
    normalizeId(record?.tenant_id) === normalizeId(scope?.tenant_id) &&
    normalizeId(record?.store_id) === normalizeId(scope?.store_id)
  );
}

function matchesFullScope(record, scope) {
  return (
    matchesTenantStore(record, scope) &&
    normalizeId(record?.terminal_id) === normalizeId(scope?.terminal_id)
  );
}

function isUnfinishedTransaction(transaction) {
  return (
    ACTIVE_SYNC_STATUSES.includes(transaction?.sync_status) ||
    ACTIVE_VOID_STATUSES.includes(transaction?.void_sync_status)
  );
}

export async function getPendingLocalWorkCount(scope) {
  if (!hasCompleteScope(scope)) {
    return 0;
  }

  const transactions =
    await db.transactions
      .filter(
        (transaction) =>
          matchesFullScope(transaction, scope) &&
          isUnfinishedTransaction(transaction)
      )
      .count();

  return transactions;
}

async function deleteByTenantStore(table, scope) {
  if (!scope?.tenant_id || !scope?.store_id) {
    return;
  }

  await table
    .filter(
      (record) =>
        matchesTenantStore(record, scope)
    )
    .delete();
}

async function deleteByFullScope(table, scope) {
  if (!hasCompleteScope(scope)) {
    return;
  }

  await table
    .filter(
      (record) =>
        matchesFullScope(record, scope)
    )
    .delete();
}

async function deleteSyncMetaForScope(scope) {
  if (!scope?.tenant_id || !scope?.store_id) {
    return;
  }

  await db.sync_meta
    .filter((record) => {
      const key =
        String(record?.key || '');

      return (
        key.includes(`:${scope.tenant_id}:${scope.store_id}`) ||
        key.includes(`${scope.tenant_id}:${scope.store_id}`)
      );
    })
    .delete();
}

export async function clearLocalScopeData(scope) {
  if (!scope?.tenant_id || !scope?.store_id) {
    return;
  }

  await db.transaction(
    'rw',
    db.products,
    db.transactions,
    db.audit_logs,
    db.stock_movements,
    db.sync_meta,
    async () => {
      await deleteByTenantStore(db.products, scope);
      await deleteByFullScope(db.transactions, scope);
      await deleteByFullScope(db.audit_logs, scope);
      await deleteByFullScope(db.stock_movements, scope);
      await deleteSyncMetaForScope(scope);
    }
  );
}

export async function prepareAuthScopeSwitch(nextScope) {
  const currentScope =
    getStoredAuthScope();

  if (
    !hasCompleteScope(currentScope) ||
    isSameScope(currentScope, nextScope)
  ) {
    return;
  }

  const pendingCount =
    await getPendingLocalWorkCount(currentScope);

  if (pendingCount > 0) {
    throw new Error(
      `Masih ada ${pendingCount} transaksi offline pada user/toko sebelumnya. Sinkronkan dulu sebelum pindah akun atau toko.`
    );
  }

  await clearLocalScopeData(currentScope);
}

export async function clearLocalAuthScopeForLogout() {
  const currentScope =
    getStoredAuthScope();

  if (!hasCompleteScope(currentScope)) {
    clearStoredAuthScope();
    return;
  }

  const pendingCount =
    await getPendingLocalWorkCount(currentScope);

  if (pendingCount > 0) {
    throw new Error(
      `Logout ditahan karena masih ada ${pendingCount} transaksi offline yang belum tersinkron. Jalankan sync terlebih dahulu.`
    );
  }

  await clearLocalScopeData(currentScope);
  clearStoredAuthScope();
}
