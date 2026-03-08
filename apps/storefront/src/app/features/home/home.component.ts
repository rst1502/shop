import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService, Product } from '../../core/services/product.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Hero -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-content">
          <div class="hero-tag">🇿🇼 Zimbabwe's Online Marketplace</div>
          <h1>Authentic Zimbabwean Products,<br>Delivered to You</h1>
          <p>Shop handcrafted art, fashion, food & more. Pay with EcoCash or OneMoney. Order on WhatsApp in seconds.</p>
          <div class="hero-btns">
            <a routerLink="/products" class="btn-primary" style="width:auto;padding:14px 32px">Shop Now</a>
            <a href="https://wa.me/263777000000?text=CATALOG" target="_blank" class="btn-wa">
              <span>💬</span> Order on WhatsApp
            </a>
          </div>
          <div class="hero-trust">
            <span>✅ Secure Paynow payments</span>
            <span>📦 Nationwide delivery</span>
            <span>💬 WhatsApp support</span>
          </div>
        </div>
        <div class="hero-visual">
          <div class="hero-card card1">
            <div class="hc-icon">👗</div>
            <div class="hc-name">Ankara Dress</div>
            <div class="hc-price">$45.00</div>
          </div>
          <div class="hero-card card2">
            <div class="hc-icon">🗿</div>
            <div class="hc-name">Shona Sculpture</div>
            <div class="hc-price">$85.00</div>
          </div>
          <div class="hero-card card3">
            <div class="hc-icon">🌿</div>
            <div class="hc-name">Baobab Serum</div>
            <div class="hc-price">$28.00</div>
          </div>
          <div class="hero-badge">
            <div class="hb-num">500+</div>
            <div class="hb-label">Happy customers</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Channels bar -->
    <section class="channels-bar">
      <div class="cb-inner">
        <div class="cb-item">
          <span class="cb-icon">🌐</span>
          <div><strong>Shop Online</strong><span>Browse & buy anytime</span></div>
        </div>
        <div class="cb-divider"></div>
        <div class="cb-item">
          <span class="cb-icon">📘</span>
          <div><strong>Facebook Shop</strong><span>Find us on Facebook</span></div>
        </div>
        <div class="cb-divider"></div>
        <div class="cb-item">
          <span class="cb-icon">💬</span>
          <div><strong>WhatsApp Orders</strong><span>Text CATALOG to start</span></div>
        </div>
        <div class="cb-divider"></div>
        <div class="cb-item">
          <span class="cb-icon">💳</span>
          <div><strong>EcoCash & Paynow</strong><span>Secure local payments</span></div>
        </div>
      </div>
    </section>

    <!-- Categories -->
    <section class="section">
      <div class="section-inner">
        <div class="section-head">
          <h2>Shop by Category</h2>
          <a routerLink="/products" class="see-all">See all →</a>
        </div>
        <div class="categories-grid">
          <a *ngFor="let cat of categories" routerLink="/products" class="cat-card">
            <div class="cat-icon">{{ cat.icon }}</div>
            <div class="cat-name">{{ cat.name }}</div>
            <div class="cat-count">{{ cat.count }} items</div>
          </a>
        </div>
      </div>
    </section>

    <!-- Featured products -->
    <section class="section bg-light">
      <div class="section-inner">
        <div class="section-head">
          <h2>Featured Products</h2>
          <a routerLink="/products" class="see-all">View all →</a>
        </div>
        <div *ngIf="loading" class="loading-grid">
          <div *ngFor="let i of [1,2,3,4]" class="product-skeleton"></div>
        </div>
        <div *ngIf="!loading" class="products-grid">
          <a *ngFor="let p of featured" [routerLink]="['/products', p.handle]" class="product-card">
            <div class="pc-image">
              <img *ngIf="p.images?.length" [src]="p.images[0].url" [alt]="p.title" loading="lazy">
              <div *ngIf="!p.images?.length" class="pc-placeholder">{{ categoryIcon(p) }}</div>
              <div *ngIf="hasDiscount(p)" class="pc-badge">Sale</div>
            </div>
            <div class="pc-info">
              <div class="pc-type">{{ p.productType || 'Zimbabwe' }}</div>
              <div class="pc-name">{{ p.title }}</div>
              <div class="pc-price-row">
                <span class="pc-price">\${{ getPrice(p) | number:'1.2-2' }}</span>
                <span *ngIf="hasDiscount(p)" class="pc-compare">\${{ getCompare(p) | number:'1.2-2' }}</span>
              </div>
            </div>
          </a>
        </div>
        <!-- Static fallback when API is down -->
        <div *ngIf="!loading && featured.length === 0" class="products-grid">
          <a *ngFor="let p of staticProducts" [routerLink]="['/products', p.handle]" class="product-card">
            <div class="pc-image">
              <div class="pc-placeholder" style="font-size:60px">{{ p.icon }}</div>
            </div>
            <div class="pc-info">
              <div class="pc-type">{{ p.type }}</div>
              <div class="pc-name">{{ p.name }}</div>
              <div class="pc-price-row"><span class="pc-price">\${{ p.price }}</span></div>
            </div>
          </a>
        </div>
      </div>
    </section>

    <!-- WhatsApp CTA -->
    <section class="wa-cta">
      <div class="wa-cta-inner">
        <div class="wa-cta-content">
          <div class="wa-cta-icon">💬</div>
          <div>
            <h3>Order instantly on WhatsApp</h3>
            <p>No account needed. Just send a message and we'll guide you through shopping, payment and delivery.</p>
          </div>
        </div>
        <a href="https://wa.me/263777000000?text=Hi%2C+I+want+to+shop%21" target="_blank" class="btn-wa-lg">
          Start WhatsApp Chat
        </a>
      </div>
    </section>
  `,
  styles: [`
    /* Hero */
    .hero { background:linear-gradient(135deg,#EDF9F4 0%,#F6F6F7 60%); padding:80px 24px; }
    .hero-inner { max-width:1200px; margin:0 auto; display:grid; grid-template-columns:1fr 400px; gap:64px; align-items:center; }
    .hero-tag { display:inline-block; background:white; border:1px solid var(--color-primary-lt); color:var(--color-primary); font-size:13px; font-weight:600; padding:5px 14px; border-radius:20px; margin-bottom:20px; }
    h1 { font-size:42px; font-weight:800; line-height:1.15; color:#202223; margin-bottom:16px; }
    .hero-content > p { font-size:16px; color:#6D7175; line-height:1.6; margin-bottom:28px; max-width:480px; }
    .hero-btns { display:flex; gap:14px; margin-bottom:28px; }
    .btn-wa { display:inline-flex; align-items:center; gap:8px; background:#25D366; color:white; border:none; padding:14px 24px; border-radius:8px; font-size:14px; font-weight:700; cursor:pointer; text-decoration:none; transition:background 0.15s; }
    .btn-wa:hover { background:#1da852; }
    .hero-trust { display:flex; gap:20px; font-size:12px; color:#6D7175; flex-wrap:wrap; }
    .hero-trust span { display:flex; align-items:center; gap:4px; }
    .hero-visual { position:relative; height:340px; }
    .hero-card { position:absolute; background:white; border:1px solid var(--color-border); border-radius:14px; padding:20px; box-shadow:var(--shadow-lg); text-align:center; }
    .hero-card.card1 { top:0; left:20px; width:140px; }
    .hero-card.card2 { top:80px; right:0;  width:150px; }
    .hero-card.card3 { bottom:0; left:60px; width:140px; }
    .hc-icon { font-size:40px; margin-bottom:8px; }
    .hc-name { font-size:12px; font-weight:600; color:#202223; margin-bottom:4px; }
    .hc-price{ font-size:14px; font-weight:800; color:#008060; }
    .hero-badge { position:absolute; top:140px; left:0; background:#008060; color:white; border-radius:12px; padding:12px 16px; text-align:center; }
    .hb-num   { font-size:22px; font-weight:800; }
    .hb-label { font-size:11px; opacity:0.85; }

    /* Channels bar */
    .channels-bar { background:white; border-top:1px solid var(--color-border); border-bottom:1px solid var(--color-border); }
    .cb-inner { max-width:1200px; margin:0 auto; padding:24px; display:flex; align-items:center; justify-content:center; gap:32px; flex-wrap:wrap; }
    .cb-item  { display:flex; align-items:center; gap:12px; }
    .cb-icon  { font-size:28px; }
    .cb-item strong { display:block; font-size:13px; font-weight:700; color:#202223; }
    .cb-item span   { font-size:12px; color:#6D7175; }
    .cb-divider { width:1px; height:40px; background:var(--color-border); }

    /* Sections */
    .section { padding:64px 24px; }
    .bg-light { background:#F6F6F7; }
    .section-inner { max-width:1200px; margin:0 auto; }
    .section-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:28px; }
    .section-head h2 { font-size:26px; font-weight:800; }
    .see-all { font-size:14px; color:#008060; font-weight:600; }
    .see-all:hover { text-decoration:underline; }

    /* Categories */
    .categories-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:16px; }
    .cat-card { background:white; border:1px solid var(--color-border); border-radius:12px; padding:20px 12px; text-align:center; cursor:pointer; transition:all 0.15s; text-decoration:none; display:block; }
    .cat-card:hover { border-color:#008060; box-shadow:0 4px 16px rgba(0,128,96,0.12); transform:translateY(-2px); }
    .cat-icon  { font-size:32px; margin-bottom:8px; }
    .cat-name  { font-size:13px; font-weight:700; color:#202223; margin-bottom:2px; }
    .cat-count { font-size:11px; color:#6D7175; }

    /* Products grid */
    .products-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }
    .product-card  { background:white; border:1px solid var(--color-border); border-radius:12px; overflow:hidden; cursor:pointer; transition:all 0.15s; text-decoration:none; display:block; color:inherit; }
    .product-card:hover { box-shadow:var(--shadow-lg); transform:translateY(-3px); }
    .pc-image      { position:relative; aspect-ratio:1; background:#F6F6F7; overflow:hidden; }
    .pc-image img  { width:100%; height:100%; object-fit:cover; }
    .pc-placeholder{ width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:64px; }
    .pc-badge      { position:absolute; top:10px; left:10px; background:#D82C0D; color:white; font-size:11px; font-weight:700; padding:3px 8px; border-radius:6px; }
    .pc-info       { padding:14px 16px; }
    .pc-type       { font-size:11px; color:#6D7175; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px; }
    .pc-name       { font-size:14px; font-weight:700; color:#202223; margin-bottom:8px; line-height:1.3; }
    .pc-price-row  { display:flex; align-items:center; gap:8px; }
    .pc-price      { font-size:16px; font-weight:800; color:#008060; }
    .pc-compare    { font-size:13px; color:#6D7175; text-decoration:line-through; }

    /* Loading skeleton */
    .loading-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }
    .product-skeleton { background:#E1E3E5; border-radius:12px; aspect-ratio:0.85; animation:pulse 1.5s ease infinite alternate; }
    @keyframes pulse { from { opacity:1; } to { opacity:0.5; } }

    /* WhatsApp CTA */
    .wa-cta { background:#1A1A1A; padding:64px 24px; }
    .wa-cta-inner { max-width:900px; margin:0 auto; display:flex; justify-content:space-between; align-items:center; gap:32px; }
    .wa-cta-content { display:flex; align-items:center; gap:20px; }
    .wa-cta-icon { font-size:48px; flex-shrink:0; }
    .wa-cta h3 { font-size:22px; font-weight:700; color:white; margin-bottom:6px; }
    .wa-cta p  { font-size:14px; color:rgba(255,255,255,0.65); line-height:1.5; }
    .btn-wa-lg { display:inline-flex; align-items:center; gap:8px; background:#25D366; color:white; border:none; padding:16px 32px; border-radius:10px; font-size:15px; font-weight:700; cursor:pointer; white-space:nowrap; text-decoration:none; flex-shrink:0; transition:background 0.15s; }
    .btn-wa-lg:hover { background:#1da852; }

    .btn-primary { display:inline-flex; align-items:center; justify-content:center; background:#008060; color:white; border:none; padding:12px 24px; border-radius:8px; font-size:14px; font-weight:700; cursor:pointer; text-decoration:none; transition:background 0.15s; }
    .btn-primary:hover { background:#006E52; }
  `]
})
export class HomeComponent implements OnInit {
  featured: Product[] = [];
  loading = true;

  categories = [
    { icon:'👗', name:'Fashion',   count:24 },
    { icon:'🗿', name:'Art',       count:18 },
    { icon:'🎵', name:'Music',     count:9  },
    { icon:'🌿', name:'Beauty',    count:15 },
    { icon:'🧺', name:'Crafts',    count:22 },
    { icon:'🥩', name:'Food',      count:11 },
  ];

  staticProducts = [
    { icon:'👗', name:'Ankara Print Dress',      handle:'ankara-print-dress',      type:'Fashion', price:'45.00' },
    { icon:'🎵', name:'Mbira Musical Instrument', handle:'mbira-musical-instrument', type:'Music',   price:'120.00' },
    { icon:'🗿', name:'Shona Sculpture',          handle:'shona-sculpture',          type:'Art',     price:'85.00' },
    { icon:'🌿', name:'Baobab Oil Serum',         handle:'baobab-oil-serum',         type:'Beauty',  price:'28.00' },
  ];

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.productService.getProducts(0, 8).subscribe({
      next: r => { this.featured = r.content || []; this.loading = false; },
      error: ()  => { this.loading = false; }
    });
  }

  getPrice(p: Product)   { return p.variants?.[0]?.price ?? 0; }
  getCompare(p: Product) { return p.variants?.[0]?.compareAtPrice ?? 0; }
  hasDiscount(p: Product){ return (p.variants?.[0]?.compareAtPrice ?? 0) > (p.variants?.[0]?.price ?? 0); }
  categoryIcon(p: Product): string {
    const map: Record<string, string> = { Clothing:'👗', Music:'🎵', Art:'🗿', Beauty:'🌿', Crafts:'🧺', Food:'🥩' };
    return map[p.productType ?? ''] ?? '📦';
  }
}
