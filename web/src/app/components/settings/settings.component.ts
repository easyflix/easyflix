import {ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatButton} from '@angular/material';
import {CoreService} from '@app/services/core.service';
import {Observable, Subscription} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {SidenavModeType, SidenavSizeType} from '@app/reducers/core.reducer';
import {FilesService} from '@app/services/files.service';
import {Library, MediaType} from '@app/models/file';
import {NgForm} from '@angular/forms';
import {MediaTypesService} from '@app/services/media-types.service';
import {LibrariesService} from '@app/services/libraries.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit, OnDestroy {

  libraryName = '';
  libraryPath = '';

  contentType = '';
  extensions = '';

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

  @ViewChild('libraryForm')
  libForm: NgForm;

  @ViewChild('mediaTypeForm')
  mediaTypeForm: NgForm;

  constructor(
    private core: CoreService,
    private files: FilesService,
    private libraries: LibrariesService,
    private mediaTypes: MediaTypesService
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
  }

  ngOnInit() {
    this.subscriptions.push(
      this.libraries.getAll().pipe(
        tap(() => this.libForm.resetForm())
      ).subscribe(),
      this.mediaTypes.getAll().pipe(
        tap(() => this.mediaTypeForm.resetForm())
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
    const normalizedName = this.libraryName.replace(/:/g, '');
    this.libraries.add({ type: 'library', name: normalizedName, path: this.libraryPath });
  }

  removeLibrary(name: string) {
    this.libraries.remove(name);
  }

  getExtensionsString(mediaType: MediaType): string {
    return mediaType.extensions.reduce((a, b) => `${a},${b}`);
  }

  addMediaType() {
    const extensions = this.extensions
      .split(',')
      .map(e => e.trim())
      .filter(e => e !== '');

    const subType = this.contentType
      .split('/')[1]; // TODO check is valid

    this.mediaTypes.addMediaType({ subType, extensions });
  }

  removeMediaType(subType: string) {
    this.mediaTypes.removeMediaType(subType);
  }

}
