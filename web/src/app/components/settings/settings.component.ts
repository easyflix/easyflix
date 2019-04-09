import {ChangeDetectionStrategy, Component, OnInit, ViewChild} from '@angular/core';
import {MatButton} from '@angular/material';
import {CoreService} from '@app/services/core.service';
import {Observable} from 'rxjs';
import {SidenavModeType} from '@app/reducers/core.reducer';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent  implements OnInit {

  @ViewChild('closeButton')
  closeButton: MatButton;

  sidenavMode$: Observable<string>;

  constructor(private core: CoreService) {
    this.sidenavMode$ = core.getSidenavMode();
  }

  ngOnInit() { }

  focus(): void {
    this.closeButton._elementRef.nativeElement.focus();
  }

  setSidenavMode(mode: SidenavModeType) {
    this.core.setSidenavMode(mode);
  }

}
