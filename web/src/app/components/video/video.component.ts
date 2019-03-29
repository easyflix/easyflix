import {Component, ElementRef, OnInit, Renderer2, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {VideoService} from '@app/services/video.service';
import {SetVideoSource, SetVideoVolume} from '@app/actions/video.actions';
import * as fromStore from '../../reducers';
import {Observable, zip} from 'rxjs';
import {take} from 'rxjs/operators';
import {CoreService} from '@app/services/core.service';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.sass']
})
export class VideoComponent implements OnInit {

  playing$: Observable<boolean>;
  currentTime$: Observable<number>;
  duration$: Observable<number>;
  loading$: Observable<boolean>;

  @ViewChild('videoContainer')
  videoContainerRef: ElementRef;

  constructor(
    private core: CoreService,
    private video: VideoService,
    private renderer: Renderer2,
    private store: Store<fromStore.State>
  ) { }

  ngOnInit() {
    const videoUrl =
      'http://127.0.0.1:8887/Atlantide%20L\'empire%20Perdu%20-%20Multi%20-%201080p%20mHDgz.mkv?static=1';
    this.video.renderer = this.renderer;
    this.video.videoRoot = this.videoContainerRef;

    this.store.dispatch(new SetVideoVolume(0));
    this.store.dispatch(new SetVideoSource(videoUrl));

    this.playing$ = this.video.getPlaying();
    this.currentTime$ = this.video.getCurrentTime();
    this.duration$ = this.video.getDuration();
    this.loading$ = this.video.getLoading();
  }

  openSidenav() {
    this.core.toggleSidenav();
  }

  play() {
    this.video.play();
  }

  pause() {
    this.video.pause();
  }

  seekTo(time: number) {
    this.video.seekTo(time);
  }

  seekForward() {
    zip(this.currentTime$, this.duration$).pipe(take(1)).subscribe(
      arr => {
        const currentTime = arr[0];
        const duration = arr[1];
        this.video.seekTo(Math.min(currentTime + 30, duration));
      }
    );
  }

  seekBackward() {
    this.currentTime$.pipe(take(1)).subscribe(
      currentTime => this.video.seekTo(Math.max(currentTime - 10, 0))
    );
  }



}
