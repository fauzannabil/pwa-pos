import { getApiUrl } from '../config/apiConfig';
import useCustomerAuthStore from '../stores/customerAuthStore';

async function readJson(response) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      payload?.message ||
      Object.values(payload?.errors || {})?.flat()?.[0] ||
      'Permintaan gagal diproses.';

    throw new Error(message);
  }

  return payload;
}

export async function fetchPublicStores(params = {}) {
  const token = useCustomerAuthStore.getState().token;
  const query = new URLSearchParams();

  if (params.search) {
    query.set('search', params.search);
  }

  const response = await fetch(
    getApiUrl(`shop/stores${query.toString() ? `?${query}` : ''}`),
    {
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  return readJson(response);
}

export async function fetchStoreProducts(storeId, params = {}) {
  const token = useCustomerAuthStore.getState().token;
  const query = new URLSearchParams();

  if (params.search) {
    query.set('search', params.search);
  }

  const response = await fetch(
    getApiUrl(`shop/stores/${storeId}/products${query.toString() ? `?${query}` : ''}`),
    {
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  return readJson(response);
}

export async function fetchCustomerMemberships() {
  const token = useCustomerAuthStore.getState().token;

  if (!token) return { data: [] };

  const response = await fetch(getApiUrl('shop/memberships'), {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  return readJson(response);
}

export async function joinStoreMembership(storeId) {
  const token = useCustomerAuthStore.getState().token;

  if (!token) throw new Error('Silakan login sebelum bergabung sebagai member.');

  const response = await fetch(getApiUrl(`shop/stores/${storeId}/membership`), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  return readJson(response);
}

export async function createOnlineOrder(storeId, order) {
  const token = useCustomerAuthStore.getState().token;
  const response = await fetch(
    getApiUrl(`shop/stores/${storeId}/orders`),
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(order),
    }
  );

  return readJson(response);
}

export async function fetchOnlineOrderStatus(orderUuid) {
  const token = useCustomerAuthStore.getState().token;
  const response = await fetch(getApiUrl(`shop/orders/${orderUuid}`), {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return readJson(response);
}

export async function registerCustomer(payload) {
  const response = await fetch(getApiUrl('customer/register'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return readJson(response);
}

export async function verifyCustomerOtp(payload) {
  const response = await fetch(getApiUrl('customer/verify-otp'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return readJson(response);
}

export async function resendCustomerOtp(phone) {
  const response = await fetch(getApiUrl('customer/resend-otp'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone }),
  });

  return readJson(response);
}

export async function loginCustomer(payload) {
  const response = await fetch(getApiUrl('customer/login'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return readJson(response);
}

export async function logoutCustomer() {
  const token = useCustomerAuthStore.getState().token;

  if (!token) return { message: 'Logged out' };

  const response = await fetch(getApiUrl('customer/logout'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  return readJson(response);
}

export async function fetchCustomerMe() {
  const token = useCustomerAuthStore.getState().token;

  if (!token) throw new Error('Customer belum login.');

  const response = await fetch(getApiUrl('customer/me'), {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  return readJson(response);
}
