import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-header">
      <div><h1>Home</h1><p class="subtitle">Welcome back — store overview</p></div>
      <a href="http://localhost:4201" target="_blank" class="btn-secondary">View store</a>
    </div>
    <div class="banner">
      <span>✅</span>
      <div><strong>Your store is live!</strong><span class="banner-sub">3 channels active</span></div>
      <div class="banner-pills">
        <span class="pill web">🌐 Web</span>
        <span class="pill fb">📘 Facebook</span>
        <span class="pill wa">💬 WhatsApp</span>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card" *ngFor="let s of stats">
        <div class="stat-label">{{ s.label }}</div>
        <div class="stat-value">{{ s.value }}</div>
        <div class="stat-change">
          <span [class]="s.up ? 'up' : 'down'">{{ s.change }}</span>
          <span class="period">vs last 30 days</span>
        </div>
      </div>
    </div>
    <div class="two-col">
      <div class="card">
        <div class="card-head"><h3>Sales by channel</h3><span>Last 30 days</span></div>
        <div class="ch-bars">
          <div class="bar-item" *ngFor="let ch of channelStats">
            <div class="bar-row">
              <span class="bar-name">{{ ch.name }}</span>
              <span class="bar-meta">{{ ch.revenue }} · {{ ch.orders }} orders</span>
            </div>
            <div class="bar-track"><div class="bar-fill" [style.width]="ch.pct+'%'" [style.background]="ch.color"></div></div>
          </div>
        </div>
        <div class="mini-chart">
          <div class="mini-label">Daily revenue (last 7 days)</div>
          <div class="bars">
            <div class="bar-col" *ngFor="let b of weekBars; let i = index">
              <div class="bar-rect" [class.today]="i===6" [style.height]="(b.v/720*70)+'px'"></div>
              <span class="bar-day">{{ b.d }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Recent orders</h3><a routerLink="/orders" class="view-all">View all →</a></div>
        <div class="order-list">
          <div class="order-row" *ngFor="let o of recentOrders">
            <div class="order-icon">{{ o.channel==='FACEBOOK'?'📘':o.channel==='WHATSAPP'?'💬':'🌐' }}</div>
            <div class="order-info">
              <span class="order-num">{{ o.id }}</span>
              <span class="order-cust">{{ o.customer }}</span>
            </div>
            <div class="order-right">
              <span class="order-total">\${{ o.total }}</span>
              <span class="status-badge" [class]="o.status.toLowerCase()">{{ o.status }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .banner { display:flex; align-items:center; gap:12px; background:#EDF9F4; border:1px solid #AEE9D1; border-radius:8px; padding:14px 18px; margin-bottom:20px; }
    .banner strong { color:#008060; font-size:14px; }
    .banner-sub { font-size:12px; color:#6D7175; margin-left:8px; }
    .banner-pills { margin-left:auto; display:flex; gap:8px; }
    .pill { font-size:11px; padding:3px 10px; border-radius:12px; font-weight:600; }
    .pill.web { background:#EEF3FE; color:#2C5FD4; }
    .pill.fb  { background:#e8f0fe; color:#1a56db; }
    .pill.wa  { background:#EDF9F4; color:#008060; }

    .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px; }
    .stat-card { background:white; border:1px solid #E1E3E5; border-radius:10px; padding:18px 20px; }
    .stat-label { font-size:13px; color:#6D7175; margin-bottom:6px; }
    .stat-value { font-size:26px; font-weight:800; color:#202223; margin-bottom:4px; }
    .up   { color:#008060; font-weight:700; font-size:13px; }
    .down { color:#D82C0D; font-weight:700; font-size:13px; }
    .period { font-size:12px; color:#6D7175; margin-left:4px; }

    .two-col { display:grid; grid-template-columns:1fr 340px; gap:16px; }
    .card { background:white; border:1px solid #E1E3E5; border-radius:10px; padding:22px; }
    .card-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
    .card-head h3 { font-size:15px; font-weight:700; }
    .card-head span { font-size:12px; color:#6D7175; }
    .view-all { font-size:13px; color:#008060; font-weight:600; }

    .ch-bars { display:flex; flex-direction:column; gap:16px; }
    .bar-item { display:flex; flex-direction:column; gap:5px; }
    .bar-row { display:flex; justify-content:space-between; }
    .bar-name { font-size:13px; font-weight:600; }
    .bar-meta { font-size:12px; color:#6D7175; }
    .bar-track { background:#F6F6F7; border-radius:6px; height:10px; }
    .bar-fill  { height:100%; border-radius:6px; }

    .mini-chart { margin-top:22px; border-top:1px solid #E1E3E5; padding-top:18px; }
    .mini-label { font-size:13px; font-weight:600; margin-bottom:10px; }
    .bars { display:flex; align-items:flex-end; gap:8px; height:80px; }
    .bar-col { flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; }
    .bar-rect { width:100%; background:#AEE9D1; border-radius:4px 4px 0 0; min-height:4px; }
    .bar-rect.today { background:#008060; }
    .bar-day { font-size:10px; color:#8C9196; }

    .order-list { display:flex; flex-direction:column; }
    .order-row { display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid #F6F6F7; }
    .order-icon { width:36px; height:36px; background:#F6F6F7; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:16px; }
    .order-info { flex:1; display:flex; flex-direction:column; }
    .order-num  { font-size:13px; font-weight:700; color:#008060; }
    .order-cust { font-size:11px; color:#6D7175; }
    .order-right { display:flex; flex-direction:column; align-items:flex-end; gap:3px; }
    .order-total { font-size:13px; font-weight:700; }

    .btn-secondary { background:white; border:1px solid #C9CCCF; color:#202223; padding:8px 16px; border-radius:7px; font-size:13px; font-weight:600; text-decoration:none; }
  `]
})
export class DashboardComponent {
  stats = [
    { label:'Total sales', value:'$4,820', change:'+12.4%', up:true },
    { label:'Orders',      value:'43',     change:'+8',     up:true },
    { label:'Customers',   value:'218',    change:'+5.1%',  up:true },
    { label:'Avg. order',  value:'$112',   change:'-3.2%',  up:false },
  ];
  channelStats = [
    { name:'Web Store',     orders:24, revenue:'$2,680', color:'#2C5FD4', pct:55 },
    { name:'Facebook Shop', orders:13, revenue:'$1,420', color:'#1877F2', pct:29 },
    { name:'WhatsApp',      orders:6,  revenue:'$720',   color:'#008060', pct:16 },
  ];
  weekBars = [
    {d:'M',v:320},{d:'T',v:480},{d:'W',v:280},{d:'T',v:620},{d:'F',v:540},{d:'S',v:390},{d:'S',v:720}
  ];
  recentOrders = [
    {id:'ZS-001043', customer:'Tendai Moyo',    channel:'FACEBOOK', total:'45.00',  status:'Paid'},
    {id:'ZS-001042', customer:'Rudo Chikwanda', channel:'WEB',      total:'153.00', status:'Processing'},
    {id:'ZS-001041', customer:'Farai Dube',     channel:'WHATSAPP', total:'32.00',  status:'Shipped'},
    {id:'ZS-001040', customer:'Chido Mutasa',   channel:'WEB',      total:'85.00',  status:'Delivered'},
  ];
}
