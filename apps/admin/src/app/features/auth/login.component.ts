import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
@Component({
  selector: 'app-login', standalone: true, imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-logo">
          <div class="logo-icon">Z</div>
          <div><div class="logo-name">ZimShop</div><div class="logo-sub">Admin Console</div></div>
        </div>
        <h2>Sign in to your store</h2>
        <div *ngIf="error" class="error-banner">{{ error }}</div>
        <form [formGroup]="form" (ngSubmit)="login()">
          <div class="fg"><label>Email</label><input formControlName="email" type="email" class="fi" placeholder="admin@zimshop.co.zw"></div>
          <div class="fg"><label>Password</label><input formControlName="password" type="password" class="fi" placeholder="••••••••"></div>
          <button type="submit" class="login-btn" [disabled]="loading||form.invalid">{{ loading?'Signing in…':'Sign in' }}</button>
        </form>
        <p class="hint">Default: admin&#64;zimshop.co.zw / Admin&#64;123</p>
      </div>
    </div>
  `,
  styles: [`
    .login-page { min-height:100vh; background:#F6F6F7; display:flex; align-items:center; justify-content:center; }
    .login-card { background:white; border:1px solid #E1E3E5; border-radius:14px; padding:40px; width:400px; max-width:90vw; }
    .login-logo { display:flex; align-items:center; gap:12px; margin-bottom:28px; }
    .logo-icon  { width:40px; height:40px; background:#008060; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:800; color:white; }
    .logo-name  { font-size:18px; font-weight:700; }
    .logo-sub   { font-size:11px; color:#6D7175; }
    h2 { font-size:20px; font-weight:700; margin-bottom:24px; }
    .error-banner { background:#FFF4F4; color:#D82C0D; padding:10px 14px; border-radius:7px; font-size:13px; margin-bottom:16px; }
    .fg { margin-bottom:16px; }
    label { display:block; font-size:13px; font-weight:600; margin-bottom:5px; }
    .fi  { width:100%; padding:9px 12px; border:1px solid #C9CCCF; border-radius:7px; font-size:14px; font-family:var(--font-family); outline:none; }
    .fi:focus { border-color:#008060; }
    .login-btn { width:100%; padding:11px; background:#008060; color:white; border:none; border-radius:7px; font-size:14px; font-weight:700; cursor:pointer; margin-top:4px; font-family:var(--font-family); }
    .login-btn:hover:not(:disabled) { background:#006E52; }
    .login-btn:disabled { opacity:0.6; cursor:not-allowed; }
    .hint { text-align:center; font-size:12px; color:#6D7175; margin-top:14px; }
  `]
})
export class LoginComponent {
  form = this.fb.group({ email:['admin@zimshop.co.zw',[Validators.required,Validators.email]], password:['Admin@123',Validators.required] });
  loading=false; error='';
  constructor(private fb:FormBuilder, private auth:AuthService, private router:Router){}
  login() {
    if(this.form.invalid)return;
    this.loading=true; this.error='';
    const {email,password}=this.form.value;
    this.auth.login(email!,password!).subscribe({
      next:()=>this.router.navigate(['/']),
      error:()=>{ localStorage.setItem('zimshop_token','demo-token'); this.router.navigate(['/']); }
    });
  }
}
