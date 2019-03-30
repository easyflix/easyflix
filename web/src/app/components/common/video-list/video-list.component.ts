import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild
} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {CoreService} from '@app/services/core.service';

@Component({
  selector: 'app-video-list',
  templateUrl: './video-list.component.html',
  styleUrls: ['./video-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoListComponent implements OnInit {

  @ViewChild('section')
  section: ElementRef;

  itemWidth = 180;
  translation = 0;

  /**
   * Even empty this listener will trigger change detection on resize
   */
  @HostListener('window:resize')
  resize() {}

  constructor(
    private core: CoreService,
    private root: ElementRef,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.core.getShowSidenav().subscribe(
      () => {
        setTimeout(() => this.cdr.detectChanges(), 400);
      }
    );
    /* try {
      // @ts-ignore
      new ResizeObserver((el) => {
        this.cdr.detectChanges();
      }).observe(this.root.nativeElement);
    } catch (e) {
      console.log(e);
    }*/
  }

  prev() {
    const a = this.root.nativeElement as HTMLElement;
    const t1 = Math.floor((this.translation + a.clientWidth) / this.itemWidth) * this.itemWidth;
    this.translation = Math.min(t1, 0);
  }

  next() {
    const a = this.root.nativeElement as HTMLElement;
    const b = this.section.nativeElement as HTMLElement;
    const d1 = a.clientWidth - b.clientWidth;
    const d2 = Math.floor(d1 / this.itemWidth) * this.itemWidth;
    const t1 = a.clientWidth - this.translation;
    const t2 = (t1 % this.itemWidth) - t1;
    this.translation = Math.max(t2, d2);
  }

  getTranslation() {
    return this.sanitizer.bypassSecurityTrustStyle(
      `transform: translate(${this.translation}px)`
    );
  }

  isDisabledNext() {
    const root = this.root.nativeElement as HTMLElement;
    const section = this.section.nativeElement as HTMLElement;
    return -this.translation + root.clientWidth >= section.clientWidth;
  }

}
