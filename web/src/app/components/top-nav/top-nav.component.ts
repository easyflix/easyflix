import {Component, Input, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {CoreService} from '@app/services/core.service';

@Component({
  selector: 'app-top-nav',
  templateUrl: './top-nav.component.html',
  styleUrls: ['./top-nav.component.css']
})
export class TopNavComponent implements OnInit {

  searchFocused = false;
  showMenuButton$: Observable<boolean>;

  constructor(private core: CoreService) {
    this.showMenuButton$ = core.getShowSidenav().pipe(map(b => !b));
  }

  ngOnInit() {
  }

  openSidenav() {
    this.core.openSidenav();
  }

}
