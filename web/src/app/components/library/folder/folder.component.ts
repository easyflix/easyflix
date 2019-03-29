import {Component, EventEmitter, OnInit, ViewChild} from '@angular/core';
import {MatButton} from '@angular/material';
import {FilesService} from '../../../services/files.service';
import {Observable} from 'rxjs';
import {File} from '../../../models/file';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.component.html',
  styleUrls: ['./folder.component.sass']
})
export class FolderComponent implements OnInit {

  next: EventEmitter<void> = new EventEmitter();
  prev: EventEmitter<void> = new EventEmitter();

  files$: Observable<File[]>;

  @ViewChild('back')
  back: MatButton;

  constructor(private filesService: FilesService) { }

  ngOnInit() {
    this.files$ = this.filesService.getFiles();
  }

  focus() {
    this.back._elementRef.nativeElement.focus();
  }

}
