import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-payment-return',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="return-page">
      <div class="return-card">
        <div *ngIf="status==='success'">
          <div class="icon success">✅</div>
          <h2>Payment Successful!</h2>
          <p>Your order has been confirmed. You'll receive a WhatsApp confirmation shortly.</p>
          <a routerLink="/" class="btn-home">Back to shop</a>
        </div>
        <div *ngIf="status==='failed'">
          <div class="icon error">❌</div>
          <h2>Payment Failed</h2>
          <p>Something went wrong. Please try again or order via WhatsApp.</p>
          <div class="btns">
            <a routerLink="/cart" class="btn-home">Try again</a>
            <a href="https://wa.me/263777000000" target="_blank" class="btn-wa">💬 WhatsApp</a>
          </div>
        </div>
        <div *ngIf="status==='pending'">
          <div class="icon pending">⏳</div>
          <h2>Payment Pending</h2>
          <p>We're waiting for your payment confirmation. Check your phone for a USSD prompt.</p>
          <a routerLink="/" class="btn-home">Go home</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .return-page { min-height:60vh; display:flex; align-items:center; justify-content:center; padding:40px 24px; }
    .return-card { background:white; border:1px solid var(--color-border); border-radius:14px; padding:48px; text-align:center; max-width:440px; }
    .icon { font-size:64px; margin-bottom:20px; }
    h2   { font-size:24px; font-weight:800; margin-bottom:12px; }
    p    { color:#6D7175; line-height:1.6; margin-bottom:28px; }
    .btns { display:flex; gap:12px; justify-content:center; }
    .btn-home { display:inline-block; background:#008060; color:white; padding:12px 28px; border-radius:8px; font-weight:700; text-decoration:none; }
    .btn-wa   { display:inline-block; background:#25D366; color:white; padding:12px 28px; border-radius:8px; font-weight:700; text-decoration:none; }
  `]
})
export class PaymentReturnComponent implements OnInit {
  status: 'success'|'failed'|'pending' = 'success';
  constructor(private route: ActivatedRoute) {}
  ngOnInit() {
    const p = this.route.snapshot.queryParams;
    if (p['status'] === 'failed')  this.status = 'failed';
    else if (p['status'] === 'pending') this.status = 'pending';
    else this.status = 'success';
  }
}
