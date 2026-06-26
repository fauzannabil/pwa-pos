import { create } from 'zustand';
import {
  buildAuthScope,
  clearLocalAuthScopeForLogout,
  clearStoredAuthScope,
  prepareAuthScopeSwitch,
  storeAuthScope,
} from '../services/localDataService';

function readStorageJson(key) {
  try {
    return JSON.parse(
      localStorage.getItem(key)
    );
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

const useAuthStore = create((set) => ({

  token: localStorage.getItem('token'),

  user: readStorageJson('user'),

  tenant: readStorageJson('tenant'),

  store: readStorageJson('store'),

  terminal: readStorageJson('terminal'),

  subscription: readStorageJson('subscription'),

  activeCashierShift: readStorageJson('active_cashier_shift'),

  login: async (
    token,
    user,
    tenant = null,
    store = null,
    terminal = null,
    subscription = null,
    activeCashierShift = null
  ) => {
    const nextScope =
      buildAuthScope({
        tenant,
        store,
        terminal,
      });

    await prepareAuthScopeSwitch(
      nextScope
    );

    localStorage.setItem(
      'token',
      token
    );

    localStorage.setItem(
      'user',
      JSON.stringify(user)
    );

    localStorage.setItem(
      'tenant',
      JSON.stringify(tenant)
    );

    localStorage.setItem(
      'store',
      JSON.stringify(store)
    );

    localStorage.setItem(
      'terminal',
      JSON.stringify(terminal)
    );

    localStorage.setItem(
      'subscription',
      JSON.stringify(subscription)
    );

    localStorage.setItem(
      'active_cashier_shift',
      JSON.stringify(activeCashierShift)
    );

    storeAuthScope(
      nextScope
    );

    set({
      token,
      user,
      tenant,
      store,
      terminal,
      subscription,
      activeCashierShift,
    });

  },

  setActiveCashierShift: (activeCashierShift) => {
    localStorage.setItem(
      'active_cashier_shift',
      JSON.stringify(activeCashierShift)
    );

    set({
      activeCashierShift,
    });
  },

  logout: async ({
    clearLocalData = true,
  } = {}) => {

    if (clearLocalData) {

      await clearLocalAuthScopeForLogout();

    } else {

      clearStoredAuthScope();

    }

    localStorage.removeItem('token');

    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    localStorage.removeItem('store');
    localStorage.removeItem('terminal');
    localStorage.removeItem('subscription');
    localStorage.removeItem('active_cashier_shift');

    set({
      token: null,
      user: null,
      tenant: null,
      store: null,
      terminal: null,
      subscription: null,
      activeCashierShift: null,
    });

  },

}));

export default useAuthStore;
