import {NgModule} from '@angular/core';
import {AboutComponent} from './nav/about.component';
import {ClientSettingsComponent} from './nav/settings/client-settings.component';
import {ConfirmDialogComponent} from './dialogs/confirm-dialog.component';
import {ControlsComponent} from './video/controls.component';
import {DescriptionListComponent} from './common/description.component';
import {DetailsComponent} from './details.component';
import {EpisodeComponent} from './shows/episode.component';
import {ErrorDialogComponent} from './dialogs/error-dialog.component';
import {FileListComponent} from './nav/library/file-list.component';
import {FileSelectionComponent} from './dialogs/file-selection.component';
import {HistoryComponent} from './nav/history.component';
import {HomeComponent} from './home.component';
import {ItemDirective, MoviesComponent} from './movies/movies.component';
import {LibraryComponent} from './nav/library/library.component';
import {LibraryCreationDialogComponent} from './dialogs/library-creation-dialog/library-creation-dialog.component';
import {LibraryListComponent} from './nav/library/library-list.component';
import {LoadingBarComponent} from './common/loading-bar.component';
import {LogoComponent} from './logo.component';
import {MainComponent} from './main.component';
import {MovieComponent} from './movies/movie.component';
import {MovieFiltersComponent} from './dialogs/movie-filters.component';
import {MoviesFiltersComponent} from './movies/movies-filters.component';
import {NavRouterComponent} from './nav/nav-router.component';
import {OverviewComponent} from './common/overview.component';
import {SearchComponent} from './nav/search.component';
import {SeasonComponent} from './shows/season.component';
import {ServerSettingsComponent} from './nav/settings/server-settings.component';
import {SettingsComponent} from './nav/settings/settings.component';
import {SharedModule} from '../shared/shared.module';
import {ShowComponent} from './shows/show.component';
import {ShowFiltersComponent} from './dialogs/show-filters.component';
import {ShowInfoComponent} from './shows/show-info.component';
import {ShowsComponent} from './shows/shows.component';
import {ShowsFiltersComponent} from './shows/shows-filters.component';
import {SidenavComponent} from './sidenav.component';
import {TabsComponent} from './common/tabs.component';
import {VideoComponent} from './video/video.component';
import {VideoListComponent} from './common/video-list.component';

const COMPONENTS = [
  AboutComponent,
  ClientSettingsComponent,
  ConfirmDialogComponent,
  ControlsComponent,
  DescriptionListComponent,
  DetailsComponent,
  EpisodeComponent,
  ErrorDialogComponent,
  FileListComponent,
  FileSelectionComponent,
  HistoryComponent,
  HomeComponent,
  ItemDirective,
  LibraryComponent,
  LibraryCreationDialogComponent,
  LibraryListComponent,
  LoadingBarComponent,
  LogoComponent,
  MainComponent,
  MovieComponent,
  MovieFiltersComponent,
  MoviesComponent,
  MoviesFiltersComponent,
  NavRouterComponent,
  OverviewComponent,
  SearchComponent,
  SeasonComponent,
  ServerSettingsComponent,
  SettingsComponent,
  ShowComponent,
  ShowFiltersComponent,
  ShowInfoComponent,
  ShowsComponent,
  ShowsFiltersComponent,
  SidenavComponent,
  TabsComponent,
  VideoComponent,
  VideoListComponent,
];

@NgModule({
  imports: [SharedModule],
  declarations: COMPONENTS,
  exports: COMPONENTS,
  entryComponents: [
    ConfirmDialogComponent,
    ErrorDialogComponent,
    FileListComponent,
    FileSelectionComponent,
    LibraryCreationDialogComponent,
    LibraryListComponent,
    MovieFiltersComponent,
    ShowFiltersComponent,
  ]
})
export class ComponentsModule {}
