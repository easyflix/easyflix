export class Theme {
  name?: string;
  cssClass: string;
  background: string;
  primary: string;
  accent: string;
}

export class ThemesUtils {

  static allThemes: Theme[] = [
    {name: 'Dark/Green', cssClass: 'dark-theme', background: '#303030', primary: '#8bc34a', accent: '#03a9f4'},
    {name: 'Blue/Orange', cssClass: 'blue-theme', background: '#37474f', primary: '#fb8c00', accent: '#03a9f4'},
    {name: 'Light/Blue', cssClass: 'light-theme', background: '#F5F5F5', primary: '#F5F5F5', accent: '#212121'},
    {name: 'Pink', cssClass: 'pink-theme', background: '#F8BBD0', primary: '#F8BBD0', accent: '#212121'}
  ];

}
