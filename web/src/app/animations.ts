import {
  trigger, group,
  transition, animate, style, query
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
    animate(DEFAULT_TIMING + ' ease', style({ opacity: '1'}))
  ])
];

const fadeOut = [
  query(':leave', [
    animate(DEFAULT_TIMING + ' ease', style({ opacity: '0'}))
  ])
];

const superimpose =
  query(':enter, :leave', [
    style({
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%'
    })
  ]);

const fadeInOut = [
  superimpose,
  group([
    fadeIn[0],
    fadeOut[0]
  ])
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
  transition(debug('player'), []),
  transition('void => player', fadeIn),
  transition('player => void', fadeOut)
]);

export const mainAnimations = trigger('mainAnimation', [
  transition(debug('main'), []),
  transition('void => *', []),
  transition('* => void', fadeOut),
  transition('* => *', fadeInOut)
]);

export const moviesAnimations = trigger('moviesAnimation', [
  transition(debug('movies'), []),
  transition('void <=> *', []),
  transition('grid => list', slideLeft),
  transition('list => grid', slideRight),
]);
