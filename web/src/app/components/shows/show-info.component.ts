import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {Creator, Network, Season, Show, ShowDetails} from '@app/models/show';
import {ActivatedRoute, Router} from '@angular/router';
import {EMPTY, Observable} from 'rxjs';
import {filter, map, take} from 'rxjs/operators';
import {Cast} from '@app/models/movie';
import {DomSanitizer, SafeStyle} from '@angular/platform-browser';
import {CoreService} from '@app/services/core.service';
import {FilesService} from '@app/services/files.service';
import {VideoService} from '@app/services/video.service';
import {MovieFiltersService} from '@app/services/movie-filters.service';

@Component({
  selector: 'app-show-info',
  template: `
    <div class="info">
      <app-dl>
        <dt>Original name</dt>
        <dd>{{ show.original_name }}</dd>
        <dt>First air date</dt>
        <dd>{{ show.first_air_date | date:'mediumDate' }}</dd>
        <dt>Episodes</dt>
        <dd *ngIf="show.details as details; else loading">
          <span *ngIf="getTotalAvailableEpisodesCount(show) < details.number_of_episodes">
            {{ getTotalAvailableEpisodesCount(show) }} /
          </span>
          <span>{{ details.number_of_episodes }}</span>
        </dd>
        <dt>Seasons</dt>
        <dd *ngIf="show.details as details; else loading">
          <span *ngIf="getAvailableSeasons(show).length !== details.number_of_seasons">
            {{ getAvailableSeasons(show).length }} /
          </span>
          <span>{{ details.number_of_seasons }}</span>
        </dd>
        <ng-template #loading>
          <dd class="loading">Loading...</dd>
        </ng-template>
      </app-dl>
      <app-dl>
        <dt>Language</dt>
        <dd>
          <a class="search" (click)="searchLanguage(show.original_language)">
            {{ getLanguage(show.original_language) | async }}
          </a>
        </dd>
        <dt>Genres</dt>
        <dd *ngIf="show.details as details; else loading">
          <ng-container *ngFor="let genre of getGenres(details); last as isLast">
            <a class="search" (click)="searchGenre(genre)">{{genre}}</a>{{ isLast ? '' : ',' }}
          </ng-container>
        </dd>
        <dt>Created by</dt>
        <dd *ngIf="show.details as details; else loading">
          <ng-container *ngFor="let creator of getCreatedBy(details.created_by); last as isLast">
            <a class="search" (click)="searchPeople(creator)">{{creator}}</a>{{ isLast ? '' : ',' }}
          </ng-container>
        </dd>
        <dt>Networks</dt>
        <dd *ngIf="show.details as details; else loading">
          <ng-container *ngFor="let network of getNetworks(details.networks); last as isLast">
            <a class="search" (click)="searchNetwork(network)">{{network}}</a>{{ isLast ? '' : ',' }}
          </ng-container>
        </dd>
      </app-dl>
    </div>
    <div class="cast" *ngIf="show.details as details; else castLoading">
      <div class="people" *ngFor="let actor of details.credits.cast">
        <div class="profile" [style]="getActorStyle(actor) | async">
          <mat-icon *ngIf="!actor.profile_path">person</mat-icon>
        </div>
        <div class="name">
          <a class="search" (click)="searchPeople(actor.name)">{{ actor.name }}</a>
        </div>
      </div>
    </div>
    <ng-template #castLoading>
      <div class="cast">
        <div class="people" *ngFor="let i of [0,1,2,3,4,5,6]">
          <div class="profile">
            <mat-icon>person</mat-icon>
          </div>
          <div class="name">
            <app-loading-bar></app-loading-bar>
          </div>
        </div>
      </div>
    </ng-template>
  `,
  styleUrls: ['../styles/cast.scss'],
  styles: [`
    :host {
      display: block;
    }
    .info {
      display: flex;
    }
    a.search {
      cursor: pointer;
    }
    a.search:hover {
      text-decoration: underline;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShowInfoComponent implements OnInit {

  @Input() show: Show;

  constructor(
    private core: CoreService,
    private files: FilesService,
    private video: VideoService,
    private filters: MovieFiltersService,
    private router: Router,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {}

  getActorStyle(actor: Cast): Observable<SafeStyle> {
    if (actor.profile_path) {
      return this.core.getConfig().pipe(
        filter(s => !!s),
        take(1),
        map(config => this.sanitizer.bypassSecurityTrustStyle(
          `background-image: url(${config.images.secure_base_url}w185${actor.profile_path})`
        ))
      );
    }
    return EMPTY;
  }

  getLanguage(languageCode: string): Observable<string> {
    return this.core.getConfig().pipe(
      filter(s => !!s),
      take(1),
      map(config =>
        config.languages
          .find(language => language.iso_639_1 === languageCode)
          .english_name
      )
    );
  }

  getCreatedBy(creators: Creator[]): string[] {
    return creators.map(creator => creator.name);
  }

  getGenres(details: ShowDetails): string[] {
    return details.genres.map(genre => genre.name);
  }

  getNetworks(networks: Network[]): string[] {
    return networks.map(network => network.name);
  }

  getTotalAvailableEpisodesCount(show: Show): number {
    return Array.from(
      new Set(show.files.map(file => `s${file.seasonNumber}e${file.episodeNumber}`))
    ).length;
  }

  getAvailableSeasons(show: Show): Season[] {
    const seasonNumbers = Array.from(new Set(show.files.map(file => file.seasonNumber)));
    return show.details.seasons.filter(season => seasonNumbers.includes(season.season_number));
  }

  searchPeople(person: string) {
    this.router.navigate(['/', {outlets: {show: null}}], {queryParamsHandling: 'preserve'}).then(
      () => {
        this.filters.clear();
        this.filters.setSearch(person);
      }
    );
  }

  searchLanguage(language: string) {
    this.router.navigate(['/', {outlets: {show: null}}], {queryParamsHandling: 'preserve'}).then(
      () => {
        this.filters.clear();
        this.filters.setLanguages([language]);
      }
    );
  }

  searchGenre(genre: string) {
    this.router.navigate(['/', {outlets: {show: null}}], {queryParamsHandling: 'preserve'}).then(
      () => {
        this.filters.clear();
        this.filters.setGenres([genre]);
      }
    );
  }

  searchTag(tag: string) {
    this.router.navigate(['/', {outlets: {show: null}}], {queryParamsHandling: 'preserve'}).then(
      () => {
        this.filters.clear();
        this.filters.setTags([tag]);
      }
    );
  }

  searchNetwork(network: string) {
  }

}
