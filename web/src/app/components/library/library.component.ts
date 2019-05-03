import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {PanelDirective} from '@app/shared/directives/panel.directive';
import {FileListComponent} from './file-list.component';
import {combineLatest, EMPTY, Subscription} from 'rxjs';
import {LibraryListComponent} from './library-list.component';
import {LibraryFile} from '@app/models';
import {ActivatedRoute, Router} from '@angular/router';
import {map, mergeMap, take, tap} from 'rxjs/operators';
import {FilesService} from '@app/services/files.service';

export interface AnimatableComponent {
  afterAnimation();
  beforeAnimation();
}

@Component({
  selector: 'app-library',
  template: `
    <header>
      <h2>Video Libraries</h2>
      <h3 class="path">{{getCurrentPath()}}</h3>
    </header>
    <mat-divider></mat-divider>
    <div class='content' [ngClass]='state'>
      <ng-template appPanels #myPanels></ng-template>
    </div>
  `,
  styles: [`
    :host {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      overflow-x: hidden
    }
    header {
      height: 59px;
      min-height: 59px;
      display: flex;
      align-items: center;
      padding: 0 1.25rem;
    }
    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
      white-space: nowrap;
    }
    h3 {
      flex-grow: 1;
      margin: 0 0 0 auto;
      text-align: right;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 12px;
      padding-left: 1rem;
    }
    .content {
      overflow-y: auto;
      display: flex;
      flex-direction: row;
      flex-grow: 1
    }
    .content.s0 {
      transition: none;
      transform: translate(0);
      width: 100%
    }
    .content.s-right {
      transition: transform 0.4s ease;
      transform: translate(-50%);
      width: 200%
    }
    .content.s-left {
      position: relative;
      left: -100%;
      transition: transform 0.4s ease;
      transform: translate(+50%);
      width: 200%
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LibraryComponent implements OnInit, OnDestroy {

  DRAWER_ANIMATION_TIME = 400;

  state = 's0';
  animating = false;

  @ViewChild('myPanels', {read: PanelDirective})
  panels: PanelDirective;

  librariesComponent: ComponentRef<LibraryListComponent>;
  librariesSub: Subscription;
  routeSub: Subscription;

  breadcrumbs: string[] = [];
  breadcrumbsIds: string[] = [];

  components: ComponentRef<any>[] = [];

  private readonly folderFactory: ComponentFactory<FileListComponent>;
  private readonly librariesFactory: ComponentFactory<LibraryListComponent>;

  constructor(
    private cdr: ChangeDetectorRef,
    private componentFactoryResolver: ComponentFactoryResolver,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private files: FilesService
  ) {
    this.folderFactory = this.componentFactoryResolver.resolveComponentFactory(FileListComponent);
    this.librariesFactory = this.componentFactoryResolver.resolveComponentFactory(LibraryListComponent);
  }

  ngOnInit() {
    this.librariesComponent = this.librariesFactory.create(this.panels.viewContainerRef.injector);

    this.librariesSub =
      this.librariesComponent.instance.openLibrary.pipe(
        mergeMap(library => this.files.getByPath(library.name).pipe(take(1)))
      ).subscribe((folder: LibraryFile) => this.goTo(folder));

    this.panels.viewContainerRef.insert(this.librariesComponent.hostView, 0);

    this.librariesComponent.instance.afterAnimation();

    this.components.push(this.librariesComponent);

    this.routeSub = this.activatedRoute.queryParamMap.pipe(
      take(1),
      mergeMap(route => {
        const param = route.get('l');
        if (param === null) { return EMPTY; }
        const foldersIds = param.split(':');
        return combineLatest(foldersIds.map(id => this.files.getById(id))).pipe(
          map((folds: LibraryFile[]) => folds.filter(f => !!f)),
          tap(() => this.resetBreadcrumbs()),
          tap(folders => folders.forEach(f => this.goTo(f, false, 0)))
        );
      }),
    ).subscribe();
  }

  ngOnDestroy() {
    this.librariesSub.unsubscribe();
    this.routeSub.unsubscribe();
  }

  resetBreadcrumbs() {
    this.breadcrumbsIds = [];
    this.breadcrumbs = [];
  }

  navigate() {
    const id = this.breadcrumbsIds.length === 0 ? null : this.breadcrumbsIds.reduce((a, b) => `${a}:${b}`);
    this.router.navigate([], { queryParams: { l: id }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  goTo(folder: LibraryFile, navigate: boolean = true, animationTime: number = this.DRAWER_ANIMATION_TIME) {
    if (this.animating) { return; }
    this.animating = true;
    const fromRef = this.components[this.components.length - 1];
    const toRef = this.folderFactory.create(this.panels.viewContainerRef.injector);
    toRef.instance.currentFolder = folder;
    toRef.instance.prev.subscribe(() => this.goBack());
    toRef.instance.next.subscribe(f => this.goTo(f));
    this.components.push(toRef);
    this.breadcrumbs.push(folder.path);
    this.breadcrumbsIds.push(folder.id);
    if (navigate) { this.navigate(); }
    this.animate(fromRef, toRef, true, animationTime);
  }

  goBack() {
    if (this.animating) { return; }
    this.animating = true;
    const fromRef = this.components.pop();
    this.breadcrumbs.pop();
    this.breadcrumbsIds.pop();
    this.navigate();
    this.animate(fromRef, this.components[this.components.length - 1], false, this.DRAWER_ANIMATION_TIME);
  }

  animate<T, R extends AnimatableComponent>(from: ComponentRef<T>, to: ComponentRef<R>, ltr: boolean, animationTime: number) {
    const viewContainer = this.panels.viewContainerRef;
    this.state = ltr ? 's-right' : 's-left';
    viewContainer.insert(to.hostView, ltr ? viewContainer.length : 0);
    to.instance.beforeAnimation();
    const f = () => {
      this.state = 's0';
      this.animating = false;
      this.cdr.detectChanges();
      ltr ?
        viewContainer.detach(viewContainer.indexOf(from.hostView)) :
        viewContainer.remove(viewContainer.indexOf(from.hostView));
      to.instance.afterAnimation();
    };
    if (animationTime === 0) {
      f();
    } else {
      setTimeout(f, animationTime);
    }
  }

  getCurrentPath(): string {
    if (this.breadcrumbs.length === 0) { return ''; }
    return this.breadcrumbs[this.breadcrumbs.length - 1]; // reduce((a, b) => `${a}/${b}`);
  }

}
