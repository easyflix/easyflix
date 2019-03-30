import {
  trigger, animateChild, group,
  transition, animate, style, query
} from '@angular/animations';


// Routable animations
export const fadeInAnimation =
  trigger('routeAnimation', [
    transition('home <=> player', [
      style({ position: 'relative' }),
      query(':enter, :leave', [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%'
        })
      ]),
      query(':enter', [
        style({ opacity: 0 })
      ]),
      query(':leave', animateChild()),
      group([
        query(':leave', [
          animate('300ms ease', style({ opacity: '0'}))
        ]),
        query(':enter', [
          animate('300ms ease', style({ opacity: '1'}))
        ])
      ]),
      query(':enter', animateChild()),
    ])
  ]);
