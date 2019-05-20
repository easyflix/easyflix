import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {filter, map, take} from 'rxjs/operators';
import {EMPTY, Observable} from 'rxjs';
import {CoreService} from '@app/services/core.service';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {Episode, Show} from '@app/models/show';
import {LibraryFile} from '@app/models';

@Component({
  selector: 'app-episode',
  template: `
      <div class="still">
        <img *ngIf="getStillSource(episode) | async as source" [src]="source" alt="Still">
      </div>
      <div class="content">
        <header class="tabs">
          <a class="tab"
             [class.selected]="tabIndex === 0"
             (click)="tabIndex = 0"
             (keydown.enter)="tabIndex = 0"
             tabindex="0">
            Episode {{ episode.episode_number }}
          </a>
          <a class="tab"
             [class.selected]="tabIndex === i + 1"
             (click)="tabIndex = i + 1"
             (keydown.enter)="tabIndex = i + 1"
             tabindex="0"
             *ngFor="let file of files; index as i">
            File Info <ng-container *ngIf="files.length > 1">({{ i + 1 }})</ng-container>
          </a>
        </header>
        <ng-container *ngIf="tabIndex === 0">
          <dl>
            <dt>Name</dt>
            <dd>{{ episode.name }}</dd>
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
        </ng-container>
        <section class="file-info" *ngFor="let file of files; index as i" [class.hidden]="tabIndex !== (i + 1)">
          <dl>
            <dt>Library</dt>
            <dd>{{ file.libraryName }}</dd>
            <dt>File name</dt>
            <dd>{{ file.name }}</dd>
            <dt>File size</dt>
            <dd>{{ file.size | sgFileSize }}</dd>
            <dt>Tags</dt>
            <dd class="tags">
              <mat-chip-list [selectable]="false" [disabled]="true">
                <mat-chip *ngFor="let tag of file.tags">
                  {{ tag }}
                </mat-chip>
              </mat-chip-list>
            </dd>
          </dl>
        </section>
      </div>
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
    .tab:hover, .tab:focus {
      border-bottom: 2px solid;
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
    .hidden {
      display: none;
    }
    .file-info dl {
      float: none;
      width: 100%;
      height: 120px;
    }
    .tags mat-chip {
      opacity: 1 !important;
      font-weight: 300;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EpisodeComponent implements OnInit {

  @Input() show: Show;
  @Input() episode: Episode;

  files: LibraryFile[];

  tabIndex = 0;

  constructor(
    private core: CoreService,
    private sanitizer: DomSanitizer,
  ) {

  }

  ngOnInit(): void {
    // Careful: this is not updated if the episode input changes
    this.files = this.show.files.filter(file =>
      file.seasonNumber === this.episode.season_number && file.episodeNumber === this.episode.episode_number
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
