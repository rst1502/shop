import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CartService } from './core/services/product.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  template: `
    <div class="site">
      <!-- Header -->
      <header class="header">
        <div class="header-inner">
          <a routerLink="/" class="logo">
            <span class="logo-icon">Z</span>
            <span class="logo-text">ZimShop</span>
          </a>
          <nav class="nav">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Home</a>
            <a routerLink="/products" routerLinkActive="active">Shop</a>
            <a href="#about">About</a>
          </nav>
          <div class="header-actions">
            <a routerLink="/products" class="search-btn" title="Search">🔍</a>
            <a routerLink="/cart" class="cart-btn">
              🛒
              <span *ngIf="cart.count > 0" class="cart-badge">{{ cart.count }}</span>
            </a>
          </div>
        </div>
        <!-- WhatsApp CTA bar -->
        <div class="wa-bar">
          <span>💬 Shop via WhatsApp — message us at</span>
          <a href="https://wa.me/263777000000" target="_blank">+263 777 000 000</a>
          <span>· Type <strong>CATALOG</strong> to browse</span>
        </div>
      </header>

      <!-- Page content -->
      <main class="main">
        <router-outlet/>
      </main>

      <!-- Footer -->
      <footer class="footer">
        <div class="footer-inner">
          <div class="footer-brand">
            <span class="logo-icon sm">Z</span>
            <div>
              <div class="footer-name">ZimShop</div>
              <div class="footer-sub">Zimbabwe's multi-channel marketplace</div>
            </div>
          </div>
          <div class="footer-links">
            <div class="footer-col">
              <strong>Shop</strong>
              <a routerLink="/products">All products</a>
              <a routerLink="/products">New arrivals</a>
              <a routerLink="/products">Sale</a>
            </div>
            <div class="footer-col">
              <strong>Help</strong>
              <a href="#">FAQ</a>
              <a href="#">Shipping</a>
              <a href="#">Returns</a>
            </div>
            <div class="footer-col">
              <strong>Connect</strong>
              <a href="https://wa.me/263777000000" target="_blank">💬 WhatsApp</a>
              <a href="#">📘 Facebook Shop</a>
              <a href="#">📸 Instagram</a>
            </div>
            <div class="footer-col">
              <strong>Payments</strong>
              <div class="payment-icons">
                <span>💳 EcoCash</span>
                <span>📱 OneMoney</span>
                <span>🏦 Paynow</span>
              </div>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© 2026 ZimShop · Made in Zimbabwe 🇿🇼</span>
          <span>Powered by Paynow · EcoCash · WhatsApp Commerce</span>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .site { display:flex; flex-direction:column; min-height:100vh; }

    /* Header */
    .header { background:white; border-bottom:1px solid var(--color-border); position:sticky; top:0; z-index:100; }
    .header-inner { max-width:1200px; margin:0 auto; padding:0 24px; height:60px; display:flex; align-items:center; gap:32px; }
    .logo { display:flex; align-items:center; gap:8px; text-decoration:none; }
    .logo-icon { width:34px; height:34px; background:#008060; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:17px; font-weight:800; color:white; flex-shrink:0; }
    .logo-icon.sm { width:28px; height:28px; font-size:14px; }
    .logo-text { font-size:18px; font-weight:800; color:#202223; }
    .nav { display:flex; gap:24px; margin-left:auto; }
    .nav a { font-size:14px; font-weight:500; color:#6D7175; text-decoration:none; transition:color 0.15s; }
    .nav a:hover, .nav a.active { color:#008060; }
    .header-actions { display:flex; align-items:center; gap:12px; }
    .search-btn, .cart-btn { font-size:20px; position:relative; text-decoration:none; cursor:pointer; }
    .cart-badge { position:absolute; top:-6px; right:-8px; background:#D82C0D; color:white; border-radius:10px; padding:0 5px; font-size:10px; font-weight:700; min-width:16px; text-align:center; }
    .wa-bar { background:#1A1A1A; color:rgba(255,255,255,0.8); text-align:center; font-size:12px; padding:7px 24px; }
    .wa-bar a { color:#AEE9D1; font-weight:600; text-decoration:none; }
    .wa-bar a:hover { text-decoration:underline; }

    /* Main */
    .main { flex:1; }

    /* Footer */
    .footer { background:#1A1A1A; color:rgba(255,255,255,0.7); margin-top:auto; }
    .footer-inner { max-width:1200px; margin:0 auto; padding:48px 24px; display:flex; gap:64px; }
    .footer-brand { display:flex; align-items:flex-start; gap:12px; flex-shrink:0; }
    .footer-name  { font-size:15px; font-weight:700; color:white; margin-bottom:2px; }
    .footer-sub   { font-size:12px; }
    .footer-links { flex:1; display:grid; grid-template-columns:repeat(4,1fr); gap:32px; }
    .footer-col   { display:flex; flex-direction:column; gap:10px; }
    .footer-col strong { color:white; font-size:13px; font-weight:700; }
    .footer-col a { font-size:13px; color:rgba(255,255,255,0.6); text-decoration:none; }
    .footer-col a:hover { color:white; }
    .payment-icons { display:flex; flex-direction:column; gap:6px; font-size:12px; }
    .footer-bottom { max-width:1200px; margin:0 auto; padding:16px 24px; border-top:1px solid rgba(255,255,255,0.1); display:flex; justify-content:space-between; font-size:12px; }
  `]
})
export class AppComponent {
  constructor(public cart: CartService) {}
}
