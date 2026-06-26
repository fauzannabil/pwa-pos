export const PWA_OPERATIONAL_ROLES = [
  'cashier',
  'store-manager',
];

export const PWA_MANAGER_ROLES = [
  'store-manager',
];

export const BACKOFFICE_ROLES = [
  'tenant-admin',
  'super-admin',
];

export function getUserRoles(user = null) {
  if (Array.isArray(user?.roles)) {
    return user.roles.map(String);
  }

  if (Array.isArray(user?.role_names)) {
    return user.role_names.map(String);
  }

  if (typeof user?.role === 'string') {
    return [user.role];
  }

  return [];
}

export function hasAnyRole(user, roles = []) {
  const userRoles =
    getUserRoles(user);

  return roles.some(
    (role) =>
      userRoles.includes(role)
  );
}

export function getUserPermissions(user = null) {
  if (Array.isArray(user?.permissions)) {
    return user.permissions.map(String);
  }

  if (user?.permissions && typeof user.permissions === 'object') {
    return Object.entries(user.permissions)
      .filter(([, allowed]) => allowed === true)
      .map(([permission]) => String(permission));
  }

  return [];
}

export function hasAnyPermission(user, permissions = []) {
  if (!permissions || permissions.length === 0) {
    return true;
  }

  const userPermissions =
    getUserPermissions(user);

  return permissions.some(
    (permission) =>
      userPermissions.includes(permission)
  );
}

export function hasAllPermissions(user, permissions = []) {
  if (!permissions || permissions.length === 0) {
    return true;
  }

  const userPermissions =
    getUserPermissions(user);

  return permissions.every(
    (permission) =>
      userPermissions.includes(permission)
  );
}

export function isBackofficeOnlyUser(user) {
  const roles =
    getUserRoles(user);

  return (
    roles.length > 0 &&
    roles.every(
      (role) =>
        BACKOFFICE_ROLES.includes(role)
    )
  );
}

export function canUsePwaPos(user) {
  const roles =
    getUserRoles(user);

  if (roles.length === 0) {
    return true;
  }

  return (
    hasAnyRole(
      user,
      PWA_OPERATIONAL_ROLES
    ) ||
    hasAnyPermission(user, [
      'transactions-access',
      'online-orders-access',
    ])
  );
}

export function canUseManagerTools(user) {
  return (
    hasAnyRole(
      user,
      PWA_MANAGER_ROLES
    ) ||
    hasAnyPermission(user, [
      'dashboard-access',
      'audit-logs-access',
      'products-edit',
      'stock-opnames-access',
    ])
  );
}

export function canViewStoreWideTransactions(user) {
  return canUseManagerTools(user);
}

export function filterTransactionsForUser(
  transactions = [],
  user = null
) {
  if (canViewStoreWideTransactions(user)) {
    return transactions;
  }

  if (!user?.id) {
    return [];
  }

  return transactions.filter(
    (transaction) =>
      String(transaction?.cashier_id) === String(user.id)
  );
}

export function canViewTransaction(
  transaction = null,
  user = null
) {
  if (!transaction) {
    return false;
  }

  if (canViewStoreWideTransactions(user)) {
    return true;
  }

  return String(transaction.cashier_id) === String(user?.id);
}
