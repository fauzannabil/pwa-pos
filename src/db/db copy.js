import Dexie from 'dexie';

const db = new Dexie('pos_database');

db.version(1).stores({

  products: 'id, barcode, title',

  transactions: '++id, status, created_at',

});

export default db;