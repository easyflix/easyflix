import {Routes} from '@angular/router';
import {HomeComponent} from './components/home/home.component';
import {HistoryComponent} from './components/history/history.component';
import {LibraryComponent} from './components/library/library.component';
import {SettingsComponent} from './components/settings/settings.component';
import {SearchComponent} from './components/search/search.component';
import {AboutComponent} from './components/about/about.component';
import {VideoComponent} from './components/video/video.component';
import {MoviesComponent} from './components/movies/movies.component';
import {VideoResolverService} from '@app/guards/video-resolver.service';
import {LibrariesLoadedGuard} from '@app/guards/libraries-loaded.guard';
import {GlobalComponent} from '@app/components/settings/global/global.component';
import {LocalComponent} from '@app/components/settings/local/local.component';
import {MovieResolverService} from '@app/guards/movie-resolver.service';
import {ShowsComponent} from '@app/components/shows/shows.component';
import {ShowResolverService} from '@app/guards/show-resolver.service';
import {DetailsComponent} from '@app/components/details.component';
import {ShowComponent} from '@app/components/shows/show.component';
import {MovieComponent} from '@app/components/movies/movie.component';

export const detailsRoutes = [
  {
    path: 'show',
    component: DetailsComponent,
    data: { type: 'show' },
    children: [
      {
        path: ':id',
        component: ShowComponent,
        data: { reuse: false, animation: 'show' },
        resolve: {
          show$: ShowResolverService
        }
      }
    ],
  },
  {
    path: 'movie',
    component: DetailsComponent,
    data: { type: 'movie' },
    children: [
      {
        path: ':id',
        component: MovieComponent,
        data: { reuse: false, animation: 'movie' },
        resolve: {
          movie$: MovieResolverService
        }
      }
    ],
  }
];

export const navRoutes = [
  {
    path: 'library',
    component: LibraryComponent,
    canActivate: [LibrariesLoadedGuard],
    data: { animation: 'library' }
  },
  {
    path: 'search',
    component: SearchComponent,
    data: { animation: 'search' }
  },
  {
    path: 'history',
    component: HistoryComponent,
    data: { animation: 'history' }
  },
  {
    path: 'settings',
    component: SettingsComponent,
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
  {
    path: 'about',
    component: AboutComponent,
    data: { animation: 'about' }
  },
];

export const routes: Routes = [
  { path: '', redirectTo: '/home(nav:library)', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, data: { animation: 'home' } },
  {
    path: 'movies',
    children: [
      { path: '', component: MoviesComponent, data: { animation: 'movies' } },
    ],
  },
  {
    path: 'shows',
    children: [
      { path: '', component: ShowsComponent, data: { animation: 'shows' } },
    ],
  },
  {
    path: '',
    outlet: 'nav',
    children: navRoutes
  },
  {
    path: '',
    outlet: 'details',
    children: detailsRoutes
  },
  {
    path: ':id',
    outlet: 'player',
    component: VideoComponent,
    // canActivate: [LibrariesLoadedGuard],
    resolve: {
      video: VideoResolverService
    },
    data: { animation: 'player' }
  },
];


