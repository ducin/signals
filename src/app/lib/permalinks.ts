// https://developer.mozilla.org/en-US/docs/Glossary/Base64

function base64ToBytes(base64: string) {
  const binString = atob(base64);
  return Uint8Array.from(binString, (m) => m.codePointAt(0)!);
}

export function decode(base64: string){
  return new TextDecoder().decode(base64ToBytes(base64))
}

function bytesToBase64(bytes: Uint8Array) {
  const binString = String.fromCodePoint(...bytes);
  return btoa(binString);
}

export function encode(text: string){
  return bytesToBase64(new TextEncoder().encode(text));
}
