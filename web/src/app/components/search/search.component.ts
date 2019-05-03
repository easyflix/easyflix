import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {FilesService} from '@app/services/files.service';
import {Observable, of, Subject, Subscription} from 'rxjs';
import {LibraryFile} from '@app/models';
import {map, switchMap, take, tap} from 'rxjs/operators';
import {ActivatedRoute, Router} from '@angular/router';
import {VideoService} from '@app/services/video.service';
import {FilesUtils} from '@app/utils/files.utils';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchComponent implements OnInit, AfterViewInit, OnDestroy {

  files$: Observable<LibraryFile[]>;

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

  static matchesSearch(video: LibraryFile, searchTerms: string[]): boolean {
    return searchTerms.every(term =>
      video.name.toLowerCase().includes(term.toLowerCase()) || video.path.toLowerCase().includes(term.toLowerCase())
    );
  }

  ngOnInit() {
    this.files$ = this.searchSubject.asObservable().pipe(
      switchMap(searchTerms => {
        return searchTerms.length === 0 ? of([]) : this.files.getAll().pipe(
          map(f => f.filter(file => file.isDirectory === false && SearchComponent.matchesSearch(file, searchTerms))),
        );
      })
    );
    this.navSubscription = this.searchSubject.asObservable().subscribe(() =>
      this.router.navigate([], { queryParams: { search: this.search.trim() || null }, queryParamsHandling: 'merge', replaceUrl: true })
    );
  }

  ngAfterViewInit() {
    this.activatedRoute.queryParamMap.pipe(
      take(1),
      tap(params => {
        const searchParam = params.get('search');
        if (searchParam !== null) {
          this.search = searchParam;
        }
      })
    ).subscribe();
  }

  ngOnDestroy() {
    this.navSubscription.unsubscribe();
  }

  playVideo(video: LibraryFile) {
    this.video.playVideo(video);
  }

  getParentPath(file: LibraryFile): string {
    return FilesUtils.getParentPath(file);
  }

}
