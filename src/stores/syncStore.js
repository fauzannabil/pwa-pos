import { create } from 'zustand';

const useSyncStore = create((set) => ({

  online: navigator.onLine,

  syncing: false,

  pendingCount: 0,

  lastSync: null,

  setOnline: (status) =>
    set({
      online: status
    }),

  setSyncing: (status) =>
    set({
      syncing: status
    }),

  setPendingCount: (count) =>
    set({
      pendingCount: count
    }),

  setLastSync: () =>
    set({
      lastSync: new Date()
    }),

}));

export default useSyncStore;