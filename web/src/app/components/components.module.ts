import {NgModule} from '@angular/core';
import {FileListComponent} from './library/file-list.component';
import {SettingsComponent} from './settings/settings.component';
import {ControlsComponent} from './video/controls/controls.component';
import {VideoComponent} from './video/video.component';
import {SearchComponent} from './search/search.component';
import {LibraryComponent} from './library/library.component';
import {HistoryComponent} from './history/history.component';
import {SharedModule} from '../shared/shared.module';
import {HomeComponent} from './home/home.component';
import {AboutComponent} from './about/about.component';
import {SidenavComponent} from './sidenav.component';
import {LibraryListComponent} from './library/library-list.component';
import {MoviesComponent} from './movies/movies.component';
import {ShowsComponent} from './shows/shows.component';
import {MainComponent} from './main.component';
import {VideoListComponent} from './common/video-list/video-list.component';
import {VideoGridComponent} from './common/video-grid/video-grid.component';

const COMPONENTS = [
  FileListComponent,
  SettingsComponent,
  ControlsComponent,
  VideoComponent,
  SearchComponent,
  AboutComponent,
  LibraryComponent,
  HistoryComponent,
  HomeComponent,
  SidenavComponent,
  LibraryListComponent,
  MoviesComponent,
  ShowsComponent,
  MainComponent,
  VideoListComponent,
  VideoGridComponent
];

@NgModule({
  imports: [SharedModule],
  declarations: COMPONENTS,
  exports: COMPONENTS,
  entryComponents: [
    LibraryListComponent,
    FileListComponent
  ]
})
export class ComponentsModule {}
