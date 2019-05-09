import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {CoreService} from '@app/services/core.service';
import {MoviesService} from '@app/services/movies.service';
import {Observable} from 'rxjs';
import {Movie} from '@app/models';
import {DomSanitizer, SafeStyle} from '@angular/platform-browser';
import {filter, take} from 'rxjs/operators';
import {ImagesConfig} from '@app/models/images-config';

@Component({
  selector: 'app-video-grid',
  templateUrl: './video-grid.component.html',
  styleUrls: ['./video-grid.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoGridComponent implements OnInit {

  movies$: Observable<Movie[]>;
  config: ImagesConfig;

  constructor(
    private core: CoreService,
    private movies: MoviesService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {
    this.movies$ = movies.getAll();
    this.core.getConfig().pipe(filter(s => !!s), take(1)).subscribe(
      conf => {
        this.config = conf;
        this.cdr.markForCheck();
      }
    );
  }

  ngOnInit() {

  }

  getStyle(movie: Movie): SafeStyle {
    if (this.config !== undefined) {
      return this.sanitizer.bypassSecurityTrustStyle(
        `background-image: url(${this.config.secure_base_url}w300${movie.poster})`
      );
    }
  }

}
