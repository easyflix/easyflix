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
import {FolderComponent} from './folder/folder.component';
import {Subscription} from 'rxjs';
import {LibrariesViewComponent} from './libraries-view/libraries-view.component';
import {Folder} from '@app/models/folder';

@Component({
  selector: 'app-library',
  template: `
    <div class='content' [ngClass]='state'>
      <ng-template appPanels #myPanels></ng-template>
    </div>
  `,
  styles: [`
    :host {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      overflow-x: hidden
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

  libraries: ComponentRef<LibrariesViewComponent>;
  librariesSub: Subscription;

  subscriptions: [Subscription[], Subscription[]] = [[], []];

  private readonly folderFactory: ComponentFactory<FolderComponent>;
  private readonly librariesFactory: ComponentFactory<LibrariesViewComponent>;

  constructor(
    private cdRef: ChangeDetectorRef,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {
    this.folderFactory = this.componentFactoryResolver.resolveComponentFactory(FolderComponent);
    this.librariesFactory = this.componentFactoryResolver.resolveComponentFactory(LibrariesViewComponent);
  }

  ngOnInit() {
    this.libraries = this.librariesFactory.create(this.panels.viewContainerRef.injector);
    this.librariesSub = this.libraries.instance.openLibrary.subscribe(library => {
      this.create(library);
    });
    this.panels.viewContainerRef.insert(this.libraries.hostView, 0);
  }

  ngOnDestroy(): void {
    this.librariesSub.unsubscribe();
  }

/*  createLibrary(library: Library) {
    const folderRef = this.folderFactory.create(this.panels.viewContainerRef.injector);
    folderRef.instance.current = library;
    folderRef.instance.prev.subscribe(() => this.closeTo(this.libraries));
    folderRef.instance.next.subscribe(f => this.createFolder(f, folderRef));
    this.openTo(folderRef);
  }

  createFolder<T>(folder: File, parentRef: ComponentRef<T>) {
    const folderRef = this.folderFactory.create(this.panels.viewContainerRef.injector);
    folderRef.instance.current = folder;
    folderRef.instance.prev.subscribe(() => this.closeTo(parentRef));
    folderRef.instance.next.subscribe(f => this.createFolder(f, folderRef));
    this.openTo(folderRef);
  }*/

  create(
      folder: Folder,
      parentRef: ComponentRef<LibrariesViewComponent | FolderComponent> = this.libraries
  ) {
    const folderRef = this.folderFactory.create(this.panels.viewContainerRef.injector);
    folderRef.instance.current = folder;
    folderRef.instance.prev.subscribe(() => this.closeTo(parentRef));
    folderRef.instance.next.subscribe(f => this.create(f, folderRef));
    this.openTo(folderRef);
  }

  openTo<T>(component: ComponentRef<T>) {
    this.animateTo(component, true, true);
  }

  closeTo<T>(component: ComponentRef<T>) {
    this.animateTo(component, false, false);
  }

  // addPanel<T>(componentRef: ComponentRef<T>, index: 0 | 1 = 0) {
  //   // const componentRef = this.folderFactory.create(this.panels.viewContainerRef.injector);
  //   // const i = index === undefined ? 0 : index;
  //   // this.subscriptions[i] = [
  //   //   componentRef.instance.next.subscribe(() => this.next()),
  //   //   componentRef.instance.prev.subscribe(() => this.prev())
  //   // ];
  //   this.panels.viewContainerRef.insert(componentRef.hostView, index);
  //   // setTimeout(() => componentRef.instance.focus(), this.DRAWER_ANIMATION_TIME);
  // }
  //
  // removePanel(index: 0 | 1 = 1) {
  //   this.panels.viewContainerRef.remove(index);
  //   // const i = index === undefined ? 1 : index;
  //   // this.subscriptions[i].forEach(sub => sub.unsubscribe());
  // }

  /**
   * Creates a new component and animates the transition to it
   * @param component the new component to show
   * @param ltr animate from left to right
   * @param detach detach previous view instead of destroying it
   */
  animateTo<T>(component: ComponentRef<T>, ltr: boolean = true, detach: boolean = false) {
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.state = ltr ? 's-right' : 's-left';
      const firstIndex = ltr ? 1 : 0;
      const secondIndex = ltr ? 0 : 1;
      this.panels.viewContainerRef.insert(component.hostView, firstIndex);
      setTimeout(() => {
        this.isAnimating = false;
        this.state = 's0';
        detach ? this.panels.viewContainerRef.detach(secondIndex) : this.panels.viewContainerRef.remove(secondIndex);
        this.cdRef.detectChanges();
      }, this.DRAWER_ANIMATION_TIME);
    }
  }

  // next() {
  //   if (!this.isAnimating) {
  //     this.isAnimating = true;
  //     this.state = 's-right';
  //     this.addPanel(1);
  //     setTimeout(() => {
  //       this.isAnimating = false;
  //       this.state = 's0';
  //       this.removePanel(0);
  //       this.cdRef.detectChanges();
  //     }, this.DRAWER_ANIMATION_TIME);
  //   }
  // }
  //
  // prev() {
  //   if (!this.isAnimating) {
  //     this.isAnimating = true;
  //     this.state = 's-left';
  //     this.addPanel(0);
  //     setTimeout(() => {
  //       this.isAnimating = false;
  //       this.state = 's0';
  //       this.removePanel(1);
  //       this.cdRef.detectChanges();
  //     }, this.DRAWER_ANIMATION_TIME);
  //   }
  // }

}
