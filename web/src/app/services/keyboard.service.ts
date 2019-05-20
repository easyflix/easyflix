import {Injectable} from '@angular/core';
import {asyncScheduler, fromEvent} from 'rxjs';
import {filter, share, throttleTime} from 'rxjs/operators';

@Injectable()
export class KeyboardService {

  THROTTLE_TIME = 300;

  ArrowRight = fromEvent(document, 'keydown').pipe(
    filter((event: KeyboardEvent) => event.key === 'ArrowRight'),
    throttleTime(this.THROTTLE_TIME, asyncScheduler, { leading: true, trailing: true}),
    throttleTime(150, asyncScheduler, { leading: true, trailing: false}),
    share()
  );

  ArrowLeft = fromEvent(document, 'keydown').pipe(
    filter((event: KeyboardEvent) => event.key === 'ArrowLeft'),
    throttleTime(this.THROTTLE_TIME, asyncScheduler, { leading: true, trailing: true}),
    throttleTime(150, asyncScheduler, { leading: true, trailing: false}),
    share()
  );

  ArrowUp = fromEvent(document, 'keydown').pipe(
    filter((event: KeyboardEvent) => event.key === 'ArrowUp'),
    throttleTime(this.THROTTLE_TIME, asyncScheduler, { leading: true, trailing: true}),
    throttleTime(150, asyncScheduler, { leading: true, trailing: false}),
    share()
  );

  ArrowDown = fromEvent(document, 'keydown').pipe(
    filter((event: KeyboardEvent) => event.key === 'ArrowDown'),
    throttleTime(this.THROTTLE_TIME, asyncScheduler, { leading: true, trailing: true}),
    throttleTime(150, asyncScheduler, { leading: true, trailing: false}),
    share()
  );

  constructor() {
    this.ArrowRight.subscribe();
    this.ArrowLeft.subscribe();
    this.ArrowUp.subscribe();
    this.ArrowDown.subscribe();
  }

}
