import {Injectable} from '@angular/core';
import {asyncScheduler, fromEvent} from 'rxjs';
import {filter, share, throttleTime} from 'rxjs/operators';

@Injectable()
export class KeyboardService {

  ArrowRight = fromEvent(document, 'keydown').pipe(
    filter((event: KeyboardEvent) => event.key === 'ArrowRight'),
    throttleTime(275, asyncScheduler, { leading: true, trailing: true}),
    throttleTime(150, asyncScheduler, { leading: true, trailing: false}),
    share()
  );

  ArrowLeft = fromEvent(document, 'keydown').pipe(
    filter((event: KeyboardEvent) => event.key === 'ArrowLeft'),
    throttleTime(275, asyncScheduler, { leading: true, trailing: true}),
    throttleTime(150, asyncScheduler, { leading: true, trailing: false}),
    share()
  );

  constructor() {
    this.ArrowRight.subscribe();
    this.ArrowLeft.subscribe();
  }



}
