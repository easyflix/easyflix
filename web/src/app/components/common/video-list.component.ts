import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener, Input, OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {DomSanitizer, SafeStyle} from '@angular/platform-browser';
import {CoreService} from '@app/services/core.service';
import {EMPTY, Observable, Subscription} from 'rxjs';
import {filter, map, take} from 'rxjs/operators';
import {Router} from '@angular/router';
import {Item} from '@app/models/item';

@Component({
  selector: 'app-video-list',
  template: `
    <button mat-icon-button (click)="prev()" class="button prev" [disabled]="translation === 0">
      <mat-icon>arrow_left</mat-icon>
    </button>
    <section #section [style]="getTranslation()">
      <div class="item" tabindex="0" *ngFor="let item of items" (click)="open(item)">
        <div class="poster" [style]="getStyle(item) | async"></div>
      </div>
    </section>
    <button mat-icon-button (click)="next()" class="button next" [disabled]="isDisabledNext()">
      <mat-icon>arrow_right</mat-icon>
    </button>
  `,
  styles: [`
    :host {
      display: flex;
      overflow-x: visible;
      position: relative;
    }
    section {
      display: flex;
      transition: transform ease 0.8s;
    }
    .item {
      height: 255px;
      min-width: 170px;
      padding: 0 16px;
      box-sizing: border-box;
      transition-property: transform;
      transition: 300ms ease;
    }
    .item:last-of-type {
      padding-right: 0;
    }
    .item:first-of-type {
      padding-left: 0;
    }
    .item:hover, .item:focus {
      transform: scale(1.25);
      z-index: 1;
    }
    .item:focus {
      z-index: 2;
      outline: none;
    }
    .item:focus .poster {
      outline: 1px solid;
    }
    .poster {
      height: 255px; /* 450 */
      width: 170px; /* 300 */
      background-size: cover;
    }
    .button {
      position: absolute;
      z-index: 1;
      top: 0;
      height: 255px;
      width: 50px;
      opacity: 0;
      transition: opacity 300ms ease;
      border-radius: 1px;
    }
    :host:hover .button,
    .button:hover, .button:focus {
      opacity: 1;
    }
    button[disabled] {
      opacity: 0 !important;
    }
    .button mat-icon {
      height: 50px;
      width: 50px;
      font-size: 50px;
      line-height: 50px;
    }
    .prev {
      left: -60px;
    }
    .next {
      right: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoListComponent implements OnInit, OnDestroy {

  @Input() items: Item[];

  @ViewChild('section', { static: true })
  section: ElementRef;

  itemWidth = 202;
  translation = 0;

  subscription: Subscription;

  constructor(
    private core: CoreService,
    private root: ElementRef,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit() {
    this.subscription = this.core.getShowSidenav().subscribe(
      () => {
        setTimeout(() => this.cdr.markForCheck(), 400); // TODO check this is right, document
      }
    );
    /* try {
      // @ts-ignore
      new ResizeObserver((el) => {
        this.cdr.detectChanges();
      }).observe(this.root.nativeElement);
    } catch (e) {
      console.log(e);
    }*/
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  getStyle(item: Item): Observable<SafeStyle> {
    if (item.poster) {
      return this.core.getConfig().pipe(
        filter(s => !!s),
        take(1),
        map(config => this.sanitizer.bypassSecurityTrustStyle(
          `background-image: url(${config.images.secure_base_url}w300${item.poster})`
        ))
      );
    } else {
      return EMPTY;
    }
  }

  open(item: Item): void {
    const ids = this.items.map(i => i.id).join(',');
    this.router.navigate(
      ['/', { outlets: { details: [item.type, item.id] } }],
      { queryParamsHandling: 'preserve', state: { ids } }
    );
  }

  /**
   * Even empty this listener will trigger change detection on resize
   */
  @HostListener('window:resize')
  resize() {}

  @HostListener('keydown.arrowRight', ['$event'])
  @HostListener('keydown.tab', ['$event'])
  focusNext(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    const next = target.nextElementSibling as HTMLElement;
    if (next) {
      next.focus({ preventScroll: true });
      if (!this.isItemVisible(next)) {
        this.next();
      }
      return false;
    }
  }

  @HostListener('keydown.arrowLeft', ['$event'])
  @HostListener('keydown.shift.tab', ['$event'])
  focusPrev(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    const previous = target.previousElementSibling as HTMLElement;
    if (previous) {
      previous.focus({ preventScroll: true });
      if (!this.isItemVisible(previous)) {
        this.prev();
      }
      return false;
    }
  }

  isItemVisible(item: HTMLElement): boolean {
    const c1 = item.offsetLeft + item.offsetWidth + this.translation <= this.root.nativeElement.offsetWidth;
    const c2 = item.offsetLeft + this.translation >= 0;
    return c1 && c2;
  }

  prev() {
    const a = this.root.nativeElement as HTMLElement;
    const t1 = Math.floor((this.translation + a.clientWidth) / this.itemWidth) * this.itemWidth;
    this.translation = Math.min(t1, 0);
  }

  next() {
    const a = this.root.nativeElement as HTMLElement;
    const b = this.section.nativeElement as HTMLElement;
    const d1 = a.clientWidth - b.clientWidth;
    const d2 = Math.floor(d1 / this.itemWidth) * this.itemWidth;
    const t1 = a.clientWidth - this.translation;
    const t2 = (t1 % this.itemWidth) - t1;
    this.translation = Math.max(t2, d2);
  }

  getTranslation() {
    return this.sanitizer.bypassSecurityTrustStyle(
      `transform: translate(${this.translation}px)`
    );
  }

  isDisabledNext() {
    const root = this.root.nativeElement as HTMLElement;
    const section = this.section.nativeElement as HTMLElement;
    return -this.translation + root.clientWidth >= section.clientWidth;
  }

}
