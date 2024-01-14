import { initializeGraph } from './graph.js';
import { signalBroker, signal, computed, effect, untracked } from './signals.js';

import CodeFlask from 'codeflask';
import { sampleCode } from '../editor/initial-code.js';

// START

export function execute(){

var nextEffectId = 0;
signalBroker.subscribe('new-effect', ({ target, getValue }) => {
  effect(() => console.log(getValue()), `effect-${target}-${nextEffectId++}`);
});

signalBroker.subscribe('destroy-effect', ({ target, destroy }) => {
  destroy();
});

// TODO: comparators (setting the same value shall not trigger updates)
// TODO: updating reactivity graph
// TODO: when clicking INC-A, the effect is being run twice - and returns different results (!)

const flask = new CodeFlask('#codeArea', { language: 'js', lineNumbers: true });

function runSnippet() {
  const code = flask.getCode();
  try {
    var fn = new Function('{signal, computed, effect, untracked}', code);
    fn({ signal, computed, effect, untracked });
  } catch (e) {
    alert(e);
  }
}

function runGraph() {
  // clear old
  document.getElementById('graph').innerHTML = '';
  // execute new
  initializeGraph(signalBroker);
  runSnippet();
}

// initially run snippet
flask.updateCode(sampleCode);
runGraph();

document.getElementById('btn-execute').addEventListener('click', runGraph);

document.getElementById('inc-a').addEventListener('click', () => {
  signalBroker.publish('execute', {
    nodeId: 'a',
    executeFn: (a) => a.update((v) => v + 1),
  });
});

document.getElementById('log-links').addEventListener('click', () => {
  signalBroker.publish('debug', 'nodes');
  signalBroker.publish('debug', 'links');
});

}
