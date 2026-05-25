import Dexie from 'dexie';

const db = new Dexie('pos_database');

db.version(2).stores({

  products: `
    ++id,
    title,
    barcode,
    stock
  `,

  transactions: `
    ++id,
    invoice_no,
    status,
    sync_status,
    created_at
  `,

});

export default db;