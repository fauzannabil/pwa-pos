export const SUBSCRIPTION_BLOCKED_STATUSES = [
  'past_due',
  'canceled',
  'expired',
];

export function hasTenantContext({
  tenant,
  store,
  terminal,
}) {
  return Boolean(
    tenant?.id &&
    store?.id &&
    terminal?.id
  );
}

export function getMissingTenantContext({
  tenant,
  store,
  terminal,
}) {
  const missing = [];

  if (!tenant?.id) missing.push('tenant');
  if (!store?.id) missing.push('store');
  if (!terminal?.id) missing.push('terminal');

  return missing;
}

export function isSubscriptionBlocked(subscription) {
  const status =
    subscription?.status ||
    subscription?.subscription?.status;

  return SUBSCRIPTION_BLOCKED_STATUSES.includes(
    status
  );
}

export function validatePosContext({
  tenant,
  store,
  terminal,
  subscription,
}) {
  const missing = getMissingTenantContext({
    tenant,
    store,
    terminal,
  });

  if (missing.length > 0) {
    return {
      ok: false,
      reason: `POS context belum lengkap: ${missing.join(', ')}.`,
    };
  }

  if (tenant?.status && tenant.status !== 'active') {
    return {
      ok: false,
      reason: 'Tenant tidak aktif.',
    };
  }

  if (store?.status && store.status !== 'active') {
    return {
      ok: false,
      reason: 'Store tidak aktif.',
    };
  }

  if (terminal?.status && terminal.status !== 'active') {
    return {
      ok: false,
      reason: 'Terminal tidak aktif.',
    };
  }

  if (isSubscriptionBlocked(subscription)) {
    return {
      ok: false,
      reason: 'Subscription tenant tidak aktif. Hubungi admin.',
    };
  }

  return {
    ok: true,
    reason: null,
  };
}

export function validateSyncContext(context = {}) {
  const missing = [];

  if (!context?.tenant_id) missing.push('tenant');
  if (!context?.store_id) missing.push('store');
  if (!context?.terminal_id) missing.push('terminal');

  if (missing.length > 0) {
    return {
      ok: false,
      reason: `Sync context belum lengkap: ${missing.join(', ')}.`,
    };
  }

  return {
    ok: true,
    reason: null,
  };
}

export function dispatchSaasAccessBlocked({
  title = 'Akses POS tertahan',
  message = 'Tenant, toko, terminal, atau subscription sedang tidak aktif.',
  status = null,
} = {}) {
  window.dispatchEvent(
    new CustomEvent(
      'saas:access-blocked',
      {
        detail: {
          title,
          message,
          status,
        },
      }
    )
  );
}

export function getApiErrorMessage(error, fallback = 'Request failed') {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}
