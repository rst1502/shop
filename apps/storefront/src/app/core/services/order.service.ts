import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface CreateOrderRequest {
  channel: string;
  lineItems: { productId: string; variantId: string; productTitle: string; variantTitle: string; quantity: number; price: number; }[];
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  notes?: string;
}

export interface Order {
  id: string; orderNumber: string; channel: string; status: string;
  paymentStatus: string; total: number; currency: string;
  lineItems?: any[]; createdAt: string;
}

export interface PaymentRequest { orderId: string; method: string; phone?: string; }
export interface PaymentResponse { success: boolean; redirectUrl?: string; pollUrl?: string; error?: string; }

@Injectable({ providedIn: 'root' })
export class OrderService {
  private base = `${environment.apiUrl}`;
  constructor(private http: HttpClient) {}

  createOrder(req: CreateOrderRequest)       { return this.http.post<Order>(`${this.base}/orders`, req); }
  getOrder(id: string)                        { return this.http.get<Order>(`${this.base}/orders/${id}`); }
  initiatePayment(req: PaymentRequest)        { return this.http.post<PaymentResponse>(`${this.base}/payments/initiate`, req); }
  checkPaymentStatus(orderId: string)         { return this.http.get<any>(`${this.base}/payments/status/${orderId}`); }
}
