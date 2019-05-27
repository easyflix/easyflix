import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {CoreService} from '@app/services/core.service';

@Component({
  selector: 'app-global',
  templateUrl: './global.component.html',
  styleUrls: ['./global.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GlobalComponent implements OnInit {

  constructor(
    private core: CoreService,
  ) {

  }

  ngOnInit() {
  }

}
