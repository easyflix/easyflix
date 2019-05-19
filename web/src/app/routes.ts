import {Routes} from '@angular/router';
import {HomeComponent} from './components/home/home.component';
import {HistoryComponent} from './components/history/history.component';
import {LibraryComponent} from './components/library/library.component';
import {SettingsComponent} from './components/settings/settings.component';
import {SearchComponent} from './components/search/search.component';
import {AboutComponent} from './components/about/about.component';
import {VideoComponent} from './components/video/video.component';
import {MoviesComponent} from './components/movies/movies.component';
import {ShowsComponent} from './components/shows/shows.component';
import {MoviesGridComponent} from './components/movies/movies-grid.component';
import {MoviesListComponent} from './components/movies/movies-list.component';
import {VideoResolverService} from '@app/guards/video-resolver.service';
import {LibrariesLoadedGuard} from '@app/guards/libraries-loaded.guard';
import {GlobalComponent} from '@app/components/settings/global/global.component';
import {LocalComponent} from '@app/components/settings/local/local.component';
import {MovieDetailsComponent} from '@app/components/movies/movie-details.component';
import {MovieResolverService} from '@app/guards/movie-resolver.service';
import {ShowsGridComponent} from '@app/components/shows/shows-grid.component';
import {ShowDetailsComponent} from '@app/components/shows/show-details.component';
import {ShowResolverService} from '@app/guards/show-resolver.service';
import {SeasonComponent} from '@app/components/shows/season.component';
import {ShowInfoComponent} from '@app/components/shows/show-info.component';
import {EpisodeComponent} from '@app/components/shows/episode.component';
import {SeasonResolverService} from '@app/guards/season-resolver.service';
import {EpisodeResolverService} from '@app/guards/episode-resolver.service';

const navOutletName = 'nav';

export const routes: Routes = [
  { path: '', redirectTo: '/home(nav:library)', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, data: { animation: 'home' } },
  {
    path: 'movies',
    component: MoviesComponent,
    data: { animation: 'movies' },
    children: [
      { path: '', component: MoviesGridComponent, data: { animation: 'grid' }, pathMatch: 'full' },
      { path: 'list', component: MoviesListComponent, data: { animation: 'list' } },
    ],
  },
  {
    path: 'shows',
    component: ShowsComponent,
    data: { animation: 'shows' },
    children: [
      { path: '', component: ShowsGridComponent, data: { animation: 'grid' }, pathMatch: 'full' },
      // { path: 'list', component: MoviesListComponent, data: { animation: 'list' } },
    ],
  },
  {
    path: ':id',
    component: ShowDetailsComponent,
    data: { animation: 'details', reuse: false },
    outlet: 'show',
    resolve: {
      show$: ShowResolverService
    },
    children: [
      { path: '', component: ShowInfoComponent, data: { animation: 'info' } },
      {
        path: 'season/:season',
        component: SeasonComponent,
        resolve: {
          season: SeasonResolverService
        },
        data: { reuse: false },
        children: [
          {
            path: '',
            component: EpisodeComponent,
            resolve: {
              episode: EpisodeResolverService
            }
          },
          {
            path: 'episode/:episode',
            component: EpisodeComponent,
            resolve: {
              episode: EpisodeResolverService
            },
            data: { reuse: false },
          },
        ]
      },
    ]
  },
  {
    path: ':id',
    component: MovieDetailsComponent,
    data: { animation: 'details' },
    outlet: 'movie',
    resolve: {
      movie$: MovieResolverService
    },
  },
  {
    path: ':id',
    component: VideoComponent,
    // canActivate: [LibrariesLoadedGuard],
    resolve: {
      video: VideoResolverService
    },
    outlet: 'player',
    data: { animation: 'player' }
  },
  {
    path: 'library',
    component: LibraryComponent,
    outlet: navOutletName,
    canActivate: [LibrariesLoadedGuard],
    data: { animation: 'library' }
  },
  { path: 'search', component: SearchComponent, outlet: navOutletName, data: { animation: 'search' } },
  { path: 'history', component: HistoryComponent, outlet: navOutletName, data: { animation: 'history' } },
  {
    path: 'settings',
    component: SettingsComponent,
    outlet: navOutletName,
    canActivate: [LibrariesLoadedGuard],
    data: { animation: 'settings' },
    children: [
      {
        path: '',
        component: LocalComponent
      },
      {
        path: 'server',
        component: GlobalComponent
      }
    ]
  },
  { path: 'about', component: AboutComponent, outlet: navOutletName, data: { animation: 'about' } },
];
