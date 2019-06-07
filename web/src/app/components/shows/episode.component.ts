import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {filter, map, take} from 'rxjs/operators';
import {EMPTY, Observable} from 'rxjs';
import {CoreService} from '@app/services/core.service';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {Episode, Show} from '@app/models/show';
import {LibraryFile} from '@app/models';
import {ActivatedRoute} from '@angular/router';
import {VideoService} from '@app/services/video.service';
import {FileSelectionComponent} from '@app/components/dialogs/file-selection.component';
import {MatDialog} from '@angular/material';

@Component({
  selector: 'app-episode',
  template: `
      <div class="still">
        <img *ngIf="getStillSource(episode) | async as source; else noStill" [src]="source" alt="Still" />
        <ng-template #noStill>
          <div class="no-still">
            <mat-icon>movie</mat-icon>
          </div>
        </ng-template>
        <button class="play" mat-mini-fab color="primary" (click)="play()">
          <mat-icon>play_arrow</mat-icon>
        </button>
      </div>
      <div class="content">
        <app-tabs>
          <nav mat-tab-nav-bar>
            <a mat-tab-link
               [routerLink]="['./', { season: episode.season_number, episode: episode.episode_number }]"
               [active]="isSelectedInfo() | async"
               queryParamsHandling="preserve">
              Episode {{ episode.episode_number }}
            </a>
            <a mat-tab-link
               *ngFor="let file of files; index as i"
               [routerLink]="['./', { season: episode.season_number, episode: episode.episode_number, file: i + 1 }]"
               [active]="isSelectedFile(i + 1) | async"
               queryParamsHandling="preserve">
              File Info <ng-container *ngIf="files.length > 1">({{ i + 1 }})</ng-container>
            </a>
          </nav>
        </app-tabs>
        <ng-container *ngIf="isSelectedInfo() | async">
          <app-dl class="info">
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
          </app-dl>
          <app-overview>{{episode.overview}}</app-overview>
        </ng-container>
        <ng-container *ngFor="let file of files; index as i">
          <section class="file-info" *ngIf="isSelectedFile(i + 1) | async">
            <app-dl>
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
            </app-dl>
          </section>
        </ng-container>
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
      position: relative;
    }
    .no-still {
      height: 169px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .no-still mat-icon {
      font-size: 4rem;
      height: 4rem;
      width: 4rem;
    }
    .play {
      position: absolute;
      right: 50%;
      bottom: 50%;
      transform: translate(50%, 50%);
      display: none;
    }
    .still:hover .play {
      display: unset;
    }
    .content {
      min-width: calc(100% - 330px);
    }
    app-tabs {
      margin-bottom: 11px;
    }
    app-tabs a {
      min-width: 120px;
    }
    .info {
      padding: 0 1rem 0 0;
      float: left;
      width: 380px;
      box-sizing: border-box;
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

  constructor(
    private core: CoreService,
    private video: VideoService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
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

  isSelectedFile(index: number): Observable<boolean> {
    return this.route.paramMap.pipe(
      map(params => params.get('file') !== null && +params.get('file') === index)
    );
  }

  isSelectedInfo(): Observable<boolean> {
    return this.route.paramMap.pipe(
      map(params => params.get('file') === null)
    );
  }

  play(): void {
    if (this.files.length > 1) {
      const fileRef = this.dialog.open(FileSelectionComponent, {
        minWidth: '650px',
        maxWidth: '85%',
        data: { files: this.files }
      });
      fileRef.afterClosed().subscribe(
        file => file ? this.video.playVideo(file) : {}
      );
    } else {
      this.video.playVideo(this.files[0]);
    }
  }

}
