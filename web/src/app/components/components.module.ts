import {NgModule} from '@angular/core';
import {FileListComponent} from './nav/library/file-list.component';
import {SettingsComponent} from './nav/settings/settings.component';
import {ControlsComponent} from './video/controls/controls.component';
import {VideoComponent} from './video/video.component';
import {SearchComponent} from './nav/search/search.component';
import {LibraryComponent} from './nav/library/library.component';
import {HistoryComponent} from './nav/history/history.component';
import {SharedModule} from '../shared/shared.module';
import {HomeComponent} from './home.component';
import {AboutComponent} from './nav/about/about.component';
import {SidenavComponent} from './sidenav.component';
import {LibraryListComponent} from './nav/library/library-list.component';
import {MainComponent} from './main.component';
import {VideoListComponent} from './common/video-list.component';
import {ItemDirective, MoviesComponent} from './movies/movies.component';
import {ServerSettingsComponent} from './nav/settings/server-settings.component';
import {ClientSettingsComponent} from './nav/settings/client-settings.component';
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
import {NavRouterComponent} from './nav/nav-router.component';

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
  ServerSettingsComponent,
  ClientSettingsComponent,
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
  FileSelectionComponent,
  ItemDirective,
  NavRouterComponent
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
