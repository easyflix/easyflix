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
import {MainComponent} from './main.component';
import {VideoListComponent} from './common/video-list/video-list.component';
import {MoviesComponent} from './movies/movies.component';
import {GlobalComponent} from './settings/global/global.component';
import {LocalComponent} from '@app/components/settings/local/local.component';
import {LibraryCreationDialogComponent} from '@app/components/dialogs/library-creation-dialog/library-creation-dialog.component';
import {ConfirmDialogComponent} from '@app/components/dialogs/confirm-dialog.component';
import {MovieComponent} from '@app/components/movies/movie.component';
import {FiltersComponent} from '@app/components/filters.component';
import {ShowsComponent} from '@app/components/shows/shows.component';
import {ShowComponent} from '@app/components/shows/show.component';
import {SeasonComponent} from '@app/components/shows/season.component';
import {ShowInfoComponent} from '@app/components/shows/show-info.component';
import {EpisodeComponent} from '@app/components/shows/episode.component';
import {DetailsComponent} from '@app/components/details.component';

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
  MainComponent,
  VideoListComponent,
  MoviesComponent,
  GlobalComponent,
  LocalComponent,
  LibraryCreationDialogComponent,
  ConfirmDialogComponent,
  MovieComponent,
  FiltersComponent,
  ShowsComponent,
  ShowComponent,
  SeasonComponent,
  ShowInfoComponent,
  EpisodeComponent,
  DetailsComponent
];

@NgModule({
  imports: [SharedModule],
  declarations: COMPONENTS,
  exports: COMPONENTS,
  entryComponents: [
    LibraryListComponent,
    FileListComponent,
    LibraryCreationDialogComponent,
    ConfirmDialogComponent
  ]
})
export class ComponentsModule {}
