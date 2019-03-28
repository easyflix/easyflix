import {NgModule} from '@angular/core';
import {DrawerComponent} from './drawer/drawer.component';
import {FolderComponent} from './folder/folder.component';
import {SettingsComponent} from './settings/settings.component';
import {ControlsComponent} from './controls/controls.component';
import {VideoComponent} from './video/video.component';
import {SearchComponent} from './search/search.component';
import {LibraryComponent} from './library/library.component';
import {HistoryComponent} from './history/history.component';
import {SharedModule} from '../shared/shared.module';

const COMPONENTS = [
  DrawerComponent,
  FolderComponent,
  SettingsComponent,
  ControlsComponent,
  VideoComponent,
  SearchComponent,
  LibraryComponent,
  HistoryComponent
];

@NgModule({
  imports: [SharedModule],
  declarations: COMPONENTS,
  exports: COMPONENTS,
  entryComponents: [FolderComponent, SettingsComponent]
})
export class ComponentsModule {}
