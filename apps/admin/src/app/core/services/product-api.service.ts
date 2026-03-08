import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ProductVariant { id: string; title: string; sku?: string; price: number; compareAtPrice?: number; currency: string; inventoryQuantity: number; }
export interface ProductImage { id: string; url: string; altText?: string; position: number; }
export interface Product {
  id: string; title: string; description: string; handle: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  vendor?: string; productType?: string; tags: string[];
  channels: string[]; images: ProductImage[]; variants: ProductVariant[];
  createdAt: string; updatedAt: string;
}
export interface PageResponse<T> { content: T[]; totalElements: number; number: number; size: number; totalPages: number; }

@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private base = `${environment.apiUrl}/products`;
  constructor(private http: HttpClient) {}

  getProducts(page = 0, size = 20, status?: string): Observable<PageResponse<Product>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    return this.http.get<PageResponse<Product>>(this.base, { params });
  }
  getProduct(id: string) { return this.http.get<Product>(`${this.base}/${id}`); }
  createProduct(body: any) { return this.http.post<Product>(this.base, body); }
  updateProduct(id: string, body: any) { return this.http.put<Product>(`${this.base}/${id}`, body); }
  publishToChannels(id: string, channels: string[]) { return this.http.post<Product>(`${this.base}/${id}/publish`, { channels }); }
  uploadImage(id: string, file: File, position = 0) {
    const form = new FormData(); form.append('file', file); form.append('position', String(position));
    return this.http.post(`${this.base}/${id}/images`, form);
  }
  deleteProduct(id: string) { return this.http.delete<void>(`${this.base}/${id}`); }
}
