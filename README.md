![Logo](https://raw.githubusercontent.com/easyflix/easyflix-assets/master/logo/easyflix_logo_tmdb.png)

# Easyflix

Easyflix is a self-hosted and reactive video-streaming server. Use it to stream your digitalized movies and TV shows (or any other videos) to your family and friends devices.

It is written in Typescript and Scala, and is licensed under the GNU Affero General Public License v3.

![License](https://img.shields.io/github/license/tgambet/easyflix.svg?color=green&style=flat-square)

## Features

* Local, FTP and Amazon S3 libraries support
* Auto-discovery of movies and TV shows
* Authentication
* Searching, sorting and filtering
* Keyboard navigable
* Shareable URLs
* Themes

## Presentation

### Library creation

![presentation-01](https://raw.githubusercontent.com/easyflix/easyflix-assets/master/gifs/presentation-01-library.gif)

### The player

![presentation-02](https://raw.githubusercontent.com/easyflix/easyflix-assets/master/gifs/presentation-02-player.gif)

### Sorting and filtering

![presentation-03](https://raw.githubusercontent.com/easyflix/easyflix-assets/master/gifs/presentation-03-filters.gif)

## Roadmap

* Internationalization of the user interface
* "Continue watching" functionality
* Support for subtitles

Feel free to make a suggestion by opening a ticket.

## FAQ

* Can Easyflix play any video?

Easyflix provides an HTML5 player which means that you can only play videos in a format supported by your browser. The formats that are supported by modern browsers change over time. You can get an idea of your browser support for videos by referring to [caniuse.com](https://caniuse.com/#search=video). The most commonly supported format at the time of writing is the [MPEG-4/H.264 video format](https://caniuse.com/#feat=mpeg4).

* Where does Easyflix find metadata for my movies and TV Shows?

Easyflix is powered by [The Movie Database](https://www.themoviedb.org/) and uses [its API](https://developers.themoviedb.org) to fetch presentation metadata for your videos. As such you will need [an account](https://www.themoviedb.org/account/signup) and a [valid API key](https://www.themoviedb.org/settings/api) from The Movie Database to run Easyflix.

## Install

TODO

## Build

TODO

## Contribute

You can find contributions ideas and guidelines by consulting [CONTRIBUTING](https://github.com/tgambet/easyflix/blob/master/CONTRIBUTING.md).

Note that a star is the easiest way to contribute to the project by increasing its visibility on Github!

## Privacy Policy

Easyflix does not collect any personal information. 

However Easyflix uses The Movie Database API to retrieve metadata about your movies and TV shows. Check their privacy policy [here](https://www.themoviedb.org/privacy-policy).

## License

Copyright © 2019 Thomas Gambet

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

For more information, please see [LICENSE](https://github.com/tgambet/easyflix/blob/master/LICENSE).
