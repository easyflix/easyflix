import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-video-grid',
  templateUrl: './video-grid.component.html',
  styleUrls: ['./video-grid.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoGridComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
