import Dexie from 'dexie';

const db = new Dexie(
  'pos_database'
);

db.version(11).stores({

  products: `
    id,
    tenant_id,
    store_id,
    category_id,
    title,
    image,
    image_url,
    barcode,
    stock,
    updated_at,
    deleted_at,
    last_synced_at
  `,

  transactions: `
    ++id,
    transaction_uuid,
    tenant_id,
    store_id,
    terminal_id,
    invoice_no,
    cashier_id,
    sync_status,
    void_sync_status,
    status,
    retry_count,
    void_retry_count,
    paid_amount,
    change_amount,
    created_at,
    updated_at,
    transaction_time
  `,

  audit_logs: `
    ++id,
    tenant_id,
    store_id,
    terminal_id,
    transaction_uuid,
    event,
    created_at
  `,

    stock_movements:
    `++id,
    tenant_id,
    store_id,
    terminal_id,
    product_id, 
    reference_no,
    movement_type,
    created_at`

  ,

  sync_meta: `
    key
  `

});

db.version(12).stores({

  products: `
    id,
    tenant_id,
    store_id,
    category_id,
    title,
    image,
    image_url,
    barcode,
    stock,
    updated_at,
    deleted_at,
    last_synced_at
  `,

  transactions: `
    ++id,
    transaction_uuid,
    tenant_id,
    store_id,
    terminal_id,
    cashier_shift_id,
    invoice_no,
    cashier_id,
    sync_status,
    void_sync_status,
    status,
    retry_count,
    void_retry_count,
    paid_amount,
    change_amount,
    created_at,
    updated_at,
    transaction_time
  `,

  audit_logs: `
    ++id,
    tenant_id,
    store_id,
    terminal_id,
    transaction_uuid,
    event,
    created_at
  `,

  stock_movements:
    `++id,
    tenant_id,
    store_id,
    terminal_id,
    product_id, 
    reference_no,
    movement_type,
    created_at`

  ,

  sync_meta: `
    key
  `

});

export default db;
