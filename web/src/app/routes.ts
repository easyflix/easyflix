import {Routes} from '@angular/router';
import {HomeComponent} from './components/home.component';
import {HistoryComponent} from './components/nav/history.component';
import {LibraryComponent} from './components/nav/library/library.component';
import {SettingsComponent} from './components/nav/settings/settings.component';
import {SearchComponent} from './components/nav/search.component';
import {AboutComponent} from './components/nav/about.component';
import {VideoComponent} from './components/video/video.component';
import {MoviesComponent} from './components/movies/movies.component';
import {ShowsComponent} from '@app/components/shows/shows.component';
import {DetailsComponent} from '@app/components/details.component';
import {ShowComponent} from '@app/components/shows/show.component';
import {MovieComponent} from '@app/components/movies/movie.component';
import {NavRouterComponent} from '@app/components/nav/nav-router.component';
import {AuthGuard} from '@app/guards/auth.guard';
import {AppComponent} from '@app/app.component';
import {LoginComponent} from '@app/login.component';

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
        data: { reuse: false, animation: 'movie' }
      }
    ],
  }
];

export const navRoutes = [
  {
    path: 'library',
    component: LibraryComponent,
    // canActivate: [LibrariesLoadedGuard],
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
    data: { animation: 'settings' },
  },
  {
    path: 'about',
    component: AboutComponent,
    data: { animation: 'about' }
  },
];

export const routes: Routes = [
  { path: '', redirectTo: '/app/(home//nav:library)', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'app', // Cannot be empty due to named outlets! https://github.com/angular/angular/issues/10726
    component: AppComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'home', component: HomeComponent, data: { animation: 'home' } },
      { path: 'movies', component: MoviesComponent, data: { animation: 'movies' } },
      { path: 'shows', component: ShowsComponent, data: { animation: 'shows' } },
      {
        path: '',
        outlet: 'nav',
        component: NavRouterComponent,
        children: navRoutes
      },
      {
        path: '',
        outlet: 'details', // TODO router component
        children: detailsRoutes
      },
      {
        path: ':id',
        outlet: 'player',
        component: VideoComponent,
        data: { animation: 'player' }
      }
    ]
  }
];
