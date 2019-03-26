import {Component, EventEmitter, OnInit, Output, ViewChild} from '@angular/core';
import {MatButton} from "@angular/material";

@Component({
  selector: 'app-folder',
  templateUrl: './folder.component.html',
  styleUrls: ['./folder.component.sass']
})
export class FolderComponent implements OnInit {

  @Output() next: EventEmitter<void> = new EventEmitter();
  @Output() prev: EventEmitter<void> = new EventEmitter();

  @ViewChild('back')
  back: MatButton;

  constructor() { }

  ngOnInit() { }

  focus() {
    this.back._elementRef.nativeElement.focus();
  }

}
