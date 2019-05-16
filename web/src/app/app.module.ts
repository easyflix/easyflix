import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {StoreModule} from '@ngrx/store';
import {metaReducers, reducers} from './reducers';
import {StoreDevtoolsModule} from '@ngrx/store-devtools';
import {environment} from '@env/environment';
import {EffectsModule} from '@ngrx/effects';
import {AppEffects} from './app.effects';
import {VideoService} from './services/video.service';
import {RouterModule} from '@angular/router';
import {HttpClientModule} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {SharedModule} from './shared/shared.module';
import {ComponentsModule} from './components/components.module';
import {routes} from './routes';
import {CoreService} from './services/core.service';
import {FilesService} from './services/files.service';
import {VideoGuard} from './guards/video.guard';
import {VideoResolverService} from '@app/guards/video-resolver.service';
import {LibrariesLoadedGuard} from '@app/guards/libraries-loaded.guard';
import {LibrariesService} from '@app/services/libraries.service';
import {HttpSocketClientService} from '@app/services/http-socket-client.service';
import {MoviesService} from '@app/services/movies.service';
import {FilterService} from '@app/services/filter.service';
import {ShowsService} from '@app/services/shows.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    // Angular
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot(routes),

    // Ngrx
    StoreModule.forRoot(reducers, { metaReducers }),
    !environment.production ? StoreDevtoolsModule.instrument() : [],
    EffectsModule.forRoot([AppEffects]),

    // Others
    SharedModule,
    ComponentsModule
  ],
  providers: [
    CoreService,
    VideoService,
    FilesService,
    LibrariesService,
    MoviesService,
    ShowsService,
    VideoGuard,
    // FilesLoadedGuard,
    LibrariesLoadedGuard,
    VideoResolverService,
    HttpSocketClientService,
    FilterService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
