import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnInit, QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {CoreService} from '@app/services/core.service';
import {EMPTY, Observable} from 'rxjs';
import {DomSanitizer, SafeStyle} from '@angular/platform-browser';
import {filter, map, switchMap, take} from 'rxjs/operators';
import {FilesService} from '@app/services/files.service';
import {VideoService} from '@app/services/video.service';
import {Router} from '@angular/router';
import {ShowsService} from '@app/services/shows.service';
import {Show} from '@app/models/show';
import {ShowFiltersService} from '@app/services/show-filters.service';
import {MatDialog} from '@angular/material';
import {animate, style, transition, trigger} from '@angular/animations';
import {ItemDirective} from '@app/components/movies/movies.component';

@Component({
  selector: 'app-shows',
  template: `
    <div class="controls animation-hidden">
      <button mat-icon-button class="filters" (click)="toggleFilters()" *ngIf="!(hasAppliedFilters$ | async)">
        <mat-icon>filter_list</mat-icon>
      </button>
      <button mat-mini-fab color="accent" class="filters" (click)="toggleFilters()" *ngIf="hasAppliedFilters$ | async">
        <mat-icon>filter_list</mat-icon>
      </button>
    </div>
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav position="end" [opened]="showFilters$ | async" mode="side">
        <div class="sidenav-content">
          <h2>Sort and filter</h2>
<!--          <mat-form-field class="sort" appearance="standard">
            <mat-label>Sort</mat-label>
            <mat-select placeholder="Sort" (selectionChange)="setSort($event.value)" [value]="sortStrategy$ | async">
              <mat-option value="alphabetical">
                Alphabetical
              </mat-option>
              <mat-option value="release">
                Latest Release
              </mat-option>
              <mat-option value="addition">
                Latest Addition
              </mat-option>
            </mat-select>
          </mat-form-field>-->
          <app-shows-filters></app-shows-filters>
        </div>
      </mat-sidenav>
      <mat-sidenav-content>
        <section class="items" #items>
          <div class="item" appItem
               @gridAnimation
               *ngFor="let show of shows$ | async; trackBy: trackByFunc" tabindex="0"
               (click)="openShow(show)"
               (keydown.enter)="openShow(show)"
               (keydown.space)="openShow(show)">
            <div class="poster" [style]="getStyle(show) | async"></div>
            <!--<button class="play" mat-mini-fab color="primary" (click)="$event.stopPropagation(); play(movie);" tabindex="-1">
              <mat-icon>play_arrow</mat-icon>
            </button>-->
          </div>
        </section>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    :host {
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .controls {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 11;
    }
    .sidenav-container {
      flex-grow: 1;
    }
    .sidenav-content {
      width: 220px;
      padding: 1rem;
      box-sizing: border-box;
    }
    mat-form-field {
      width: 100%;
    }
    .items {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 22px 0 60px 44px;
    }
    .item {
      box-sizing: content-box;
      position: relative;
      transition: transform 300ms ease;
      cursor: pointer;
      padding: 38px 16px;
    }
    .item:hover, .item:focus {
      transform: scale(1.25);
      z-index: 2;
      outline: none;
    }
    .item:hover {
      z-index: 1;
    }
    .item:hover .play, .item:focus .play {
      opacity: 1;
    }
    .item:focus .poster {
      outline: 1px solid;
    }
    .poster {
      height: 255px; /* 450 */
      width: 170px; /* 300 */
      background-size: cover;
      transition: box-shadow 300ms ease;
    }
    /*.play {
      position: absolute;
      bottom: 46px;
      right: 24px;
      opacity: 0;
      transition: opacity ease 300ms;
      transform: scale(0.77);
    }*/
  `],
  animations: [trigger('gridAnimation', [
    // transition(debugAnimation('grid'), []),
    transition(':enter', [
      style({ width: 0, paddingLeft: 0, paddingRight: 0, opacity: 0 }),
      animate('300ms ease-in-out', style({ width: '170px', paddingLeft: '16px', paddingRight: '16px', opacity: 1 }))
    ]),
    transition(':leave', [
      animate('300ms ease-in-out', style({ width: 0, paddingLeft: 0, paddingRight: 0, opacity: 0 }))
    ])
  ])],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShowsComponent implements OnInit {

  shows$: Observable<Show[]>;
  hasAppliedFilters$: Observable<boolean>;
  showFilters$: Observable<boolean>;

  @ViewChild('items', { static: true })
  itemsContainer: ElementRef;

  @ViewChildren(ItemDirective)
  items: QueryList<ItemDirective>;

  constructor(
    private core: CoreService,
    private files: FilesService,
    private video: VideoService,
    private shows: ShowsService,
    private filters: ShowFiltersService,
    private router: Router,
    private dialog: MatDialog,
    private sanitizer: DomSanitizer,
  ) {

  }

  ngOnInit() {
    this.shows$ = this.shows.getAll().pipe(
      switchMap(shows => this.filters.filterShows(shows))
    );
    this.hasAppliedFilters$ = this.filters.hasAppliedFilters();
    this.showFilters$ = this.filters.getShow();
  }

  getStyle(show: Show): Observable<SafeStyle> {
    if (show.poster) {
      return this.core.getConfig().pipe(
        filter(s => !!s),
        take(1),
        map(config => this.sanitizer.bypassSecurityTrustStyle(
          `background-image: url(${config.images.secure_base_url}w300${show.poster})`
        ))
      );
    } else {
      return EMPTY;
    }
  }

  // TODO check movies trackByFunc
  trackByFunc(index: number, show: Show) {
    return show.id;
  }

/*  play(movie: Movie) {
    this.files.getByPath(movie.files[0].path).subscribe( // TODO present a dialog with file choice
      file => this.video.playVideo(file)
    );
  }*/

  openShow(show: Show): void {
    this.router.navigate(
      ['/', { outlets: { details: ['show', show.id] } }],
      { queryParamsHandling: 'preserve' }
    );
  }

  // @HostListener('keydown.f')
  toggleFilters() {
    this.filters.toggleFilters();
  }

  /*@HostListener('keydown.space', ['$event'])
  noScroll(event: KeyboardEvent) {
    event.preventDefault();
  }*/

  @HostListener('keydown.arrowRight')
  right() {
    const elements = this.items.map(item => item.elementRef.nativeElement);
    const activeElement = elements.find(i => i === document.activeElement);
    const activeIndex = elements.indexOf(activeElement);
    const nextElement = elements[activeIndex + 1];
    if (nextElement) {
      nextElement.focus();
    } else if (activeElement) {
      activeElement.focus();
    }
  }

  @HostListener('keydown.arrowLeft')
  left() {
    const elements = this.items.map(item => item.elementRef.nativeElement);
    const activeElement = elements.find(i => i === document.activeElement);
    const activeIndex = elements.indexOf(activeElement);
    const nextElement = elements[activeIndex - 1];
    if (nextElement) {
      nextElement.focus();
    } else if (activeElement) {
      activeElement.focus();
    }
  }

  @HostListener('keydown.arrowUp', ['$event'])
  up(event: KeyboardEvent) {
    const numberPerLine = Math.floor(
      this.itemsContainer.nativeElement.clientWidth / this.items.first.elementRef.nativeElement.clientWidth
    );
    const elements = this.items.map(item => item.elementRef.nativeElement);
    const activeElement = elements.find(i => i === document.activeElement);
    const activeIndex = elements.indexOf(activeElement);
    const nextElement = elements[activeIndex - numberPerLine] as HTMLElement;
    if (nextElement) {
      nextElement.focus({ preventScroll: true });
      nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (activeElement) {
      activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    event.preventDefault();
  }

  @HostListener('keydown.arrowDown', ['$event'])
  down(event: KeyboardEvent) {
    const numberPerLine = Math.floor(
      this.itemsContainer.nativeElement.clientWidth / this.items.first.elementRef.nativeElement.clientWidth
    );
    const elements = this.items.map(item => item.elementRef.nativeElement);
    const activeElement = elements.find(i => i === document.activeElement);
    const activeIndex = elements.indexOf(activeElement);
    const nextElement = elements[activeIndex + numberPerLine];
    if (nextElement) {
      nextElement.focus({preventScroll: true});
      nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (activeElement) {
      activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    event.preventDefault();
  }

}
