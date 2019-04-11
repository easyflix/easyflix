import {ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatButton} from '@angular/material';
import {CoreService} from '@app/services/core.service';
import {Observable, Subscription} from 'rxjs';
import {filter, map, tap} from 'rxjs/operators';
import {SidenavModeType, SidenavSizeType} from '@app/reducers/core.reducer';
import {FilesService} from '@app/services/files.service';
import {Library, MediaType} from '@app/models/file';
import {FormBuilder, Validators} from '@angular/forms';
import {MediaTypesService} from '@app/services/media-types.service';
import {LibrariesService} from '@app/services/libraries.service';
import {Theme, ThemesUtils} from '@app/utils/themes.utils';
import {DomSanitizer} from '@angular/platform-browser';

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
  sidenavSize$: Observable<SidenavSizeType>;

  libraries$: Observable<Library[]>;
  librariesError$: Observable<string>;
  librariesAdding$: Observable<boolean>;

  mediaTypes$: Observable<MediaType[]>;
  mediaTypesError$: Observable<string>;
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
    this.sidenavSize$ = core.getSidenavSize();
    this.libraries$ = libraries.getAll().pipe(
      map(libs => libs.sort((a, b) => a.path.localeCompare(b.path)))
    );
    this.librariesError$ = libraries.getError();
    this.librariesAdding$ = libraries.getAdding();

    this.mediaTypes$ = mediaTypes.getAll();
    this.mediaTypesError$ = mediaTypes.getError();
    this.mediaTypesAdding$ = mediaTypes.getAdding();

    this.theme$ = core.getTheme();
  }

  ngOnInit() {
    this.subscriptions.push(
      this.librariesAdding$.pipe(
        filter(b => !b),
        tap(() => {
          this.libraryForm.reset();
          this.libraryForm.controls.name.setErrors(null);
          this.libraryForm.controls.path.setErrors(null);
        })
      ).subscribe(),
      this.mediaTypesAdding$.pipe(
        filter(b => !b),
        tap(() => {
          this.mediaTypeForm.reset();
          this.mediaTypeForm.controls.contentType.setErrors(null);
          this.mediaTypeForm.controls.extensions.setErrors(null);
        })
      ).subscribe()
    );

  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  focus(): void {
    this.closeButton._elementRef.nativeElement.focus();
  }

  setSidenavMode(mode: SidenavModeType) {
    this.core.setSidenavMode(mode);
  }

  setSidenavSize(size: SidenavSizeType) {
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

  getLibraryNameErrorMessage(): string {
    const formControl = this.libraryForm.controls.name;
    if (formControl.hasError('required')) {
      return 'A value is required';
    } else if (formControl.hasError('pattern')) {
      return 'Invalid name (" : " is not allowed)';
    } else {
      return '';
    }
  }

  getContentTypeErrorMessage(): string {
    const formControl = this.mediaTypeForm.controls.contentType;
    if (formControl.hasError('required')) {
      return 'A value is required';
    } else if (formControl.hasError('pattern')) {
      return 'Content-Type must start with video/';
    } else {
      return '';
    }
  }

}
