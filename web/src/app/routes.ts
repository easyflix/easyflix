import {Routes} from '@angular/router';
import {HomeComponent} from './components/home/home.component';
import {HistoryComponent} from './components/history/history.component';
import {LibraryComponent} from './components/library/library.component';
import {SettingsComponent} from './components/settings/settings.component';
import {SearchComponent} from './components/search/search.component';
import {AboutComponent} from './components/about/about.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home(sidenav:library)', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'history', component: HistoryComponent },
  {
    path: 'library',
    component: LibraryComponent,
    outlet: 'sidenav'
  },
  {
    path: 'search',
    component: SearchComponent,
    outlet: 'sidenav'
  },
  {
    path: 'history',
    component: HistoryComponent,
    outlet: 'sidenav'
  },
  {
    path: 'settings',
    component: SettingsComponent,
    outlet: 'sidenav'
  },
  {
    path: 'about',
    component: AboutComponent,
    outlet: 'sidenav'
  },
];
