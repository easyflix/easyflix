import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {MatHorizontalStepper} from '@angular/material/stepper';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {LibrariesService} from '@app/services/libraries.service';
import {Library} from '@app/models';
import {ValidationError} from '@app/models/validation-error';
import {SocketService} from '@app/services/socket.service';
import {filter} from 'rxjs/internal/operators/filter';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-library-creation-dialog',
  templateUrl: './library-creation-dialog.component.html',
  styleUrls: ['./library-creation-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LibraryCreationDialogComponent implements OnInit {

  s3Regions = [
    { key: 'us-east-1', region: 'US East (N. Virginia)'},
    { key: 'us-east-2', region: 'US East (Ohio)'},
    { key: 'us-west-1', region: 'US West (N. California)'},
    { key: 'us-west-2', region: 'US West (Oregon)'},
    { key: 'eu-west-1', region: 'EU (Ireland)'},
    { key: 'eu-west-2', region: 'EU (London)'},
    { key: 'eu-west-3', region: 'EU (Paris)'},
    { key: 'eu-central-1', region: 'EU (Frankfurt)'},
    { key: 'eu-north-1', region: 'EU (Stockholm)'},
    { key: 'ap-south-1', region: 'Asia Pacific (Mumbai)'},
    { key: 'ap-southeast-1', region: 'Asia Pacific (Singapore)'},
    { key: 'ap-southeast-2', region: 'Asia Pacific (Sydney)'},
    { key: 'ap-northeast-1', region: 'Asia Pacific (Tokyo)'},
    { key: 'ap-northeast-2', region: 'Asia Pacific (Seoul)'},
    { key: 'sa-east-1', region: 'South America (Sao Paulo)'},
    { key: 'cn-north-1', region: 'China (Beijing)'},
    { key: 'cn-northwest-1', region: 'China (Ningxia)'},
    { key: 'ca-central-1', region: 'Canada (Central)'}
  ];

  @ViewChild(MatHorizontalStepper, { static: true }) stepper: MatHorizontalStepper;

  localFormGroup: FormGroup;
  ftpFormGroup: FormGroup;
  s3FormGroup: FormGroup;

  currentFormGroup: FormGroup;
  currentLibrary: Library;

  addingLibrary = false;
  scanning = false;
  scanningResult: number;
  scanningError: string;
  incomingFiles$: Observable<string>;

  static setControlErrors(error: ValidationError, form: FormGroup) {
    const formError = {};
    formError[error.code] = error.value || true;
    const control = form.controls[error.control];
    if (control) {
      control.setErrors(formError);
    } else {
      form.setErrors(formError);
    }
  }

  constructor(
    private dialogRef: MatDialogRef<LibraryCreationDialogComponent>,
    private fb: FormBuilder,
    private libraries: LibrariesService,
    private cdr: ChangeDetectorRef,
    private socket: SocketService
  ) { }

  ngOnInit() {
    this.localFormGroup = this.fb.group({
      name: ['', Validators.required],
      path: ['', Validators.required]
    });
    this.ftpFormGroup = this.fb.group({
      name: ['', Validators.required],
      path: [''],
      hostname: ['', Validators.required],
      port: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', Validators.required],
      passive: [true, Validators.required],
      conType: ['ftps', Validators.required]
    });
    this.s3FormGroup = this.fb.group({
      name: ['', Validators.required],
      path: [''],
      bucket: ['', Validators.required],
      accessId: ['', Validators.required],
      accessSecret: ['', Validators.required],
      region: ['', Validators.required]
    });
  }

  callNext() {
    setTimeout(() => this.stepper.next());
  }

  closeDialog() {
    this.dialogRef.close();
  }

  getErrorMessage(control: AbstractControl): string {
    if (control.hasError('required')) {
      return 'A value is required';
    }
    if (control.hasError('pattern') && control === this.localFormGroup.controls.name) {
      return 'Invalid name (avoid special characters)';
    }
    if (control.hasError('alreadyExists')) {
      return 'A library with that name already exists';
    }
    if (control.hasError('doesNotExist')) {
      return 'This path does not exist';
    }
    if (control.hasError('notDirectory')) {
      return 'This path is not a directory';
    }
    if (control.hasError('notReadable')) {
      return 'This path is not readable';
    }
    if (control.hasError('notAbsolute')) {
      return 'This path is not an absolute path';
    }
    if (control.hasError('invalid') && control === this.ftpFormGroup.controls.hostname) {
      return 'Hostname is invalid or could not be resolved';
    }
    console.warn('Unhandled error', control.errors);
    return '';
  }

  addLibrary() {
    if (!this.currentFormGroup.valid) {
      return;
    }

    this.addingLibrary = true;

    let library: Library;
    if (this.currentFormGroup === this.localFormGroup) {
      library = {
        type: 'local',
        name: this.localFormGroup.value.name,
        path: this.localFormGroup.value.path
      };
    } else if (this.currentFormGroup === this.ftpFormGroup) {
      library = {
        type: 'ftp',
        name: this.ftpFormGroup.value.name,
        path: this.ftpFormGroup.value.path.replace(/^\//, ''), // TODO check this server-side ?
        hostname: this.ftpFormGroup.value.hostname,
        port: this.ftpFormGroup.value.port,
        username: this.ftpFormGroup.value.username,
        password: this.ftpFormGroup.value.password,
        passive: this.ftpFormGroup.value.passive,
        conType: this.ftpFormGroup.value.conType
      };
    } else {
      library = {
        type: 's3',
        name: this.s3FormGroup.value.name,
        path: this.s3FormGroup.value.path,
        bucket: this.s3FormGroup.value.bucket,
        accessId: this.s3FormGroup.value.accessId,
        accessSecret: this.s3FormGroup.value.accessSecret,
        region: this.s3FormGroup.value.region
      };
    }

    this.libraries.add(library).subscribe(
      lib => {
        this.currentLibrary = lib;
        this.scanning = true;
        this.callNext();
        this.incomingFiles$ = this.socket.observe('FileAdded').pipe(
          filter(file => file.libraryName === lib.name),
          map(file => file.path)
        );
        this.libraries.scan(library).subscribe(
          files => this.scanningResult = files.filter(f => !f.isDirectory).length,
          error => {
            this.scanningError = error;
            console.log(error);
            this.scanning = false;
            this.cdr.markForCheck();
          },
          () => {
            this.scanning = false;
            this.cdr.markForCheck();
          }
        );
      },
      (error: ValidationError) => {
        LibraryCreationDialogComponent.setControlErrors(error, this.currentFormGroup);
        this.addingLibrary = false;
        this.cdr.markForCheck();
      },
      () => {
        this.addingLibrary = false;
        this.cdr.markForCheck();
      }
    );
  }

}
