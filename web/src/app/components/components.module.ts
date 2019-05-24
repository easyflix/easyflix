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
import {LocalComponent} from './settings/local/local.component';
import {LibraryCreationDialogComponent} from './dialogs/library-creation-dialog/library-creation-dialog.component';
import {ConfirmDialogComponent} from './dialogs/confirm-dialog.component';
import {MovieComponent} from './movies/movie.component';
import {ShowsComponent} from './shows/shows.component';
import {ShowComponent} from './shows/show.component';
import {SeasonComponent} from './shows/season.component';
import {ShowInfoComponent} from './shows/show-info.component';
import {EpisodeComponent} from './shows/episode.component';
import {DetailsComponent} from './details.component';
import {LoadingBarComponent} from './common/loading-bar.component';
import {OverviewComponent} from './common/overview.component';
import {DescriptionListComponent} from './common/description.component';
import {TabsComponent} from './common/tabs.component';
import {MovieFiltersComponent} from './dialogs/movie-filters.component';
import {ShowFiltersComponent} from './dialogs/show-filters.component';
import {FileSelectionComponent} from './dialogs/file-selection.component';

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
  ShowsComponent,
  ShowComponent,
  SeasonComponent,
  ShowInfoComponent,
  EpisodeComponent,
  DetailsComponent,
  LoadingBarComponent,
  OverviewComponent,
  DescriptionListComponent,
  TabsComponent,
  MovieFiltersComponent,
  ShowFiltersComponent,
  FileSelectionComponent
];

@NgModule({
  imports: [SharedModule],
  declarations: COMPONENTS,
  exports: COMPONENTS,
  entryComponents: [
    LibraryListComponent,
    FileListComponent,
    LibraryCreationDialogComponent,
    ConfirmDialogComponent,
    MovieFiltersComponent,
    ShowFiltersComponent,
    FileSelectionComponent
  ]
})
export class ComponentsModule {}
