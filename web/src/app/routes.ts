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
import {VideoGridComponent} from './components/common/video-grid/video-grid.component';
import {VideoDetailedListComponent} from './components/common/video-detailed-list/video-detailed-list.component';
import {VideoResolverService} from '@app/guards/video-resolver.service';
import {LibrariesLoadedGuard} from '@app/guards/libraries-loaded.guard';
import {GlobalComponent} from '@app/components/settings/global/global.component';
import {LibrariesComponent} from '@app/components/settings/libraries/libraries.component';
import {LocalComponent} from '@app/components/settings/local/local.component';

const navOutletName = 'nav';

export const routes: Routes = [
  // { path: '', redirectTo: '/browse(nav:library)', pathMatch: 'full' },
  { path: '', component: HomeComponent, data: { animation: 'home' } },
  { path: 'home', component: HomeComponent, data: { animation: 'home' } },
  {
    path: 'movies',
    component: MoviesComponent,
    data: { animation: 'movies' },
    children: [
      { path: '', component: VideoGridComponent, data: { animation: 'grid' } },
      { path: 'list', component: VideoDetailedListComponent, data: { animation: 'list' } }
    ],
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
        path: 'global',
        component: GlobalComponent
      },
      {
        path: 'libraries',
        component: LibrariesComponent
      }
    ]
  },
  { path: 'about', component: AboutComponent, outlet: navOutletName, data: { animation: 'about' } },
];
