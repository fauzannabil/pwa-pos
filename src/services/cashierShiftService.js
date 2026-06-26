import api from '../api/api';

export async function getActiveCashierShift() {
  const response =
    await api.get('/cashier-shifts/active');

  return response.data?.active_cashier_shift || null;
}
