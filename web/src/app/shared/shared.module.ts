import {NgModule} from '@angular/core';
import {HttpClientModule} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule} from '@angular/router';

import {MaterialModule} from './material.module';
import {PipesModule} from './pipes.module';
import {DirectivesModule} from './directives.module';


export const SHARED_MODULES = [
  // Angular Modules
  BrowserModule,
  BrowserAnimationsModule,
  FormsModule,
  HttpClientModule,
  RouterModule,

  // My Modules
  MaterialModule,
  DirectivesModule,
  PipesModule
];

@NgModule({
  imports: SHARED_MODULES,
  exports: SHARED_MODULES
})
export class SharedModule { }
