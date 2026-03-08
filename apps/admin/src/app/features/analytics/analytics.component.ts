import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-analytics', standalone: true, imports: [CommonModule],
  template: `
    <div class="page-header"><div><h1>Analytics</h1><p class="subtitle">Revenue and performance</p></div></div>
    <div class="card mb">
      <div class="card-head"><h3>Revenue by channel</h3>
        <div class="legend">
          <span><span class="dot" style="background:#2C5FD4"></span>Web</span>
          <span><span class="dot" style="background:#1877F2"></span>Facebook</span>
          <span><span class="dot" style="background:#008060"></span>WhatsApp</span>
        </div>
      </div>
      <div class="bar-chart">
        <div class="bg" *ngFor="let w of weeks; let i=index">
          <div class="stk">
            <div [style.height]="(web[i]/maxV*120)+'px'" style="background:#2C5FD4;border-radius:4px 4px 0 0"></div>
            <div [style.height]="(fb[i]/maxV*80)+'px'"  style="background:#1877F2"></div>
            <div [style.height]="(wa[i]/maxV*50)+'px'"  style="background:#008060;border-radius:0 0 4px 4px"></div>
          </div>
          <span class="lbl">{{ w }}</span>
        </div>
      </div>
      <div class="totals">
        <div *ngFor="let t of totals" class="tc">
          <div class="tc-label">{{ t.label }}</div>
          <div class="tc-val" [style.color]="t.color">{{ t.value }}</div>
          <div class="tc-chg">{{ t.change }}</div>
        </div>
      </div>
    </div>
    <div class="two-col">
      <div class="card">
        <h3 class="sub-title">Top products</h3>
        <div class="pr" *ngFor="let p of top"><span>{{ p.emoji }}</span><span class="pr-n">{{ p.name }}</span><span class="pr-r">{{ p.rev }}</span></div>
      </div>
      <div class="card">
        <h3 class="sub-title">Payment methods</h3>
        <div class="pm" *ngFor="let p of pay">
          <div class="pm-row"><span>{{ p.method }}</span><span class="muted">{{ p.pct }}%</span></div>
          <div class="pm-bar"><div [style.width]="p.pct+'%'" [style.background]="p.color" class="pm-fill"></div></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card { background:white; border:1px solid #E1E3E5; border-radius:10px; padding:24px; }
    .mb { margin-bottom:16px; }
    .two-col { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .card-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
    .card-head h3 { font-size:15px; font-weight:700; }
    .legend { display:flex; gap:16px; font-size:12px; }
    .dot { width:10px; height:10px; border-radius:50%; display:inline-block; margin-right:5px; }
    .bar-chart { display:flex; align-items:flex-end; gap:12px; height:200px; border-bottom:1px solid #E1E3E5; padding-bottom:24px; margin-bottom:20px; }
    .bg  { flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; }
    .stk { display:flex; flex-direction:column; width:100%; align-items:stretch; gap:1px; }
    .stk div { min-height:2px; }
    .lbl { font-size:10px; color:#8C9196; }
    .totals { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
    .tc { text-align:center; }
    .tc-label { font-size:11px; color:#6D7175; margin-bottom:4px; }
    .tc-val   { font-size:22px; font-weight:800; }
    .tc-chg   { font-size:12px; color:#008060; font-weight:600; }
    .sub-title { font-size:14px; font-weight:700; margin-bottom:14px; }
    .pr  { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid #F6F6F7; font-size:13px; }
    .pr-n{ flex:1; font-weight:500; }
    .pr-r{ font-weight:700; }
    .pm  { margin-bottom:14px; }
    .pm-row { display:flex; justify-content:space-between; font-size:13px; margin-bottom:5px; }
    .muted { color:#6D7175; }
    .pm-bar { background:#F6F6F7; border-radius:6px; height:8px; }
    .pm-fill{ height:100%; border-radius:6px; }
  `]
})
export class AnalyticsComponent {
  weeks=['Feb 7','Feb 14','Feb 21','Feb 28','Mar 7'];
  web=[420,680,520,890,740]; fb=[180,320,260,480,390]; wa=[60,140,90,200,130]; maxV=890;
  totals=[
    {label:'Web Store',value:'$4,250',change:'+18%',color:'#2C5FD4'},
    {label:'Facebook Shop',value:'$1,630',change:'+24%',color:'#1877F2'},
    {label:'WhatsApp',value:'$620',change:'+41%',color:'#008060'},
  ];
  top=[
    {emoji:'👗',name:'Ankara Print Dress',rev:'$2,025'},
    {emoji:'🎵',name:'Mbira Instrument',rev:'$1,440'},
    {emoji:'🗿',name:'Shona Sculpture',rev:'$850'},
    {emoji:'🌿',name:'Baobab Oil Serum',rev:'$504'},
  ];
  pay=[
    {method:'EcoCash',pct:48,color:'#008060'},
    {method:'Paynow Web',pct:32,color:'#2C5FD4'},
    {method:'OneMoney',pct:20,color:'#B98900'},
  ];
}
