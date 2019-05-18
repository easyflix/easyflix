import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {filter, map, switchMap, take} from 'rxjs/operators';
import {EMPTY, Observable, zip} from 'rxjs';
import {CoreService} from '@app/services/core.service';
import {FilesService} from '@app/services/files.service';
import {VideoService} from '@app/services/video.service';
import {FilterService} from '@app/services/filter.service';
import {ActivatedRoute, Router} from '@angular/router';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {Episode, Show} from '@app/models/show';

@Component({
  selector: 'app-episode',
  template: `
    <ng-container *ngIf="episode$ | async as episode">
      <div class="still">
        <img *ngIf="getStillSource(episode) | async as source" [src]="source">
      </div>
      <div class="content">
        <header class="tabs">
          <h3 class="tab" [class.selected]="true">Episode Info</h3>
          <h3 class="tab" [class.selected]="false">File Info</h3>
        </header>
        <dl>
          <dt>Name</dt>
          <dd>{{ episode.episode_number }}. {{ episode.name }}</dd>
          <dt>Air date</dt>
          <dd>{{ episode.air_date | date }}</dd>
          <ng-container *ngIf="getDirectors(episode).length > 0; else placeholder">
            <dt>Directed by</dt>
            <dd>
              <ng-container *ngFor="let director of getDirectors(episode); last as isLast">
                {{ director }}{{ isLast ? '' : ', ' }}
              </ng-container>
            </dd>
          </ng-container>
          <ng-container *ngIf="getWriters(episode).length > 0; else placeholder">
            <dt>Written by</dt>
            <dd>
              <ng-container *ngFor="let writer of getWriters(episode); last as isLast">
                {{ writer }}{{ isLast ? '' : ', ' }}
              </ng-container>
            </dd>
          </ng-container>
          <ng-template #placeholder>
            <dt>&nbsp;</dt>
            <dd>&nbsp;</dd>
          </ng-template>
        </dl>
        <p class="overview">{{episode.overview}}</p>
      </div>
    </ng-container>
  `,
  styles: [`
    :host {
      box-sizing: border-box;
      width: 100%;
      font-weight: 300;
      display: flex;
      align-items: center;
    }
    .still {
      margin-right: 30px;
      font-size: 0;
      min-width: 300px;
    }
    .content {
      min-width: calc(100% - 330px);
    }
    dl {
      float: left;
      width: 350px;
    }
    .tabs {
      margin-top: 0;
      display: flex;
      flex-direction: row;
      margin-bottom: 15px;
      border-bottom: 1px solid;
    }
    .tab {
      font-weight: 400;
      font-size: 16px;
      width: 8.5rem;
      text-align: center;
      margin: 0 0 -1px 0;
      padding: .75rem 0;
      cursor: pointer;
    }
    .tab.selected {
      border-bottom: 2px solid;
    }
    dl {
      padding: 0 1rem 0 0;
      float: left;
      width: 380px;
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      font-weight: 300;
      margin: 0;
      line-height: 1.9;
    }
    dt {
      width: 9rem;
      padding-right: 1rem;
      box-sizing: border-box;
      font-weight: 400;
      margin: 0;
      text-align: right;
    }
    dd {
      width: calc(100% - 9rem);
      align-items: center;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .overview {
      margin: 0;
      font-weight: 300;
      line-height: 30px;
      max-height: 120px;
      overflow-y: auto;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EpisodeComponent implements OnInit {

  episode$: Observable<Episode>;

  constructor(
    private core: CoreService,
    private files: FilesService,
    private video: VideoService,
    private filters: FilterService,
    private router: Router,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
  ) {

  }

  ngOnInit(): void {

    this.episode$ = zip(this.route.paramMap, this.route.parent.paramMap, this.route.parent.parent.data).pipe(
      map(array => ({
        episode: +array[0].get('episode'),
        season: +array[1].get('season'),
        show$: array[2].show$ as Observable<Show>
      })),
      switchMap(obj => obj.show$.pipe(
        map((show: Show) =>
          show.episodes.filter(ep =>
            ep.season_number === obj.season && ep.episode_number === obj.episode
          )[0]
        )
      ))
    );
  }

  getStillSource(episode: Episode): Observable<SafeUrl> {
    if (episode.still_path) {
      return this.core.getConfig().pipe(
        filter(s => !!s),
        take(1),
        map(config => this.sanitizer.bypassSecurityTrustResourceUrl(
          `${config.images.secure_base_url}w300${episode.still_path}`
        ))
      );
    } else {
      return EMPTY;
    }
  }

  getWriters(episode: Episode): string[] {
    return episode.crew.filter(p => p.job === 'Writer').map(p => p.name);
  }

  getDirectors(episode: Episode): string[] {
    return episode.crew.filter(p => p.job === 'Director').map(p => p.name);
  }

}
