import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-controls',
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.sass']
})
export class ControlsComponent implements OnInit {

  @Input() opening: boolean;

  @Output() sidenavToggle: EventEmitter<void> = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }

}
