import { Component, EventEmitter, Output, ViewEncapsulation } from '@angular/core';
import * as monaco from 'monaco-editor'

import { getInitialCode } from './initial-code';

@Component({
  selector: 'editor',
  styles: `
  .editor-container {
    height: 250% !important;
  }
  `,
  template: `
  <div class="editor-container">
    <ngx-monaco-editor
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

  @Output()
  initialized = new EventEmitter<void>();

  editorOptions = {
    theme: 'vs-dark',
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
    this.initialized.emit();
    let line = editor.getPosition();
  }
}
