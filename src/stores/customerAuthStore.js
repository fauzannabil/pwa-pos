import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCustomerAuthStore = create(
  persist(
    (set) => ({
      token: null,
      customer: null,

      login(token, customer) {
        set({ token, customer });
      },

      setCustomer(customer) {
        set({ customer });
      },

      logout() {
        set({ token: null, customer: null });
      },
    }),
    {
      name: 'untanpos-customer-auth',
    }
  )
);

export default useCustomerAuthStore;
