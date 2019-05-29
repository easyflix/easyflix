import {ChangeDetectionStrategy, Component, HostBinding, OnInit, ViewChild} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {transition, trigger} from '@angular/animations';
import {slideLeft, slideRight} from '@app/animations';

const isRightAnimation = (from, to) => {
  const links = ['library', 'search', 'history', 'settings', 'about'];
  return links.indexOf(from) < links.indexOf(to);
};

@Component({
  selector: 'app-nav-router',
  template: `
    <router-outlet #nav="outlet"></router-outlet>
  `,
  styles: [`
    :host {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow-x: hidden;
    }
  `],
  animations: [
    trigger('navAnimations', [
      // transition(debugAnimation('nav'), []),
      transition('void <=> *', []),
      transition(isRightAnimation, slideLeft),
      transition('* => *', slideRight)
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavRouterComponent implements OnInit {

  @ViewChild(RouterOutlet, { static: true }) navOutlet: RouterOutlet;

  @HostBinding('@navAnimations') animationState: string;

  ngOnInit(): void {
    this.animationState = this.navOutlet.activatedRouteData.animation;
    this.navOutlet.activateEvents.subscribe(
      () => this.animationState = this.navOutlet.activatedRouteData.animation
    );
  }

}
