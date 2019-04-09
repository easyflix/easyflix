import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {Observable, Subject} from 'rxjs';
import {publishReplay, refCount, throttleTime} from 'rxjs/operators';
import {Store} from '@ngrx/store';

import * as fromStore from '../reducers';
import {
  SetVideoDuration,
  SetVideoLoading,
  SetVideoMuted,
  SetVideoPlaying,
  SetVideoSource,
  SetVideoVolume
} from '../actions/video.actions';
import {Video} from '@app/models/file';

@Injectable()
export class VideoService {

  private readonly currentTime$: Observable<number>;
  private readonly currentTimeSubject = new Subject<number>();

  constructor(
    private store: Store<fromStore.State>,
    private router: Router
  ) {
    this.currentTime$ = this.currentTimeSubject.asObservable().pipe(publishReplay(1), refCount(), throttleTime(100));
  }
  
  playVideo(video: Video) {
    this.setSource(`http://localhost:8081/videos/${video.id}`);
    this.router.navigate([{ outlets: { player: video.id } }], { queryParamsHandling: 'preserve' });
  }

  setSource(videoUrl: string) {
    this.store.dispatch(new SetVideoSource(videoUrl));
  }

  setMuted(muted: boolean) {
    this.store.dispatch(new SetVideoMuted(muted));
  }

  setVolume(volume: number) {
    this.store.dispatch(new SetVideoVolume(volume));
  }

  setPlaying(playing: boolean) {
    this.store.dispatch(new SetVideoPlaying(playing));
  }

  setLoading(loading: boolean) {
    this.store.dispatch(new SetVideoLoading(loading));
  }

  setDuration(duration: number) {
    this.store.dispatch(new SetVideoDuration(duration));
  }

  getSource(): Observable<string> {
    return this.store.select(fromStore.getVideoSource);
  }

  getMuted() {
    return this.store.select(fromStore.getVideoMuted);
  }

  getVolume() {
    return this.store.select(fromStore.getVideoVolume);
  }

  getPlaying() {
    return this.store.select(fromStore.getVideoPlaying);
  }

  getLoading() {
    return this.store.select(fromStore.getVideoLoading);
  }

  getDuration() {
    return this.store.select(fromStore.getVideoDuration);
  }

  getCurrentTime() {
    return this.currentTime$;
  }

  updateCurrentTime(currentTime: number) {
    this.currentTimeSubject.next(currentTime);
  }

}
