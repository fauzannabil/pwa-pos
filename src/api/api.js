import axios from 'axios';
import {
  getApiBaseUrl
} from '../config/apiConfig';

const api = axios.create({

  baseURL:
    getApiBaseUrl(),
    
    timeout: 10000,

});

api.interceptors.request.use(

  (config) => {

    const token =
      localStorage.getItem('token');

    if (
      token &&
      config.url !== '/login'
    ) {

      config.headers.Authorization =
        `Bearer ${token}`;

    }

    return config;

  },

  (error) => {

    return Promise.reject(error);

  }

);

api.interceptors.response.use(

  (response) => response,

  (error) => {

    if (
      error.response &&
      error.response.status === 401
    ) {

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
      localStorage.removeItem('store');
      localStorage.removeItem('terminal');
      localStorage.removeItem('subscription');
      localStorage.removeItem('active_cashier_shift');
      localStorage.removeItem('auth_scope');

      window.dispatchEvent(
        new CustomEvent(
          'saas:access-blocked',
          {
            detail: {
              title:
                'Sesi login berakhir',
              message:
                'Silakan login kembali untuk melanjutkan transaksi.',
              status:
                401,
            },
          }
        )
      );

      window.location.href = '/login';

    }

    if (
      error.response &&
      [402, 403].includes(error.response.status)
    ) {

      const message =
        error.response.data?.message ||
        (
          error.response.status === 402
            ? 'Subscription tenant tidak aktif.'
            : 'Akses POS ditolak. Periksa status tenant, toko, atau terminal.'
        );

      window.dispatchEvent(
        new CustomEvent(
          'saas:access-blocked',
          {
            detail: {
              title:
                error.response.status === 402
                  ? 'Subscription tidak aktif'
                  : 'Akses toko ditolak',
              message,
              status:
                error.response.status,
            },
          }
        )
      );

      if (error.response.status === 402) {

        window.dispatchEvent(
          new CustomEvent(
            'saas:subscription-blocked',
            {
              detail: {
                message,
                status:
                  error.response.status,
              },
            }
          )
        );

      }

    }

    return Promise.reject(error);

  }

);

export default api;
