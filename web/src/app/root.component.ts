import {ChangeDetectionStrategy, Component, HostBinding, OnInit} from '@angular/core';
import {map} from 'rxjs/operators';
import {CoreService} from '@app/services/core.service';
import {ThemesUtils} from '@app/utils/themes.utils';

@Component({
  selector: 'app-root',
  template: `
    <router-outlet></router-outlet>
  `,
  styles: [`
    :host {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RootComponent implements OnInit {

  @HostBinding('class')
  class = '';

  constructor(
    private core: CoreService,
  ) { }

  ngOnInit() {
    this.core.getTheme().pipe(map(t => t.cssClass)).subscribe(
      cssClass => this.class = cssClass
    );
    this.core.changeTheme(ThemesUtils.allThemes[0]);
  }

}
