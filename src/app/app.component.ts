import { Component, ElementRef, WritableSignal, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';

import { EditorModule } from './editor/editor.module';
import { GraphComponent } from './graph/graph.component.js';
import { signalBroker } from './lib/MessageBroker';


import { encode } from './lib/permalinks';
import { copyToClipboard } from './lib/copy-clipboard';
import { EventBrokerService } from './event-broker.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, EditorModule, GraphComponent],
  styles: `
    .editor, .graph {
      height: 500px;
    }

    .container {
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      gap: 10px;
      align-items: stretch;
      height: 500px;
    }

    .item {
      flex-basis: 300px;
      flex-grow: 1;
    }
  `,
  template: `
    <a [href]="baseLink"><h1 class="angular-gradient">Angular Signals Visualizer</h1></a>
    <button (click)="onIncAClick()">INC a</button>
    <button (click)="onExecuteClick()">execute</button>

    <div class="container">
      <div class="editor item">
        <editor (codeChange)="code.set($event)"></editor>
      </div>
      <div class="item">
        <graph></graph>
      </div>
    </div>
    <!-- <router-outlet></router-outlet> -->
  `
})
export class AppComponent {
  baseLink = window.location.href.split("#")[0]

  code = signal('')

  #eventBroker = inject(EventBrokerService)

  onExecuteClick(){
    const encodedSignals = encode(this.code())
    parent.location.hash = `code/${encodedSignals}`
    copyToClipboard(parent.location.href)
    this.#eventBroker.publish({ type: 'EXECUTE', code: this.code() })
  }

  #signalBroker = signalBroker // TODO: remove from here

  onIncAClick(){
    this.#signalBroker.publish('execute', {
      nodeId: 'a',
      executeFn: (a: WritableSignal<number>) => a.update((v) => v + 1),
    });
  }
}
