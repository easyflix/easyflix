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
import {Subscription} from 'rxjs';
import {LibraryListComponent} from './library-list.component';
import {Folder, Library} from '@app/models/file';

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
  isAnimating = false;

  state = 's0';

  @ViewChild('myPanels', {read: PanelDirective})
  panels: PanelDirective;

  libraries: ComponentRef<LibraryListComponent>;
  librariesSub: Subscription;

  breadcrumbs: string[] = [];

  private readonly folderFactory: ComponentFactory<FileListComponent>;
  private readonly librariesFactory: ComponentFactory<LibraryListComponent>;

  constructor(
    private cdr: ChangeDetectorRef,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {
    this.folderFactory = this.componentFactoryResolver.resolveComponentFactory(FileListComponent);
    this.librariesFactory = this.componentFactoryResolver.resolveComponentFactory(LibraryListComponent);
  }

  ngOnInit() {
    this.libraries = this.librariesFactory.create(this.panels.viewContainerRef.injector);
    this.librariesSub = this.libraries.instance.openLibrary.subscribe((library: Library) => this.create(library));
    this.panels.viewContainerRef.insert(this.libraries.hostView, 0);
    this.libraries.instance.afterAnimation();
  }

  ngOnDestroy(): void {
    this.librariesSub.unsubscribe();
  }

  create(
    folder: Folder | Library,
    parentRef: ComponentRef<LibraryListComponent | FileListComponent> = this.libraries
  ) {
    const folderRef = this.folderFactory.create(this.panels.viewContainerRef.injector);
    folderRef.instance.currentFolder = folder;
    folderRef.instance.prev.subscribe(() => {
      this.breadcrumbs.pop();
      this.closeTo(parentRef);
    });
    folderRef.instance.next.subscribe(f => this.create(f, folderRef));
    this.breadcrumbs.push(folder.name);
    this.openTo(folderRef);
  }

  openTo<T extends AnimatableComponent>(component: ComponentRef<T>) {
    this.animateTo(component, true, true);
  }

  closeTo<T extends AnimatableComponent>(component: ComponentRef<T>) {
    this.animateTo(component, false, false);
  }

  /**
   * Creates a new component and animates the transition to it
   * @param component the new component to show
   * @param ltr animate from left to right
   * @param detach detaches previous view instead of destroying it
   */
  animateTo<T extends AnimatableComponent>(component: ComponentRef<T>, ltr: boolean = true, detach: boolean = false) {
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.state = ltr ? 's-right' : 's-left';
      const firstIndex = ltr ? 1 : 0;
      const secondIndex = ltr ? 0 : 1;
      this.panels.viewContainerRef.insert(component.hostView, firstIndex);
      component.instance.beforeAnimation();
      setTimeout(() => {
        this.isAnimating = false;
        this.state = 's0';
        component.instance.afterAnimation();
        detach ? this.panels.viewContainerRef.detach(secondIndex) : this.panels.viewContainerRef.remove(secondIndex);
        this.cdr.detectChanges();
      }, this.DRAWER_ANIMATION_TIME);
    }
  }

  getCurrentPath(): string {
    if (this.breadcrumbs.length === 0) {
      return '';
    }
    return this.breadcrumbs.reduce((a, b) => `${a}/${b}`);
  }

}
