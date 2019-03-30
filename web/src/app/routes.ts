import {Routes} from '@angular/router';
import {HomeComponent} from './components/home/home.component';
import {HistoryComponent} from './components/history/history.component';
import {LibraryComponent} from './components/library/library.component';
import {SettingsComponent} from './components/settings/settings.component';
import {SearchComponent} from './components/search/search.component';
import {AboutComponent} from './components/about/about.component';
import {VideoComponent} from './components/video/video.component';
import {VideoGuard} from './components/video/video.guard';
import {MoviesComponent} from './components/movies/movies.component';
import {ShowsComponent} from './components/shows/shows.component';

const navOutletName = 'nav';

export const routes: Routes = [
  { path: '', redirectTo: '/(nav:library)', pathMatch: 'full' },
  { path: '', component: HomeComponent, data: { animation: 'home' } },
  { path: 'movies', component: MoviesComponent, data: { animation: 'movies' } },
  { path: 'shows', component: ShowsComponent, data: { animation: 'shows' } },
  { path: 'history', component: HistoryComponent, data: { animation: 'history' } },
  { path: 'player', component: VideoComponent, canActivate: [VideoGuard], data: { animation: 'player' } },
  { path: 'library', component: LibraryComponent, outlet: navOutletName },
  { path: 'search', component: SearchComponent, outlet: navOutletName },
  { path: 'history', component: HistoryComponent, outlet: navOutletName },
  { path: 'settings', component: SettingsComponent, outlet: navOutletName },
  { path: 'about', component: AboutComponent, outlet: navOutletName },
];
