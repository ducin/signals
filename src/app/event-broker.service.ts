import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

type AppEvent =
  | { type: 'EXECUTE', code: string }

@Injectable({
  providedIn: 'root'
})
export class EventBrokerService {

  #eventSubject = new Subject<AppEvent>()

  events$ = this.#eventSubject.asObservable()

  publish(event: AppEvent) {
    this.#eventSubject.next(event)
  }
}
