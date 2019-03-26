import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {StoreModule} from '@ngrx/store';
import {metaReducers, reducers} from './reducers';
import {StoreDevtoolsModule} from '@ngrx/store-devtools';
import {environment} from '../environments/environment';
import {EffectsModule} from '@ngrx/effects';
import {AppEffects} from './app.effects';
import {MaterialModule} from "./material.module";
import {DrawerComponent} from './drawer/drawer.component';
import {PanelDirective} from './panel.directive';
import {FolderComponent} from './folder/folder.component';
import {SettingsComponent} from './settings/settings.component';
import { ControlsComponent } from './controls/controls.component';
import { VideoComponent } from './video/video.component';

@NgModule({
  declarations: [
    AppComponent,
    DrawerComponent,
    PanelDirective,
    FolderComponent,
    SettingsComponent,
    ControlsComponent,
    VideoComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    StoreModule.forRoot(reducers, { metaReducers }),
    !environment.production ? StoreDevtoolsModule.instrument() : [],
    EffectsModule.forRoot([AppEffects]),
    MaterialModule
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [FolderComponent, SettingsComponent]
})
export class AppModule { }
