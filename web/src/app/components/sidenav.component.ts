import {ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-sidenav',
  template: `
    <nav>
      <button mat-icon-button [routerLink]="[{ outlets: { nav: ['library'] } }]">
        <mat-icon>video_library</mat-icon>
      </button>
      <button mat-icon-button [routerLink]="[{ outlets: { nav: ['search'] } }]">
        <mat-icon>search</mat-icon>
      </button>
      <button mat-icon-button [routerLink]="[{ outlets: { nav: ['history'] } }]">
        <mat-icon>history</mat-icon>
      </button>
      <button mat-icon-button [routerLink]="[{ outlets: { nav: ['settings'] } }]">
        <mat-icon>settings</mat-icon>
      </button>
      <button mat-icon-button [routerLink]="[{ outlets: { nav: ['about'] } }]" class="about">
        <mat-icon>info</mat-icon>
      </button>
      <button mat-icon-button (click)="closeSidenav.emit()">
        <mat-icon>close</mat-icon>
      </button>
    </nav>
    <mat-divider></mat-divider>
    <router-outlet name="nav"></router-outlet>
  `,
  styles: [`
    nav {
      padding: 0 0.6rem;
      display: flex;
      flex-direction: row;
      align-items: center;
      min-height: 60px;
    }
    button:not(:last-of-type) {
      margin-right: 0.6rem;
    }
    .about {
      margin-left: auto;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidenavComponent {

  @Output() closeSidenav: EventEmitter<void> = new EventEmitter();

}
