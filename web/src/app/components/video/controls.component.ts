import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

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
      <!--<button mat-icon-button class="next">
        <mat-icon>arrow_right</mat-icon>
      </button>-->
    </section>

    <section class="bottom">
      <div class="seeker">
        <mat-progress-bar
          *ngIf="loading"
          mode="indeterminate"></mat-progress-bar>
        <mat-slider
          *ngIf="!loading"
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
        <div class="g1">
          <button mat-icon-button>
            <mat-icon class="material-icons-outlined">volume_up</mat-icon>
          </button>
          <button mat-icon-button>
            <mat-icon class="material-icons-outlined">speaker_notes</mat-icon>
          </button>
        </div>
        <div class="g2">
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
        <div class="g3">
          <button mat-icon-button>
            <mat-icon class="material-icons-outlined">fullscreen</mat-icon>
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
      padding: 0 1rem;
    }
    .next {
      margin-left: auto;
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
    mat-progress-bar {
      width: auto;
      height: 2px;
      margin: 23px 8px;
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
    .g2 {
      flex-grow: 1;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    button.cdk-keyboard-focused{
      color: green;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ControlsComponent implements OnInit {

  @Input() playing: boolean;

  @Output() openSidenav: EventEmitter<void> = new EventEmitter();
  @Output() pause: EventEmitter<void> = new EventEmitter();
  @Output() resume: EventEmitter<void> = new EventEmitter();
  @Output() seekForward: EventEmitter<void> = new EventEmitter();
  @Output() seekBackward: EventEmitter<void> = new EventEmitter();
  @Output() closeVideo: EventEmitter<void> = new EventEmitter();

  @Input() loading: boolean;
  @Input() currentTime: number;
  @Input() duration: number;

  @Output() seekTo = new EventEmitter<number>();

  constructor() { }

  ngOnInit() {
  }

}
