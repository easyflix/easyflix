export class Theme {
  name?: string;
  cssClass: string;
  background: string;
  primary: string;
  accent: string;
}

export class ThemesUtils {

  static allThemes: Theme[] = [
    {name: 'Dark/Green', cssClass: 'dark-theme', background: '#212121', primary: 'green', accent: 'cyan'},
    {name: 'Blue/Orange', cssClass: 'blue-theme', background: '#263238', primary: '#263238', accent: '#212121'},
    {name: 'Light/Blue', cssClass: 'light-theme', background: '#F5F5F5', primary: '#F5F5F5', accent: '#212121'},
    {name: 'Pink', cssClass: 'pink-theme', background: '#F8BBD0', primary: '#F8BBD0', accent: '#212121'}
  ];

}
