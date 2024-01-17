import { Component, EventEmitter, Output, ViewEncapsulation, inject } from '@angular/core';
// import * as monaco from 'monaco-editor'

import { getInitialCode } from './initial-code';
import { EventBrokerService } from '../event-broker.service';

function shouldUseDarkTheme() {
  const preferDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const darkReaderOn = document.children[0].getAttribute('data-darkreader-scheme') == 'dark';
  return preferDark || darkReaderOn;
}

@Component({
  selector: 'editor',
  styles: `
  .editor-container {
    height: 500px;
  }
  `,
  template: `
  <div class="editor-container">
    <ngx-monaco-editor
    style="height: 100%"
      [options]="editorOptions"
      [(ngModel)]="code"
      [ngModel]="code" (ngModelChange)="onCodeChange($event)"
      (onInit)="onInit($event)"
    ></ngx-monaco-editor>
  </div>
  `,
  encapsulation: ViewEncapsulation.None
})
export class EditorComponent {
  @Output()
  codeChange = new EventEmitter<string>();

  // @Output()
  // initialized = new EventEmitter<void>();

  #eventBroker = inject(EventBrokerService)

  editorOptions = {
    theme: shouldUseDarkTheme() ? 'vs-dark' : 'vs-light',
    language: 'javascript',
    automaticLayout: true,
    minimap: { enabled: false },
  };
  // editorOptions: monaco.editor.IEditorOptions = { showUnused: true, };
  code: string = getInitialCode()

  onCodeChange(value: string) {
    this.code = value;
    this.codeChange.emit(this.code);
  }

  onInit(editor: any) {
    this.codeChange.emit(this.code);
    this.#eventBroker.publish({ type: 'EXECUTE', code: this.code });
    // this.initialized.emit();
    // let line = editor.getPosition();
  }
}
