import { MessageBroker, signalBroker } from './MessageBroker';
import { getRandomName } from './randomNames';

// nodes and links are used for visual layer (d3)
// signals and effects objects maintain their own model with dependents
// both are kept in parallel:
// more work, ofc
// but model/view might change independently later on

// export const signalBroker = new MessageBroker();

var nodes = new Set();
signalBroker.subscribe('node-add', (node) => {
  nodes.add(node);
});

// PROVIDER -> CONSUMER[]
function Links() {
  // var allLinks = [];
  // return { source, target };
  var allLinks = new Map();
  return {
    add: ({ provider, consumer }) => {
      if (!allLinks.has(provider)) {
        // no provider yet
        allLinks.set(provider, new Set());
      }
      allLinks.get(provider).add(consumer);
    },
    dependentsOf: (node) => {
      return allLinks.get(node);
    },
    removeLeaf: (theConsumer, updateProvider) => {
      for (var [provider, consumers] of allLinks.entries()) {
        consumers.delete(theConsumer);
        updateProvider?.(provider);
      }
    },
    get() {
      return allLinks;
    },
  };
}
var links = Links();
signalBroker.subscribe('link-add', (link) => {
  links.add(link);
});
signalBroker.subscribe('debug', (what) => {
  switch (what) {
    case 'nodes':
      console.log({ nodes });
      break;
    case 'links':
      console.log(links.get());
      break;
  }
});
signalBroker.subscribe('execute', ({ nodeId, executeFn }) => {
  const theNode = [...nodes].find((node) => node.ID == nodeId);
  if (theNode.type != 'SIGNAL') {
    console.error("Can't execute anything on non-signal", theNode);
  }
  executeFn(theNode.signalHandle);
});

var path = [];
function __debugPath() {
  return path.map(({ id }) => id);
}
function visitNode(node) {
  if (inReactiveContext()) {
    signalBroker.publish('link-add', { provider: node, consumer: pathHead() });
  }
  path.push(node);
}
function leaveNode() {
  signalBroker.publish('node-data', { node: pathHead() });
  path.pop();
}
function pathHead() {
  const len = path.length;
  return path[len - 1];
}

function inReactiveContext() {
  return !currentlyUntracked && Boolean(pathHead());
}

var currentlyUntracked = false;

export function untracked(nonReactiveFn) {
  currentlyUntracked = true;
  var result = nonReactiveFn();
  currentlyUntracked = false;
  return result;
}

var isEqual = (a, b) => a == b;

// TODO: make sure whether it should remain like this (live vs dead consumers)
// depth-first traversal
function broadcastUpdate(node) {
  // effects are nodes with no dependents
  if (node.dependents) {
    for (var d of node.dependents.values()) {
      d.notify(); // don't pass value
      broadcastUpdate(d);
    }
  }
}

export function signal(initialValue, ID = getRandomName()) {
  var thisNode = {
    type: 'SIGNAL',
    ID,
    innerValue: initialValue,
    getValue: undefined,
    setValue: undefined,
    dependents: new Set(),
    signalHandle: undefined,
  };
  signalBroker.publish('node-add', thisNode);

  function getValue() {
    if (inReactiveContext()) {
      const downstream = pathHead();
      thisNode.dependents.add(downstream);
      downstream.dependencies.add(thisNode);
    }
    visitNode(thisNode);
    var result = thisNode.innerValue;
    leaveNode();
    return result;
  }
  thisNode.getValue = getValue;

  thisNode.setValue = (newValue) => {
    var currentValue = thisNode.innerValue;
    if (!isEqual(currentValue, newValue)) {
      thisNode.innerValue = newValue;
      broadcastUpdate(thisNode);
    }
  };

  var signalHandle = () => {
    return getValue();
  };
  signalHandle.set = thisNode.setValue;
  signalHandle.update = (updateFn) => {
    var newValue = updateFn(thisNode.innerValue);
    thisNode.setValue(newValue);
  };

  thisNode.signalHandle = signalHandle;

  return signalHandle;
}

export function computed(factoryFn, ID = getRandomName()) {
  var thisNode = {
    type: 'COMPUTED',
    label: ID,
    ID,
    innerValue: undefined,
    dirty: true,
    getValue: undefined,
    dependents: new Set(),
    dependencies: new Set(),
    notify: undefined,
  };
  signalBroker.publish('node-add', thisNode);

  function produceValue() {
    // TODO/CHECK: how to support isEqual?
    // how to block making dependents dirty if new value is the same?
    if (thisNode.dirty) {
      thisNode.innerValue = factoryFn();
      thisNode.dirty = false;
    }
    return thisNode.innerValue;
  }

  function getValue() {
    if (inReactiveContext()) {
      // const clonedDependents = [...thisNode.dependents];
      // thisNode.dependents.clear();
      // for (const dependent of clonedDependents) {
      //   dependent.dependencies.delete(thisNode);
      // }
      // wpada w infinite loop :/

      const downstream = pathHead();
      thisNode.dependents.add(downstream);
      downstream.dependencies.add(thisNode);
    }
    visitNode(thisNode);
    var result = produceValue();
    leaveNode();
    return result;
  }

  thisNode.getValue = getValue;

  function notify() {
    thisNode.dirty = true;
    signalBroker.publish('node-data', { node: thisNode });
  }

  thisNode.notify = notify;

  return () => {
    return getValue();
  };
}

export function effect(effectFn, ID = getRandomName()) {
  var thisNode = {
    type: 'EFFECT',
    ID,
    dependencies: new Set(),
    notify: undefined,
    effect: effectFn,
    destroy: undefined,
  };
  signalBroker.publish('node-add', thisNode);

  function runEffect() {
    visitNode(thisNode);
    thisNode.effect();
    leaveNode();
  }

  function notify() {
    // immediately re-run effect
    // TODO: update graph
    runEffect();
  }

  thisNode.notify = notify;

  function destroy() {
    // TODO: untested
    links.removeLeaf(thisNode, (provider) => {
      provider.dependents.delete(thisNode);
    });
  }
  thisNode.destroy = destroy;

  // run initially
  notify();

  return { destroy };
}
