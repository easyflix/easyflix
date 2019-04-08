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
import {EMPTY, Observable, Subscription} from 'rxjs';
import {LibraryListComponent} from './library-list.component';
import {Folder, Library} from '@app/models/file';
import {ActivatedRoute, Router} from '@angular/router';
import {map, mergeMap, switchMap, take} from 'rxjs/operators';
import {FilesService} from '@app/services/files.service';
import {filter} from 'rxjs/internal/operators/filter';

export interface AnimatableComponent {
  afterAnimation();
  beforeAnimation();
}

@Component({
  selector: 'app-library',
  template: `
    <header>
      <h2>Video Libraries</h2>
      <h3>{{getCurrentPath()}}</h3>
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
      font-weight: 300;
      padding-left: 1rem;
      color: rgba(255,255,255,0.7);
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

  @ViewChild('myPanels', {read: PanelDirective})
  panels: PanelDirective;

  libraries: ComponentRef<LibraryListComponent>;
  librariesSub: Subscription;

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
    this.libraries = this.librariesFactory.create(this.panels.viewContainerRef.injector);
    this.librariesSub = this.libraries.instance.openLibrary.subscribe((library: Library) => this.goTo(library));
    this.panels.viewContainerRef.insert(this.libraries.hostView, 0);
    this.libraries.instance.afterAnimation();
    this.components.push(this.libraries);

    const obs: Observable<{ library: Library, folders: Folder[] }> = this.activatedRoute.queryParamMap.pipe(
      take(1),
      mergeMap(route => {
        const param = route.get('l');
        if (param === null) { return EMPTY; }
        const [libraryName, ...foldersIds] = param.split(':');
        return this.files.getLibraryByName(libraryName).pipe(
          mergeMap(lib => {
            return this.files.getFilesByIds(foldersIds).pipe(
              map((folders: Folder[]) => {
                return ({ library: lib, folders: folders.sort((a, b) => a.parent.localeCompare(b.parent)) });
              })
            );
          })
        );
      })
    );

    // TODO temporary
    this.files.getAllFiles().pipe(
      filter(f => f.length > 0),
      take(1),
      switchMap(() => obs),
    ).subscribe(
      l => {
        this.goTo(l.library, 0);
        l.folders.forEach(f => this.goTo(f, 0));
      }
    );

  }

  ngOnDestroy() {
    this.librariesSub.unsubscribe();
  }

  navigate() {
    const id = this.breadcrumbsIds.length === 0 ? null : this.breadcrumbsIds.reduce((a, b) => `${a}:${b}`);
    this.router.navigate([], { queryParams: { l: id }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  goTo(folder: Folder | Library, animationTime: number = this.DRAWER_ANIMATION_TIME) {
    const fromRef = this.components[this.components.length - 1];
    const toRef = this.folderFactory.create(this.panels.viewContainerRef.injector);
    toRef.instance.currentFolder = folder;
    toRef.instance.prev.subscribe(() => this.goBack());
    toRef.instance.next.subscribe(f => this.goTo(f));
    this.components.push(toRef);
    this.breadcrumbs.push(folder.name);
    switch (folder.type) {
      case 'folder': this.breadcrumbsIds.push(folder.id); break;
      case 'library': this.breadcrumbsIds.push(folder.name);
    }
    this.navigate();
    this.animate(fromRef, toRef, true, animationTime);
  }

  goBack() {
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
    return this.breadcrumbs.reduce((a, b) => `${a}/${b}`);
  }

}
