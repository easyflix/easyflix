import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-episode',
  template: `
    <div class="still">
      <img src="https://image.tmdb.org/t/p/w300/lNXkxjiVwWKXalBcDCpntXBBfOh.jpg">
    </div>
    <div>
      <header class="tabs">
        <h3 class="tab" [class.selected]="true">Episode Info</h3>
        <h3 class="tab" [class.selected]="false">File Info</h3>
      </header>
      <dl>
        <dt>Number</dt>
        <dd>1</dd>
        <dt>Name</dt>
        <dd>eps1.0_hellofriend.mov</dd>
        <dt>Directed by</dt>
        <dd>David Nutter</dd>
        <dt>Written by</dt>
        <dd>Dave Hill</dd>
      </dl>
      <p class="overview">Elliot, a cyber-security engineer by day and vigilante hacker by night,
        is recruited by a mysterious underground group to destroy the firm he's paid to protect.
        Elliot must decide how far he'll go to expose the forces he believes are running (and ruining)
        the world.</p>
    </div>
  `,
  styles: [`
    :host {
      box-sizing: border-box;
      width: 100%;
      font-weight: 300;
      display: flex;
      align-items: center;
    }
    .still {
      margin-right: 2rem;
      font-size: 0;
    }
    dl {
      float: left;
      width: 350px;
    }
    .tabs {
      margin-top: 0;
      display: flex;
      flex-direction: row;
      margin-bottom: 15px;
      border-bottom: 1px solid;
    }
    .tab {
      font-weight: 400;
      font-size: 16px;
      width: 8.5rem;
      text-align: center;
      margin: 0 0 -1px 0;
      padding: .75rem 0;
      cursor: pointer;
    }
    .tab.selected {
      border-bottom: 2px solid;
    }
    dl {
      padding: 0 1rem 0 0;
      float: left;
      width: 350px;
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      font-weight: 300;
      margin: 0;
      line-height: 1.9;
    }
    dt {
      width: 9rem;
      padding-right: 1rem;
      box-sizing: border-box;
      font-weight: 400;
      margin: 0;
      text-align: right;
    }
    dd {
      width: calc(100% - 9rem);
      align-items: center;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .overview {
      margin: 0;
      font-weight: 300;
      line-height: 30px;
      max-height: 120px;
      overflow-y: auto;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EpisodeComponent implements OnInit {

  constructor() {}

  ngOnInit(): void {
  }

}
