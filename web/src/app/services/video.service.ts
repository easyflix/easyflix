import {ElementRef, Injectable, Renderer2} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {filter, map, publishReplay, refCount, throttleTime} from 'rxjs/operators';
import {Store} from '@ngrx/store';

import * as fromStore from '../reducers';
import {SetVideoDuration, SetVideoLoading, SetVideoMuted, SetVideoPlaying, SetVideoVolume} from '../actions/video.actions';

@Injectable(/*{
  providedIn: 'root'
}*/)
export class VideoService {

  public renderer: Renderer2;

  public videoRoot: ElementRef;

  private videoElement: HTMLMediaElement;
  private listeners: (() => void)[] = [];

  private readonly currentTime$: Observable<number>;
  private readonly ended$: Observable<void>;

  private currentTimeSubject = new Subject<number>();
  private endedSubject = new Subject<void>();

  constructor(private store: Store<fromStore.State>) {
    this.store.select(fromStore.getVideoInput).pipe(
      filter(video => !!video.source),
      map(video => this.setVideo(video.source, video.volume))
    ).subscribe();

    this.currentTime$ = this.currentTimeSubject.asObservable().pipe(publishReplay(1), refCount(), throttleTime(100));
    this.ended$ = this.endedSubject.asObservable();
  }

  play(): Promise<void> {
    if (this.videoElement) {
      return this.videoElement.play();
    }
  }

  pause(): void {
    if (this.videoElement) {
      return this.videoElement.pause();
    }
  }

  seekTo(time: number) {
    this.videoElement.currentTime = time;
    if (!this.isTimeInBuffer(time)) {
      this.store.dispatch(new SetVideoLoading(true));
    }
  }

  setMuted(muted: boolean) {
    this.store.dispatch(new SetVideoMuted(muted));
  }

  setVolume(volume: number) {
    this.store.dispatch(new SetVideoVolume(volume));
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

  getEnded() {
    return this.ended$;
  }

  private isTimeInBuffer(time: number): boolean {
    for (let i = 0; i < this.videoElement.buffered.length; i++) {
      if (time >= this.videoElement.buffered.start(i) && time <= this.videoElement.buffered.end(i)) {
        return true;
      }
    }
    return false;
  }

  private setVideo(src: string, volume: number) {
    if (this.videoElement && this.videoElement.src === src) {
      this.videoElement.volume = volume;
      return;
    }
    if (this.videoElement) {
      this.renderer.removeChild(this.videoRoot, this.videoElement);
      this.listeners.forEach(listener => listener());
      // setTimeout(() => this._currentTime.next(0));
    }
    this.videoElement = this.createVideoElement(src);
    this.videoElement.volume = volume;
  }

  private createVideoElement(src: string): HTMLMediaElement {
    this.store.dispatch(new SetVideoLoading(true));
    const video: HTMLMediaElement = this.renderer.createElement('video');
    this.renderer.appendChild(this.videoRoot.nativeElement, video);
    video.autoplay = true;
    video.src = src;
   //  setTimeout(() => console.log(video.audioTracks), 5000)
   //  setTimeout(() => console.log(video.videoTracks), 5000)
   //  setTimeout(() =>
   //   video.audioTracks.onaddtrack = (event) => console.log(event)
   // , 0)
    this.listeners.push(
      this.renderer.listen(video, 'loadedmetadata', (event) =>  this.store.dispatch(new SetVideoDuration(event.target.duration))),
      this.renderer.listen(video, 'timeupdate', (event) => this.currentTimeSubject.next(event.target.currentTime)),
      this.renderer.listen(video, 'playing', () => this.store.dispatch(new SetVideoPlaying(true))),
      this.renderer.listen(video, 'pause', () => this.store.dispatch(new SetVideoPlaying(false))),
      this.renderer.listen(video, 'ended', () => this.store.dispatch(new SetVideoPlaying(false))),
      this.renderer.listen(video, 'canplay', () => this.store.dispatch(new SetVideoLoading(false))),
      this.renderer.listen(video, 'ended', () => this.endedSubject.next()),
      this.renderer.listen(video, 'error', (event) => {
        console.error('An video error occurred!', event);
      })
    );
    return video;
  }

}
