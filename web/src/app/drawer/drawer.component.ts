import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentFactory,
  ComponentFactoryResolver,
  OnInit,
  ViewChild
} from '@angular/core';
import {PanelDirective} from "../panel.directive";
import {FolderComponent} from "../folder/folder.component";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-drawer',
  templateUrl: './drawer.component.html',
  styleUrls: ['./drawer.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DrawerComponent implements OnInit {

  DRAWER_ANIMATION_TIME = 400;

  state: string = 's0';

  @ViewChild('panels', {read: PanelDirective})
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
    let i = index === undefined ? 0 : index;
    this.subscriptions[i] = [
      componentRef.instance.next.subscribe(() => this.next()),
      componentRef.instance.prev.subscribe(() => this.prev())
    ];
    this.panels.viewContainerRef.insert(componentRef.hostView, i);
    setTimeout(() => componentRef.instance.focus(), this.DRAWER_ANIMATION_TIME);
  }

  removePanel(index?: 0 | 1) {
    this.panels.viewContainerRef.remove(index);
    let i = index === undefined ? 1 : index;
    this.subscriptions[i].forEach(sub => sub.unsubscribe());
  }

  next() {
    this.state = 's-right';
    this.addPanel(1);
    setTimeout(() => {
      this.state = 's0';
      this.removePanel(0);
      this.cdRef.detectChanges();
    }, this.DRAWER_ANIMATION_TIME);
  }

  prev() {
    this.state = 's-left';
    this.addPanel(0);
    setTimeout(() => {
      this.state = 's0';
      this.removePanel(1);
      this.cdRef.detectChanges();
    }, this.DRAWER_ANIMATION_TIME);
  }

}
