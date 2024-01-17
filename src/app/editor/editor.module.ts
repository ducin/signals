import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { MonacoEditorModule, EditorComponent , DiffEditorComponent } from 'ngx-monaco-editor';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { FormsModule } from '@angular/forms';
import { EditorComponent } from './editor.component'

@NgModule({
  declarations: [
    EditorComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MonacoEditorModule.forRoot()
  ],
  exports: [
     EditorComponent
  //   EditorComponent, DiffEditorComponent
  ]
})
export class EditorModule { }
