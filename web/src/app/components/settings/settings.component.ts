import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild} from '@angular/core';
import {MatButton} from '@angular/material';
import {CoreService} from '@app/services/core.service';
import {Observable} from 'rxjs';
import {map, mergeMap} from 'rxjs/operators';
import {SidenavModeType, SidenavWidthType} from '@app/reducers/core.reducer';
import {FilesService} from '@app/services/files.service';
import {Library, MediaType} from '@app/models';
import {AbstractControl, FormBuilder, FormGroup, FormGroupDirective, Validators} from '@angular/forms';
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
export class SettingsComponent implements OnInit {

  libraryForm = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(/^[^:]+$/)]],
    path: ['', Validators.required]
  });

  mediaTypeForm = this.fb.group({
    contentType: ['', [Validators.required, Validators.pattern(/^video\/.+$/)]],
    extensions: ['', Validators.required]
  });

  @ViewChild('closeButton') closeButton: MatButton;

  // Required because we have to call resetForm() (https://github.com/angular/material2/issues/4190)
  @ViewChild('libraryNgForm', { read: FormGroupDirective }) libraryNgForm;
  @ViewChild('mediaTypeNgForm', { read: FormGroupDirective }) mediaTypeNgForm;

  sidenavMode$: Observable<SidenavModeType>;
  sidenavWidth$: Observable<SidenavWidthType>;

  libraries$: Observable<Library[]>;
  addingLibrary = false;

  mediaTypes$: Observable<MediaType[]>;
  addingMediaType = false;

  allThemes: Theme[] = ThemesUtils.allThemes;
  theme$: Observable<Theme>;

  static setControlErrors(error: ValidationError, form: FormGroup) {
    const formError = {};
    formError[error.code] = error.value || true;
    const control = form.controls[error.control];
    if (control) {
      control.setErrors(formError);
    } else {
      form.setErrors(formError);
    }
  }

  constructor(
    private core: CoreService,
    private files: FilesService,
    private libraries: LibrariesService,
    private mediaTypes: MediaTypesService,
    private sanitizer: DomSanitizer,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.sidenavMode$ = core.getSidenavMode();
    this.sidenavWidth$ = core.getSidenavWidth();
    this.libraries$ = libraries.getAll().pipe(
      map(libs => libs.sort((a, b) => a.path.localeCompare(b.path)))
    );
    this.mediaTypes$ = mediaTypes.getAll();
    this.theme$ = core.getTheme();
  }

  ngOnInit() {}

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
    this.addingLibrary = true;
    this.libraries.add({ type: 'local', name: this.libraryForm.value.name, path: this.libraryForm.value.path }).pipe(
      mergeMap(library => this.libraries.scan(library.name))
    ).subscribe(
      files => {
        console.log('files scanned: ', files);
        this.libraryNgForm.resetForm();
      },
      (error: ValidationError) => {
        SettingsComponent.setControlErrors(error, this.libraryForm);
        this.addingLibrary = false;
        this.cdr.markForCheck();
      },
      () => {
        this.addingLibrary = false;
        this.cdr.markForCheck();
      }
    );
  }

  removeLibrary(name: string) {
    this.libraries.remove(name).subscribe(
      () => {},
      error => console.log(error) // TODO handle error
    );
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

    this.addingMediaType = true;
    this.mediaTypes.add({ subType, extensions }).subscribe(
      () => this.mediaTypeNgForm.resetForm(),
      (error: ValidationError) => {
        SettingsComponent.setControlErrors(error, this.mediaTypeForm);
        this.addingMediaType = false;
        this.cdr.markForCheck();
      },
      () => {
        this.addingMediaType = false;
        this.cdr.markForCheck();
      }
    );
  }

  removeMediaType(subType: string) {
    this.mediaTypes.remove(subType).subscribe(
      () => {},
      error => console.log(error) // TODO handle error
    );
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
    if (control.hasError('alreadyExists') && control === this.mediaTypeForm.controls.contentType) {
      return 'A rule with that Content-Type already exists';
    }
    if (control.hasError('alreadyExists') && control === this.mediaTypeForm.controls.extensions) {
      return 'One of these extensions already have a rule';
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
