import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ProductVariant { id: string; title: string; sku?: string; price: number; compareAtPrice?: number; inventoryQuantity: number; currency: string; }
export interface ProductImage   { id: string; url: string; altText?: string; position: number; }
export interface Product {
  id: string; title: string; description: string; handle: string;
  status: string; vendor?: string; productType?: string; tags: string[];
  images: ProductImage[]; variants: ProductVariant[]; channels: string[];
}
export interface PageResponse<T> { content: T[]; totalElements: number; totalPages: number; number: number; size: number; }

export interface CartItem { product: Product; variant: ProductVariant; quantity: number; }

@Injectable({ providedIn: 'root' })
export class ProductService {
  private base = `${environment.apiUrl}/products`;
  constructor(private http: HttpClient) {}

  getProducts(page = 0, size = 20, type?: string) {
    let params = new HttpParams().set('page', page).set('size', size).set('status', 'ACTIVE');
    if (type) params = params.set('productType', type);
    return this.http.get<PageResponse<Product>>(this.base, { params });
  }
  getProduct(id: string)       { return this.http.get<Product>(`${this.base}/${id}`); }
  getByHandle(handle: string)  { return this.http.get<Product>(`${this.base}/handle/${handle}`); }
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private cartKey = 'zimshop_cart';
  private cart$ = new BehaviorSubject<CartItem[]>(this.load());

  get items$() { return this.cart$.asObservable(); }
  get items()  { return this.cart$.value; }
  get count()  { return this.items.reduce((s, i) => s + i.quantity, 0); }
  get total()  { return this.items.reduce((s, i) => s + i.variant.price * i.quantity, 0); }

  add(product: Product, variant: ProductVariant, qty = 1) {
    const items = [...this.items];
    const idx = items.findIndex(i => i.variant.id === variant.id);
    if (idx >= 0) items[idx] = { ...items[idx], quantity: items[idx].quantity + qty };
    else items.push({ product, variant, quantity: qty });
    this.save(items);
  }

  update(variantId: string, qty: number) {
    const items = qty <= 0
      ? this.items.filter(i => i.variant.id !== variantId)
      : this.items.map(i => i.variant.id === variantId ? { ...i, quantity: qty } : i);
    this.save(items);
  }

  remove(variantId: string) { this.save(this.items.filter(i => i.variant.id !== variantId)); }
  clear() { this.save([]); }

  private save(items: CartItem[]) {
    this.cart$.next(items);
    try { localStorage.setItem(this.cartKey, JSON.stringify(items)); } catch {}
  }
  private load(): CartItem[] {
    try { return JSON.parse(localStorage.getItem(this.cartKey) || '[]'); } catch { return []; }
  }
}
