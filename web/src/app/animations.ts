import {animate, animateChild, group, query, style, transition, trigger} from '@angular/animations';

export const debugAnimation = (name: string) => {
  return (from, to, el, params) => {
    console.log('ANIMATION (' + name + '):', from, '=>', to, el, params);
    return false;
  };
};

export const DEFAULT_TIMING = '300ms';

const fadeIn = [
  query(':enter', [
    style({ opacity: 0 }),
    animate(DEFAULT_TIMING + ' ease-in-out', style({ opacity: '1'}))
  ])
];

const fadeOut = [
  query(':leave', [
    animate(DEFAULT_TIMING + ' ease-in-out', style({ opacity: '0'}))
  ]),
  // FIX to prevent child routes to remove their component https://github.com/angular/angular/issues/15477 -> bugs in Edge
  // query('router-outlet ~ *', [style({}), animate(10, style({}))], { optional: true }),
];

const superimpose =
  query(':enter, :leave', [
    style({
      position: 'absolute',
      top: '60px',
      left: 0,
      bottom: 0,
      width: '100%'
    })
  ]);

const hideElements =
  query(':enter .animation-hidden, :leave .animation-hidden', [
    style({
      display: 'none'
    })
  ], { optional: true });

const fadeInOut = [
  superimpose,
  // hideElements,
  query(':leave', animateChild()),
  group([
    fadeIn[0],
    fadeOut[0]
  ]),
  // FIX to prevent child routes to remove their component https://github.com/angular/angular/issues/15477
  // query('router-outlet ~ *', [style({}), animate(1, style({}))], { optional: true }),
  query(':enter', animateChild())
];

const fadeOver = [
  superimpose,
  fadeIn[0]
];

export const slideRight = [
  query(':enter, :leave', [
    style({
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      width: '100%'
    })
  ]),
  query(':enter', [
    style({
      transform: 'translate(-100%)'
    })
  ]),
  group([
    query('' +
      ':enter',
      animate(DEFAULT_TIMING + ' ease-in-out', style({ transform: 'translate(0)' }))
    ),
    query(
      ':leave',
      animate(DEFAULT_TIMING + ' ease-in-out', style({ transform: 'translate(100%)' }))
    )
  ]),
  // FIX to prevent child routes to remove their component https://github.com/angular/angular/issues/15477
  // query('router-outlet + *', [style({ opacity: 1 }), animate(1, style({ opacity: 0.99 }))], { optional: true }),
];

export const slideLeft = [
  query(':enter, :leave', [
    style({
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      width: '100%'
    })
  ]),
  query(':enter', [
    style({
      transform: 'translate(100%)'
    })
  ]),
  group([
    query(
      ':enter',
      animate(DEFAULT_TIMING + ' ease-in-out', style({ transform: 'translate(0)' }))
    ),
    query(
      ':leave',
      animate(DEFAULT_TIMING + ' ease-in-out', style({ transform: 'translate(-100%)' }))
    )
  ]),
  // FIX to prevent child routes to remove their component https://github.com/angular/angular/issues/15477
  // query('router-outlet + *', [style({ opacity: 1 }), animate(1, style({ opacity: 0.99 }))], { optional: true }),
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

/*export const moviesAnimations = trigger('moviesAnimation', [
  // transition(debug('movies'), []),
  transition('void <=> *', []),
  transition('grid => list', slideLeft),
  transition('grid <=> details', fadeInOut),
  transition('list => grid', slideRight),
]);*/

/*export const movieAnimations = trigger('movieAnimation', [
  transition(debug('movie'), []),
  transition('void => details', fadeIn),
  transition('details => void', fadeOut)
]);*/

/*export const showsAnimations = trigger('showsAnimation', [
  // transition(debug('shows'), []),
  transition('void <=> *', []),
  transition('grid => list', slideLeft),
  transition('grid <=> details', fadeInOut),
  transition('list => grid', slideRight),
]);*/

const isRight = (from, to) => {
  return to.startsWith('right');
};

const isLeft = (from, to) => {
  return to.startsWith('left');
};

export const detailsAnimations = trigger('detailsAnimation', [
  // transition(debug('details'), []),
  transition('void => *', []),
  transition(isRight, slideLeft),
  transition(isLeft, slideRight),
]);

/*export const showAnimations = trigger('showAnimation', [
  transition(debug('show'), []),
  transition('void => details', fadeIn),
  transition('details => void', fadeOut)
]);*/

/*const tabsAnim = [
  sequence([
    query(':enter', [
      style({
        height: 0,
        opacity: 0,
        overflow: 'hidden'
      }),
    ]),
    query(
      ':leave',
      sequence([
        style({ height: 'unset' }),
        animate('150ms ease-in-out', style({ opacity: 0 })),
        style({ height: 0, overflow: 'hidden' }),
      ])
    ),
    query(':enter', sequence([
      style({ height: 'unset', overflow: 'unset' }),
      animate('150ms ease-in-out', style({ opacity: 1 }))
    ])),
  ]),

  // FIX to prevent child routes to remove their component https://github.com/angular/angular/issues/15477
  // query('router-outlet ~ *', [style({}), animate(1, style({}))], { optional: true }),
];

export const tabsAnimations = trigger('tabsAnimation', [
  // transition(debug('tabs'), []),
  transition('void <=> *', []),
  transition('* => *', tabsAnim),
]);


const slideUp = [
  query(':enter, :leave', [
    style({
      position: 'absolute'
    })
  ]),
  query(':enter', [
    style({
      transform: 'translateY(calc(100% + 50px))'
    })
  ]),
  group([
    query(
      ':enter',
      animate(DEFAULT_TIMING + ' ease', style({ transform: 'translateY(0)' }))
    ),
    query(
      ':leave',
      animate(DEFAULT_TIMING + ' ease', style({ transform: 'translateY(calc(-100% - 50px))' }))
    )
  ])
];

const slideDown = [
  query(':enter, :leave', [
    style({
      position: 'absolute'
    })
  ]),
  query(':enter', [
    style({
      transform: 'translateY(calc(-100% - 50px))'
    })
  ]),
  group([
    query(
      ':enter',
      animate(DEFAULT_TIMING + ' ease', style({ transform: 'translateY(0)' }))
    ),
    query(
      ':leave',
      animate(DEFAULT_TIMING + ' ease', style({ transform: 'translateY(calc(100% + 50px))' }))
    )
  ])
];

const nextEpisode = (from, to) => {
  return +from < +to;
};

export const episodesAnimations = trigger('episodesAnimation', [
  // transition(debug('episodes'), []),
  transition('void <=> *', []),
  transition(nextEpisode, slideUp),
  transition('* => *', slideDown),
]);*/
