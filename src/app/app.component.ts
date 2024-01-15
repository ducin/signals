import { Component, ElementRef, WritableSignal, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';

import { EditorModule } from './editor/editor.module';
import { GraphComponent } from './graph/graph.component.js';
import { signalBroker } from './lib/MessageBroker';
import * as lib from './lib/signals.js';

import { initializeGraph } from './lib/graph.js';
import { encode } from './lib/permalinks';
import { copyToClipboard } from './lib/copy-clipboard';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, EditorModule, GraphComponent],
  styles: `
    .editor, .graph {
      width: 50%;
      display: inline-block;
    }
    /*
    .container {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
    }
    */
  `,
  template: `
    <a [href]="baseLink"><h1 class="angular-gradient">Angular Signals Visualizer</h1></a>
    <button (click)="onIncAClick()">INC a</button>
    <button (click)="onExecuteClick()">execute</button>

    <div id="container">
      <span class="editor">
        <editor (codeChange)="code.set($event)" (initialized)="runGraph()"></editor>
      </span>
      <span id="graph"></span>
    </div>

    <graph></graph>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  baseLink = window.location.href.split("#")[0]

  code = signal('')

  #elementRef = inject(ElementRef)

  #signalBroker = signalBroker
  // TODO: (?)
  // #signalBroker = inject(MessageBroker)

  ngOnInit(){
    var nextEffectId = 0;

    this.#signalBroker.subscribe('new-effect', ({ target, getValue }) => {
      lib.effect(() => console.log(getValue()), `effect-${target}-${nextEffectId++}`);
    });

    this.#signalBroker.subscribe('destroy-effect', ({ target, destroy }) => {
      destroy();
    });
  }

  runGraph() {
    // clear old
    this.#elementRef.nativeElement.querySelector("#graph").innerHTML = '';
    // execute new
    initializeGraph(this.#signalBroker);
    
    try {
      var fn = new Function('{signal, computed, effect, untracked}', this.code());
      fn(lib);
      // this is what is used underneath:
      // fn({ signal: lib.signal, computed: lib.computed, effect: lib.effect, untracked: lib.untracked });
    } catch (e) {
      alert(e);
    }
  }

  onExecuteClick(){
    const encodedSignals = encode(this.code())
    parent.location.hash = `code/${encodedSignals}`
    copyToClipboard(parent.location.href)
    this.runGraph()
  }

  onIncAClick(){
    this.#signalBroker.publish('execute', {
      nodeId: 'a',
      executeFn: (a: WritableSignal<number>) => a.update((v) => v + 1),
    });
  }
}
