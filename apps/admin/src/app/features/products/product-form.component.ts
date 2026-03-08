import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ProductApiService } from '../../core/services/product-api.service';
@Component({
  selector: 'app-product-form', standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="page-header">
      <div><a routerLink="/products" class="back">← Products</a><h1>{{ isEdit?'Edit product':'Add product' }}</h1></div>
      <div style="display:flex;gap:10px">
        <button class="btn-secondary" (click)="save('DRAFT')">Save draft</button>
        <button class="btn-primary" (click)="save('ACTIVE')" [disabled]="saving">{{ saving?'Saving…':isEdit?'Save':'Save product' }}</button>
      </div>
    </div>
    <div *ngIf="toast" class="toast">{{ toast }}</div>
    <form [formGroup]="form" class="pform">
      <div class="left">
        <div class="card fm-card">
          <div class="fg"><label>Title <span class="req">*</span></label><input formControlName="title" class="fi" placeholder="e.g. Ankara Print Dress"></div>
          <div class="fg"><label>Description</label><textarea formControlName="description" rows="5" class="fi" placeholder="Describe your product…"></textarea></div>
        </div>
        <div class="card fm-card">
          <h3 class="card-title">Pricing</h3>
          <div class="frow">
            <div class="fg"><label>Price</label><div class="ipfx"><span class="pfx">$</span><input formControlName="price" type="number" step="0.01" class="fi pfi" placeholder="0.00"></div></div>
            <div class="fg"><label>Compare-at</label><div class="ipfx"><span class="pfx">$</span><input formControlName="compareAtPrice" type="number" step="0.01" class="fi pfi" placeholder="0.00"></div></div>
          </div>
        </div>
        <div class="card fm-card">
          <h3 class="card-title">Inventory</h3>
          <div class="frow">
            <div class="fg"><label>SKU</label><input formControlName="sku" class="fi" placeholder="e.g. DRESS-RED-LG"></div>
            <div class="fg"><label>Quantity</label><input formControlName="quantity" type="number" class="fi" placeholder="0"></div>
          </div>
        </div>
      </div>
      <div class="right">
        <div class="card fm-card">
          <h3 class="card-title">Status</h3>
          <select formControlName="status" class="fi"><option value="ACTIVE">Active</option><option value="DRAFT">Draft</option><option value="ARCHIVED">Archived</option></select>
        </div>
        <div class="card fm-card">
          <h3 class="card-title">Sales channels</h3>
          <div class="ch-list">
            <label *ngFor="let ch of channels" class="ch-row" [class.on]="isChOn(ch.value)">
              <div class="ch-l"><span style="font-size:18px">{{ ch.icon }}</span><div><span class="chn">{{ ch.name }}</span><span class="chd">{{ ch.desc }}</span></div></div>
              <input type="checkbox" [checked]="isChOn(ch.value)" (change)="toggleCh(ch.value)" style="width:16px;height:16px;accent-color:#008060;cursor:pointer">
            </label>
          </div>
        </div>
        <div class="card fm-card">
          <h3 class="card-title">Organization</h3>
          <div class="fg"><label>Product type</label><input formControlName="productType" class="fi" placeholder="e.g. Clothing"></div>
          <div class="fg"><label>Vendor</label><input formControlName="vendor" class="fi" placeholder="e.g. ZimCraft"></div>
          <div class="fg"><label>Tags</label><input formControlName="tags" class="fi" placeholder="summer, sale (comma-separated)"></div>
        </div>
      </div>
    </form>
  `,
  styles: [`
    .back { font-size:13px; color:#6D7175; display:block; margin-bottom:4px; }
    .toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:#1A1A1A; color:white; padding:12px 22px; border-radius:8px; font-size:13px; font-weight:500; z-index:9999; }
    .pform { display:grid; grid-template-columns:1fr 300px; gap:20px; margin-top:20px; }
    .left,.right { display:flex; flex-direction:column; gap:16px; }
    .card { background:white; border:1px solid #E1E3E5; border-radius:10px; }
    .fm-card { padding:20px; }
    .card-title { font-size:14px; font-weight:700; margin-bottom:14px; }
    .fg { margin-bottom:14px; }
    .fg:last-child { margin-bottom:0; }
    label { display:block; font-size:13px; font-weight:600; margin-bottom:5px; }
    .req { color:#D82C0D; }
    .fi  { width:100%; padding:8px 12px; border:1px solid #C9CCCF; border-radius:7px; font-size:14px; font-family:var(--font-family); outline:none; color:#202223; }
    .fi:focus { border-color:#008060; }
    textarea.fi { resize:vertical; }
    select.fi   { appearance:none; background:white; }
    .frow { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .ipfx { position:relative; }
    .pfx  { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#6D7175; font-size:14px; }
    .pfi  { padding-left:24px; }
    .ch-list { display:flex; flex-direction:column; gap:2px; }
    .ch-row  { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border-radius:7px; border:1px solid transparent; cursor:pointer; transition:all 0.15s; }
    .ch-row:hover { background:#F6F6F7; }
    .ch-row.on    { border-color:#AEE9D1; background:#EDF9F4; }
    .ch-l  { display:flex; align-items:center; gap:10px; }
    .chn   { display:block; font-size:13px; font-weight:600; }
    .chd   { display:block; font-size:11px; color:#6D7175; }
    .btn-primary  { background:#008060; color:white; border:none; padding:9px 18px; border-radius:7px; font-size:13px; font-weight:600; cursor:pointer; font-family:var(--font-family); }
    .btn-primary:hover:not(:disabled) { background:#006E52; }
    .btn-primary:disabled { opacity:0.6; cursor:not-allowed; }
    .btn-secondary { background:white; border:1px solid #C9CCCF; color:#202223; padding:9px 18px; border-radius:7px; font-size:13px; font-weight:600; cursor:pointer; }
  `]
})
export class ProductFormComponent implements OnInit {
  form=this.fb.group({title:['',Validators.required],description:[''],price:[0],compareAtPrice:[null as number|null],sku:[''],quantity:[0],status:['DRAFT'],productType:[''],vendor:[''],tags:['']});
  isEdit=false; saving=false; toast: string|null=null; selectedChannels=['WEB'];
  channels=[{value:'WEB',icon:'🌐',name:'Online Store',desc:'zimshop.co.zw'},{value:'FACEBOOK',icon:'📘',name:'Facebook & Instagram',desc:'Via Catalog API'},{value:'WHATSAPP',icon:'💬',name:'WhatsApp Business',desc:'Conversational'}];
  constructor(private fb:FormBuilder,private api:ProductApiService,private route:ActivatedRoute,private router:Router){}
  ngOnInit(){
    const id=this.route.snapshot.params['id'];
    if(id){ this.isEdit=true; this.api.getProduct(id).subscribe(p=>{ this.form.patchValue({title:p.title,description:p.description,price:p.variants?.[0]?.price??0,sku:p.variants?.[0]?.sku??'',quantity:p.variants?.[0]?.inventoryQuantity??0,status:p.status,productType:p.productType??'',vendor:p.vendor??'',tags:(p.tags??[]).join(', ')}); this.selectedChannels=p.channels??[]; }); }
  }
  isChOn(ch:string){ return this.selectedChannels.includes(ch); }
  toggleCh(ch:string){ this.selectedChannels=this.selectedChannels.includes(ch)?this.selectedChannels.filter(c=>c!==ch):[...this.selectedChannels,ch]; }
  save(status:string){
    if(this.form.get('title')?.invalid){this.showToast('❌ Title required');return;}
    this.saving=true;
    const v=this.form.value;
    const payload={title:v.title,description:v.description,status,vendor:v.vendor,productType:v.productType,tags:v.tags?v.tags.split(',').map((t:string)=>t.trim()).filter(Boolean):[],channels:this.selectedChannels,variants:[{title:'Default Title',sku:v.sku,price:v.price,inventoryQuantity:v.quantity}]};
    const id=this.route.snapshot.params['id'];
    (id?this.api.updateProduct(id,payload):this.api.createProduct(payload)).subscribe({
      next:()=>{ this.saving=false; this.showToast('✅ Saved!'); setTimeout(()=>this.router.navigate(['/products']),1000); },
      error:()=>{ this.saving=false; this.showToast('❌ Failed. Check API connection.'); }
    });
  }
  private showToast(msg:string){ this.toast=msg; setTimeout(()=>this.toast=null,3500); }
}
