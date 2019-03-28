import {Component, EventEmitter, OnInit, ViewChild} from '@angular/core';
import {MatButton} from '@angular/material';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.sass']
})
export class SettingsComponent  implements OnInit {

  close: EventEmitter<void> = new EventEmitter();

  @ViewChild('closeButton')
  closeButton: MatButton;

  constructor() { }

  ngOnInit() { }

  focus(): void {
    this.closeButton._elementRef.nativeElement.focus();
  }

}
