import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {FilesService} from '@app/services/files.service';
import {Observable, of, Subject, Subscription} from 'rxjs';
import {Video} from '@app/models/file';
import {map, switchMap, take} from 'rxjs/operators';
import {ActivatedRoute, Router} from '@angular/router';
import {tap} from 'rxjs/internal/operators/tap';
import {VideoService} from '@app/services/video.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchComponent implements OnInit, AfterViewInit, OnDestroy {

  files$: Observable<Video[]>;

  private searchVar = '';
  get search() {
    return this.searchVar;
  }
  set search(val: string) {
    this.searchVar = val;
    this.searchTerms = val.trim().replace(/[ ]+/g, ' ').split(' ').filter(s => s !== '');
    this.searchSubject.next(this.searchTerms);
  }

  searchTerms: string[] = [];

  searchSubject: Subject<string[]> = new Subject();

  navSubscription: Subscription;

  constructor(
    private files: FilesService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private video: VideoService
  ) {}

  static matchesSearch(video: Video, searchTerms: string[]): boolean {
    return searchTerms.every(term =>
      video.name.toLowerCase().includes(term.toLowerCase()) || video.parent.toLowerCase().includes(term.toLowerCase())
    );
  }

  ngOnInit() {
    this.files$ = this.searchSubject.asObservable().pipe(
      switchMap(searchTerms => {
        return searchTerms.length === 0 ? of([]) : this.files.getAllFiles().pipe(
          map(f => f.filter(file => file.type === 'video' && SearchComponent.matchesSearch(file, searchTerms))),
        );
      })
    );
    this.navSubscription = this.searchSubject.asObservable().subscribe(() =>
      this.router.navigate([], { queryParams: { s: this.search.trim() }, queryParamsHandling: 'merge', replaceUrl: true })
    );
  }

  ngAfterViewInit() {
    this.activatedRoute.queryParamMap.pipe(
      take(1),
      tap(params => {
        if (params.get('s') !== null) {
          this.search = params.get('s');
        }
      })
    ).subscribe();
  }

  ngOnDestroy() {
    this.navSubscription.unsubscribe();
  }

  playVideo(video: Video) {
    this.video.playVideo(video);
  }

}
