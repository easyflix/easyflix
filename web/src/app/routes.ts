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

const navOutletName = 'nav';

export const detailsRoutes = [
  {
    path: 'show',
    children: [
      {
        path: ':id',
        component: DetailsComponent,
        data: { type: 'show' },
        resolve: {
          show$: ShowResolverService
        }
      }
    ],
  },
  {
    path: 'movie',
    children: [
      {
        path: ':id',
        component: DetailsComponent,
        data: { type: 'movie' },
        resolve: {
          movie$: MovieResolverService
        }
      }
    ],
  }
];

export const routes: Routes = [
  { path: '', redirectTo: '/home(nav:library)', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, data: { animation: 'home' } },
  {
    path: 'movies',
    data: { animation: 'movies' },
    children: [
      { path: '', component: MoviesComponent, data: { animation: 'grid' } },
    ],
  },
  {
    path: 'shows',
    data: { animation: 'shows' },
    children: [
      { path: '', component: ShowsComponent, data: { animation: 'grid' } },
    ],
  },
  {
    path: '',
    outlet: 'details',
    children: detailsRoutes
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


