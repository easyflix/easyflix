import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AuthenticationService} from '@app/services/authentication.service';
import {ActivatedRoute, Router} from '@angular/router';

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

    // reset login status // TODO figure out what to do if logged in
    this.authenticationService.logout().subscribe();

    this.returnUrl = this.route.snapshot.queryParams.returnUrl || '/';
  }

  get f() { return this.loginForm.controls; }

  login() {
    if (this.loginForm.invalid) {
      return;
    }
    this.loading = true;
    this.authenticationService.login(this.f.password.value)
      .subscribe(
        () => {
          this.router.navigateByUrl(this.returnUrl, { replaceUrl: true });
        },
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
