import {ChangeDetectionStrategy, Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {LibraryFile} from '@app/models';

@Component({
  selector: 'app-file-selection',
  template: `
    <h3 mat-dialog-title>Select a file</h3>
    <div mat-dialog-content class="mat-typography">
      <mat-action-list>
        <button mat-list-item *ngFor="let file of data.files" (click)="select(file)" class="file">
          <span class="library">{{ file.libraryName }}</span>
          <span class="size">{{ file.size | sgFileSize }}</span>
          <span class="name">{{ file.name }}</span>
        </button>
      </mat-action-list>
    </div>
    <div mat-dialog-actions>
      <button mat-button [mat-dialog-close]="false">Cancel</button>
    </div>
  `,
  styles: [`
    mat-action-list {
      padding: 0;
    }
    .file {
    }
    .library {
      min-width: 100px;
      margin-right: 1rem;
    }
    .size {
      min-width: 75px;
      margin-right: 1rem;
    }
    .name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileSelectionComponent {

  constructor(
    private dialogRef: MatDialogRef<FileSelectionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { files: LibraryFile[] }
  ) {}

  select(file: LibraryFile) {
    this.dialogRef.close(file);
  }

}
