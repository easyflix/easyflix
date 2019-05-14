import {Actions, ofType} from '@ngrx/effects';
import {asapScheduler, defer, Observable, scheduled} from 'rxjs';
import {map, switchMap, take} from 'rxjs/operators';
import {Action, Store} from '@ngrx/store';
import {State} from '@app/reducers';

export abstract class ServiceHelper {

  protected constructor(protected store: Store<State>, private actions$: Actions) {}

  protected dispatchActionObservable<T>(action: Action, success: string, error: string): Observable<T> {
    return defer(() => scheduled([this.store.dispatch(action)], asapScheduler)).pipe(
      switchMap(() => this.actions$.pipe(
        ofType(success, error),
        take(1),
        map((result: any) => {
          if (result.type === success) {
            return result.payload as T;
          } else if (result.type === error) {
            throw result.payload;
          }
        })
      ))
    );
  }

}
