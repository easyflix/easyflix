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

const navOutletName = 'nav';

export const routes: Routes = [
  // { path: '', redirectTo: '/browse(nav:library)', pathMatch: 'full' },
  { path: '', component: HomeComponent, data: { animation: 'home' }, pathMatch: 'full' },
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
    path: ':id',
    component: MovieDetailsComponent,
    data: { animation: 'details' },
    outlet: 'movie',
    resolve: {
      movie: MovieResolverService
    },
  },
  { path: 'shows', component: ShowsComponent, data: { animation: 'shows' } },
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
