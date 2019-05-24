import {ChangeDetectionStrategy, Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {ConfirmData} from '@app/components/dialogs/confirm-dialog.component';
import {FormControl} from '@angular/forms';
import {Observable} from 'rxjs';
import {CoreService} from '@app/services/core.service';
import {MoviesService} from '@app/services/movies.service';
import {MovieFiltersService} from '@app/services/movie-filters.service';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-filters-shows',
  template: `
    <h3 mat-dialog-title>Movie filters</h3>
    <div mat-dialog-content class="container">

    </div>
    <div mat-dialog-actions>
      <button mat-raised-button [mat-dialog-close]="true">Close</button>
      <button mat-raised-button *ngIf="showClear$ | async"
              color="warn"
              (click)="clearFilters()"
              [mat-dialog-close]="false">Clear</button>
    </div>
  `,
  styles: [`
    .container {
      display: flex;
      flex-wrap: wrap;
    }
    mat-form-field {
      flex-basis: calc(50% - .5rem);
    }
    mat-form-field:nth-child(2n + 1) {
      margin-right: 1rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShowFiltersComponent implements OnInit {

  search = new FormControl();
  rating = new FormControl();
  years = new FormControl();
  languages = new FormControl();
  tags = new FormControl();
  genres = new FormControl();

  ratings$: Observable<number[]>;
  years$: Observable<string[]>;
  languages$: Observable<{ code: string; name: string }[]>;
  tags$: Observable<string[]>;
  genres$: Observable<string[]>;

  showClear$: Observable<boolean>;

  constructor(
    private dialogRef: MatDialogRef<ShowFiltersComponent>,
    private core: CoreService,
    private movies: MoviesService,
    private filters: MovieFiltersService,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmData
  ) {}

  ngOnInit(): void {

  }

  clearFilters(): void {
    this.filters.clear();
  }
}
