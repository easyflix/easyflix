import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {VideoService} from '@app/services/video.service';
import {Observable, zip} from 'rxjs';
import {take} from 'rxjs/operators';
import {CoreService} from '@app/services/core.service';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.sass']
})
export class VideoComponent implements OnInit {

  @ViewChild('video')
  videoRef: ElementRef;

  src$: Observable<string>;
  volume$: Observable<number>;
  currentTime = 0;

  playing$: Observable<boolean>;
  currentTime$: Observable<number>;
  duration$: Observable<number>;
  loading$: Observable<boolean>;

  constructor(
    private core: CoreService,
    private video: VideoService,
  ) { }

  ngOnInit() {
    this.src$ = this.video.getSource();
    this.volume$ = this.video.getVolume();

    this.playing$ = this.video.getPlaying();
    this.currentTime$ = this.video.getCurrentTime();
    this.duration$ = this.video.getDuration();
    this.loading$ = this.video.getLoading();
  }

  openSidenav() {
    this.core.toggleSidenav();
  }

  play() {
    (this.videoRef.nativeElement as HTMLMediaElement).play();
  }

  pause() {
    (this.videoRef.nativeElement as HTMLMediaElement).pause();
  }

  seekTo(time: number) {
    this.currentTime = time;
  }

  seekForward() {
    zip(this.currentTime$, this.duration$).pipe(take(1)).subscribe(
      arr => {
        const currentTime = arr[0];
        const duration = arr[1];
        this.seekTo(Math.min(currentTime + 30, duration));
      }
    );
  }

  seekBackward() {
    this.currentTime$.pipe(take(1)).subscribe(
      currentTime => this.seekTo(Math.max(currentTime - 10, 0))
    );
  }

  onPlay() {
    this.video.setPlaying(true);
  }

  onPlaying() {
    this.video.setPlaying(true);
  }

  onPause() {
    this.video.setPlaying(false);
  }

  onEnded() {
    this.video.setPlaying(false);
  }

  onCanPlay() {
    this.video.setLoading(false);
  }

  onCanPlayThrough() {
    this.video.setLoading(false);
  }

  onLoadedMetadata(event) {
    this.video.setDuration(event.target.duration);
  }

  onTimeUpdate(event) {
    this.video.updateCurrentTime(event.target.currentTime);
  }

  onWaiting() {
    this.video.setLoading(true);
  }

  onError(event) {
    console.error('VideoError', event);
  }

}