import {
  ChangeDetectorRef,
  Component,
  ComponentFactory,
  ComponentFactoryResolver,
  OnInit,
  ViewChild
} from '@angular/core';
import {PanelDirective} from '../shared/directives/panel.directive';
import {FolderComponent} from './folder/folder.component';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-library',
  template: `
    <div class="content" [ngClass]="state">
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
  `]
})
export class LibraryComponent implements OnInit {

  DRAWER_ANIMATION_TIME = 400;
  isAnimating = false;

  state = 's0';

  @ViewChild('myPanels', {read: PanelDirective})
  panels: PanelDirective;

  folderFactory: ComponentFactory<FolderComponent>;
  subscriptions: [Subscription[], Subscription[]] = [[], []];

  constructor(
    private cdRef: ChangeDetectorRef,
    private componentFactoryResolver: ComponentFactoryResolver) { }

  ngOnInit() {
    this.folderFactory = this.componentFactoryResolver.resolveComponentFactory(FolderComponent);
    this.addPanel();
  }

  addPanel(index?: 0 | 1) {
    const componentRef = this.folderFactory.create(this.panels.viewContainerRef.injector);
    const i = index === undefined ? 0 : index;
    this.subscriptions[i] = [
      componentRef.instance.next.subscribe(() => this.next()),
      componentRef.instance.prev.subscribe(() => this.prev())
    ];
    this.panels.viewContainerRef.insert(componentRef.hostView, i);
    setTimeout(() => componentRef.instance.focus(), this.DRAWER_ANIMATION_TIME);
  }

  removePanel(index?: 0 | 1) {
    this.panels.viewContainerRef.remove(index);
    const i = index === undefined ? 1 : index;
    this.subscriptions[i].forEach(sub => sub.unsubscribe());
  }

  next() {
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.state = 's-right';
      this.addPanel(1);
      setTimeout(() => {
        this.isAnimating = false;
        this.state = 's0';
        this.removePanel(0);
        this.cdRef.detectChanges();
      }, this.DRAWER_ANIMATION_TIME);
    }
  }

  prev() {
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.state = 's-left';
      this.addPanel(0);
      setTimeout(() => {
        this.isAnimating = false;
        this.state = 's0';
        this.removePanel(1);
        this.cdRef.detectChanges();
      }, this.DRAWER_ANIMATION_TIME);
    }
  }

}
