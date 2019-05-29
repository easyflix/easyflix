import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input, OnChanges, OnDestroy,
  OnInit,
  Output, SimpleChanges
} from '@angular/core';
import {asapScheduler, Observable, of, scheduled, Subject, Subscription, timer} from 'rxjs';
import {filter, skipUntil, take, tap} from 'rxjs/operators';
import {FocusTrap, FocusTrapFactory} from '@angular/cdk/a11y';

@Component({
  selector: 'app-controls',
  template: `
    <section class="top">
      <button mat-icon-button (click)="openSidenav.emit()">
        <mat-icon>{{ 'menu' }}</mat-icon>
      </button>
      <button mat-icon-button class="close" (click)="closeVideo.emit()">
        <mat-icon>close</mat-icon>
      </button>
    </section>
    <section class="middle">
      <mat-spinner *ngIf="loading$ | async" diameter="40"></mat-spinner>
    </section>
    <section class="bottom">
      <div class="seeker">
        <mat-slider
          color="primary"
          [step]="1"
          [disabled]="!duration"
          [max]="duration"
          [value]="currentTime"
          (change)="seekTo.emit($event.value)"></mat-slider>
      </div>
      <div class="time">
        <span class="left">{{ currentTime | sgTime }}</span>
        <span class="right">{{ duration | sgTime }}</span>
      </div>
      <div class="controls">
        <div>
          <button mat-icon-button>
            <mat-icon class="material-icons-outlined">volume_up</mat-icon>
          </button>
          <button mat-icon-button>
            <mat-icon class="material-icons-outlined">speaker_notes</mat-icon>
          </button>
        </div>
        <div class="mid-controls">
          <button mat-icon-button class="md-36" (click)="seekBackward.emit()">
            <mat-icon class="material-icons-outlined">replay_10</mat-icon>
          </button>
          <button mat-icon-button
                  class="playPause md-48"
                  [disabled]="false"
                  (click)="playing ? pause.emit() : resume.emit()">
            <mat-icon class="material-icons-outlined">{{ playing ? 'pause' : 'play_arrow' }}</mat-icon>
          </button>
          <button mat-icon-button class="md-36" (click)="seekForward.emit()">
            <mat-icon class="material-icons-outlined">forward_30</mat-icon>
          </button>
        </div>
        <div>
          <button mat-icon-button (click)="toggleFullscreen()">
            <mat-icon class="material-icons-outlined">{{ isFullScreen() ? 'fullscreen_exit' : 'fullscreen' }}</mat-icon>
          </button>
          <button mat-icon-button>
            <mat-icon class="material-icons-outlined">more_horiz</mat-icon>
          </button>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      color: white;
      transition: opacity 500ms ease;
    }
    :host.hidden {
      opacity: 0;
      cursor: none !important;
    }
    :host.hidden * {
      cursor: none !important;
    }
    .top {
      height: 60px;
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: 0 0.65rem;
    }
    .close {
      margin-left: auto;
    }
    .middle {
      flex-grow: 1;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      padding: 0 1rem;
    }
    mat-spinner {
      position: relative;
      top: 60px;
    }
    .bottom {
      height: 200px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding-bottom: 1rem;
      background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%);
    }
    .seeker {
      padding: 0 1rem;
      display: flex;
      flex-direction: column;
    }
    mat-slider {
      width: 100%;
      cursor: pointer;
    }
    .time {
      display: flex;
      padding: 0 1.5rem;
      font-size: 80%;
    }
    .left {
      margin-right: auto;
    }
    .controls {
      height: 60px;
      display: flex;
      align-items: center;
      padding: 0 1rem;
      font-size: 24px;
    }
    button:not(:last-of-type) {
      margin-right: 1rem;
    }
    .mid-controls {
      flex-grow: 1;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ControlsComponent implements OnInit, OnDestroy, OnChanges {

  HIDE_DELAY = 3000;

  @HostBinding('class.hidden') hidden = false;

  loadingSubject: Subject<boolean> = new Subject();
  loading$: Observable<boolean> = this.loadingSubject.asObservable();
  loadingSub: Subscription;

  @Input() playing: boolean;
  @Input() loading: boolean;
  @Input() currentTime: number;
  @Input() duration: number;

  @Output() openSidenav: EventEmitter<void> = new EventEmitter();
  @Output() pause: EventEmitter<void> = new EventEmitter();
  @Output() resume: EventEmitter<void> = new EventEmitter();
  @Output() seekForward: EventEmitter<void> = new EventEmitter();
  @Output() seekBackward: EventEmitter<void> = new EventEmitter();
  @Output() closeVideo: EventEmitter<void> = new EventEmitter();
  @Output() seekTo: EventEmitter<number> = new EventEmitter();

  private mouseSubscription: Subscription;
  private focusTrap: FocusTrap;
  private previousFocusedElement: HTMLElement;

  @HostListener('keydown')
  @HostListener('mouseleave')
  @HostListener('mouseenter')
  @HostListener('mousemove')
  showControls() {
    // Show controls and pointer
    this.hidden = false;
    // Schedule hiding controls and pointer in HIDE_DELAY ms unless loading
    if (this.mouseSubscription) {
      this.mouseSubscription.unsubscribe();
    }
    const notifier = this.loading ? this.loading$.pipe(filter(l => !l)) : scheduled([true], asapScheduler);
    this.mouseSubscription = timer(this.HIDE_DELAY, this.HIDE_DELAY).pipe(
      skipUntil(notifier),
      tap(() => this.hidden = true),
      tap(() => this.cdr.markForCheck()),
      take(1)
    ).subscribe();
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private element: ElementRef,
    private focusTrapFactory: FocusTrapFactory
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.loading) {
      if (this.loadingSub) {
        this.loadingSub.unsubscribe();
      }
      if (changes.loading.currentValue) {
        this.loadingSub = timer(500).subscribe(
          () => this.loadingSubject.next(true)
        );
      } else {
        this.loadingSubject.next(false);
      }
    }
  }

  ngOnInit() {
    this.previousFocusedElement = document.activeElement as HTMLElement;
    this.focusTrap = this.focusTrapFactory.create(this.element.nativeElement);
    // Must happen after details focus...
    setTimeout(() => this.focusTrap.focusInitialElement(), 500);
  }

  ngOnDestroy(): void {
    if (this.mouseSubscription) {
      this.mouseSubscription.unsubscribe();
    }
    if (this.previousFocusedElement) {
      this.previousFocusedElement.focus();
    }
  }

  isFullScreen(): boolean {
    const keyName = 'webkitFullscreenElement'; // <- This is for Edge !
    return !!document.fullscreenElement || !!document[keyName];
  }

  @HostListener('keydown.f11', ['$event'])
  toggleFullscreen(event?: KeyboardEvent): void {
    const keyName = 'webkitFullscreenElement'; // <- This is for Edge !
    if (!document.fullscreenElement && !document[keyName]) {
      const elem = document.documentElement as any;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.mozRequestFullScreen) { /* Firefox */
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) { /* IE/Edge */
        elem.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else {
        // @ts-ignore
        if (document.webkitExitFullscreen) {
          // @ts-ignore
          document.webkitExitFullscreen();
        }
      }
    }
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
  }

}
