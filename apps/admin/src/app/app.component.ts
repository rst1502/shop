import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  template: `
    <div class="shell">
      <nav class="sidebar">
        <div class="sidebar-logo">
          <div class="logo-icon">Z</div>
          <div class="logo-text">
            <span class="logo-name">ZimShop</span>
            <span class="logo-sub">Admin</span>
          </div>
        </div>
        <div class="nav-section">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-item">
            <span class="nav-icon">⊞</span> Home
          </a>
          <a routerLink="/orders" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📦</span> Orders
            <span class="nav-badge">3</span>
          </a>
          <a routerLink="/products" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🏷️</span> Products
          </a>
          <a routerLink="/channels" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🔗</span> Channels
          </a>
          <a routerLink="/analytics" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📊</span> Analytics
          </a>
        </div>
        <div class="nav-bottom">
          <div class="channel-status">
            <span class="ch-dot web">🌐 Web</span>
            <span class="ch-dot fb">📘 FB</span>
            <span class="ch-dot wa">💬 WA</span>
          </div>
          <div class="user-info">
            <div class="user-avatar">A</div>
            <div>
              <span class="user-name">Admin</span>
              <span class="user-email">admin&#64;zimshop.co.zw</span>
            </div>
          </div>
        </div>
      </nav>
      <div class="main">
        <div class="topbar">
          <input placeholder="🔍  Search ZimShop" class="topbar-search">
          <div class="topbar-chips">
            <span class="chip web">🌐 Web Live</span>
            <span class="chip fb">📘 FB Synced</span>
            <span class="chip wa">💬 WA Active</span>
          </div>
        </div>
        <div class="content">
          <router-outlet/>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .shell { display:flex; height:100vh; font-family:var(--font-family); }
    .sidebar { width:224px; background:#1A1A1A; display:flex; flex-direction:column; flex-shrink:0; overflow-y:auto; }
    .sidebar-logo { display:flex; align-items:center; gap:10px; padding:18px 14px 16px; border-bottom:1px solid rgba(255,255,255,0.08); margin-bottom:8px; }
    .logo-icon { width:32px; height:32px; background:#008060; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:800; color:white; }
    .logo-name { display:block; font-size:15px; font-weight:700; color:white; }
    .logo-sub  { display:block; font-size:10px; color:#6D7175; text-transform:uppercase; }
    .nav-section { padding:4px 8px; flex:1; }
    .nav-item { display:flex; align-items:center; gap:9px; padding:9px 10px; border-radius:7px; color:#A8ABB2; text-decoration:none; font-size:13px; font-weight:500; margin-bottom:1px; transition:all 0.15s; }
    .nav-item:hover { background:rgba(255,255,255,0.07); color:white; }
    .nav-item.active { background:#2A2A2A; color:white; font-weight:600; }
    .nav-icon { font-size:15px; width:20px; text-align:center; }
    .nav-badge { margin-left:auto; background:#D82C0D; color:white; border-radius:10px; padding:1px 7px; font-size:11px; font-weight:700; }
    .nav-bottom { padding:12px 8px; border-top:1px solid rgba(255,255,255,0.08); }
    .channel-status { display:flex; gap:6px; padding:0 4px; margin-bottom:10px; }
    .ch-dot { font-size:10px; padding:3px 7px; border-radius:10px; font-weight:600; }
    .ch-dot.web { background:rgba(46,113,212,0.2); color:#6ea8fe; }
    .ch-dot.fb  { background:rgba(24,119,242,0.2); color:#6ea8fe; }
    .ch-dot.wa  { background:rgba(0,128,96,0.2);   color:#AEE9D1; }
    .user-info { display:flex; align-items:center; gap:9px; padding:9px 10px; border-radius:7px; background:#2A2A2A; }
    .user-avatar { width:28px; height:28px; border-radius:50%; background:#008060; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; color:white; }
    .user-name  { display:block; font-size:12px; font-weight:600; color:white; }
    .user-email { display:block; font-size:10px; color:#6D7175; }
    .main { flex:1; display:flex; flex-direction:column; overflow:hidden; }
    .topbar { height:54px; background:white; border-bottom:1px solid #E1E3E5; display:flex; align-items:center; padding:0 24px; gap:16px; flex-shrink:0; }
    .topbar-search { flex:1; max-width:400px; border:1px solid #E1E3E5; border-radius:7px; padding:7px 14px; font-size:13px; outline:none; background:#F6F6F7; font-family:var(--font-family); }
    .topbar-chips { display:flex; gap:8px; margin-left:auto; }
    .chip { font-size:11px; padding:4px 10px; border-radius:12px; font-weight:600; }
    .chip.web { background:#EEF3FE; color:#2C5FD4; }
    .chip.fb  { background:#e8f0fe; color:#1a56db; }
    .chip.wa  { background:#EDF9F4; color:#008060; }
    .content { flex:1; overflow-y:auto; padding:24px; background:#F6F6F7; }
  `]
})
export class AppComponent {}
