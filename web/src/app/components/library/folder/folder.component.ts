import {Component, EventEmitter, OnInit, ViewChild} from '@angular/core';
import {MatButton} from '@angular/material';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {FilesService} from '@app/services/files.service';
import {File, Folder} from '@app/models/file';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.component.html',
  styleUrls: ['./folder.component.sass']
})
export class FolderComponent implements OnInit {

  next: EventEmitter<Folder> = new EventEmitter();
  prev: EventEmitter<void> = new EventEmitter();

  folders$: Observable<Folder[]>;
  files$: Observable<File[]>;
  current: Folder;

  @ViewChild('back')
  back: MatButton;

  constructor(private filesService: FilesService) {
  }

  ngOnInit() {
    this.files$ = this.filesService.getFiles(this.current).pipe(
      map(files => files.filter(f => f.type === 'file'))
    );
    this.folders$ = this.filesService.getFiles(this.current).pipe(
      map(files => files.filter(f => f.type === 'folder') as Folder[])
    );
  }

  focus() {
    this.back._elementRef.nativeElement.focus();
  }

}
