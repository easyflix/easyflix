import {Routes} from '@angular/router';
import {HomeComponent} from './components/home/home.component';
import {HistoryComponent} from './components/history/history.component';
import {LibraryComponent} from './components/library/library.component';
import {SettingsComponent} from './components/settings/settings.component';
import {SearchComponent} from './components/search/search.component';
import {AboutComponent} from './components/about/about.component';

const navOutletName = 'nav';

export const routes: Routes = [
  { path: '', redirectTo: '/home(nav:library)', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'history', component: HistoryComponent },
  { path: 'library', component: LibraryComponent, outlet: navOutletName },
  { path: 'search', component: SearchComponent, outlet: navOutletName },
  { path: 'history', component: HistoryComponent, outlet: navOutletName },
  { path: 'settings', component: SettingsComponent, outlet: navOutletName },
  { path: 'about', component: AboutComponent, outlet: navOutletName },
];
