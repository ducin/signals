import { decode } from "../lib/permalinks";

export const sampleCode = `// pass second name parameter:
var a = signal(4, 'a');
// or allow a random name:
var b = signal(100);

var c = computed(() => Math.sqrt(b()), 'c');
var nonReactiveComputed = computed(() => 125, 'NRC');
var pi = signal(Math.PI, 'PI');
var square = computed(() => a() * a(), 'sq');
var sum = computed(() => {
  var result = a();
  if (result > 10) {
    result += b();
  }
  result += square();
  return result;
}, 'sum');
var logEffect = effect(() => {
  console.log(\`(effect) sum: \${sum()}\`);
  console.log(\`(effect) untracked pi: \${untracked(pi)}\`);
}, 'log');`;

export const getInitialCode = () => {
  const hash = parent.location.hash
  if (hash.startsWith('#code/')) {
    return decode(hash.slice('#code/'.length))
  }
  return sampleCode
}