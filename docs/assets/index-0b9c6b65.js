(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))c(t);new MutationObserver(t=>{for(const e of t)if(e.type==="childList")for(const o of e.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&c(o)}).observe(document,{childList:!0,subtree:!0});function s(t){const e={};return t.integrity&&(e.integrity=t.integrity),t.referrerpolicy&&(e.referrerPolicy=t.referrerpolicy),t.crossorigin==="use-credentials"?e.credentials="include":t.crossorigin==="anonymous"?e.credentials="omit":e.credentials="same-origin",e}function c(t){if(t.ep)return;t.ep=!0;const e=s(t);fetch(t.href,e)}})();const m="modulepreload",g=function(r){return"/signify-tester/"+r},a={},d=function(n,s,c){if(!s||s.length===0)return n();const t=document.getElementsByTagName("link");return Promise.all(s.map(e=>{if(e=g(e),e in a)return;a[e]=!0;const o=e.endsWith(".css"),f=o?'[rel="stylesheet"]':"";if(!!c)for(let l=t.length-1;l>=0;l--){const u=t[l];if(u.href===e&&(!o||u.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${e}"]${f}`))return;const i=document.createElement("link");if(i.rel=o?"stylesheet":m,o||(i.as="script",i.crossOrigin=""),i.href=e,document.head.appendChild(i),o)return new Promise((l,u)=>{i.addEventListener("load",l),i.addEventListener("error",()=>u(new Error(`Unable to preload CSS for ${e}`)))})})).then(()=>n())};document.getElementById("sign").addEventListener("click",async()=>{const r=document.getElementById("output");r.innerText="";const n=(await d(()=>import("./signer-11006d6f.js"),["assets/signer-11006d6f.js","assets/core-5143e3c4.js"])).signer;await n(r,document.getElementById("message").innerText)});document.getElementById("digest").addEventListener("click",async()=>{const r=document.getElementById("output");r.innerText="";const n=(await d(()=>import("./digest-e1727f94.js"),["assets/digest-e1727f94.js","assets/core-5143e3c4.js"])).digest;await n(r,document.getElementById("message").innerText)});
