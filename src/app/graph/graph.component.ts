import { Component, ElementRef, inject } from '@angular/core';

import { initializeGraph } from './graph.js';
import { signalBroker } from '../lib/MessageBroker.js';
import * as lib from '../lib/signals.js';
import { EventBrokerService } from '../event-broker.service.js';

@Component({
  selector: 'graph',
  standalone: true,
  imports: [],
  template: `
    <div id="graph"></div>
  `,
  styles: ``
})
export class GraphComponent {
  #elementRef = inject(ElementRef)

  #signalBroker = signalBroker
  // TODO: (?)
  // #signalBroker = inject(MessageBroker)

  #eventBroker = inject(EventBrokerService)

  ngOnInit(){
    var nextEffectId = 0;

    this.#signalBroker.subscribe('new-effect', ({ target, getValue }) => {
      lib.effect(() => console.log(getValue()), `effect-${target}-${nextEffectId++}`);
    });

    this.#signalBroker.subscribe('destroy-effect', ({ target, destroy }) => {
      destroy();
    });

    this.#eventBroker.events$.subscribe(event => {
      if (event.type == 'EXECUTE') {
        this.runGraph(event.code);
      }
    });
  }

  runGraph(code: string) {
    // clear old
    this.#elementRef.nativeElement.querySelector("#graph").innerHTML = '';
    // execute new
    initializeGraph(this.#signalBroker);

    try {
      var fn = new Function('{signal, computed, effect, untracked}', code);
      fn(lib);
      // this is what is used underneath:
      // fn({ signal: lib.signal, computed: lib.computed, effect: lib.effect, untracked: lib.untracked });
    } catch (e) {
      alert(e);
    }
  }
}
