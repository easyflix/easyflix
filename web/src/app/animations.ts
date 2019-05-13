import {
  trigger, group,
  transition, animate, style, query, animateChild
} from '@angular/animations';

const debug = (name: string) => {
  return (from, to, el, params) => {
    console.log('ANIMATION (' + name + '):', from, '=>', to, el, params);
    return false;
  };
};

const DEFAULT_TIMING = '300ms';

const fadeIn = [
  query(':enter', [
    style({ opacity: 0 }),
    animate(DEFAULT_TIMING + ' ease-in-out', style({ opacity: '1'}))
  ])
];

const fadeOut = [
  query(':leave', [
    animate(DEFAULT_TIMING + ' ease-in-out', style({ opacity: '0'}))
  ])
];

const superimpose =
  query(':enter, :leave', [
    style({
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      width: '100%',
      minHeight: '100%',
      overflow: 'hidden',
      paddingTop: '60px',
      boxSizing: 'border-box'
    })
  ]);

const hideElements =
  query(':enter .animation-hide, :leave .animation-hide', [
    style({
      display: 'none'
    })
  ], { optional: true });

const fadeInOut = [
  superimpose,
  hideElements,
  query(':leave', animateChild()),
  group([
    fadeIn[0],
    fadeOut[0]
  ]),
  // FIX to prevent child routes to remove their component https://github.com/angular/angular/issues/15477
  query('router-outlet ~ *', [style({}), animate(1, style({}))], { optional: true }),
  query(':enter', animateChild())
];

const fadeOver = [
  superimpose,
  fadeIn[0]
];

const slideRight = [
  superimpose,
  query(':enter', [
    style({
      left: '-100%'
    })
  ]),
  group([
    query(':enter', animate(DEFAULT_TIMING + ' ease-in-out', style({ left: 0 }))),
    query(':leave', animate(DEFAULT_TIMING + ' ease-in-out', style({ left: '100%' })))
  ])
];
const slideLeft = [
  superimpose,
  query(':enter', [
    style({
      left: '100%'
    })
  ]),
  group([
    query(':enter', animate(DEFAULT_TIMING + ' ease-in-out', style({ left: 0 }))),
    query(':leave', animate(DEFAULT_TIMING + ' ease-in-out', style({ left: '-100%' })))
  ])
];

export const playerAnimations = trigger('playerAnimation', [
  // transition(debug('player'), []),
  transition('void => player', fadeIn),
  transition('player => void', fadeOut)
]);

export const mainAnimations = trigger('mainAnimation', [
  // transition(debug('main'), []),
  transition('void => *', []),
  transition('* => void', fadeOut),
  transition('* => *', fadeInOut)
]);

export const moviesAnimations = trigger('moviesAnimation', [
  // transition(debug('movies'), []),
  transition('void <=> *', []),
  transition('grid => list', slideLeft),
  transition('grid <=> details', fadeInOut),
  transition('list => grid', slideRight),
]);
