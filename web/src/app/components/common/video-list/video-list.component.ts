import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener, OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {CoreService} from '@app/services/core.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-video-list',
  templateUrl: './video-list.component.html',
  styleUrls: ['./video-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoListComponent implements OnInit, OnDestroy {

  @ViewChild('section')
  section: ElementRef;

  itemWidth = 202;
  translation = 0;

  subscription: Subscription;

  /**
   * Even empty this listener will trigger change detection on resize
   */
  @HostListener('window:resize')
  resize() {}

  @HostListener('keydown.tab')
  tab() {
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

  @HostListener('keydown.shift.tab', ['$event'])
  altTab(event) {
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

  constructor(
    private core: CoreService,
    private root: ElementRef,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
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

  isItemVisible(item: HTMLElement): boolean {
    const c1 = item.offsetLeft + item.offsetWidth + this.translation < this.root.nativeElement.offsetWidth;
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
