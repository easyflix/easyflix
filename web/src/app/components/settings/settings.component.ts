import {ChangeDetectionStrategy, Component, OnInit, ViewChild} from '@angular/core';
import {MatButton} from '@angular/material';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent  implements OnInit {

  @ViewChild('closeButton')
  closeButton: MatButton;

  constructor() { }

  ngOnInit() { }

  focus(): void {
    this.closeButton._elementRef.nativeElement.focus();
  }

}
