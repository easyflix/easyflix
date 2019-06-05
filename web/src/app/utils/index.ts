import {environment} from '@env/environment';
import {LibraryFile} from '@app/models';

// TODO review
export function getAPIUrl(path: string) {
  let url = '';
  url += window.location.protocol + '//' + window.location.hostname;
  if (environment.production) {
    if (window.location.port) {
      url += ':' + window.location.port;
    }
  } else {
    url += ':' + environment.httpPort;
  }
  url += path;
  return url;
}

export function getSocketUrl() {
  let socketUrl = '';
  socketUrl += window.location.protocol === 'http:' ? 'ws://' : 'wss://';
  socketUrl += window.location.hostname;
  if (environment.production) {
    if (window.location.port) {
      socketUrl += ':' + window.location.port;
    }
  } else {
    socketUrl += ':' + environment.httpPort;
  }
  socketUrl += '/socket';
  return socketUrl;
}

export function getParentPath(file: LibraryFile) {
  const segments = file.path.split('/');
  return segments.slice(0, segments.length - 1).join('/');
}
