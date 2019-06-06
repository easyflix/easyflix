import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AuthenticationService} from '@app/services/authentication.service';
import {ActivatedRoute, Router} from '@angular/router';
import {CoreService} from '@app/services/core.service';
import {first, map} from 'rxjs/operators';

@Component({
  selector: 'app-login',
  template: `
    <app-logo></app-logo>
    <form [formGroup]="loginForm" (ngSubmit)="login()">
      <mat-form-field>
        <mat-label>Password</mat-label>
        <input matInput formControlName="password"
               required [type]="hide ? 'password' : 'text'" spellcheck="false">
        <button mat-icon-button matSuffix
                (click)="hide = !hide" [attr.aria-label]="'Hide password'" [attr.aria-pressed]="hide" type="button">
          <mat-icon>{{hide ? 'visibility_off' : 'visibility'}}</mat-icon>
        </button>
        <mat-error *ngIf="f.password.invalid">{{ getErrorMessage() }}</mat-error>
      </mat-form-field>
      <button type="submit" mat-raised-button color="primary" [disabled]="loading">
        {{ loading ? 'LOADING' : 'LOGIN' }}
      </button>
    </form>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100%;
      align-items: center;
      justify-content: center;
    }
    app-logo {
      width: 300px;
      margin-bottom: 1rem;
    }
    form {
      display: flex;
      flex-direction: column;
    }
    mat-form-field {
      width: 300px;
    }
    button {
      margin-top: 1rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {

  hide = true;
  loginForm: FormGroup;
  returnUrl: string;
  loading = false;

  constructor(
    private core: CoreService,
    private formBuilder: FormBuilder,
    private authenticationService: AuthenticationService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      password: ['', Validators.required],
    });

    this.returnUrl = this.route.snapshot.queryParams.returnUrl || '/';

    // If logged in redirect
    this.core.getToken().pipe(
      first(),
      map(token => {
        if (token) { this.router.navigateByUrl(this.returnUrl, { replaceUrl: true }); }
      })
    ).subscribe();

  }

  get f() { return this.loginForm.controls; }

  login(): void {
    if (this.loginForm.invalid) {
      return;
    }
    this.loading = true;
    this.authenticationService.login(this.f.password.value)
      .subscribe(
        () => this.router.navigateByUrl(this.returnUrl, { replaceUrl: true }),
        error => {
          this.loginForm.controls.password.setErrors({invalid: error.error});
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  getErrorMessage(): string {
    return this.f.password.hasError('required') ? 'A password is required' :
      this.f.password.hasError('invalid') ? this.f.password.getError('invalid') : '';
  }

}
