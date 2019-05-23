import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ContentChildren,
  ElementRef,
  forwardRef,
  HostListener,
  OnDestroy,
  QueryList,
  ViewChild
} from '@angular/core';
import {MatTabLink, MatTabNav} from '@angular/material';
import {Subscription, timer} from 'rxjs';
import {map, takeWhile, tap} from 'rxjs/operators';

@Component({
  selector: 'app-tabs',
  template: `
    <button mat-icon-button
            *ngIf="scrollButtonsEnabled"
            [disabled]="prevDisabled"
            (click)="scrollPrev()"
            class="prev mat-elevation-z5"
            aria-hidden="true" tabindex="-1">
      <mat-icon>arrow_left</mat-icon>
    </button>
    <div #container class="nav-container">
      <ng-content></ng-content>
    </div>
    <button mat-icon-button
            *ngIf="scrollButtonsEnabled"
            [disabled]="nextDisabled"
            (click)="scrollNext()"
            class="next mat-elevation-z5"
            aria-hidden="true" tabindex="-1">
      <mat-icon>arrow_right</mat-icon>
    </button>
  `,
  styles: [`
    :host {
      display: flex;
      overflow: hidden;
      position: relative;
    }
    button {
      width: 34px;
      height: 49px;
      border-radius: 0;
    }
    .nav-container {
      flex-grow: 1;
      display: flex;
      overflow-x: hidden;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabsComponent implements AfterContentInit, OnDestroy {

  @ContentChild(forwardRef(() => MatTabNav), { static: true })
  tabNav: MatTabNav;

  @ContentChildren(forwardRef(() => MatTabLink), { descendants: true })
  tabLinks: QueryList<MatTabLink>;

  @ViewChild('container')
  container: ElementRef;

  private tabNavEl: HTMLElement;
  private containerEl: HTMLElement;
  private currentOffset = 0;
  private itemWidth;
  private currentFocusIndex = 0;

  get scrollButtonsEnabled() {
    if (this.tabNavEl && this.containerEl) {
      const tabNavWidth = this.tabNavEl.offsetWidth;
      const containerWidth = this.containerEl.offsetWidth;
      return tabNavWidth > containerWidth;
    } else {
      return false;
    }
  }

  get prevDisabled() {
    return this.currentOffset >= 0;
  }
  get nextDisabled() {
    const a = this.container.nativeElement as HTMLElement;
    const b = this.tabNav._elementRef.nativeElement as HTMLElement;
    const d1 = a.clientWidth - b.clientWidth;
    return this.currentOffset <= d1;
  }

  private subscription = new Subscription();

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterContentInit(): void {
    this.tabNavEl = this.tabNav._elementRef.nativeElement as HTMLElement;
    this.containerEl = this.container.nativeElement as HTMLElement;

    // Style the MatTabNav element
    this.tabNavEl.style.transition = 'transform .4s ease';
    this.tabNavEl.style.minWidth = '100%';

    // Update and register to tabLinks changes
    this.updateItemWidth();
    this.updateTabIndexes();
    this.subscription.add(this.tabLinks.changes.pipe(
      tap(() => setTimeout(() => {
        this.updateItemWidth();
        this.updateTabIndexes();
        this.cdr.markForCheck();
      }))
    ).subscribe());

    // Scroll to the currently selected tab and disable tab focus selectively
    this.tabLinks.find((tab, index) => {
      if (tab.active) {
        this.currentFocusIndex = index;
        this.updateTabIndexes();
        timer(0, 400).pipe(
          map(() => {
            if (!this.isElementVisible(tab._elementRef.nativeElement)) {
              this.scrollNext();
            }
            return !this.isElementVisible(tab._elementRef.nativeElement);
          }),
          takeWhile(val => val)
        ).subscribe();
        return true;
      }
      return false;
    });
  }

  updateItemWidth() {
    // Update itemWidth, making the assumption that all links have the same width
    if (this.tabLinks.first) {
      this.itemWidth = this.tabLinks.first._elementRef.nativeElement.offsetWidth;
    } else {
      this.itemWidth = 0;
    }
  }

  scrollNext(): void {
    const d1 = this.containerEl.clientWidth - this.tabNavEl.clientWidth;
    const t1 = this.containerEl.clientWidth - this.currentOffset;
    const t2 = (t1 % this.itemWidth) - t1;
    this.currentOffset = Math.max(t2, d1);
    this.tabNavEl.style.transform = `translate(${this.currentOffset}px)`;
  }

  scrollPrev(): void {
    const t1 = Math.floor((this.currentOffset + this.containerEl.clientWidth) / this.itemWidth) * this.itemWidth;
    this.currentOffset = Math.min(t1, 0);
    this.tabNavEl.style.transform = `translate(${this.currentOffset}px)`;
  }

  @HostListener('keydown.arrowDown')
  @HostListener('keydown.arrowRight')
  focusNext(): void {
    this.focus(this.currentFocusIndex + 1);
  }

  @HostListener('keydown.arrowUp')
  @HostListener('keydown.arrowLeft')
  focusPrev(): void {
    this.focus(this.currentFocusIndex - 1);
  }

  focus(index: number) {
    const links = this.tabLinks.toArray();
    if (links[index]) {
      const prevLink = links[index]._elementRef.nativeElement as HTMLElement;
      prevLink.focus({ preventScroll: true });
      if (!this.isElementVisible(prevLink)) {
        index < this.currentFocusIndex ? this.scrollPrev() : this.scrollNext();
      }
      this.currentFocusIndex = index;
      this.updateTabIndexes();
    }
  }

  isElementVisible(item: HTMLElement): boolean {
    const c1 = item.offsetLeft + item.offsetWidth + this.currentOffset <= this.containerEl.offsetWidth;
    const c2 = item.offsetLeft + this.currentOffset >= 0;
    return c1 && c2;
  }

  updateTabIndexes(): void {
    this.tabLinks.forEach((link, index) => {
      link._elementRef.nativeElement.tabIndex = index === this.currentFocusIndex ? 0 : -1;
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

}
