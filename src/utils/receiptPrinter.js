export const PRINT_TEMPLATES = [
  {
    key: 'invoice',
    label: 'Invoice/Kwitansi',
    description: 'Dokumen A4 untuk bukti pembayaran yang lebih formal.',
  },
  {
    key: 'receipt58',
    label: 'Struk 58mm',
    description: 'Struk kasir ringkas untuk printer thermal kecil.',
  },
  {
    key: 'receipt80',
    label: 'Struk 80mm',
    description: 'Struk thermal lebih lega untuk item yang lebih panjang.',
  },
  {
    key: 'shipping',
    label: 'Resi',
    description: 'Label pengiriman berisi penerima dan ringkasan paket.',
  },
];

const APP_BRAND = 'UNTANPoS';

function rupiah(value) {
  return `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalizeTransaction(transaction) {
  const items = transaction?.details || transaction?.items || [];
  const source = transaction?.source || '';
  const orderChannel = transaction?.order_channel || '';
  const isOnlineOrder =
    source === 'online_order' ||
    orderChannel === 'online' ||
    Boolean(transaction?.online_order_id || transaction?.online_order_number);

  return {
    invoice: transaction?.invoice || transaction?.invoice_no || '-',
    createdAt:
      transaction?.created_at ||
      transaction?.transaction_time ||
      new Date().toISOString(),
    cashier:
      transaction?.cashier?.name ||
      transaction?.cashier_name ||
      'Administrator',
    customer: transaction?.customer || null,
    paymentMethod: transaction?.payment_method || 'cash',
    total: Number(transaction?.grand_total ?? transaction?.total ?? 0),
    paid: Number(transaction?.cash ?? transaction?.paid_amount ?? 0),
    change: Number(transaction?.change ?? transaction?.change_amount ?? 0),
    discount: Number(transaction?.discount || 0),
    shippingCost: Number(transaction?.shipping_cost || 0),
    source,
    orderChannel,
    isOnlineOrder,
    onlineOrderNumber: transaction?.online_order_number || '',
    store: {
      name:
        transaction?.store?.name ||
        transaction?.store_profile?.name ||
        transaction?.store_name ||
        transaction?.tenant_name ||
        'Universitas Tanjungpura Pontianak',
      address:
        transaction?.store?.address ||
        transaction?.store_profile?.address ||
        transaction?.store_address ||
        '',
      phone:
        transaction?.store?.phone ||
        transaction?.store_profile?.phone ||
        transaction?.store_phone ||
        '095179945179',
      email:
        transaction?.store?.email ||
        transaction?.store_profile?.email ||
        transaction?.store_email ||
        '',
      website:
        transaction?.store?.website ||
        transaction?.store_profile?.website ||
        transaction?.store_website ||
        '',
    },
    items: items.map((item, index) => {
      const qty = Number(item.qty || item.quantity || 0);
      const unitPrice =
        item.unit_price !== undefined
          ? Number(item.unit_price || 0)
          : Number(item.price || 0);
      const lineTotal =
        item.unit_price !== undefined
          ? Number(item.price || 0)
          : qty * Number(item.price || 0);

      return {
        id: item.id || item.product_id || index,
        name:
          item.product_name ||
          item.product_title ||
          item.title ||
          item.product?.title ||
          '-',
        barcode: item.barcode || item.product?.barcode || '',
        qty,
        unitPrice,
        lineTotal,
      };
    }),
  };
}

function formatDateTime(value) {
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function paymentLabel(value) {
  const labels = {
    cash: 'Tunai',
    bank_transfer: 'Transfer Bank',
    midtrans: 'Midtrans',
    xendit: 'Xendit',
    pay_later: 'Piutang',
  };

  return labels[String(value || 'cash').toLowerCase()] || 'Tunai';
}

function barcodeHtml(value, height = 48) {
  const bars = String(value || '')
    .split('')
    .map((char, index) => 2 + ((char.charCodeAt(0) + index * 17) % 5));

  return `
    <div class="barcode" style="height:${height}px">
      ${bars
        .map(
          (width) =>
            `<span style="border-left:${width}px solid #0f172a"></span>`
        )
        .join('')}
    </div>
  `;
}

function receiptHtml(transaction, size) {
  const trx = normalizeTransaction(transaction);
  const is58 = size === '58';
  const paperWidth = is58 ? '58mm' : '80mm';
  const line = is58 ? '-'.repeat(24) : '='.repeat(32);
  const fontSize = is58 ? '11px' : '12px';

  return htmlDocument({
    title: `Struk ${trx.invoice}`,
    pageSize: `${paperWidth} auto`,
    bodyClass: 'thermal-page',
    style: `
      body.thermal-page {
        width: ${paperWidth};
        margin: 0;
        padding: ${is58 ? '5px' : '10px'};
        color: #0f172a;
        font-family: "Courier New", monospace;
        font-size: ${fontSize};
      }
      .center { text-align: center; }
      .store-name { font-weight: 800; font-size: ${is58 ? '13px' : '15px'}; }
      .line { white-space: pre; margin: 6px 0; overflow: hidden; }
      .row { display: flex; justify-content: space-between; gap: 8px; }
      .item { margin-bottom: 7px; }
      .item-name { font-weight: 700; overflow-wrap: anywhere; }
      .total { font-weight: 800; font-size: ${is58 ? '12px' : '14px'}; }
      .muted { color: #475569; }
      .channel-badge { display: inline-block; margin-top: 5px; padding: 2px 6px; border: 1px solid #0f172a; border-radius: 999px; font-weight: 800; }
      .brand-footer { margin-top: 7px; font-weight: 800; letter-spacing: .5px; }
      .barcode { display: flex; justify-content: center; align-items: end; gap: 2px; margin-top: 8px; }
      .barcode span { display: block; width: 0; height: 100%; background: #0f172a; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    `,
    content: `
      <section class="center">
        <div class="store-name">${escapeHtml(trx.store.name)}</div>
        ${trx.store.address && !is58 ? `<div>${escapeHtml(trx.store.address)}</div>` : ''}
        ${trx.store.phone ? `<div>Telp: ${escapeHtml(trx.store.phone)}</div>` : ''}
        ${trx.store.email && !is58 ? `<div>${escapeHtml(trx.store.email)}</div>` : ''}
      </section>

      <div class="line">${line}</div>
      <div>${escapeHtml(trx.invoice)}</div>
      ${trx.isOnlineOrder ? `<div class="channel-badge">PESANAN ONLINE</div>` : ''}
      ${trx.onlineOrderNumber ? `<div>Order: ${escapeHtml(trx.onlineOrderNumber)}</div>` : ''}
      <div>${escapeHtml(formatDateTime(trx.createdAt))}</div>
      <div>Kasir: ${escapeHtml(trx.cashier)}</div>
      <div class="line">${line}</div>

      ${trx.items
        .map(
          (item) => `
            <div class="item">
              <div class="item-name">${escapeHtml(item.name)}</div>
              <div class="row">
                <span>${item.qty} x ${rupiah(item.unitPrice)}</span>
                <span>${rupiah(item.lineTotal)}</span>
              </div>
            </div>
          `
        )
        .join('')}

      <div class="line">${line}</div>
      ${
        trx.discount > 0
          ? `<div class="row"><span>Diskon</span><span>-${rupiah(trx.discount)}</span></div>`
          : ''
      }
      ${
        trx.shippingCost > 0
          ? `<div class="row"><span>Ongkir</span><span>${rupiah(trx.shippingCost)}</span></div>`
          : ''
      }
      <div class="row total"><span>TOTAL</span><span>${rupiah(trx.total)}</span></div>
      <div class="row"><span>Bayar (${escapeHtml(paymentLabel(trx.paymentMethod))})</span><span>${rupiah(trx.paid)}</span></div>
      <div class="row"><span>Kembali</span><span>${rupiah(trx.change)}</span></div>
      <div class="line">${line}</div>

      <section class="center">
        <div>Terima kasih</div>
        <div class="muted">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</div>
        ${barcodeHtml(trx.invoice, is58 ? 34 : 44)}
        <div class="muted">${escapeHtml(trx.invoice)}</div>
        <div class="brand-footer">${APP_BRAND}</div>
      </section>
    `,
  });
}

function invoiceHtml(transaction) {
  const trx = normalizeTransaction(transaction);
  const subtotal = trx.items.reduce((sum, item) => sum + item.lineTotal, 0);

  return htmlDocument({
    title: `Invoice ${trx.invoice}`,
    pageSize: 'A4',
    bodyClass: 'invoice-page',
    style: `
      body.invoice-page {
        margin: 0;
        background: #f1f5f9;
        color: #0f172a;
        font-family: Inter, Arial, sans-serif;
        font-size: 13px;
      }
      .sheet {
        width: 190mm;
        min-height: 277mm;
        margin: 10mm auto;
        background: #fff;
        border: 1px solid #e2e8f0;
        box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);
      }
      .header {
        display: grid;
        grid-template-columns: 1.5fr 1fr;
        gap: 24px;
        padding: 28px;
        background: #1d4ed8;
        color: #fff;
      }
      .store { font-size: 22px; font-weight: 800; }
      .badge { text-align: right; font-size: 12px; letter-spacing: 2px; font-weight: 800; }
      .invoice-no { text-align: right; font-size: 22px; font-weight: 800; margin-top: 8px; }
      .content { padding: 28px; }
      .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 22px; }
      .box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
      .label { color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 800; }
      .channel-badge { display: inline-flex; margin-top: 10px; padding: 5px 9px; border-radius: 999px; background: #dbeafe; color: #1d4ed8; font-size: 11px; font-weight: 900; letter-spacing: 1px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #f8fafc; color: #475569; text-align: left; font-size: 11px; text-transform: uppercase; padding: 11px; border-bottom: 1px solid #e2e8f0; }
      td { padding: 12px 11px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
      .right { text-align: right; }
      .center { text-align: center; }
      .summary { width: 76mm; margin-left: auto; margin-top: 22px; }
      .summary .row { display: flex; justify-content: space-between; padding: 7px 0; }
      .grand { border-top: 2px solid #0f172a; font-size: 18px; font-weight: 900; }
      .brand-footer { margin-top: 18px; text-align: center; color: #64748b; font-size: 11px; font-weight: 800; letter-spacing: 1px; }
      .barcode { display: flex; align-items: end; gap: 2px; margin-top: 22px; }
      .barcode span { display: block; width: 0; height: 100%; background: #0f172a; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      @media print {
        body.invoice-page { background: #fff; }
        .sheet { margin: 0; width: auto; min-height: auto; border: 0; box-shadow: none; }
      }
    `,
    content: `
      <main class="sheet">
        <section class="header">
          <div>
            <div class="store">${escapeHtml(trx.store.name)}</div>
            <div>${escapeHtml(trx.store.address)}</div>
            <div>${trx.store.phone ? `Telp: ${escapeHtml(trx.store.phone)}` : ''}</div>
            <div>${escapeHtml(trx.store.email || trx.store.website || '')}</div>
          </div>
          <div>
            <div class="badge">INVOICE / KWITANSI</div>
            <div class="invoice-no">${escapeHtml(trx.invoice)}</div>
            ${trx.isOnlineOrder ? `<div class="channel-badge">PESANAN ONLINE</div>` : ''}
            ${trx.onlineOrderNumber ? `<div class="label" style="margin-top:8px;color:#dbeafe">Order ${escapeHtml(trx.onlineOrderNumber)}</div>` : ''}
          </div>
        </section>

        <section class="content">
          <div class="meta">
            <div class="box">
              <div class="label">Tanggal</div>
              <div>${escapeHtml(formatDateTime(trx.createdAt))}</div>
            </div>
            <div class="box">
              <div class="label">Kasir</div>
              <div>${escapeHtml(trx.cashier)}</div>
            </div>
            <div class="box">
              <div class="label">Pelanggan</div>
              <div>${escapeHtml(trx.customer?.name || 'Umum')}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Produk</th>
                <th class="right">Harga</th>
                <th class="center">Qty</th>
                <th class="right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${trx.items
                .map(
                  (item) => `
                    <tr>
                      <td>
                        <strong>${escapeHtml(item.name)}</strong>
                        ${item.barcode ? `<div class="label">${escapeHtml(item.barcode)}</div>` : ''}
                      </td>
                      <td class="right">${rupiah(item.unitPrice)}</td>
                      <td class="center">${item.qty}</td>
                      <td class="right"><strong>${rupiah(item.lineTotal)}</strong></td>
                    </tr>
                  `
                )
                .join('')}
            </tbody>
          </table>

          <div class="summary">
            <div class="row"><span>Subtotal</span><span>${rupiah(subtotal)}</span></div>
            ${
              trx.discount > 0
                ? `<div class="row"><span>Diskon</span><span>-${rupiah(trx.discount)}</span></div>`
                : ''
            }
            ${
              trx.shippingCost > 0
                ? `<div class="row"><span>Ongkir</span><span>${rupiah(trx.shippingCost)}</span></div>`
                : ''
            }
            <div class="row grand"><span>Total</span><span>${rupiah(trx.total)}</span></div>
            <div class="row"><span>Bayar (${escapeHtml(paymentLabel(trx.paymentMethod))})</span><span>${rupiah(trx.paid)}</span></div>
            <div class="row"><span>Kembali</span><span>${rupiah(trx.change)}</span></div>
          </div>

          ${barcodeHtml(trx.invoice, 54)}
          <p class="label">${escapeHtml(trx.invoice)}</p>
          <div class="brand-footer">${APP_BRAND}</div>
        </section>
      </main>
    `,
  });
}

function shippingHtml(transaction) {
  const trx = normalizeTransaction(transaction);
  const customer = trx.customer || {};
  const itemText = trx.items
    .map((item) => `${item.name} (x${item.qty})`)
    .join(', ');

  return htmlDocument({
    title: `Resi ${trx.invoice}`,
    pageSize: '150mm 100mm',
    bodyClass: 'shipping-page',
    style: `
      body.shipping-page {
        margin: 0;
        background: #f1f5f9;
        color: #0f172a;
        font-family: Inter, Arial, sans-serif;
        font-size: 12px;
      }
      .label-sheet {
        width: 150mm;
        height: 100mm;
        margin: 12mm auto;
        background: #fff;
        border: 2px solid #cbd5e1;
        border-radius: 12px;
        box-sizing: border-box;
        padding: 18px 22px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .top { display: grid; grid-template-columns: 1fr auto; gap: 18px; border-bottom: 2px dashed #cbd5e1; padding-bottom: 14px; }
      .store { font-size: 20px; font-weight: 900; }
      .invoice { text-align: right; color: #1d4ed8; font-size: 18px; font-weight: 900; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
      .title { color: #1d4ed8; font-size: 11px; text-transform: uppercase; font-weight: 900; letter-spacing: 1px; }
      .name { font-size: 18px; font-weight: 900; margin-top: 6px; }
      .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
      .barcode { display: flex; justify-content: end; align-items: end; gap: 1px; margin-top: 4px; }
      .barcode span { display: block; width: 0; height: 100%; background: #0f172a; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .brand-footer { text-align: right; color: #64748b; font-size: 10px; font-weight: 900; letter-spacing: 1px; margin-top: 4px; }
      @media print {
        body.shipping-page { background: #fff; }
        .label-sheet { margin: 0; border-radius: 0; }
      }
    `,
    content: `
      <main class="label-sheet">
        <section class="top">
          <div>
            <div class="store">${escapeHtml(trx.store.name)}</div>
            <div>${trx.store.phone ? `Telp: ${escapeHtml(trx.store.phone)}` : ''}</div>
          </div>
          <div>
            <div class="title">No. Invoice</div>
            <div class="invoice">${escapeHtml(trx.invoice)}</div>
            <div>${escapeHtml(formatDateTime(trx.createdAt))}</div>
          </div>
        </section>

        <section class="grid">
          <div>
            <div class="title">Penerima</div>
            <div class="name">${escapeHtml(customer.name || 'Pelanggan Umum')}</div>
            <div><strong>${escapeHtml(customer.phone || '')}</strong></div>
            <p>${escapeHtml(customer.address || 'Ambil di toko')}</p>
          </div>

          <div class="box">
            <div class="title">Isi Paket</div>
            <p>${escapeHtml(itemText || '-')}</p>
            <div><strong>Total Bayar: ${rupiah(trx.total)}</strong></div>
          </div>
        </section>

        <section>
          ${barcodeHtml(trx.invoice, 38)}
          <div style="text-align:right;font-weight:800;letter-spacing:2px">${escapeHtml(trx.invoice)}</div>
          <div class="brand-footer">${APP_BRAND}</div>
        </section>
      </main>
    `,
  });
}

function htmlDocument({ title, pageSize, bodyClass, style, content }) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${escapeHtml(title)}</title>
        <style>
          @page {
            size: ${pageSize};
            margin: 0;
          }
          * {
            box-sizing: border-box;
          }
          ${style}
        </style>
      </head>
      <body class="${escapeHtml(bodyClass)}">
        ${content}
      </body>
    </html>
  `;
}

export function buildReceiptHtml(transaction, template = 'receipt58') {
  if (!transaction) {
    return '';
  }

  if (template === 'invoice') {
    return invoiceHtml(transaction);
  }

  if (template === 'receipt80') {
    return receiptHtml(transaction, '80');
  }

  if (template === 'shipping') {
    return shippingHtml(transaction);
  }

  return receiptHtml(transaction, '58');
}

export function printTransactionReceipt(
  transaction,
  template = 'receipt58',
  options = {}
) {
  const html = buildReceiptHtml(transaction, template);

  if (!html) {
    return;
  }

  const parser = new DOMParser();
  const printDocument = parser.parseFromString(html, 'text/html');
  const printRoot = document.createElement('div');
  const printStyle = document.createElement('style');
  const appRoot = document.getElementById('root');
  const bodyClass = printDocument.body.className;
  const sourceStyles = Array.from(printDocument.querySelectorAll('style'))
    .map((styleElement) => styleElement.textContent || '')
    .join('\n')
    .replaceAll('body.', '#pos-print-root.')
    .replaceAll('body ', '#pos-print-root ');

  printRoot.id = 'pos-print-root';
  printRoot.className = bodyClass;
  printRoot.innerHTML = printDocument.body.innerHTML;
  printRoot.setAttribute('aria-hidden', 'true');

  printStyle.textContent = `
    ${sourceStyles}

    @media screen {
      #pos-print-root {
        display: none !important;
      }
    }

    @media print {
      body {
        margin: 0 !important;
        background: #fff !important;
      }

      body > *:not(#pos-print-root) {
        display: none !important;
      }

      #pos-print-root {
        display: block !important;
      }
    }
  `;

  let cleanedUp = false;

  const cleanup = () => {
    if (cleanedUp) {
      return;
    }

    cleanedUp = true;
    window.removeEventListener('afterprint', cleanup);
    printRoot.remove();
    printStyle.remove();
    appRoot?.removeAttribute('aria-hidden');
    options.onAfterPrint?.();
  };

  appRoot?.setAttribute('aria-hidden', 'true');
  document.head.appendChild(printStyle);
  document.body.appendChild(printRoot);
  window.addEventListener('afterprint', cleanup, { once: true });

  setTimeout(() => {
    window.print();
    setTimeout(cleanup, 30000);
  }, 100);
}
