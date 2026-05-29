import Dexie from 'dexie';

const db = new Dexie(
  'pos_database'
);

db.version(3).stores({

  products: `
    id,
    title,
    image,
    barcode,
    stock
  `,

  transactions: `
    ++id,
    transaction_uuid,
    invoice_no,
    status,
    sync_status,
    created_at
  `,

});

export default db;