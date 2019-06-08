import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-about',
  template: `
    <header>
      <h2>About</h2>
    </header>
    <mat-divider></mat-divider>
    <section class="about">
      <dl>
        <dt>Version</dt>
        <dd>1.0.0</dd>
        <dt>Author</dt>
        <dd>Thomas Gambet</dd>
        <dt>Contact</dt>
        <dd><a href="mailto:contact@easyflix.net">contact@easyflix.net</a></dd>
        <!--<dt>Website</dt>
        <dd><a href="https://easyflix.net" target="_blank">https://easyflix.net</a></dd>-->
        <dt>Github</dt>
        <dd><a href="https://github.com/tgambet/easyflix" target="_blank">https://github.com/tgambet/easyflix</a></dd>
      </dl>
      <mat-divider></mat-divider>
      <h3>License</h3>
      <section class="license">
        <p>
          Copyright © 2019 Thomas Gambet
        </p>
        <p>
          This program is free software: you can redistribute it and/or modify
          it under the terms of the GNU Affero General Public License as published
          by the Free Software Foundation, either version 3 of the License, or
          (at your option) any later version.
        </p>
        <p>
          This program is distributed in the hope that it will be useful,
          but WITHOUT ANY WARRANTY; without even the implied warranty of
          MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
          GNU Affero General Public License for more details.
        </p>
        <p>
          You should have received a copy of the GNU Affero General Public License
          along with this program.  If not, see <a href="https://www.gnu.org/licenses/">https://www.gnu.org/licenses/</a>.
        </p>
      </section>
    </section>
  `,
  styles: [`
    header {
      height: 59px;
      display: flex;
      align-items: center;
      padding: 0 1.25rem;
    }
    h2 {
      margin: 0;
      font-size: 18px;
    }
    h3 {
      font-size: 18px;
      margin: 1rem 0;
    }
    .about {
      padding: 1rem 1.25rem;
    }
    p {
      margin: 0 0 1rem 0;
    }
    dl {
      display: flex;
      flex-wrap: wrap;
      margin: 0;
    }
    dt {
      width: 80px;
      padding-right: 1rem;
      box-sizing: border-box;
      text-align: right;
      font-weight: 700;
    }
    dd {
      margin: 0 0 1rem 0;
      width: calc(100% - 80px);
    }
    .license {
      font-size: 14px;
      line-height: 1.5;
      font-weight: 300;
      text-align: justify;
    }
    a {
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
