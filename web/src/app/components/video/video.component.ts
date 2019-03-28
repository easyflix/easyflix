import {Component, ElementRef, OnInit, Renderer2} from '@angular/core';
import {VideoService} from '../../services/video.service';
import {Store} from '@ngrx/store';
import * as fromStore from '../../reducers';
import {SetVideoSource, SetVideoVolume} from '../../actions/video.actions';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.sass']
})
export class VideoComponent implements OnInit {

  constructor(
    private video: VideoService,
    private renderer: Renderer2,
    private videoRoot: ElementRef,
    private store: Store<fromStore.State>
  ) { }

  ngOnInit() {
    const videoUrl =
      'http://127.0.0.1:8887/Atlantide%20L\'empire%20Perdu%20-%20Multi%20-%201080p%20mHDgz.mkv?static=1';
    this.video.renderer = this.renderer;
    this.video.videoRoot = this.videoRoot;

    this.store.dispatch(new SetVideoVolume(0));
    this.store.dispatch(new SetVideoSource(videoUrl));

  }



}
