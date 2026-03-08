import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, Product, ProductVariant, CartService } from '../../core/services/product.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="pdp-page" *ngIf="product">
      <div class="breadcrumb">
        <a routerLink="/">Home</a> / <a routerLink="/products">Products</a> / {{ product.title }}
      </div>

      <div class="pdp-grid">
        <!-- Images -->
        <div class="gallery">
          <div class="main-img">
            <img *ngIf="selectedImage" [src]="selectedImage" [alt]="product.title">
            <div *ngIf="!selectedImage" class="img-ph">{{ icon() }}</div>
          </div>
          <div class="thumbs" *ngIf="product.images?.length > 1">
            <div *ngFor="let img of product.images" class="thumb" [class.active]="selectedImage===img.url" (click)="selectedImage=img.url">
              <img [src]="img.url" [alt]="img.altText">
            </div>
          </div>
        </div>

        <!-- Info -->
        <div class="info">
          <div class="info-top">
            <div class="vendor">{{ product.vendor || product.productType || 'ZimShop' }}</div>
            <h1>{{ product.title }}</h1>
            <div class="price-row">
              <span class="price">\${{ price() | number:'1.2-2' }}</span>
              <span *ngIf="hasDiscount()" class="compare">\${{ compare() | number:'1.2-2' }}</span>
              <span *ngIf="hasDiscount()" class="save-badge">Save {{ savings() }}%</span>
            </div>
            <div class="channels-row">
              <span class="av-label">Available on:</span>
              <span *ngFor="let ch of product.channels" class="ch-tag" [class]="ch.toLowerCase()">{{ chLabel(ch) }}</span>
            </div>
          </div>

          <!-- Variants -->
          <div class="section-block" *ngIf="product.variants?.length > 1">
            <div class="block-label">Select option</div>
            <div class="variant-grid">
              <button *ngFor="let v of product.variants" (click)="selectedVariant=v" class="variant-btn" [class.active]="selectedVariant?.id===v.id" [disabled]="v.inventoryQuantity===0">
                {{ v.title }}
                <span *ngIf="v.inventoryQuantity===0" class="oos"> · Out of stock</span>
              </button>
            </div>
          </div>

          <!-- Qty -->
          <div class="section-block">
            <div class="block-label">Quantity</div>
            <div class="qty-row">
              <button class="qty-btn" (click)="qty=qty>1?qty-1:1">−</button>
              <span class="qty-val">{{ qty }}</span>
              <button class="qty-btn" (click)="qty=qty+1">+</button>
              <span class="stock-info" *ngIf="selectedVariant">
                {{ selectedVariant.inventoryQuantity > 0 ? selectedVariant.inventoryQuantity + ' in stock' : 'Out of stock' }}
              </span>
            </div>
          </div>

          <!-- CTAs -->
          <div class="ctas">
            <button class="btn-atc" (click)="addToCart()" [disabled]="!canBuy()">
              🛒 Add to cart
            </button>
            <button class="btn-buy" (click)="buyNow()" [disabled]="!canBuy()">
              Buy now
            </button>
            <a class="btn-wa" [href]="waLink()" target="_blank">
              💬 Order on WhatsApp
            </a>
          </div>

          <div *ngIf="toastMsg" class="toast">{{ toastMsg }}</div>

          <!-- Description -->
          <div class="desc-block">
            <div class="block-label">Description</div>
            <p>{{ product.description || 'Authentic Zimbabwean product. Handcrafted with care.' }}</p>
          </div>

          <!-- Tags -->
          <div class="tags-row" *ngIf="product.tags?.length">
            <span *ngFor="let tag of product.tags" class="tag">{{ tag }}</span>
          </div>

          <!-- Shipping info -->
          <div class="shipping-info">
            <div class="si-item">📦 <span>Nationwide delivery available</span></div>
            <div class="si-item">💳 <span>EcoCash · OneMoney · Paynow web</span></div>
            <div class="si-item">💬 <span>WhatsApp support: +263 777 000 000</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div *ngIf="loading" class="loading-pdp">
      <div class="pdp-skel-img"></div>
      <div class="pdp-skel-info">
        <div class="skel-line w60"></div>
        <div class="skel-line w40"></div>
        <div class="skel-line w80"></div>
      </div>
    </div>

    <!-- Not found -->
    <div *ngIf="!loading && !product" class="not-found">
      <div style="font-size:64px;margin-bottom:16px">😕</div>
      <h2>Product not found</h2>
      <a routerLink="/products" class="btn-back">← Back to shop</a>
    </div>
  `,
  styles: [`
    .pdp-page { max-width:1200px; margin:0 auto; padding:32px 24px; }
    .breadcrumb { font-size:12px; color:#6D7175; margin-bottom:28px; }
    .breadcrumb a { color:#008060; }

    .pdp-grid { display:grid; grid-template-columns:1fr 1fr; gap:64px; }

    .gallery { display:flex; flex-direction:column; gap:12px; }
    .main-img { background:#F6F6F7; border-radius:14px; aspect-ratio:1; overflow:hidden; }
    .main-img img { width:100%; height:100%; object-fit:cover; }
    .img-ph { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:100px; }
    .thumbs { display:flex; gap:8px; flex-wrap:wrap; }
    .thumb  { width:72px; height:72px; border-radius:8px; overflow:hidden; cursor:pointer; border:2px solid transparent; }
    .thumb.active { border-color:#008060; }
    .thumb img { width:100%; height:100%; object-fit:cover; }

    .info { display:flex; flex-direction:column; gap:20px; }
    .info-top { display:flex; flex-direction:column; gap:10px; }
    .vendor { font-size:12px; color:#6D7175; text-transform:uppercase; letter-spacing:.5px; }
    h1 { font-size:28px; font-weight:800; line-height:1.2; }
    .price-row { display:flex; align-items:center; gap:10px; }
    .price    { font-size:28px; font-weight:800; color:#008060; }
    .compare  { font-size:18px; color:#6D7175; text-decoration:line-through; }
    .save-badge { background:#D82C0D; color:white; font-size:11px; font-weight:700; padding:3px 8px; border-radius:6px; }
    .channels-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .av-label { font-size:12px; color:#6D7175; }
    .ch-tag { font-size:11px; padding:3px 10px; border-radius:12px; font-weight:600; }
    .ch-tag.web      { background:#EEF3FE; color:#2C5FD4; }
    .ch-tag.facebook { background:#e8f0fe; color:#1877F2; }
    .ch-tag.whatsapp { background:#EDF9F4; color:#008060; }

    .section-block { display:flex; flex-direction:column; gap:10px; }
    .block-label { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:#6D7175; }

    .variant-grid { display:flex; flex-wrap:wrap; gap:8px; }
    .variant-btn  { padding:9px 16px; border:2px solid var(--color-border-dk); border-radius:8px; background:white; font-size:13px; font-weight:600; cursor:pointer; font-family:var(--font); transition:all .15s; }
    .variant-btn.active { border-color:#008060; background:#EDF9F4; color:#008060; }
    .variant-btn:disabled { opacity:.45; cursor:not-allowed; }
    .oos { font-weight:400; font-size:11px; }

    .qty-row { display:flex; align-items:center; gap:12px; }
    .qty-btn  { width:36px; height:36px; border:1px solid var(--color-border-dk); border-radius:8px; background:white; font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
    .qty-val  { font-size:16px; font-weight:700; min-width:24px; text-align:center; }
    .stock-info { font-size:12px; color:#6D7175; }

    .ctas { display:flex; flex-direction:column; gap:10px; }
    .btn-atc { padding:14px; border-radius:9px; border:2px solid #008060; background:white; color:#008060; font-size:14px; font-weight:700; cursor:pointer; font-family:var(--font); transition:all .15s; }
    .btn-atc:hover:not(:disabled) { background:#EDF9F4; }
    .btn-buy { padding:14px; border-radius:9px; border:none; background:#008060; color:white; font-size:14px; font-weight:700; cursor:pointer; font-family:var(--font); transition:background .15s; }
    .btn-buy:hover:not(:disabled) { background:#006E52; }
    .btn-wa  { padding:14px; border-radius:9px; background:#25D366; color:white; font-size:14px; font-weight:700; text-decoration:none; text-align:center; transition:background .15s; }
    .btn-wa:hover { background:#1da852; }
    .btn-atc:disabled, .btn-buy:disabled { opacity:.5; cursor:not-allowed; }

    .toast { background:#1A1A1A; color:white; padding:10px 16px; border-radius:8px; font-size:13px; text-align:center; }

    .desc-block { display:flex; flex-direction:column; gap:8px; }
    .desc-block p { font-size:14px; color:#6D7175; line-height:1.6; }

    .tags-row { display:flex; flex-wrap:wrap; gap:6px; }
    .tag { background:#F6F6F7; border:1px solid var(--color-border); color:#6D7175; font-size:11px; padding:3px 10px; border-radius:20px; }

    .shipping-info { display:flex; flex-direction:column; gap:8px; padding:16px; background:#F6F6F7; border-radius:10px; }
    .si-item { display:flex; align-items:center; gap:10px; font-size:13px; color:#6D7175; }

    /* Loading */
    .loading-pdp { max-width:1200px; margin:40px auto; padding:0 24px; display:grid; grid-template-columns:1fr 1fr; gap:64px; }
    .pdp-skel-img  { background:#E1E3E5; border-radius:14px; aspect-ratio:1; animation:pulse 1.5s ease infinite alternate; }
    .pdp-skel-info { display:flex; flex-direction:column; gap:16px; padding-top:20px; }
    .skel-line     { background:#E1E3E5; border-radius:6px; height:20px; animation:pulse 1.5s ease infinite alternate; }
    .w60 { width:60%; } .w40 { width:40%; } .w80 { width:80%; }
    @keyframes pulse { from{opacity:1}to{opacity:.5} }

    /* Not found */
    .not-found { text-align:center; padding:100px 24px; }
    .not-found h2 { font-size:24px; font-weight:700; margin-bottom:20px; }
    .btn-back { display:inline-block; background:#008060; color:white; padding:12px 24px; border-radius:8px; font-weight:700; text-decoration:none; }
  `]
})
export class ProductDetailComponent implements OnInit {
  product?: Product;
  selectedVariant?: ProductVariant;
  selectedImage?: string;
  qty = 1;
  loading = true;
  toastMsg: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productSvc: ProductService,
    private cart: CartService
  ) {}

  ngOnInit() {
    const handle = this.route.snapshot.params['handle'];
    this.productSvc.getByHandle(handle).subscribe({
      next: p => {
        this.product = p;
        this.selectedVariant = p.variants?.[0];
        this.selectedImage = p.images?.[0]?.url;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  price()      { return this.selectedVariant?.price ?? 0; }
  compare()    { return this.selectedVariant?.compareAtPrice ?? 0; }
  hasDiscount(){ return this.compare() > this.price(); }
  savings()    { return Math.round((1 - this.price() / this.compare()) * 100); }
  canBuy()     { return this.selectedVariant && this.selectedVariant.inventoryQuantity > 0; }
  chLabel(ch: string) { return ch==='FACEBOOK'?'📘 Facebook':ch==='WHATSAPP'?'💬 WhatsApp':'🌐 Web'; }
  icon() {
    const m: Record<string,string> = {Clothing:'👗',Music:'🎵',Art:'🗿',Beauty:'🌿',Crafts:'🧺'};
    return m[this.product?.productType??''] ?? '📦';
  }

  waLink() {
    const msg = `Hi! I'd like to order: ${this.product?.title} (x${this.qty}) — $${(this.price()*this.qty).toFixed(2)}`;
    return `https://wa.me/263777000000?text=${encodeURIComponent(msg)}`;
  }

  addToCart() {
    if (!this.product || !this.selectedVariant) return;
    this.cart.add(this.product, this.selectedVariant, this.qty);
    this.showToast(`✅ Added ${this.qty}× ${this.product.title} to cart`);
  }

  buyNow() {
    this.addToCart();
    this.router.navigate(['/cart']);
  }

  private showToast(msg: string) {
    this.toastMsg = msg;
    setTimeout(() => this.toastMsg = null, 3000);
  }
}
