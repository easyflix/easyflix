import {AfterViewInit, Component, EventEmitter, OnInit, ViewChild} from '@angular/core';
import {MatButton} from '@angular/material';
import {Observable} from 'rxjs';

import {FilesService} from '@app/services/files.service';
import {File} from '@app/models/file';
import {Folder} from '@app/models/folder';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.component.html',
  styleUrls: ['./folder.component.sass']
})
export class FolderComponent implements OnInit {

  next: EventEmitter<Folder> = new EventEmitter();
  prev: EventEmitter<void> = new EventEmitter();

  files$: Observable<File[]>;
  current: Folder;

  @ViewChild('back')
  back: MatButton;

  constructor(private filesService: FilesService) {
  }

  ngOnInit() {
    this.files$ = this.filesService.getFiles(this.current);
    console.log(this.current);
  }

  focus() {
    this.back._elementRef.nativeElement.focus();
  }

}
