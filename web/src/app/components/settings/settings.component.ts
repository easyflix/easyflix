import {ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatButton} from '@angular/material';
import {CoreService} from '@app/services/core.service';
import {Observable, Subscription} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {SidenavModeType, SidenavSizeType} from '@app/reducers/core.reducer';
import {FilesService} from '@app/services/files.service';
import {Library} from '@app/models/file';
import {NgForm} from '@angular/forms';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit, OnDestroy {

  libraryName = '';
  libraryPath = '';

  @ViewChild('closeButton')
  closeButton: MatButton;

  sidenavMode$: Observable<SidenavModeType>;
  sidenavSize$: Observable<SidenavSizeType>;

  libraries$: Observable<Library[]>;
  librariesError$: Observable<string>;
  librariesAdding$: Observable<boolean>;

  subscriptions: Subscription[] = [];

  @ViewChild('libForm')
  form: NgForm;

  constructor(private core: CoreService, private files: FilesService) {
    this.sidenavMode$ = core.getSidenavMode();
    this.sidenavSize$ = core.getSidenavSize();
    this.libraries$ = files.getAllLibraries().pipe(
      map(libs => libs.sort((a, b) => a.path.localeCompare(b.path)))
    );
    this.librariesError$ = files.getLibrariesError();
    this.librariesAdding$ = files.getLibrariesAdding();
  }

  ngOnInit() {
    this.subscriptions.push(
      this.files.getAllLibraries().pipe(
        tap(() => {
          this.form.resetForm();
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
    const normalizedName = this.libraryName.replace(/:/g, '');
    this.files.addLibrary({ type: 'library', name: normalizedName, path: this.libraryPath });
  }

  removeLibrary(name: string) {
    this.files.removeLibrary(name);
  }

}
