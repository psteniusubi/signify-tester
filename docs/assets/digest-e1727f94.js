import{b as U,B as j}from"./core-5143e3c4.js";let A;const b=()=>{if(!A)throw new Error("BLAKE3 webassembly not loaded. Please import the module via `blake3/browser` or `blake3/browser-async`");return A},H=t=>{A=t};let a,C=new TextDecoder("utf-8",{ignoreBOM:!0,fatal:!0});C.decode();let p=null;function d(){return(p===null||p.buffer!==a.memory.buffer)&&(p=new Uint8Array(a.memory.buffer)),p}function O(t,e){return C.decode(d().subarray(t,t+e))}let c=0;function l(t,e){const r=e(t.length*1);return d().set(t,r/1),c=t.length,r}function $(t,e){try{var r=l(t,a.__wbindgen_malloc),n=c,s=l(e,a.__wbindgen_malloc),i=c;a.hash(r,n,s,i)}finally{e.set(d().subarray(s/1,s/1+i)),a.__wbindgen_free(s,i*1)}}function M(){var t=a.create_hasher();return f.__wrap(t)}function L(t){var e=l(t,a.__wbindgen_malloc),r=c,n=a.create_keyed(e,r);return f.__wrap(n)}let g=new TextEncoder("utf-8");const K=typeof g.encodeInto=="function"?function(t,e){return g.encodeInto(t,e)}:function(t,e){const r=g.encode(t);return e.set(r),{read:t.length,written:r.length}};function P(t,e,r){if(r===void 0){const h=g.encode(t),_=e(h.length);return d().subarray(_,_+h.length).set(h),c=h.length,_}let n=t.length,s=e(n);const i=d();let o=0;for(;o<n;o++){const h=t.charCodeAt(o);if(h>127)break;i[s+o]=h}if(o!==n){o!==0&&(t=t.slice(o)),s=r(s,n,n=o+t.length*3);const h=d().subarray(s+o,s+n),_=K(t,h);o+=_.written}return c=o,s}function q(t){var e=P(t,a.__wbindgen_malloc,a.__wbindgen_realloc),r=c,n=a.create_derive(e,r);return f.__wrap(n)}const E=new Uint32Array(2),z=new BigUint64Array(E.buffer);class f{static __wrap(e){const r=Object.create(f.prototype);return r.ptr=e,r}free(){const e=this.ptr;this.ptr=0,a.__wbg_blake3hash_free(e)}reader(){var e=a.blake3hash_reader(this.ptr);return y.__wrap(e)}update(e){var r=l(e,a.__wbindgen_malloc),n=c;a.blake3hash_update(this.ptr,r,n)}digest(e){try{var r=l(e,a.__wbindgen_malloc),n=c;a.blake3hash_digest(this.ptr,r,n)}finally{e.set(d().subarray(r/1,r/1+n)),a.__wbindgen_free(r,n*1)}}}class y{static __wrap(e){const r=Object.create(y.prototype);return r.ptr=e,r}free(){const e=this.ptr;this.ptr=0,a.__wbg_hashreader_free(e)}fill(e){try{var r=l(e,a.__wbindgen_malloc),n=c;a.hashreader_fill(this.ptr,r,n)}finally{e.set(d().subarray(r/1,r/1+n)),a.__wbindgen_free(r,n*1)}}set_position(e){z[0]=e;const r=E[0],n=E[1];a.hashreader_set_position(this.ptr,r,n)}}async function D(t,e){if(typeof Response=="function"&&t instanceof Response){if(typeof WebAssembly.instantiateStreaming=="function")try{return await WebAssembly.instantiateStreaming(t,e)}catch(n){if(t.headers.get("Content-Type")!="application/wasm")console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n",n);else throw n}const r=await t.arrayBuffer();return await WebAssembly.instantiate(r,e)}else{const r=await WebAssembly.instantiate(t,e);return r instanceof WebAssembly.Instance?{instance:r,module:t}:r}}async function x(t){typeof t>"u"&&(t=import.meta.url.replace(/\.js$/,"_bg.wasm"));const e={};e.wbg={},e.wbg.__wbindgen_throw=function(s,i){throw new Error(O(s,i))},(typeof t=="string"||typeof Request=="function"&&t instanceof Request||typeof URL=="function"&&t instanceof URL)&&(t=fetch(t));const{instance:r,module:n}=await D(await t,e);return a=r.exports,x.__wbindgen_wasm_module=n,a}const F=Object.freeze(Object.defineProperty({__proto__:null,Blake3Hash:f,HashReader:y,create_derive:q,create_hasher:M,create_keyed:L,default:x,hash:$},Symbol.toStringTag,{value:"Module"})),u=32,S=t=>t instanceof Uint8Array?t:new Uint8Array(t),G=new TextDecoder,N={base64:t=>btoa(String.fromCharCode(...t)),hex:t=>{let e="";for(const r of t)r<16&&(e+="0"),e+=r.toString(16);return e},utf8:t=>G.decode(t)},T=t=>{const e=N[t];if(!e)throw new Error(`Unknown encoding ${t}`);return e};class w extends Uint8Array{equals(e){if(!(e instanceof Uint8Array)||e.length!==this.length)return!1;let r=0;for(let n=0;n<this.length;n++)r|=this[n]^e[n];return r===0}toString(e="hex"){return T(e)(this)}}const V=new TextEncoder,m=t=>S(typeof t=="string"?V.encode(t):t);function J(t,{length:e=u}={}){const r=new w(e);return b().hash(m(t),r),r}function Q(t,e,{length:r=u}={}){const n=b().create_derive(t);n.update(m(e));const s=new w(r);return n.digest(s),s}function X(t,e,{length:r=u}={}){if(t.length!==32)throw new Error(`key provided to keyedHash must be 32 bytes, got ${t.length}`);const n=b().create_keyed(t);n.update(m(e));const s=new w(r);return n.digest(s),s}const k=BigInt("18446744073709551615");class R{constructor(e){this.pos=BigInt(0),this.reader=e}get position(){return this.pos}set position(e){var r;if(typeof e!="bigint")throw new Error(`Got a ${typeof e} set in to reader.position, expected a bigint`);this.boundsCheck(e),this.pos=e,(r=this.reader)===null||r===void 0||r.set_position(e)}readInto(e){if(!this.reader)throw new Error("Cannot read from a hash after it was disposed");const r=this.pos+BigInt(e.length);this.boundsCheck(r),this.reader.fill(e),this.position=r}read(e){const r=this.alloc(e);return this.readInto(r),r}dispose(){var e,r;(r=(e=this.reader)===null||e===void 0?void 0:e.free)===null||r===void 0||r.call(e),this.reader=void 0}boundsCheck(e){if(e>k)throw new RangeError(`Cannot read past ${k} bytes in BLAKE3 hashes`);if(e<BigInt(0))throw new RangeError("Cannot read to a negative position")}}class W{constructor(e,r,n){this.alloc=r,this.getReader=n,this.hash=e}update(e){if(!this.hash)throw new Error("Cannot continue updating hashing after dispose() has been called");return this.hash.update(S(e)),this}digest({length:e=u,dispose:r=!0}={}){if(!this.hash)throw new Error("Cannot call digest() after dipose() has been called");const n=this.alloc(e);return this.hash.digest(n),r&&this.dispose(),n}reader({dispose:e=!0}={}){if(!this.hash)throw new Error("Cannot call reader() after dipose() has been called");const r=this.getReader(this.hash.reader());return e&&this.dispose(),r}dispose(){var e;(e=this.hash)===null||e===void 0||e.free(),this.hash=void 0}}const Y=t=>typeof t=="object"&&!!t&&"then"in t,Z=(t,e)=>{let r;try{r=e(t)}catch(n){throw t.dispose(),n}return Y(r)?r.then(n=>(t.dispose(),n),n=>{throw t.dispose(),n}):(t.dispose(),r)};class I extends R{toString(e="hex"){return this.toArray().toString(e)}toArray(){return this.position=BigInt(0),this.read(u)}alloc(e){return new w(e)}}class B extends W{update(e){return super.update(m(e))}digest(e,r){let n,s;e&&typeof e=="object"?(n=e,s=void 0):(n=r,s=e);const i=super.digest(n);return s?T(s)(i):i}}const ee=()=>new B(b().create_hasher(),t=>new w(t),t=>new I(t)),te=t=>new B(b().create_keyed(t),e=>new w(e),e=>new I(e)),re=Object.freeze(Object.defineProperty({__proto__:null,BaseHash:W,BaseHashReader:R,BrowserHasher:B,createHash:ee,createKeyed:te,defaultHashLength:u,deriveKey:Q,hash:J,inputToArray:S,keyedHash:X,maxHashBytes:k,using:Z},Symbol.toStringTag,{value:"Module"}));let v;function ne(t){return v||(v=x(t).then(()=>(H(F),re))),v}async function ae(t,e){const s=(await ne()).createHash().update(U(e)).digest("");t.appendChild(document.createTextNode(`digest ${j.encode(s)}\r
`))}export{ae as digest};