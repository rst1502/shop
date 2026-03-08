import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-channels', standalone: true, imports: [CommonModule],
  template: `
    <div class="page-header"><div><h1>Sales channels</h1><p class="subtitle">Manage where your products are sold</p></div></div>
    <div class="list">
      <div *ngFor="let ch of channels" class="ch-card">
        <div class="ch-icon">{{ ch.icon }}</div>
        <div class="ch-info">
          <div class="ch-top">
            <span class="ch-name">{{ ch.name }}</span>
            <span class="status-badge" [class]="ch.connected?'active':'draft'">{{ ch.connected?'Active':'Inactive' }}</span>
          </div>
          <p class="ch-desc">{{ ch.desc }}</p>
          <div class="ch-stats" *ngIf="ch.stats">
            <span *ngIf="ch.stats.products"><b>{{ ch.stats.products }}</b> products</span>
            <span><b>{{ ch.stats.orders }}</b> orders</span>
            <span class="green"><b>{{ ch.stats.revenue }}</b></span>
          </div>
          <div class="steps" *ngIf="ch.steps && ch.connected">
            <span *ngFor="let s of ch.steps" class="step">✓ {{ s }}</span>
          </div>
        </div>
        <div class="ch-actions">
          <button class="btn-secondary">Settings</button>
          <button *ngIf="ch.toggleable" class="btn-toggle" [class.disc]="ch.connected" (click)="ch.connected=!ch.connected">
            {{ ch.connected?'Disconnect':'Connect' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .list { display:flex; flex-direction:column; gap:14px; }
    .ch-card { background:white; border:1px solid #E1E3E5; border-radius:10px; display:flex; align-items:flex-start; gap:16px; padding:22px 24px; }
    .ch-icon { width:48px; height:48px; background:#F6F6F7; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:24px; flex-shrink:0; }
    .ch-info { flex:1; }
    .ch-top  { display:flex; align-items:center; gap:10px; margin-bottom:4px; }
    .ch-name { font-size:15px; font-weight:700; }
    .ch-desc { font-size:13px; color:#6D7175; margin-bottom:10px; }
    .ch-stats { display:flex; gap:20px; font-size:12px; color:#6D7175; }
    .green { color:#008060; }
    .steps { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
    .step  { background:#EDF9F4; color:#008060; font-size:11px; padding:2px 9px; border-radius:12px; font-weight:600; }
    .ch-actions { display:flex; gap:8px; }
    .btn-secondary { background:white; border:1px solid #C9CCCF; color:#202223; padding:7px 14px; border-radius:7px; font-size:13px; font-weight:600; cursor:pointer; }
    .btn-toggle { padding:7px 14px; border-radius:7px; font-size:13px; font-weight:600; cursor:pointer; border:none; background:#008060; color:white; }
    .btn-toggle.disc { background:#FFF4F4; color:#D82C0D; border:1px solid #FFC9C9; }
  `]
})
export class ChannelsComponent {
  channels = [
    {icon:'🌐',name:'Online Store',connected:true,toggleable:false,desc:'Your primary web storefront at zimshop.co.zw',stats:{products:6,orders:24,revenue:'$2,680'}},
    {icon:'📘',name:'Facebook & Instagram Shopping',connected:true,toggleable:true,desc:'Sync your catalog to Facebook Shop and Instagram. Orders flow back automatically.',stats:{products:5,orders:13,revenue:'$1,420'},steps:['Business Account','Catalog API','Webhook active']},
    {icon:'💬',name:'WhatsApp Business',connected:true,toggleable:true,desc:'Let customers browse and buy directly via WhatsApp conversations.',stats:{products:4,orders:6,revenue:'$720'},steps:['Business App','Phone verified','Webhook active']},
    {icon:'💳',name:'Paynow Zimbabwe',connected:true,toggleable:false,desc:'Accept EcoCash, OneMoney, and bank payments. Default payment gateway.',stats:{orders:43,revenue:'$4,820'}},
  ];
}
