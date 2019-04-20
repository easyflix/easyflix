import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-libraries',
  templateUrl: './libraries.component.html',
  styleUrls: ['./libraries.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LibrariesComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
