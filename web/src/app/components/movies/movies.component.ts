import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {moviesAnimations} from '@app/animations';
import {FilterService} from '@app/services/filter.service';

@Component({
  selector: 'app-movies',
  template: `
    <div class="animation-container" [@moviesAnimation]="getAnimationData(main)">
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
  animations: [moviesAnimations],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MoviesComponent implements OnInit {

  constructor(
    private filters: FilterService
  ) { }

  ngOnInit() {
    this.filters.showFilters();
  }

  getAnimationData(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData.animation || 'void';
  }

}
