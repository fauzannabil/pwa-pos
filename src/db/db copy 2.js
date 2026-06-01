import Dexie from 'dexie';

const db = new Dexie(
  'pos_database'
);

db.version(4).stores({

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
    cashier_id,
    sync_status,
    status,
    retry_count,
    paid_amount,
    change_amount,
    created_at,
    updated_at,
    transaction_time
  `,

  audit_logs: `
    ++id,
    transaction_uuid,
    event,
    created_at
  `,

});

export default db;