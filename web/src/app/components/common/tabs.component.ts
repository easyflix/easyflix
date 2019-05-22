import {
  AfterContentInit,
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  ContentChild,
  ContentChildren,
  ElementRef,
  forwardRef,
  HostBinding,
  HostListener,
  OnInit,
  QueryList, ViewChild
} from '@angular/core';
import {MatTabLink, MatTabNav} from '@angular/material';
import {interval, timer} from "rxjs";
import {map, takeUntil, takeWhile} from "rxjs/operators";

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
export class TabsComponent implements AfterContentInit {

  scrollButtonsEnabled = false;

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

  private currentIndex;
  get currentFocusIndex() {
    return this.currentIndex;
  }
  set currentFocusIndex(value: number) {
    this.currentIndex = value;
    this.updateLinksTabIndexes();
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

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterContentInit(): void {
    this.tabNavEl = this.tabNav._elementRef.nativeElement as HTMLElement;
    this.containerEl = this.container.nativeElement as HTMLElement;

    // Style the MatTabNav element
    this.tabNavEl.style.transition = 'transform .4s ease';
    this.tabNavEl.style.minWidth = '100%';

    // Enable scroll buttons if necessary
    const tabNavWidth = this.tabNavEl.offsetWidth;
    const containerWidth = this.containerEl.offsetWidth;
    this.scrollButtonsEnabled = tabNavWidth > containerWidth;

    // Update itemWidth, making the assumption that all links have the same width
    this.itemWidth = this.tabLinks.first._elementRef.nativeElement.offsetWidth;

    // Disable tab focus on MatTabLinks
    this.currentFocusIndex = 0;

    // Scroll to the currently selected tab
    this.tabLinks.find((tab, index) => {
      if (tab.active) {
        this.currentFocusIndex = index;
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

  scrollNext(): void {
    const d1 = this.containerEl.clientWidth - this.tabNavEl.clientWidth;
    const t1 = this.containerEl.clientWidth - this.currentOffset;
    const t2 = (t1 % this.itemWidth) - t1;
    this.currentOffset = Math.max(t2, d1);
    this.tabNavEl.style.transform = `translate(${this.currentOffset}px)`;
    this.cdr.markForCheck();
  }

  scrollPrev(): void {
    const t1 = Math.floor((this.currentOffset + this.containerEl.clientWidth) / this.itemWidth) * this.itemWidth;
    this.currentOffset = Math.min(t1, 0);
    this.tabNavEl.style.transform = `translate(${this.currentOffset}px)`;
    this.cdr.markForCheck();
  }

  @HostListener('keydown.arrowDown')
  @HostListener('keydown.arrowRight')
  focusNext(): void {
    const nextIndex = this.currentFocusIndex + 1;
    const links = this.tabLinks.toArray();
    if (links[nextIndex]) {
      const nextLink = links[nextIndex]._elementRef.nativeElement as HTMLElement;
      nextLink.focus({ preventScroll: true });
      this.currentFocusIndex = nextIndex;
      if (!this.isElementVisible(nextLink)) {
        this.scrollNext();
      }
    }
  }

  @HostListener('keydown.arrowUp')
  @HostListener('keydown.arrowLeft')
  focusPrev(): void {
    const prevIndex = this.currentFocusIndex - 1;
    const links = this.tabLinks.toArray();
    if (links[prevIndex]) {
      const prevLink = links[prevIndex]._elementRef.nativeElement as HTMLElement;
      prevLink.focus({ preventScroll: true });
      this.currentFocusIndex = prevIndex;
      if (!this.isElementVisible(prevLink)) {
        this.scrollPrev();
      }
    }
  }

  isElementVisible(item: HTMLElement): boolean {
    const c1 = item.offsetLeft + item.offsetWidth + this.currentOffset <= this.containerEl.offsetWidth;
    const c2 = item.offsetLeft + this.currentOffset >= 0;
    return c1 && c2;
  }

  updateLinksTabIndexes(): void {
    this.tabLinks.forEach((link, index) => {
      setTimeout(() =>
        link._elementRef.nativeElement.tabIndex = index === this.currentFocusIndex ? 0 : -1
      );
    });
  }

}
