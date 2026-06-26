import api from '../api/api';

export async function getOnlineOrders(params = {}) {
  const response = await api.get('/online-orders', {
    params,
  });

  return response.data?.data || [];
}

export async function getOnlineOrder(orderId) {
  const response = await api.get(`/online-orders/${orderId}`);

  return response.data?.data;
}

export async function acceptOnlineOrder(orderId) {
  const response = await api.post(`/online-orders/${orderId}/accept`);

  return response.data;
}

export async function markOnlineOrderReady(orderId) {
  const response = await api.post(`/online-orders/${orderId}/ready`);

  return response.data;
}

export async function completeOnlineOrder(orderId) {
  const response = await api.post(`/online-orders/${orderId}/complete`);

  return response.data;
}
