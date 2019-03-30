import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-controls',
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.sass'],
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
