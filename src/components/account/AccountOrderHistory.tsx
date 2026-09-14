"use client";

import type { OrderHistoryView } from "@/server/order/order-history-service";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium" }).format(new Date(value));
}

function formatMoney(value: { amount: number; currency: string }) {
  return new Intl.NumberFormat("sv-SE", { style: "currency", currency: value.currency }).format(value.amount / 100);
}

export function AccountOrderHistory({ orders }: { orders: OrderHistoryView[] }) {
  return (
    <section className="account-orders" aria-labelledby="order-history-title">
      <div className="account-orders__header">
        <div><p className="account-page__eyebrow">ORDER HISTORY</p><h2 id="order-history-title">Your Maison purchases</h2><p>Review your orders and the details captured at the time of purchase.</p></div>
      </div>
      {orders.length === 0 ? <div className="account-orders__empty"><h3>No orders yet</h3><p>Your completed Maison purchases will appear here.</p></div> : <ol className="account-orders__list">{orders.map((order) => <li key={order.orderNumber} className="account-order"><details><summary><span><strong>{order.orderNumber}</strong><small>{formatDate(order.createdAt)}</small></span><span className="account-order__summary"><b>{formatMoney(order.totals.total)}</b><em>{order.status}</em></span></summary><div className="account-order__detail"><div className="account-order__meta"><div><span>Status</span><strong>{order.status}</strong></div><div><span>Payment</span><strong>{order.paymentStatus}</strong></div><div><span>Fulfillment</span><strong>{order.fulfillmentStatus}</strong></div></div><div className="account-order__columns"><div><h3>Items</h3><ul className="account-order__items">{order.items.map((item) => <li key={`${item.sku}-${item.variantId}`}><div><strong>{item.productName}</strong><span>{item.variantName} · {item.volumeMl} ml · {item.quantity} × {formatMoney(item.unitPrice)}</span></div><b>{formatMoney(item.lineTotal)}</b></li>)}</ul></div><div><h3>Shipping address</h3><address>{order.shippingAddress.recipientFirstName} {order.shippingAddress.recipientLastName}<br />{order.shippingAddress.addressLine1}{order.shippingAddress.addressLine2 ? <><br />{order.shippingAddress.addressLine2}</> : null}<br />{order.shippingAddress.postalCode} {order.shippingAddress.city}{order.shippingAddress.region ? `, ${order.shippingAddress.region}` : ""}<br />{order.shippingAddress.countryCode}</address></div></div><dl className="account-order__totals"><div><dt>Subtotal</dt><dd>{formatMoney(order.totals.subtotal)}</dd></div><div><dt>Shipping</dt><dd>{formatMoney(order.totals.shipping)}</dd></div><div><dt>Tax</dt><dd>{formatMoney(order.totals.tax)}</dd></div><div><dt>Discount</dt><dd>−{formatMoney(order.totals.discount)}</dd></div><div><dt>Total</dt><dd>{formatMoney(order.totals.total)}</dd></div></dl></div></details></li>)}</ol>}
    </section>
  );
}
