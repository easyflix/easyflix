import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {FilesService} from '@app/services/files.service';
import {Observable, of, Subject, Subscription} from 'rxjs';
import {LibraryFile, Video} from '@app/models/file';
import {map, switchMap, take} from 'rxjs/operators';
import {ActivatedRoute, Router} from '@angular/router';
import {tap} from 'rxjs/internal/operators/tap';

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
    this.searchSubject.next(val);
    this.searchVar = val;
  }

  searchSubject: Subject<string> = new Subject();

  subscription: Subscription;

  constructor(
    private files: FilesService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  static matchesSearch(video: Video, searchTerms: string[]): boolean {
    return searchTerms.map(term =>
      video.name.toLowerCase().includes(term.toLowerCase()) || video.parent.toLowerCase().includes(term.toLowerCase())
    ).reduce((a, b) => a && b);
  }

  ngOnInit() {
    this.files$ = this.searchSubject.asObservable().pipe(
      switchMap(search => {
        let searchTerms = search.trim().replace(/[ ]+/g, ' ').split(' ');
        if (searchTerms.length === 1 && searchTerms[0] === '') {
          searchTerms = [];
        }
        return searchTerms.length === 0 ? of([]) : this.files.getAllFiles().pipe(
          map(f => f.filter(file => file.type === 'video')),
          map(f => f.filter((video: Video) =>  SearchComponent.matchesSearch(video, searchTerms)))
        );
      })
    );
    this.subscription = this.searchSubject.asObservable().subscribe(search =>
      this.router.navigate([], { queryParams: { s: search.trim() }, queryParamsHandling: 'merge', replaceUrl: true })
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
    this.subscription.unsubscribe();
  }

}
