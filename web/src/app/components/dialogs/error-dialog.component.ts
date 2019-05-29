import {ChangeDetectionStrategy, Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

export interface ErrorData {
  title: string;
  message: string;
}

@Component({
  selector: 'app-error',
  template: `
    <h3 mat-dialog-title>{{ data.title }}</h3>
    <div mat-dialog-content class="mat-typography">
      <p [innerHtml]="data.message"></p>
    </div>
    <div mat-dialog-actions>
      <button mat-button [mat-dialog-close]="true">OK</button>
    </div>
  `,
  styles: [``],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorDialogComponent implements OnInit {

  constructor(
    private dialogRef: MatDialogRef<ErrorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ErrorData
  ) { }

  ngOnInit() {}

}
