import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService, CartItem } from '../../core/services/product.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="cart-page">
      <div class="cart-inner">
        <h1>Your Cart <span class="count">({{ cart.count }} {{ cart.count === 1 ? 'item' : 'items' }})</span></h1>

        <!-- Empty -->
        <div *ngIf="cart.items.length === 0" class="empty">
          <div style="font-size:72px;margin-bottom:20px">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added anything yet.</p>
          <a routerLink="/products" class="btn-shop">Start shopping →</a>
        </div>

        <div *ngIf="cart.items.length > 0" class="cart-layout">
          <!-- Items -->
          <div class="items">
            <div *ngFor="let item of cart.items" class="cart-item">
              <div class="item-img">
                <img *ngIf="item.product.images?.length" [src]="item.product.images[0].url" [alt]="item.product.title">
                <div *ngIf="!item.product.images?.length" class="item-ph">{{ icon(item) }}</div>
              </div>
              <div class="item-info">
                <a [routerLink]="['/products', item.product.handle]" class="item-name">{{ item.product.title }}</a>
                <div class="item-variant" *ngIf="item.variant.title !== 'Default Title'">{{ item.variant.title }}</div>
                <div class="item-sku" *ngIf="item.variant.sku">SKU: {{ item.variant.sku }}</div>
              </div>
              <div class="item-qty">
                <button class="qty-btn" (click)="update(item, item.quantity - 1)">−</button>
                <span>{{ item.quantity }}</span>
                <button class="qty-btn" (click)="update(item, item.quantity + 1)">+</button>
              </div>
              <div class="item-price">\${{ (item.variant.price * item.quantity) | number:'1.2-2' }}</div>
              <button class="remove-btn" (click)="cart.remove(item.variant.id)" title="Remove">✕</button>
            </div>

            <div class="cart-footer-row">
              <a routerLink="/products" class="continue-link">← Continue shopping</a>
              <button class="clear-link" (click)="cart.clear()">Clear cart</button>
            </div>
          </div>

          <!-- Summary -->
          <div class="summary">
            <h3>Order Summary</h3>
            <div class="summary-rows">
              <div class="summary-row" *ngFor="let item of cart.items">
                <span>{{ item.product.title }} × {{ item.quantity }}</span>
                <span>\${{ (item.variant.price * item.quantity) | number:'1.2-2' }}</span>
              </div>
            </div>
            <div class="divider"></div>
            <div class="summary-row subtotal">
              <span>Subtotal</span>
              <span>\${{ cart.total | number:'1.2-2' }}</span>
            </div>
            <div class="summary-row muted-row">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div class="divider"></div>
            <div class="summary-row total">
              <span>Total (USD)</span>
              <span>\${{ cart.total | number:'1.2-2' }}</span>
            </div>

            <div class="payment-methods">
              <div class="pm-label">Accepted payments</div>
              <div class="pm-icons">
                <span>💳 EcoCash</span>
                <span>📱 OneMoney</span>
                <span>🏦 Paynow Web</span>
              </div>
            </div>

            <button class="btn-checkout" (click)="checkout()">Proceed to Checkout →</button>

            <a [href]="waLink()" target="_blank" class="btn-wa-checkout">
              💬 Order via WhatsApp instead
            </a>

            <div class="secure-note">🔒 Secure checkout powered by Paynow Zimbabwe</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cart-page  { background:#F6F6F7; min-height:calc(100vh - 120px); padding:40px 24px; }
    .cart-inner { max-width:1100px; margin:0 auto; }
    h1 { font-size:26px; font-weight:800; margin-bottom:28px; }
    .count { color:#6D7175; font-weight:400; }

    .empty { text-align:center; padding:80px 24px; background:white; border-radius:14px; }
    .empty h3 { font-size:22px; font-weight:700; margin-bottom:8px; }
    .empty p  { color:#6D7175; margin-bottom:24px; }
    .btn-shop { display:inline-block; background:#008060; color:white; padding:12px 28px; border-radius:8px; font-weight:700; text-decoration:none; }

    .cart-layout { display:grid; grid-template-columns:1fr 360px; gap:24px; align-items:start; }

    .items { background:white; border-radius:14px; border:1px solid var(--color-border); }
    .cart-item { display:flex; align-items:center; gap:16px; padding:18px 20px; border-bottom:1px solid #F6F6F7; }
    .item-img  { width:72px; height:72px; border-radius:10px; background:#F6F6F7; overflow:hidden; flex-shrink:0; }
    .item-img img { width:100%; height:100%; object-fit:cover; }
    .item-ph   { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:28px; }
    .item-info { flex:1; }
    .item-name    { font-size:14px; font-weight:700; color:#202223; text-decoration:none; display:block; margin-bottom:3px; }
    .item-name:hover { color:#008060; text-decoration:underline; }
    .item-variant { font-size:12px; color:#6D7175; }
    .item-sku     { font-size:11px; color:#8C9196; }
    .item-qty   { display:flex; align-items:center; gap:10px; }
    .qty-btn    { width:30px; height:30px; border:1px solid var(--color-border-dk); border-radius:6px; background:white; font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
    .item-qty span { font-size:14px; font-weight:700; min-width:20px; text-align:center; }
    .item-price { font-size:15px; font-weight:800; min-width:70px; text-align:right; }
    .remove-btn { background:none; border:none; color:#8C9196; font-size:14px; cursor:pointer; padding:4px 8px; }
    .remove-btn:hover { color:#D82C0D; }

    .cart-footer-row { display:flex; justify-content:space-between; padding:16px 20px; }
    .continue-link   { font-size:13px; color:#008060; font-weight:600; text-decoration:none; }
    .clear-link      { background:none; border:none; font-size:13px; color:#6D7175; cursor:pointer; font-family:var(--font); }

    .summary { background:white; border:1px solid var(--color-border); border-radius:14px; padding:24px; position:sticky; top:80px; }
    .summary h3 { font-size:16px; font-weight:700; margin-bottom:18px; }
    .summary-rows { display:flex; flex-direction:column; gap:10px; margin-bottom:14px; }
    .summary-row { display:flex; justify-content:space-between; font-size:13px; }
    .summary-row.subtotal { font-weight:600; }
    .summary-row.total    { font-size:17px; font-weight:800; }
    .muted-row span:last-child { color:#6D7175; font-size:12px; }
    .divider { border:none; border-top:1px solid var(--color-border); margin:14px 0; }
    .payment-methods { background:#F6F6F7; border-radius:8px; padding:12px 14px; margin:16px 0; }
    .pm-label { font-size:11px; color:#6D7175; font-weight:600; margin-bottom:6px; }
    .pm-icons { display:flex; gap:10px; flex-wrap:wrap; }
    .pm-icons span { font-size:12px; color:#202223; }
    .btn-checkout { width:100%; padding:14px; background:#008060; color:white; border:none; border-radius:9px; font-size:14px; font-weight:700; cursor:pointer; font-family:var(--font); transition:background .15s; margin-bottom:10px; }
    .btn-checkout:hover { background:#006E52; }
    .btn-wa-checkout { display:block; text-align:center; padding:12px; background:#25D366; color:white; border-radius:9px; font-size:13px; font-weight:700; text-decoration:none; margin-bottom:14px; }
    .btn-wa-checkout:hover { background:#1da852; }
    .secure-note { text-align:center; font-size:11px; color:#6D7175; }
  `]
})
export class CartComponent {
  constructor(public cart: CartService, private router: Router) {}
  update(item: CartItem, qty: number) { this.cart.update(item.variant.id, qty); }
  checkout() { this.router.navigate(['/checkout']); }
  icon(item: CartItem) {
    const m: Record<string,string> = {Clothing:'👗',Music:'🎵',Art:'🗿',Beauty:'🌿',Crafts:'🧺'};
    return m[item.product.productType??''] ?? '📦';
  }
  waLink() {
    const lines = this.cart.items.map(i => `${i.quantity}× ${i.product.title} ($${(i.variant.price*i.quantity).toFixed(2)})`).join(', ');
    return `https://wa.me/263777000000?text=${encodeURIComponent('Hi! I want to order: ' + lines + '. Total: $' + this.cart.total.toFixed(2))}`;
  }
}
