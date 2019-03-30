import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {Subscription} from 'rxjs';
import {CoreService} from '@app/services/core.service';

@Component({
  selector: 'app-sidenav',
  template: `
    <nav>
      <button mat-icon-button [routerLink]="[{ outlets: { nav: ['library'] } }]" #firstButton>
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
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
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
export class SidenavComponent implements OnInit, OnDestroy {

  @Output() closeSidenav: EventEmitter<void> = new EventEmitter();

  @ViewChild('firstButton', { read: ElementRef })
  first: ElementRef;

  private subscription: Subscription;

  constructor(private core: CoreService) {}

  ngOnInit(): void {
    this.subscription = this.core.getShowSidenav().subscribe(
      show => show ? this.focus() : {}
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  focus() {
    const firstElement = this.first.nativeElement as HTMLElement;
    setTimeout(() => firstElement.focus(), 400); // TODO export 400ms somewhere
  }


}
