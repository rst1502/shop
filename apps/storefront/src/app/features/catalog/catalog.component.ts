import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, Product, CartService } from '../../core/services/product.service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="catalog-page">
      <aside class="sidebar">
        <h3>Filter</h3>
        <div class="filter-group">
          <label class="filter-label">Category</label>
          <div *ngFor="let c of categories" class="filter-opt">
            <label><input type="radio" name="cat" [value]="c.value" [(ngModel)]="selectedCat" (change)="applyFilter()"> {{ c.label }}</label>
          </div>
        </div>
        <div class="filter-group">
          <label class="filter-label">Price range</label>
          <div *ngFor="let r of priceRanges" class="filter-opt">
            <label><input type="radio" name="price" [value]="r.value" [(ngModel)]="selectedPrice" (change)="applyFilter()"> {{ r.label }}</label>
          </div>
        </div>
        <div class="filter-group">
          <label class="filter-label">Channel</label>
          <div *ngFor="let ch of channelFilters" class="filter-opt">
            <label><input type="checkbox" [value]="ch.value" (change)="toggleChannel(ch.value)"> {{ ch.label }}</label>
          </div>
        </div>
        <button class="clear-btn" (click)="clearFilters()">Clear filters</button>
      </aside>

      <div class="results">
        <div class="results-header">
          <h1>All Products <span class="count">({{ filtered.length }})</span></h1>
          <div class="sort-row">
            <input [(ngModel)]="search" placeholder="🔍 Search…" class="search-in" (input)="applyFilter()">
            <select [(ngModel)]="sortBy" (change)="applyFilter()" class="sort-sel">
              <option value="default">Featured</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>

        <div *ngIf="loading" class="grid">
          <div *ngFor="let i of [1,2,3,4,5,6,7,8]" class="skeleton"></div>
        </div>

        <div *ngIf="!loading && filtered.length === 0" class="empty">
          <div style="font-size:56px;margin-bottom:16px">🔍</div>
          <h3>No products found</h3>
          <p>Try different filters or search terms</p>
          <button class="clear-btn mt" (click)="clearFilters()">Clear all filters</button>
        </div>

        <div *ngIf="!loading" class="grid">
          <a *ngFor="let p of filtered" [routerLink]="['/products', p.handle]" class="product-card">
            <div class="pc-img">
              <img *ngIf="p.images?.length" [src]="p.images[0].url" [alt]="p.title" loading="lazy">
              <div *ngIf="!p.images?.length" class="pc-ph">{{ icon(p) }}</div>
              <div *ngIf="hasDiscount(p)" class="pc-sale">Sale</div>
              <div class="pc-channels">
                <span *ngFor="let ch of p.channels" class="ch-dot" [title]="ch">{{ chIcon(ch) }}</span>
              </div>
            </div>
            <div class="pc-info">
              <div class="pc-vendor">{{ p.vendor || p.productType || 'Zimbabwe' }}</div>
              <div class="pc-name">{{ p.title }}</div>
              <div class="pc-price-row">
                <span class="pc-price">\${{ price(p) | number:'1.2-2' }}</span>
                <span *ngIf="hasDiscount(p)" class="pc-compare">\${{ compare(p) | number:'1.2-2' }}</span>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .catalog-page { max-width:1200px; margin:0 auto; padding:40px 24px; display:grid; grid-template-columns:220px 1fr; gap:40px; }
    .sidebar { position:sticky; top:80px; align-self:start; }
    .sidebar h3 { font-size:16px; font-weight:800; margin-bottom:20px; }
    .filter-group { margin-bottom:24px; border-bottom:1px solid var(--color-border); padding-bottom:20px; }
    .filter-label { display:block; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:#6D7175; margin-bottom:10px; }
    .filter-opt   { margin-bottom:7px; font-size:13px; }
    .filter-opt label { cursor:pointer; display:flex; align-items:center; gap:7px; }
    .clear-btn { background:none; border:1px solid var(--color-border-dk); padding:8px 14px; border-radius:7px; font-size:13px; cursor:pointer; width:100%; font-family:var(--font); }
    .clear-btn.mt { margin-top:12px; }
    .clear-btn:hover { background:#F6F6F7; }
    .results-header { margin-bottom:24px; }
    h1 { font-size:24px; font-weight:800; margin-bottom:14px; }
    .count { color:#6D7175; font-weight:400; }
    .sort-row { display:flex; gap:12px; }
    .search-in { flex:1; padding:9px 14px; border:1px solid var(--color-border-dk); border-radius:8px; font-size:13px; outline:none; font-family:var(--font); }
    .search-in:focus { border-color:#008060; }
    .sort-sel   { padding:9px 12px; border:1px solid var(--color-border-dk); border-radius:8px; font-size:13px; background:white; font-family:var(--font); outline:none; }
    .grid       { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
    .skeleton   { background:#E1E3E5; border-radius:12px; aspect-ratio:.85; animation:pulse 1.5s ease infinite alternate; }
    @keyframes pulse { from{opacity:1}to{opacity:.5} }
    .empty      { text-align:center; padding:80px 24px; }
    .empty h3   { font-size:20px; font-weight:700; margin-bottom:8px; }
    .empty p    { color:#6D7175; }
    .product-card { background:white; border:1px solid var(--color-border); border-radius:12px; overflow:hidden; cursor:pointer; transition:all .15s; text-decoration:none; display:block; color:inherit; }
    .product-card:hover { box-shadow:0 8px 24px rgba(0,0,0,.12); transform:translateY(-3px); }
    .pc-img     { position:relative; aspect-ratio:1; background:#F6F6F7; overflow:hidden; }
    .pc-img img { width:100%; height:100%; object-fit:cover; }
    .pc-ph      { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:64px; }
    .pc-sale    { position:absolute; top:10px; left:10px; background:#D82C0D; color:white; font-size:10px; font-weight:700; padding:3px 7px; border-radius:5px; }
    .pc-channels{ position:absolute; bottom:8px; right:8px; display:flex; gap:3px; }
    .ch-dot     { background:rgba(0,0,0,.6); color:white; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; font-size:10px; }
    .pc-info    { padding:14px 16px; }
    .pc-vendor  { font-size:11px; color:#6D7175; text-transform:uppercase; letter-spacing:.4px; margin-bottom:3px; }
    .pc-name    { font-size:14px; font-weight:700; margin-bottom:8px; line-height:1.3; }
    .pc-price-row { display:flex; align-items:center; gap:8px; }
    .pc-price   { font-size:16px; font-weight:800; color:#008060; }
    .pc-compare { font-size:13px; color:#6D7175; text-decoration:line-through; }
  `]
})
export class CatalogComponent implements OnInit {
  products: Product[] = [];
  filtered:  Product[] = [];
  loading = true;
  search = ''; selectedCat = ''; selectedPrice = ''; sortBy = 'default';

  categories  = [
    {label:'All',value:''},{label:'Fashion 👗',value:'Clothing'},{label:'Art 🗿',value:'Art'},
    {label:'Music 🎵',value:'Music'},{label:'Beauty 🌿',value:'Beauty'},{label:'Crafts 🧺',value:'Crafts'}
  ];
  priceRanges = [
    {label:'Any',value:''},{label:'Under $25',value:'0-25'},{label:'$25–$50',value:'25-50'},
    {label:'$50–$100',value:'50-100'},{label:'Over $100',value:'100+'}
  ];
  channelFilters = [{label:'🌐 Web',value:'WEB'},{label:'📘 Facebook',value:'FACEBOOK'},{label:'💬 WhatsApp',value:'WHATSAPP'}];
  selectedChannels: string[] = [];

  constructor(private svc: ProductService) {}
  ngOnInit() {
    this.svc.getProducts(0, 50).subscribe({
      next: r => { this.products = r.content || []; this.applyFilter(); this.loading = false; },
      error: ()  => { this.loading = false; }
    });
  }

  applyFilter() {
    let list = [...this.products];
    if (this.search) list = list.filter(p => p.title.toLowerCase().includes(this.search.toLowerCase()));
    if (this.selectedCat) list = list.filter(p => p.productType === this.selectedCat);
    if (this.selectedPrice) {
      const [min, max] = this.selectedPrice === '100+' ? [100, Infinity] : this.selectedPrice.split('-').map(Number);
      list = list.filter(p => { const pr = this.price(p); return pr >= min && pr <= (max || Infinity); });
    }
    if (this.selectedChannels.length) list = list.filter(p => this.selectedChannels.some(c => p.channels?.includes(c)));
    if (this.sortBy === 'price-asc')  list.sort((a,b) => this.price(a) - this.price(b));
    if (this.sortBy === 'price-desc') list.sort((a,b) => this.price(b) - this.price(a));
    if (this.sortBy === 'name')       list.sort((a,b) => a.title.localeCompare(b.title));
    this.filtered = list;
  }
  clearFilters() { this.search=''; this.selectedCat=''; this.selectedPrice=''; this.selectedChannels=[]; this.sortBy='default'; this.applyFilter(); }
  toggleChannel(ch: string) { this.selectedChannels = this.selectedChannels.includes(ch) ? this.selectedChannels.filter(c=>c!==ch) : [...this.selectedChannels, ch]; this.applyFilter(); }
  price(p: Product)    { return p.variants?.[0]?.price ?? 0; }
  compare(p: Product)  { return p.variants?.[0]?.compareAtPrice ?? 0; }
  hasDiscount(p: Product) { return this.compare(p) > this.price(p); }
  chIcon(ch: string)   { return ch==='FACEBOOK'?'📘':ch==='WHATSAPP'?'💬':'🌐'; }
  icon(p: Product) {
    const m: Record<string,string> = {Clothing:'👗',Music:'🎵',Art:'🗿',Beauty:'🌿',Crafts:'🧺',Food:'🥩'};
    return m[p.productType??'']??'📦';
  }
}
