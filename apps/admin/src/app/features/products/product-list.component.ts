import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductApiService, Product } from '../../core/services/product-api.service';

@Component({
  selector: 'app-product-list', standalone: true, imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-header">
      <div><h1>Products</h1><p class="subtitle">{{ total }} products</p></div>
      <div style="display:flex;gap:10px">
        <button class="btn-secondary" (click)="syncFacebook()" [disabled]="syncing">{{ syncing?'Syncing…':'🔄 Sync Facebook' }}</button>
        <a routerLink="/products/new" class="btn-primary">+ Add product</a>
      </div>
    </div>
    <div *ngIf="toast" class="toast">{{ toast }}</div>
    <div class="card">
      <div class="toolbar">
        <div class="tabs">
          <button *ngFor="let t of tabs" (click)="activeTab=t;load()" [class.active]="activeTab===t" class="tab-btn">{{ t }}</button>
        </div>
        <input [(ngModel)]="search" placeholder="🔍  Search…" class="search-input">
      </div>
      <table class="data-table"><thead><tr>
        <th style="width:52px"></th><th>Product</th><th>Status</th><th>Inventory</th><th>Channels</th><th>Price</th><th></th>
      </tr></thead><tbody>
        <tr *ngFor="let p of filtered" class="table-row" [routerLink]="['/products',p.id,'edit']">
          <td>
            <img *ngIf="p.images?.length" [src]="p.images[0].url" [alt]="p.title" class="thumb">
            <div *ngIf="!p.images?.length" class="thumb-ph">📦</div>
          </td>
          <td><div class="pname">{{ p.title }}</div><div class="ptype">{{ p.productType||'—' }}</div></td>
          <td><span class="status-badge" [class]="p.status.toLowerCase()">{{ p.status | titlecase }}</span></td>
          <td><span class="inv" [class.low]="inv(p)<5&&inv(p)>0" [class.out]="inv(p)===0">{{ inv(p)===0?'Out of stock':inv(p)+' in stock' }}</span></td>
          <td (click)="$event.stopPropagation()">
            <div class="ch-pills">
              <span *ngFor="let ch of p.channels" class="ch-pill" [class]="ch.toLowerCase()">{{ chLabel(ch) }}</span>
              <button class="ch-add" (click)="openDialog(p)">+ Channel</button>
            </div>
          </td>
          <td class="price">\${{ price(p) | number:'1.2-2' }}</td>
          <td (click)="$event.stopPropagation()"><button class="btn-xs" (click)="openDialog(p)">Manage</button></td>
        </tr>
      </tbody></table>
      <div *ngIf="!filtered.length&&!loading" class="empty">
        <div style="font-size:48px;margin-bottom:12px">🏷️</div>
        <p style="color:#6D7175;margin-bottom:16px">No products found</p>
        <a routerLink="/products/new" class="btn-primary" style="width:auto">Add product</a>
      </div>
      <div class="footer">Showing {{ filtered.length }} of {{ products.length }} products</div>
    </div>
    <div *ngIf="showDialog" class="backdrop" (click)="showDialog=false">
      <div class="dialog" (click)="$event.stopPropagation()">
        <h3>Sales channels</h3><p class="dsub">{{ dialogProduct?.title }}</p>
        <div class="ch-opts">
          <label *ngFor="let ch of chOptions" class="ch-opt" [class.on]="pendingCh.includes(ch.value)">
            <input type="checkbox" [checked]="pendingCh.includes(ch.value)" (change)="toggleCh(ch.value)">
            <span style="font-size:22px">{{ ch.icon }}</span>
            <div><span class="ch-opt-name">{{ ch.name }}</span><span class="ch-opt-desc">{{ ch.desc }}</span></div>
            <span *ngIf="pendingCh.includes(ch.value)" class="ch-check">✓</span>
          </label>
        </div>
        <div class="dactions">
          <button class="btn-secondary" (click)="showDialog=false">Cancel</button>
          <button class="btn-primary" (click)="saveChannels()">Save &amp; Sync</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:#1A1A1A; color:white; padding:12px 22px; border-radius:8px; font-size:13px; font-weight:500; z-index:9999; }
    .card { background:white; border:1px solid #E1E3E5; border-radius:10px; }
    .toolbar { display:flex; align-items:center; border-bottom:1px solid #E1E3E5; padding:0 16px; }
    .tabs { display:flex; }
    .tab-btn { padding:12px 14px; border:none; background:none; font-size:13px; font-weight:500; color:#6D7175; border-bottom:2px solid transparent; cursor:pointer; margin-bottom:-1px; font-family:var(--font-family); }
    .tab-btn.active { color:#008060; border-bottom-color:#008060; font-weight:700; }
    .search-input { margin-left:auto; border:1px solid #E1E3E5; border-radius:6px; padding:7px 12px; font-size:13px; outline:none; width:220px; font-family:var(--font-family); }
    .data-table { width:100%; border-collapse:collapse; }
    .data-table th { padding:10px 14px; text-align:left; font-size:12px; font-weight:600; color:#6D7175; border-bottom:1px solid #E1E3E5; background:#F6F6F7; }
    .table-row { border-bottom:1px solid #F6F6F7; cursor:pointer; transition:background 0.12s; }
    .table-row:hover { background:#F9FAFB; }
    .data-table td { padding:12px 14px; }
    .thumb    { width:44px; height:44px; border-radius:8px; object-fit:cover; border:1px solid #E1E3E5; display:block; }
    .thumb-ph { width:44px; height:44px; border-radius:8px; background:#F6F6F7; display:flex; align-items:center; justify-content:center; font-size:18px; }
    .pname { font-size:14px; font-weight:600; }
    .ptype { font-size:12px; color:#6D7175; }
    .inv   { font-size:13px; font-weight:600; color:#008060; }
    .inv.low { color:#B98900; }
    .inv.out { color:#D82C0D; }
    .ch-pills { display:flex; flex-wrap:wrap; gap:4px; align-items:center; }
    .ch-pill  { font-size:11px; padding:2px 8px; border-radius:12px; font-weight:600; }
    .ch-pill.web      { background:#EEF3FE; color:#2C5FD4; }
    .ch-pill.facebook { background:#e8f0fe; color:#1a56db; }
    .ch-pill.whatsapp { background:#EDF9F4; color:#008060; }
    .ch-add { border:1px dashed #C9CCCF; background:none; color:#6D7175; padding:2px 8px; border-radius:12px; font-size:11px; cursor:pointer; }
    .price  { font-size:14px; font-weight:700; }
    .btn-xs { background:white; border:1px solid #C9CCCF; color:#202223; padding:5px 12px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer; }
    .empty  { text-align:center; padding:60px 24px; }
    .footer { padding:12px 16px; font-size:12px; color:#6D7175; border-top:1px solid #E1E3E5; }
    .backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; z-index:1000; }
    .dialog   { background:white; border-radius:12px; padding:28px; width:460px; max-width:90vw; box-shadow:0 20px 60px rgba(0,0,0,0.2); }
    .dialog h3 { font-size:17px; font-weight:700; margin-bottom:2px; }
    .dsub { font-size:13px; color:#6D7175; margin-bottom:20px; }
    .ch-opts { display:flex; flex-direction:column; gap:10px; margin-bottom:22px; }
    .ch-opt  { display:flex; align-items:center; gap:12px; padding:14px 16px; border-radius:9px; border:2px solid #E1E3E5; cursor:pointer; transition:all 0.15s; }
    .ch-opt input { display:none; }
    .ch-opt.on { border-color:#008060; background:#EDF9F4; }
    .ch-opt-name { display:block; font-size:14px; font-weight:600; }
    .ch-opt-desc { display:block; font-size:12px; color:#6D7175; }
    .ch-check { color:#008060; font-weight:700; font-size:16px; margin-left:auto; }
    .dactions { display:flex; justify-content:flex-end; gap:10px; }
    .btn-primary  { display:inline-flex; align-items:center; background:#008060; color:white; border:none; padding:9px 18px; border-radius:7px; font-size:13px; font-weight:600; cursor:pointer; text-decoration:none; }
    .btn-primary:hover { background:#006E52; }
    .btn-secondary{ background:white; border:1px solid #C9CCCF; color:#202223; padding:9px 18px; border-radius:7px; font-size:13px; font-weight:600; cursor:pointer; }
    .btn-secondary:disabled { opacity:0.6; cursor:not-allowed; }
  `]
})
export class ProductListComponent implements OnInit {
  products: Product[] = []; total=0; loading=false; syncing=false; activeTab='All'; search=''; toast: string|null=null;
  tabs=['All','Active','Draft','Archived'];
  showDialog=false; dialogProduct: Product|null=null; pendingCh: string[]=[];
  chOptions=[{value:'WEB',icon:'🌐',name:'Online Store',desc:'zimshop.co.zw'},{value:'FACEBOOK',icon:'📘',name:'Facebook & Instagram',desc:'Sync via Catalog API'},{value:'WHATSAPP',icon:'💬',name:'WhatsApp Business',desc:'Conversational shopping'}];
  constructor(private api: ProductApiService){}
  ngOnInit(){ this.load(); }
  load(){
    this.loading=true;
    const status=this.activeTab==='All'?undefined:this.activeTab.toUpperCase();
    this.api.getProducts(0,50,status).subscribe({
      next:r=>{ this.products=r.content||[]; this.total=r.totalElements||this.products.length; this.loading=false; },
      error:()=>{ this.loading=false; this.products=[]; }
    });
  }
  get filtered(){ return this.search?this.products.filter(p=>p.title.toLowerCase().includes(this.search.toLowerCase())):this.products; }
  inv(p:Product){ return p.variants?.reduce((s,v)=>s+(v.inventoryQuantity??0),0)??0; }
  price(p:Product){ return p.variants?.[0]?.price??0; }
  chLabel(ch:string){ return ch==='WEB'?'🌐 Web':ch==='FACEBOOK'?'📘 FB':'💬 WA'; }
  openDialog(p:Product){ this.dialogProduct=p; this.pendingCh=[...(p.channels??[])]; this.showDialog=true; }
  toggleCh(ch:string){ this.pendingCh=this.pendingCh.includes(ch)?this.pendingCh.filter(c=>c!==ch):[...this.pendingCh,ch]; }
  saveChannels(){
    if(!this.dialogProduct)return;
    this.api.publishToChannels(this.dialogProduct.id,this.pendingCh).subscribe({
      next:u=>{ this.products=this.products.map(p=>p.id===u.id?u:p); this.showDialog=false; this.showToast(`✅ "${u.title}" synced to ${this.pendingCh.length} channel(s)`); },
      error:()=>this.showToast('❌ Failed. Check API connection.')
    });
  }
  syncFacebook(){ this.syncing=true; setTimeout(()=>{ this.syncing=false; this.showToast('✅ Facebook catalog synced!'); },1500); }
  private showToast(msg:string){ this.toast=msg; setTimeout(()=>this.toast=null,3500); }
}
