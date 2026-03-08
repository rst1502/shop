import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
export interface Order { id: string; orderNumber: string; channel: string; status: string; paymentStatus: string; total: number; currency: string; createdAt: string; }
@Injectable({ providedIn: 'root' })
export class OrderApiService {
  private base = `${environment.apiUrl}/orders`;
  constructor(private http: HttpClient) {}
  getOrders(page = 0, size = 20) { return this.http.get<any>(this.base, { params: new HttpParams().set('page', page).set('size', size) }); }
  getOrder(id: string) { return this.http.get<Order>(`${this.base}/${id}`); }
  createOrder(body: any) { return this.http.post<Order>(this.base, body); }
}
