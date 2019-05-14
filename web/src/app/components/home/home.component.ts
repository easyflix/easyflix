import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {FilterService} from '@app/services/filter.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {

  constructor(
    private filters: FilterService
  ) { }

  ngOnInit() {
    this.filters.hideFilters();
  }

}
