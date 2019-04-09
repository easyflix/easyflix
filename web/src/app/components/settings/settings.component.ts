import {ChangeDetectionStrategy, Component, OnInit, ViewChild} from '@angular/core';
import {MatButton} from '@angular/material';
import {CoreService} from '@app/services/core.service';
import {Observable} from 'rxjs';
import {SidenavModeType, SidenavSizeType} from '@app/reducers/core.reducer';
import {FilesService} from '@app/services/files.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent  implements OnInit {

  @ViewChild('closeButton')
  closeButton: MatButton;

  sidenavMode$: Observable<SidenavModeType>;
  sidenavSize$: Observable<SidenavSizeType>;

  librariesError$: Observable<string>;

  constructor(private core: CoreService, private files: FilesService) {
    this.sidenavMode$ = core.getSidenavMode();
    this.sidenavSize$ = core.getSidenavSize();
    this.librariesError$ = files.getLibrariesError();
  }

  ngOnInit() { }

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

  addLibrary(name: string, path: string) {
    const normalizedName = name.replace(/:/g, '');
    this.files.addLibrary({ type: 'library', name: normalizedName, path });
  }

  removeLibrary(name: string) {
    this.files.removeLibrary(name);
  }

}
