import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-orders', standalone: true, imports: [CommonModule],
  template: `
    <div class="page-header"><div><h1>Orders</h1><p class="subtitle">{{ orders.length }} orders</p></div>
      <button class="btn-secondary">Export</button></div>
    <div class="card">
      <div class="tabs">
        <button *ngFor="let t of tabs" (click)="active=t" class="tab-btn" [class.active]="active===t">{{ t }}</button>
      </div>
      <table class="data-table"><thead><tr>
        <th>Order</th><th>Date</th><th>Customer</th><th>Channel</th><th>Payment</th><th>Total</th><th>Status</th>
      </tr></thead><tbody>
        <tr *ngFor="let o of filtered" class="table-row">
          <td><span class="order-num">{{ o.id }}</span></td>
          <td class="muted">{{ o.date }}</td>
          <td class="bold">{{ o.customer }}</td>
          <td>{{ o.channel==='FACEBOOK'?'📘 Facebook':o.channel==='WHATSAPP'?'💬 WhatsApp':'🌐 Web' }}</td>
          <td class="muted">{{ o.payment }}</td>
          <td class="bold">\${{ o.total }}</td>
          <td><span class="status-badge" [class]="o.status.toLowerCase()">{{ o.status }}</span></td>
        </tr>
      </tbody></table>
    </div>
  `,
  styles: [`
    .card { background:white; border:1px solid #E1E3E5; border-radius:10px; }
    .tabs { display:flex; padding:0 16px; border-bottom:1px solid #E1E3E5; }
    .tab-btn { padding:12px 14px; border:none; background:none; font-size:13px; font-weight:500; color:#6D7175; border-bottom:2px solid transparent; cursor:pointer; margin-bottom:-1px; font-family:var(--font-family); }
    .tab-btn.active { color:#008060; border-bottom-color:#008060; font-weight:700; }
    .data-table { width:100%; border-collapse:collapse; }
    .data-table th { padding:10px 14px; text-align:left; font-size:12px; font-weight:600; color:#6D7175; border-bottom:1px solid #E1E3E5; background:#F6F6F7; }
    .table-row { border-bottom:1px solid #F6F6F7; cursor:pointer; }
    .table-row:hover { background:#F9FAFB; }
    .data-table td { padding:13px 14px; font-size:13px; }
    .order-num { color:#008060; font-weight:700; }
    .muted { color:#6D7175; }
    .bold  { font-weight:600; }
    .btn-secondary { background:white; border:1px solid #C9CCCF; color:#202223; padding:8px 16px; border-radius:7px; font-size:13px; font-weight:600; cursor:pointer; }
  `]
})
export class OrdersComponent {
  active = 'All';
  tabs = ['All','Unfulfilled','Paid','Cancelled'];
  orders = [
    {id:'ZS-001043',customer:'Tendai Moyo',   channel:'FACEBOOK',status:'Paid',      payment:'EcoCash', total:'45.00', date:'Mar 8, 2026'},
    {id:'ZS-001042',customer:'Rudo Chikwanda',channel:'WEB',     status:'Processing',payment:'Paynow',  total:'153.00',date:'Mar 8, 2026'},
    {id:'ZS-001041',customer:'Farai Dube',    channel:'WHATSAPP',status:'Shipped',   payment:'EcoCash', total:'32.00', date:'Mar 7, 2026'},
    {id:'ZS-001040',customer:'Chido Mutasa',  channel:'WEB',     status:'Delivered', payment:'OneMoney',total:'85.00', date:'Mar 7, 2026'},
    {id:'ZS-001039',customer:'Nyasha Banda',  channel:'FACEBOOK',status:'Cancelled', payment:'Paynow',  total:'18.00', date:'Mar 6, 2026'},
  ];
  get filtered() {
    if (this.active==='All') return this.orders;
    if (this.active==='Unfulfilled') return this.orders.filter(o=>o.status==='Processing');
    if (this.active==='Paid') return this.orders.filter(o=>['Paid','Delivered'].includes(o.status));
    return this.orders.filter(o=>o.status==='Cancelled');
  }
}
