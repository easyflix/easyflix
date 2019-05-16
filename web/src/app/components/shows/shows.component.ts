import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {showsAnimations} from '@app/animations';

@Component({
  selector: 'app-shows',
  template: `
    <div class="animation-container" [@showsAnimation]="getAnimationData(main)">
      <router-outlet #main="outlet"></router-outlet>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      overflow: hidden;
    }
    .animation-container {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
    }
  `],
  animations: [showsAnimations],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShowsComponent implements OnInit {

  constructor(
  ) { }

  ngOnInit() {
  }

  getAnimationData(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData.animation || 'void';
  }

}
