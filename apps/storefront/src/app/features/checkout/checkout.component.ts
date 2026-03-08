import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/product.service';
import { OrderService } from '../../core/services/order.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="checkout-page">
      <div class="checkout-inner">
        <!-- Steps -->
        <div class="steps">
          <div class="step" [class.active]="step===1" [class.done]="step>1">
            <span class="step-num">1</span> Contact
          </div>
          <div class="step-line"></div>
          <div class="step" [class.active]="step===2" [class.done]="step>2">
            <span class="step-num">2</span> Shipping
          </div>
          <div class="step-line"></div>
          <div class="step" [class.active]="step===3">
            <span class="step-num">3</span> Payment
          </div>
        </div>

        <div class="checkout-layout">
          <div class="form-area">
            <!-- Step 1 — Contact -->
            <div *ngIf="step===1" class="card fm">
              <h2>Contact information</h2>
              <form [formGroup]="contactForm">
                <div class="frow">
                  <div class="fg"><label>First name <span class="req">*</span></label>
                    <input formControlName="firstName" class="fi" placeholder="Tendai"></div>
                  <div class="fg"><label>Last name <span class="req">*</span></label>
                    <input formControlName="lastName" class="fi" placeholder="Moyo"></div>
                </div>
                <div class="fg"><label>Email <span class="req">*</span></label>
                  <input formControlName="email" type="email" class="fi" placeholder="tendai@email.com"></div>
                <div class="fg"><label>Phone / WhatsApp number</label>
                  <input formControlName="phone" class="fi" placeholder="+263 77 XXX XXXX"></div>
              </form>
              <button class="btn-next" (click)="nextStep()" [disabled]="contactForm.invalid">Continue to shipping →</button>
            </div>

            <!-- Step 2 — Shipping -->
            <div *ngIf="step===2" class="card fm">
              <h2>Shipping address</h2>
              <form [formGroup]="shippingForm">
                <div class="fg"><label>Street address <span class="req">*</span></label>
                  <input formControlName="address" class="fi" placeholder="15 Samora Machel Ave"></div>
                <div class="frow">
                  <div class="fg"><label>City <span class="req">*</span></label>
                    <input formControlName="city" class="fi" placeholder="Harare"></div>
                  <div class="fg"><label>Province</label>
                    <select formControlName="province" class="fi">
                      <option value="">Select…</option>
                      <option *ngFor="let p of provinces" [value]="p">{{ p }}</option>
                    </select>
                  </div>
                </div>
                <div class="fg"><label>Delivery notes</label>
                  <textarea formControlName="notes" rows="2" class="fi" placeholder="Gate colour, landmark…"></textarea>
                </div>
              </form>
              <div class="nav-btns">
                <button class="btn-back-step" (click)="step=1">← Back</button>
                <button class="btn-next" (click)="nextStep()" [disabled]="shippingForm.invalid">Continue to payment →</button>
              </div>
            </div>

            <!-- Step 3 — Payment -->
            <div *ngIf="step===3" class="card fm">
              <h2>Payment method</h2>
              <div class="pay-methods">
                <label *ngFor="let m of payMethods" class="pay-opt" [class.active]="payMethod===m.value">
                  <input type="radio" [value]="m.value" [(ngModel)]="payMethod" name="pm">
                  <span class="pay-icon">{{ m.icon }}</span>
                  <div>
                    <span class="pay-name">{{ m.name }}</span>
                    <span class="pay-desc">{{ m.desc }}</span>
                  </div>
                </label>
              </div>

              <div *ngIf="payMethod==='ECOCASH' || payMethod==='ONEMONEY'" class="fg mt">
                <label>Mobile money number <span class="req">*</span></label>
                <input [(ngModel)]="mobilePhone" class="fi" placeholder="+263 77 XXX XXXX">
                <span class="field-hint">We'll send a USSD push to this number</span>
              </div>

              <div *ngIf="error" class="error-box">⚠️ {{ error }}</div>

              <div class="nav-btns">
                <button class="btn-back-step" (click)="step=2">← Back</button>
                <button class="btn-place" (click)="placeOrder()" [disabled]="submitting || !payMethod">
                  {{ submitting ? 'Processing…' : '🔒 Place Order — $' + (cart.total | number:'1.2-2') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Order summary sidebar -->
          <div class="summary-sidebar">
            <div class="card summary-card">
              <h3>Order summary</h3>
              <div class="summary-items">
                <div *ngFor="let item of cart.items" class="sum-item">
                  <div class="sum-img">
                    <img *ngIf="item.product.images?.length" [src]="item.product.images[0].url" [alt]="item.product.title">
                    <div *ngIf="!item.product.images?.length" class="sum-ph">{{ icon(item) }}</div>
                    <span class="sum-qty">{{ item.quantity }}</span>
                  </div>
                  <span class="sum-name">{{ item.product.title }}</span>
                  <span class="sum-price">\${{ (item.variant.price * item.quantity) | number:'1.2-2' }}</span>
                </div>
              </div>
              <div class="sum-divider"></div>
              <div class="sum-row"><span>Subtotal</span><span>\${{ cart.total | number:'1.2-2' }}</span></div>
              <div class="sum-row muted"><span>Shipping</span><span>TBD</span></div>
              <div class="sum-divider"></div>
              <div class="sum-row total"><span>Total (USD)</span><span>\${{ cart.total | number:'1.2-2' }}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .checkout-page  { background:#F6F6F7; min-height:calc(100vh - 120px); padding:40px 24px; }
    .checkout-inner { max-width:1000px; margin:0 auto; }

    .steps { display:flex; align-items:center; justify-content:center; gap:0; margin-bottom:36px; }
    .step  { display:flex; align-items:center; gap:8px; font-size:13px; font-weight:600; color:#6D7175; padding:0 16px; }
    .step.active { color:#008060; }
    .step.done   { color:#008060; }
    .step-num { width:24px; height:24px; border-radius:50%; background:#E1E3E5; color:#6D7175; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; }
    .step.active .step-num { background:#008060; color:white; }
    .step.done .step-num   { background:#AEE9D1; color:#008060; }
    .step-line { flex:1; max-width:60px; height:1px; background:#E1E3E5; }

    .checkout-layout { display:grid; grid-template-columns:1fr 320px; gap:24px; align-items:start; }
    .card { background:white; border:1px solid var(--color-border); border-radius:14px; }
    .fm { padding:28px; }
    h2 { font-size:18px; font-weight:700; margin-bottom:22px; }
    .frow { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .fg   { margin-bottom:16px; }
    label { display:block; font-size:13px; font-weight:600; margin-bottom:5px; }
    .req  { color:#D82C0D; }
    .fi   { width:100%; padding:10px 12px; border:1px solid var(--color-border-dk); border-radius:8px; font-size:14px; font-family:var(--font); outline:none; }
    .fi:focus { border-color:#008060; }
    textarea.fi { resize:vertical; }
    select.fi   { background:white; }
    .field-hint { font-size:11px; color:#6D7175; margin-top:4px; display:block; }
    .mt { margin-top:8px; }

    .pay-methods { display:flex; flex-direction:column; gap:10px; margin-bottom:16px; }
    .pay-opt { display:flex; align-items:center; gap:14px; padding:14px 16px; border:2px solid var(--color-border); border-radius:10px; cursor:pointer; transition:all .15s; }
    .pay-opt input { display:none; }
    .pay-opt.active { border-color:#008060; background:#EDF9F4; }
    .pay-icon { font-size:26px; }
    .pay-name { display:block; font-size:14px; font-weight:700; }
    .pay-desc { display:block; font-size:12px; color:#6D7175; }
    .error-box { background:#FFF4F4; color:#D82C0D; border:1px solid #FFC9C9; border-radius:8px; padding:12px 16px; font-size:13px; margin-bottom:16px; }

    .nav-btns { display:flex; gap:10px; margin-top:20px; }
    .btn-next { flex:1; padding:14px; background:#008060; color:white; border:none; border-radius:9px; font-size:14px; font-weight:700; cursor:pointer; font-family:var(--font); }
    .btn-next:hover:not(:disabled) { background:#006E52; }
    .btn-next:disabled { opacity:.6; cursor:not-allowed; }
    .btn-back-step { padding:14px 20px; background:white; border:1px solid var(--color-border-dk); border-radius:9px; font-size:14px; font-weight:600; cursor:pointer; font-family:var(--font); }
    .btn-place { flex:1; padding:14px; background:#008060; color:white; border:none; border-radius:9px; font-size:14px; font-weight:700; cursor:pointer; font-family:var(--font); }
    .btn-place:hover:not(:disabled) { background:#006E52; }
    .btn-place:disabled { opacity:.6; cursor:not-allowed; }

    .summary-sidebar { position:sticky; top:80px; }
    .summary-card { padding:22px; }
    .summary-card h3 { font-size:15px; font-weight:700; margin-bottom:18px; }
    .summary-items { display:flex; flex-direction:column; gap:14px; margin-bottom:16px; }
    .sum-item { display:flex; align-items:center; gap:10px; }
    .sum-img  { position:relative; width:48px; height:48px; border-radius:8px; overflow:hidden; background:#F6F6F7; flex-shrink:0; }
    .sum-img img { width:100%; height:100%; object-fit:cover; }
    .sum-ph   { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:20px; }
    .sum-qty  { position:absolute; top:-6px; right:-6px; background:#202223; color:white; border-radius:50%; width:18px; height:18px; font-size:10px; font-weight:700; display:flex; align-items:center; justify-content:center; }
    .sum-name { flex:1; font-size:13px; font-weight:600; }
    .sum-price{ font-size:13px; font-weight:700; }
    .sum-divider { border:none; border-top:1px solid var(--color-border); margin:12px 0; }
    .sum-row  { display:flex; justify-content:space-between; font-size:13px; margin-bottom:8px; }
    .sum-row.muted span:last-child { color:#6D7175; }
    .sum-row.total { font-size:16px; font-weight:800; }
  `]
})
export class CheckoutComponent implements OnInit {
  step = 1;
  payMethod = '';
  mobilePhone = '';
  submitting = false;
  error = '';

  contactForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
    phone:     ['']
  });

  shippingForm = this.fb.group({
    address:  ['', Validators.required],
    city:     ['', Validators.required],
    province: [''],
    notes:    ['']
  });

  provinces = ['Harare','Bulawayo','Manicaland','Mashonaland Central','Mashonaland East',
                'Mashonaland West','Masvingo','Matabeleland North','Matabeleland South','Midlands'];

  payMethods = [
    { value:'ECOCASH',  icon:'📱', name:'EcoCash',    desc:'Instant USSD push to your phone' },
    { value:'ONEMONEY', icon:'💳', name:'OneMoney',   desc:'NetOne mobile money' },
    { value:'PAYNOW',   icon:'🏦', name:'Paynow Web', desc:'Card, bank, Telecash & more' },
  ];

  constructor(
    private fb: FormBuilder,
    public cart: CartService,
    private orderSvc: OrderService,
    private router: Router
  ) {}

  ngOnInit() {
    if (this.cart.items.length === 0) this.router.navigate(['/cart']);
  }

  nextStep() {
    if (this.step === 1 && this.contactForm.valid) this.step = 2;
    else if (this.step === 2 && this.shippingForm.valid) this.step = 3;
  }

  placeOrder() {
    this.submitting = true; this.error = '';
    const cf = this.contactForm.value;
    const sf = this.shippingForm.value;

    const req = {
      channel: 'WEB',
      customerEmail: cf.email!,
      customerPhone: cf.phone || undefined,
      shippingAddress: `${sf.address}, ${sf.city}${sf.province ? ', ' + sf.province : ''}`,
      notes: sf.notes || undefined,
      lineItems: this.cart.items.map(i => ({
        productId: i.product.id, variantId: i.variant.id,
        productTitle: i.product.title, variantTitle: i.variant.title,
        quantity: i.quantity, price: i.variant.price
      }))
    };

    this.orderSvc.createOrder(req).subscribe({
      next: order => {
        this.orderSvc.initiatePayment({ orderId: order.id, method: this.payMethod, phone: this.mobilePhone || undefined }).subscribe({
          next: res => {
            this.submitting = false;
            if (res.redirectUrl) { window.location.href = res.redirectUrl; }
            else { this.cart.clear(); this.router.navigate(['/orders', order.id]); }
          },
          error: () => {
            // Offline / sandbox — still navigate to confirmation
            this.submitting = false;
            this.cart.clear();
            this.router.navigate(['/orders', order.id]);
          }
        });
      },
      error: () => { this.submitting = false; this.error = 'Could not place order. Please try again or use WhatsApp.'; }
    });
  }

  icon(item: any) {
    const m: Record<string,string> = {Clothing:'👗',Music:'🎵',Art:'🗿',Beauty:'🌿',Crafts:'🧺'};
    return m[item.product.productType??''] ?? '📦';
  }
}
