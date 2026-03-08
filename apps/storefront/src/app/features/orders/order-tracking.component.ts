import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { OrderService, Order } from '../../core/services/order.service';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="track-page">
      <div class="track-inner">
        <!-- Confirmed banner -->
        <div class="confirm-banner">
          <div class="cb-icon">🎉</div>
          <div>
            <h2>Order Confirmed!</h2>
            <p>Thank you for shopping with ZimShop. We'll send updates to your WhatsApp.</p>
          </div>
        </div>

        <div *ngIf="order" class="order-card">
          <div class="order-header">
            <div>
              <div class="order-num">{{ order.orderNumber }}</div>
              <div class="order-date">{{ order.createdAt | date:'d MMMM yyyy, h:mm a' }}</div>
            </div>
            <div class="statuses">
              <span class="status-badge" [class]="statusClass(order.status)">{{ order.status }}</span>
              <span class="status-badge" [class]="payClass(order.paymentStatus)">{{ order.paymentStatus }}</span>
            </div>
          </div>

          <!-- Timeline -->
          <div class="timeline">
            <div *ngFor="let step of steps; let i=index" class="tl-step" [class.done]="i <= currentStep" [class.active]="i===currentStep">
              <div class="tl-dot"></div>
              <div class="tl-content">
                <div class="tl-label">{{ step.label }}</div>
                <div class="tl-desc">{{ step.desc }}</div>
              </div>
            </div>
          </div>

          <!-- Total -->
          <div class="order-total">
            <span>Total paid</span>
            <span class="total-val">\${{ order.total | number:'1.2-2' }} {{ order.currency }}</span>
          </div>
        </div>

        <!-- Loading skeleton -->
        <div *ngIf="loading" class="order-card">
          <div *ngFor="let i of [1,2,3]" class="skel-row"></div>
        </div>

        <div class="actions">
          <a href="https://wa.me/263777000000" target="_blank" class="btn-wa-track">
            💬 Track via WhatsApp
          </a>
          <a routerLink="/products" class="btn-continue">Continue shopping →</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .track-page  { background:#F6F6F7; min-height:calc(100vh - 120px); padding:40px 24px; }
    .track-inner { max-width:640px; margin:0 auto; display:flex; flex-direction:column; gap:20px; }

    .confirm-banner { background:#EDF9F4; border:1px solid #AEE9D1; border-radius:14px; padding:28px; display:flex; align-items:center; gap:20px; }
    .cb-icon { font-size:48px; }
    h2 { font-size:22px; font-weight:800; margin-bottom:4px; }
    .confirm-banner p { color:#6D7175; font-size:14px; }

    .order-card { background:white; border:1px solid var(--color-border); border-radius:14px; padding:28px; }
    .order-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; }
    .order-num  { font-size:20px; font-weight:800; color:#008060; }
    .order-date { font-size:12px; color:#6D7175; margin-top:3px; }
    .statuses   { display:flex; gap:8px; }
    .status-badge { font-size:12px; padding:4px 12px; border-radius:20px; font-weight:700; }
    .status-badge.processing { background:#FFF5EA; color:#B98900; }
    .status-badge.paid       { background:#EDF9F4; color:#008060; }
    .status-badge.shipped    { background:#EEF3FE; color:#2C5FD4; }
    .status-badge.delivered  { background:#EDF9F4; color:#008060; }
    .status-badge.pending    { background:#F6F6F7; color:#6D7175; }

    .timeline { display:flex; flex-direction:column; gap:0; margin-bottom:24px; }
    .tl-step  { display:flex; gap:16px; padding-bottom:24px; position:relative; }
    .tl-step:last-child { padding-bottom:0; }
    .tl-step:not(:last-child)::before { content:''; position:absolute; left:11px; top:24px; bottom:0; width:2px; background:#E1E3E5; }
    .tl-step.done::before { background:#AEE9D1; }
    .tl-dot  { width:24px; height:24px; border-radius:50%; border:2px solid #E1E3E5; background:white; flex-shrink:0; margin-top:2px; }
    .tl-step.done   .tl-dot { background:#008060; border-color:#008060; }
    .tl-step.active .tl-dot { border-color:#008060; background:white; box-shadow:0 0 0 3px #AEE9D1; }
    .tl-label { font-size:14px; font-weight:700; }
    .tl-desc  { font-size:12px; color:#6D7175; margin-top:2px; }

    .order-total { display:flex; justify-content:space-between; padding-top:20px; border-top:1px solid var(--color-border); font-size:14px; font-weight:600; }
    .total-val   { font-size:18px; font-weight:800; color:#008060; }

    .skel-row { background:#E1E3E5; height:20px; border-radius:6px; margin-bottom:12px; animation:pulse 1.5s ease infinite alternate; }
    @keyframes pulse { from{opacity:1}to{opacity:.5} }

    .actions { display:flex; gap:12px; }
    .btn-wa-track  { flex:1; display:block; text-align:center; padding:14px; background:#25D366; color:white; border-radius:9px; font-weight:700; text-decoration:none; }
    .btn-continue  { flex:1; display:block; text-align:center; padding:14px; background:#008060; color:white; border-radius:9px; font-weight:700; text-decoration:none; }
  `]
})
export class OrderTrackingComponent implements OnInit {
  order?: Order;
  loading = true;

  steps = [
    { label:'Order placed',        desc:'We received your order' },
    { label:'Payment confirmed',   desc:'Payment has been processed' },
    { label:'Being packed',        desc:'Your items are being prepared' },
    { label:'Out for delivery',    desc:'On its way to you' },
    { label:'Delivered',           desc:'Order complete 🎉' },
  ];

  get currentStep() {
    if (!this.order) return 0;
    const s = this.order.status.toUpperCase();
    if (s === 'DELIVERED') return 4;
    if (s === 'SHIPPED')   return 3;
    if (s === 'PROCESSING')return 2;
    if (s === 'PAID')      return 1;
    return 0;
  }

  constructor(private route: ActivatedRoute, private orderSvc: OrderService) {}

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.orderSvc.getOrder(id).subscribe({
      next: o => { this.order = o; this.loading = false; },
      error: () => {
        // Offline fallback
        this.order = { id, orderNumber: 'ZS-' + Math.floor(Math.random()*9000+1000), channel:'WEB', status:'Processing', paymentStatus:'Paid', total: 0, currency:'USD', createdAt: new Date().toISOString() };
        this.loading = false;
      }
    });
  }

  statusClass(s: string) { return s.toLowerCase(); }
  payClass(s: string)    { return s.toLowerCase(); }
}
