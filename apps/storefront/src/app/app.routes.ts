import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  { path: 'products', loadComponent: () => import('./features/catalog/catalog.component').then(m => m.CatalogComponent) },
  { path: 'products/:handle', loadComponent: () => import('./features/product-detail/product-detail.component').then(m => m.ProductDetailComponent) },
  { path: 'cart', loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent) },
  { path: 'checkout', loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent) },
  { path: 'checkout/return', loadComponent: () => import('./features/checkout/payment-return.component').then(m => m.PaymentReturnComponent) },
  { path: 'orders/:id', loadComponent: () => import('./features/orders/order-tracking.component').then(m => m.OrderTrackingComponent) },
  { path: '**', redirectTo: '' }
];
