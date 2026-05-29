import { create }
from 'zustand';

const useNetworkStore =
  create((set) => ({

    isOnline:
      navigator.onLine,

    pendingCount: 0,

    setOnline: (status) =>

      set({
        isOnline: status
      }),

    setPendingCount:
      (count) =>

        set({
          pendingCount: count
        }),

  }));

export default
  useNetworkStore;