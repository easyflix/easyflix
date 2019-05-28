import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {CoreService} from '@app/services/core.service';

@Component({
  selector: 'app-global',
  template: `
    <h3>Setting 1</h3>
    <mat-divider></mat-divider>
    <h3>Setting 2</h3>
  `,
  styles: [`
    h3 {
      margin: 1.25rem 0;
      font-size: 18px
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServerSettingsComponent implements OnInit {

  constructor(
    private core: CoreService,
  ) {

  }

  ngOnInit() {
  }

}
