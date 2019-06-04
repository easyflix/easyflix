import {RouteReuseStrategy} from '@angular/router/';
import {ActivatedRouteSnapshot, DetachedRouteHandle} from '@angular/router';
import {Injectable} from '@angular/core';

// https://github.com/angular/angular/blob/master/packages/router/src/route_reuse_strategy.ts
export class DefaultRouteReuseStrategy implements RouteReuseStrategy {
  shouldDetach(route: ActivatedRouteSnapshot): boolean { return false; }
  store(route: ActivatedRouteSnapshot, detachedTree: DetachedRouteHandle): void {}
  shouldAttach(route: ActivatedRouteSnapshot): boolean { return false; }
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null { return null; }
  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }
}

// TODO check if this is still needed, review
@Injectable()
export class CustomRouteReuseStrategy extends DefaultRouteReuseStrategy {
  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    const reuse = (future.data && future.data.hasOwnProperty('reuse')) ? future.data.reuse : true;
    // Reuse route when navigating in same show/movie details component
    if (!reuse && curr.params.id && future.params.id && curr.params.id === future.params.id) {
      return true;
    }
    // Reuse route when navigating in same season component
    if (!reuse && curr.params.season && future.params.season && curr.params.season === future.params.season) {
      return true;
    }
    return super.shouldReuseRoute(future, curr) && reuse;
  }
}
