import {ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {VideoService} from '@app/services/video.service';
import {Observable, Subscription, zip} from 'rxjs';
import {filter, map, take, tap, throttleTime} from 'rxjs/operators';
import {CoreService} from '@app/services/core.service';
import {ActivatedRoute, Router} from '@angular/router';
import {LibraryFile} from '@app/models';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoComponent implements OnInit, OnDestroy {

  @ViewChild('video')
  videoRef: ElementRef;

  src$: Observable<string>;
  volume$: Observable<number>;
  currentTime = 0;

  playing$: Observable<boolean>;
  currentTime$: Observable<number>;
  duration$: Observable<number>;
  loading$: Observable<boolean>;

  subscriptions: Subscription[] = [];

  constructor(
    private core: CoreService,
    private video: VideoService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.src$ = this.video.getSource().pipe(
      filter(s => !!s),
      tap(() => this.video.setLoading(true))
    );
    this.volume$ = this.video.getVolume();

    this.playing$ = this.video.getPlaying();
    this.currentTime$ = this.video.getCurrentTime();
    this.duration$ = this.video.getDuration();
    this.loading$ = this.video.getLoading();

    this.route.data.subscribe(
      (data: { video: LibraryFile }) => this.video.setSource(`http://localhost:8081/videos/${data.video.id}`)
    );

    this.route.queryParamMap.pipe(
      take(1),
      map(params => params.get('play')),
      filter(play => play !== null),
      tap(play => play === '0' ? setTimeout(() => this.pause(), 0) : {})
    ).subscribe();

    this.route.queryParamMap.pipe(
      take(1),
      map(params => params.get('time')),
      filter(time => time !== null),
      tap(time => this.seekTo(+time))
    ).subscribe();

    this.subscriptions.push(

      this.video.getCurrentTime().pipe(
        throttleTime(1000),
        map(ct => Math.floor(ct)),
        tap(ct => this.router.navigate([], { queryParams: { time: ct }, queryParamsHandling: 'merge' }))
      ).subscribe(),

      this.video.getPlaying().pipe(
        tap(playing => this.router.navigate([], { queryParams: { play: playing ? 1 : 0 }, queryParamsHandling: 'merge' }))
      ).subscribe()

    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  openSidenav() {
    this.core.toggleSidenav();
  }

  play() {
    (this.videoRef.nativeElement as HTMLMediaElement).play().then(
      () => {},
      error => console.error(error)
    );
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
    this.video.setLoading(false);
    this.video.setPlaying(true);
  }

  onPlaying() {
    this.onPlay();
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
    // Fix for Edge ?
    /* this.video.getLoading().pipe(
      take(1),
      tap(loading => loading ? this.video.setLoading(false) : {})
    ).subscribe(); */

    this.video.updateCurrentTime(event.target.currentTime);
  }

  onWaiting() {
    this.video.setLoading(true);
  }

  onError(event) {
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaError/code
    console.error('VideoError', event.target.error);
  }

  closeVideo() {
    this.video.updateCurrentTime(0);
    this.router.navigate(
      [{ outlets: { player: null } }],
      { queryParams: { time: null, play: null }, queryParamsHandling: 'merge' }
    ).then(() => {
      this.video.setSource(null);
    });
  }

}
