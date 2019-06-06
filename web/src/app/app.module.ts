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
import {RouteReuseStrategy, RouterModule} from '@angular/router';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {SharedModule} from './shared/shared.module';
import {ComponentsModule} from './components/components.module';
import {routes} from './routes';
import {CoreService} from './services/core.service';
import {FilesService} from './services/files.service';
import {LibrariesLoadedGuard} from '@app/guards/libraries-loaded.guard';
import {LibrariesService} from '@app/services/libraries.service';
import {SocketService} from '@app/services/socket.service';
import {MoviesService} from '@app/services/movies.service';
import {MovieFiltersService} from '@app/services/movie-filters.service';
import {ShowsService} from '@app/services/shows.service';
import {CustomRouteReuseStrategy} from '@app/route-reuse.strategy';
import {KeyboardService} from '@app/services/keyboard.service';
import {ShowFiltersService} from '@app/services/show-filters.service';
import {JwtInterceptor} from '@app/utils/jwt.interceptor';
import {ErrorInterceptor} from '@app/utils/error.interceptor';
import {RootComponent} from '@app/root.component';
import {LoginComponent} from '@app/login.component';
import {AuthenticationService} from '@app/services/authentication.service';
import {SocketInterceptor} from '@app/utils/socket.interceptor';

@NgModule({
  declarations: [
    RootComponent,
    AppComponent,
    LoginComponent
  ],
  imports: [
    // Angular
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot(routes/*, { enableTracing: true }*/),

    // Ngrx
    StoreModule.forRoot(reducers, { metaReducers }),
    !environment.production ? StoreDevtoolsModule.instrument() : [],
    EffectsModule.forRoot([AppEffects]),

    // Others
    SharedModule,
    ComponentsModule
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: CustomRouteReuseStrategy },
    CoreService,
    VideoService,
    FilesService,
    LibrariesService,
    MoviesService,
    ShowsService,
    LibrariesLoadedGuard,
    SocketService,
    AuthenticationService,
    MovieFiltersService,
    ShowFiltersService,
    KeyboardService,
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: SocketInterceptor, multi: true },
  ],
  bootstrap: [RootComponent]
})
export class AppModule { }
