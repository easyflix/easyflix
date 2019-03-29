import { Component, OnInit } from '@angular/core';
import {FilesService} from '@app/services/files.service';
import {Observable} from 'rxjs';
import {Library} from '@app/models/library';

@Component({
  selector: 'app-libraries-view',
  templateUrl: './libraries-view.component.html',
  styleUrls: ['./libraries-view.component.css']
})
export class LibrariesViewComponent implements OnInit {

  libraries$: Observable<Library[]>;

  constructor(private filesService: FilesService) {
    this.libraries$ = this.filesService.getLibraries();
  }

  ngOnInit() {
  }

}
