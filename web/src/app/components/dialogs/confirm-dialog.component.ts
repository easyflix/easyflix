import {ChangeDetectionStrategy, Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

export interface ConfirmData {
  title: string;
  message: string;
}

@Component({
  selector: 'app-confirm',
  template: `
    <h3 mat-dialog-title>{{ data.title }}</h3>
    <div mat-dialog-content class="mat-typography">
      <p [innerHtml]="data.message"></p>
    </div>
    <div mat-dialog-actions>
      <button mat-button [mat-dialog-close]="false">Cancel</button>
      <button mat-button [mat-dialog-close]="true">Yes</button>
    </div>
  `,
  styles: [``],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmDialogComponent implements OnInit {

  constructor(
    private dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmData
  ) { }

  ngOnInit() {}

}
