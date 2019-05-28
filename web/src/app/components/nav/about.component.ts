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
        <dd><a href="mailto:contact@creasource.net">contact@creasource.net</a></dd>
        <dt>Website</dt>
        <dd><a href="https://webflix.creasource.net" target="_blank">https://webflix.creasource.net</a></dd>
        <dt>Github</dt>
        <dd><a href="https://github.com/tgambet/webflix" target="_blank">https://github.com/tgambet/webflix</a></dd>
      </dl>
      <mat-divider></mat-divider>
      <h3>License</h3>
      <section class="license">
        <p>
          Copyright © 2019 Thomas Gambet
        </p>
        <p>
          Permission is hereby granted, free of charge, to any person obtaining a copy
          of this software and associated documentation files (the "Software"), to deal
          in the Software without restriction, including without limitation the rights
          to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
          copies of the Software, and to permit persons to whom the Software is
          furnished to do so, subject to the following conditions:
        </p>
        <p>
          The above copyright notice and this permission notice shall be included in all
          copies or substantial portions of the Software.
        </p>
        <p>
          THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
          IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
          FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
          AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
          LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
          OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
          SOFTWARE.
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
      font-weight: 500;
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
      font-weight: 500;
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
