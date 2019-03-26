import {Component, ViewChild} from '@angular/core';
import {MatSidenav} from "@angular/material";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  opened: boolean = true;
  @ViewChild('sidenav')
  sidenav: MatSidenav;
}
