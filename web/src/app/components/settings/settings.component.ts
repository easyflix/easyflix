import {ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatButton} from '@angular/material';
import {CoreService} from '@app/services/core.service';
import {Observable, Subscription} from 'rxjs';
import {filter, map, tap} from 'rxjs/operators';
import {SidenavModeType, SidenavWidthType} from '@app/reducers/core.reducer';
import {FilesService} from '@app/services/files.service';
import {Library, MediaType} from '@app/models/file';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MediaTypesService} from '@app/services/media-types.service';
import {LibrariesService} from '@app/services/libraries.service';
import {Theme, ThemesUtils} from '@app/utils/themes.utils';
import {DomSanitizer} from '@angular/platform-browser';
import {ValidationError} from '@app/models/validation-error';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit, OnDestroy {

  libraryForm = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(/^[^:]+$/)]],
    path: ['', Validators.required]
  });

  mediaTypeForm = this.fb.group({
    contentType: ['', [Validators.required, Validators.pattern(/^video\/.+$/)]],
    extensions: ['', Validators.required]
  });

  @ViewChild('closeButton')
  closeButton: MatButton;

  sidenavMode$: Observable<SidenavModeType>;
  sidenavWidth$: Observable<SidenavWidthType>;

  libraries$: Observable<Library[]>;
  librariesError$: Observable<ValidationError>;
  librariesAdding$: Observable<boolean>;

  mediaTypes$: Observable<MediaType[]>;
  mediaTypesError$: Observable<ValidationError>;
  mediaTypesAdding$: Observable<boolean>;

  subscriptions: Subscription[] = [];

  allThemes: Theme[] = ThemesUtils.allThemes;
  theme$: Observable<Theme>;

  constructor(
    private core: CoreService,
    private files: FilesService,
    private libraries: LibrariesService,
    private mediaTypes: MediaTypesService,
    private sanitizer: DomSanitizer,
    private fb: FormBuilder
  ) {
    this.sidenavMode$ = core.getSidenavMode();
    this.sidenavWidth$ = core.getSidenavWidth();
    this.libraries$ = libraries.getAll().pipe(
      map(libs => libs.sort((a, b) => a.path.localeCompare(b.path)))
    );
    this.librariesError$ = libraries.getValidationError();
    this.librariesAdding$ = libraries.getAdding();

    this.mediaTypes$ = mediaTypes.getAll();
    this.mediaTypesError$ = mediaTypes.getValidationError();
    this.mediaTypesAdding$ = mediaTypes.getAdding();

    this.theme$ = core.getTheme();
  }

  ngOnInit() {
    this.subscriptions.push(
      this.libraries$.pipe(
        tap(() => {
          this.libraryForm.reset();
          this.libraryForm.controls.name.setErrors(null);
          this.libraryForm.controls.path.setErrors(null);
        })
      ).subscribe(),
      this.mediaTypes$.pipe(
        tap(() => {
          this.mediaTypeForm.reset();
          this.mediaTypeForm.controls.contentType.setErrors(null);
          this.mediaTypeForm.controls.extensions.setErrors(null);
        })
      ).subscribe(),
      this.librariesError$.pipe(
        filter(error => error !== null),
        tap(error => this.setControlErrors(error, this.libraryForm))
      ).subscribe(),
      this.mediaTypesError$.pipe(
        filter(error => error !== null),
        tap(error => this.setControlErrors(error, this.mediaTypeForm))
      ).subscribe()
    );

  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  setControlErrors(error: ValidationError, form: FormGroup) {
    const formError = {};
    formError[error.code] = error.value || true;
    const control = form.controls[error.control];
    if (control) {
      control.setErrors(formError);
    } else {
      form.setErrors(formError);
    }
  }

  focus(): void {
    this.closeButton._elementRef.nativeElement.focus();
  }

  setSidenavMode(mode: SidenavModeType) {
    this.core.setSidenavMode(mode);
  }

  setSidenavSize(size: SidenavWidthType) {
    this.core.setSidenavSize(size);
    setTimeout(() => this.core.closeSidenav());
    setTimeout(() => this.core.openSidenav());
  }

  addLibrary() {
    const normalizedName = this.libraryForm.value.name.replace(/:/g, '');
    this.libraries.add({ type: 'library', name: normalizedName, path: this.libraryForm.value.path });
  }

  removeLibrary(name: string) {
    this.libraries.remove(name);
  }

  getExtensionsString(mediaType: MediaType): string {
    return mediaType.extensions.reduce((a, b) => `${a},${b}`);
  }

  addMediaType() {
    const extensions = this.mediaTypeForm.value.extensions
      .split(',')
      .map(e => e.trim())
      .filter(e => e !== '');

    const subType = this.mediaTypeForm.value.contentType
      .split('/')[1];

    this.mediaTypes.addMediaType({ subType, extensions });
  }

  removeMediaType(subType: string) {
    this.mediaTypes.removeMediaType(subType);
  }

  changeTheme(theme: Theme) {
    this.core.changeTheme(theme);
  }

  getThemeStyle(theme: Theme) {
    const style = `
      background-color: ${theme.background};
      color: ${theme.accent};
      border: 3px solid ${theme.primary}
    `;
    return this.sanitizer.bypassSecurityTrustStyle(style);
  }

  getErrorMessage(control: AbstractControl): string {
    if (control.hasError('required')) {
      return 'A value is required';
    }
    if (control.hasError('pattern') && control === this.libraryForm.controls.name) {
      return 'Invalid name (" : " is not allowed)';
    }
    if (control.hasError('pattern') && control === this.mediaTypeForm.controls.contentType) {
      return 'Content-Type must start with video/';
    }
    if (control.hasError('alreadyExists') && control === this.libraryForm.controls.name) {
      return 'A library with that name already exists';
    }
    if (control.hasError('alreadyExists') && control === this.libraryForm.controls.path) {
      return 'A library with that path already exists';
    }
    if (control.hasError('doesNotExist')) {
      return 'This path does not exist';
    }
    if (control.hasError('notDirectory')) {
      return 'This path is not a directory';
    }
    if (control.hasError('notReadable')) {
      return 'This path is not readable';
    }
    if (control.hasError('noChildren')) {
      return 'A library cannot contain another';
    }
    if (control.hasError('notAbsolute')) {
      return 'This path is not an absolute path';
    }
    console.warn('Unhandled error', control.errors);
    return '';
  }

}
