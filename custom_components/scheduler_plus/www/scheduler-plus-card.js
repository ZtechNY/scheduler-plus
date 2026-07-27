var o2=Object.defineProperty;var a2=Object.getOwnPropertyDescriptor;var A=(M,H,C,V)=>{for(var L=V>1?void 0:V?a2(H,C):H,r=M.length-1,e;r>=0;r--)(e=M[r])&&(L=(V?e(H,C,L):e(L))||L);return V&&L&&o2(H,C,L),L};var T="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z";var H1="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z";var V1=globalThis,L1=V1.ShadowRoot&&(V1.ShadyCSS===void 0||V1.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s1=Symbol(),T1=new WeakMap,U=class{constructor(H,C,V){if(this._$cssResult$=!0,V!==s1)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=H,this.t=C}get styleSheet(){let H=this.o,C=this.t;if(L1&&H===void 0){let V=C!==void 0&&C.length===1;V&&(H=T1.get(C)),H===void 0&&((this.o=H=new CSSStyleSheet).replaceSync(this.cssText),V&&T1.set(C,H))}return H}toString(){return this.cssText}},P1=M=>new U(typeof M=="string"?M:M+"",void 0,s1),O=(M,...H)=>{let C=M.length===1?M[0]:H.reduce((V,L,r)=>V+(e=>{if(e._$cssResult$===!0)return e.cssText;if(typeof e=="number")return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(L)+M[r+1],M[0]);return new U(C,M,s1)},w1=(M,H)=>{if(L1)M.adoptedStyleSheets=H.map(C=>C instanceof CSSStyleSheet?C:C.styleSheet);else for(let C of H){let V=document.createElement("style"),L=V1.litNonce;L!==void 0&&V.setAttribute("nonce",L),V.textContent=C.cssText,M.appendChild(V)}},c1=L1?M=>M:M=>M instanceof CSSStyleSheet?(H=>{let C="";for(let V of H.cssRules)C+=V.cssText;return P1(C)})(M):M;var{is:d2,defineProperty:p2,getOwnPropertyDescriptor:m2,getOwnPropertyNames:v2,getOwnPropertySymbols:n2,getPrototypeOf:x2}=Object,M1=globalThis,F1=M1.trustedTypes,l2=F1?F1.emptyScript:"",Z2=M1.reactiveElementPolyfillSupport,Q=(M,H)=>M,G={toAttribute(M,H){switch(H){case Boolean:M=M?l2:null;break;case Object:case Array:M=M==null?M:JSON.stringify(M)}return M},fromAttribute(M,H){let C=M;switch(H){case Boolean:C=M!==null;break;case Number:C=M===null?null:Number(M);break;case Object:case Array:try{C=JSON.parse(M)}catch{C=null}}return C}},r1=(M,H)=>!d2(M,H),R1={attribute:!0,type:String,converter:G,reflect:!1,useDefault:!1,hasChanged:r1};Symbol.metadata??=Symbol("metadata"),M1.litPropertyMetadata??=new WeakMap;var g=class extends HTMLElement{static addInitializer(H){this._$Ei(),(this.l??=[]).push(H)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(H,C=R1){if(C.state&&(C.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(H)&&((C=Object.create(C)).wrapped=!0),this.elementProperties.set(H,C),!C.noAccessor){let V=Symbol(),L=this.getPropertyDescriptor(H,V,C);L!==void 0&&p2(this.prototype,H,L)}}static getPropertyDescriptor(H,C,V){let{get:L,set:r}=m2(this.prototype,H)??{get(){return this[C]},set(e){this[C]=e}};return{get:L,set(e){let i=L?.call(this);r?.call(this,e),this.requestUpdate(H,i,V)},configurable:!0,enumerable:!0}}static getPropertyOptions(H){return this.elementProperties.get(H)??R1}static _$Ei(){if(this.hasOwnProperty(Q("elementProperties")))return;let H=x2(this);H.finalize(),H.l!==void 0&&(this.l=[...H.l]),this.elementProperties=new Map(H.elementProperties)}static finalize(){if(this.hasOwnProperty(Q("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(Q("properties"))){let C=this.properties,V=[...v2(C),...n2(C)];for(let L of V)this.createProperty(L,C[L])}let H=this[Symbol.metadata];if(H!==null){let C=litPropertyMetadata.get(H);if(C!==void 0)for(let[V,L]of C)this.elementProperties.set(V,L)}this._$Eh=new Map;for(let[C,V]of this.elementProperties){let L=this._$Eu(C,V);L!==void 0&&this._$Eh.set(L,C)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(H){let C=[];if(Array.isArray(H)){let V=new Set(H.flat(1/0).reverse());for(let L of V)C.unshift(c1(L))}else H!==void 0&&C.push(c1(H));return C}static _$Eu(H,C){let V=C.attribute;return V===!1?void 0:typeof V=="string"?V:typeof H=="string"?H.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(H=>this.enableUpdating=H),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(H=>H(this))}addController(H){(this._$EO??=new Set).add(H),this.renderRoot!==void 0&&this.isConnected&&H.hostConnected?.()}removeController(H){this._$EO?.delete(H)}_$E_(){let H=new Map,C=this.constructor.elementProperties;for(let V of C.keys())this.hasOwnProperty(V)&&(H.set(V,this[V]),delete this[V]);H.size>0&&(this._$Ep=H)}createRenderRoot(){let H=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return w1(H,this.constructor.elementStyles),H}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(H=>H.hostConnected?.())}enableUpdating(H){}disconnectedCallback(){this._$EO?.forEach(H=>H.hostDisconnected?.())}attributeChangedCallback(H,C,V){this._$AK(H,V)}_$ET(H,C){let V=this.constructor.elementProperties.get(H),L=this.constructor._$Eu(H,V);if(L!==void 0&&V.reflect===!0){let r=(V.converter?.toAttribute!==void 0?V.converter:G).toAttribute(C,V.type);this._$Em=H,r==null?this.removeAttribute(L):this.setAttribute(L,r),this._$Em=null}}_$AK(H,C){let V=this.constructor,L=V._$Eh.get(H);if(L!==void 0&&this._$Em!==L){let r=V.getPropertyOptions(L),e=typeof r.converter=="function"?{fromAttribute:r.converter}:r.converter?.fromAttribute!==void 0?r.converter:G;this._$Em=L;let i=e.fromAttribute(C,r.type);this[L]=i??this._$Ej?.get(L)??i,this._$Em=null}}requestUpdate(H,C,V,L=!1,r){if(H!==void 0){let e=this.constructor;if(L===!1&&(r=this[H]),V??=e.getPropertyOptions(H),!((V.hasChanged??r1)(r,C)||V.useDefault&&V.reflect&&r===this._$Ej?.get(H)&&!this.hasAttribute(e._$Eu(H,V))))return;this.C(H,C,V)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(H,C,{useDefault:V,reflect:L,wrapped:r},e){V&&!(this._$Ej??=new Map).has(H)&&(this._$Ej.set(H,e??C??this[H]),r!==!0||e!==void 0)||(this._$AL.has(H)||(this.hasUpdated||V||(C=void 0),this._$AL.set(H,C)),L===!0&&this._$Em!==H&&(this._$Eq??=new Set).add(H))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(C){Promise.reject(C)}let H=this.scheduleUpdate();return H!=null&&await H,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[L,r]of this._$Ep)this[L]=r;this._$Ep=void 0}let V=this.constructor.elementProperties;if(V.size>0)for(let[L,r]of V){let{wrapped:e}=r,i=this[L];e!==!0||this._$AL.has(L)||i===void 0||this.C(L,void 0,r,i)}}let H=!1,C=this._$AL;try{H=this.shouldUpdate(C),H?(this.willUpdate(C),this._$EO?.forEach(V=>V.hostUpdate?.()),this.update(C)):this._$EM()}catch(V){throw H=!1,this._$EM(),V}H&&this._$AE(C)}willUpdate(H){}_$AE(H){this._$EO?.forEach(C=>C.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(H)),this.updated(H)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(H){return!0}update(H){this._$Eq&&=this._$Eq.forEach(C=>this._$ET(C,this[C])),this._$EM()}updated(H){}firstUpdated(H){}};g.elementStyles=[],g.shadowRootOptions={mode:"open"},g[Q("elementProperties")]=new Map,g[Q("finalized")]=new Map,Z2?.({ReactiveElement:g}),(M1.reactiveElementVersions??=[]).push("2.1.2");var O1=globalThis,D1=M=>M,e1=O1.trustedTypes,_1=e1?e1.createPolicy("lit-html",{createHTML:M=>M}):void 0,g1="$lit$",f=`lit$${Math.random().toFixed(9).slice(2)}$`,f1="?"+f,S2=`<${f1}>`,F=document,K=()=>F.createComment(""),q=M=>M===null||typeof M!="object"&&typeof M!="function",k1=Array.isArray,U1=M=>k1(M)||typeof M?.[Symbol.iterator]=="function",h1=`[ 	
\f\r]`,z=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,E1=/-->/g,$1=/>/g,P=RegExp(`>|${h1}(?:([^\\s"'>=/]+)(${h1}*=${h1}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),N1=/'/g,W1=/"/g,Q1=/^(?:script|style|textarea|title)$/i,y1=M=>(H,...C)=>({_$litType$:M,strings:H,values:C}),a=y1(1),E2=y1(2),$2=y1(3),k=Symbol.for("lit-noChange"),p=Symbol.for("lit-nothing"),I1=new WeakMap,w=F.createTreeWalker(F,129);function G1(M,H){if(!k1(M)||!M.hasOwnProperty("raw"))throw Error("invalid template strings array");return _1!==void 0?_1.createHTML(H):H}var z1=(M,H)=>{let C=M.length-1,V=[],L,r=H===2?"<svg>":H===3?"<math>":"",e=z;for(let i=0;i<C;i++){let t=M[i],n,l,o=-1,x=0;for(;x<t.length&&(e.lastIndex=x,l=e.exec(t),l!==null);)x=e.lastIndex,e===z?l[1]==="!--"?e=E1:l[1]!==void 0?e=$1:l[2]!==void 0?(Q1.test(l[2])&&(L=RegExp("</"+l[2],"g")),e=P):l[3]!==void 0&&(e=P):e===P?l[0]===">"?(e=L??z,o=-1):l[1]===void 0?o=-2:(o=e.lastIndex-l[2].length,n=l[1],e=l[3]===void 0?P:l[3]==='"'?W1:N1):e===W1||e===N1?e=P:e===E1||e===$1?e=z:(e=P,L=void 0);let v=e===P&&M[i+1].startsWith("/>")?" ":"";r+=e===z?t+S2:o>=0?(V.push(n),t.slice(0,o)+g1+t.slice(o)+f+v):t+f+(o===-2?i:v)}return[G1(M,r+(M[C]||"<?>")+(H===2?"</svg>":H===3?"</math>":"")),V]},j=class M{constructor({strings:H,_$litType$:C},V){let L;this.parts=[];let r=0,e=0,i=H.length-1,t=this.parts,[n,l]=z1(H,C);if(this.el=M.createElement(n,V),w.currentNode=this.el.content,C===2||C===3){let o=this.el.content.firstChild;o.replaceWith(...o.childNodes)}for(;(L=w.nextNode())!==null&&t.length<i;){if(L.nodeType===1){if(L.hasAttributes())for(let o of L.getAttributeNames())if(o.endsWith(g1)){let x=l[e++],v=L.getAttribute(o).split(f),Z=/([.?@])?(.*)/.exec(x);t.push({type:1,index:r,name:Z[2],strings:v,ctor:Z[1]==="."?i1:Z[1]==="?"?A1:Z[1]==="@"?o1:D}),L.removeAttribute(o)}else o.startsWith(f)&&(t.push({type:6,index:r}),L.removeAttribute(o));if(Q1.test(L.tagName)){let o=L.textContent.split(f),x=o.length-1;if(x>0){L.textContent=e1?e1.emptyScript:"";for(let v=0;v<x;v++)L.append(o[v],K()),w.nextNode(),t.push({type:2,index:++r});L.append(o[x],K())}}}else if(L.nodeType===8)if(L.data===f1)t.push({type:2,index:r});else{let o=-1;for(;(o=L.data.indexOf(f,o+1))!==-1;)t.push({type:7,index:r}),o+=f.length-1}r++}}static createElement(H,C){let V=F.createElement("template");return V.innerHTML=H,V}};function R(M,H,C=M,V){if(H===k)return H;let L=V!==void 0?C._$Co?.[V]:C._$Cl,r=q(H)?void 0:H._$litDirective$;return L?.constructor!==r&&(L?._$AO?.(!1),r===void 0?L=void 0:(L=new r(M),L._$AT(M,C,V)),V!==void 0?(C._$Co??=[])[V]=L:C._$Cl=L),L!==void 0&&(H=R(M,L._$AS(M,H.values),L,V)),H}var t1=class{constructor(H,C){this._$AV=[],this._$AN=void 0,this._$AD=H,this._$AM=C}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(H){let{el:{content:C},parts:V}=this._$AD,L=(H?.creationScope??F).importNode(C,!0);w.currentNode=L;let r=w.nextNode(),e=0,i=0,t=V[0];for(;t!==void 0;){if(e===t.index){let n;t.type===2?n=new $(r,r.nextSibling,this,H):t.type===1?n=new t.ctor(r,t.name,t.strings,this,H):t.type===6&&(n=new a1(r,this,H)),this._$AV.push(n),t=V[++i]}e!==t?.index&&(r=w.nextNode(),e++)}return w.currentNode=F,L}p(H){let C=0;for(let V of this._$AV)V!==void 0&&(V.strings!==void 0?(V._$AI(H,V,C),C+=V.strings.length-2):V._$AI(H[C])),C++}},$=class M{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(H,C,V,L){this.type=2,this._$AH=p,this._$AN=void 0,this._$AA=H,this._$AB=C,this._$AM=V,this.options=L,this._$Cv=L?.isConnected??!0}get parentNode(){let H=this._$AA.parentNode,C=this._$AM;return C!==void 0&&H?.nodeType===11&&(H=C.parentNode),H}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(H,C=this){H=R(this,H,C),q(H)?H===p||H==null||H===""?(this._$AH!==p&&this._$AR(),this._$AH=p):H!==this._$AH&&H!==k&&this._(H):H._$litType$!==void 0?this.$(H):H.nodeType!==void 0?this.T(H):U1(H)?this.k(H):this._(H)}O(H){return this._$AA.parentNode.insertBefore(H,this._$AB)}T(H){this._$AH!==H&&(this._$AR(),this._$AH=this.O(H))}_(H){this._$AH!==p&&q(this._$AH)?this._$AA.nextSibling.data=H:this.T(F.createTextNode(H)),this._$AH=H}$(H){let{values:C,_$litType$:V}=H,L=typeof V=="number"?this._$AC(H):(V.el===void 0&&(V.el=j.createElement(G1(V.h,V.h[0]),this.options)),V);if(this._$AH?._$AD===L)this._$AH.p(C);else{let r=new t1(L,this),e=r.u(this.options);r.p(C),this.T(e),this._$AH=r}}_$AC(H){let C=I1.get(H.strings);return C===void 0&&I1.set(H.strings,C=new j(H)),C}k(H){k1(this._$AH)||(this._$AH=[],this._$AR());let C=this._$AH,V,L=0;for(let r of H)L===C.length?C.push(V=new M(this.O(K()),this.O(K()),this,this.options)):V=C[L],V._$AI(r),L++;L<C.length&&(this._$AR(V&&V._$AB.nextSibling,L),C.length=L)}_$AR(H=this._$AA.nextSibling,C){for(this._$AP?.(!1,!0,C);H!==this._$AB;){let V=D1(H).nextSibling;D1(H).remove(),H=V}}setConnected(H){this._$AM===void 0&&(this._$Cv=H,this._$AP?.(H))}},D=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(H,C,V,L,r){this.type=1,this._$AH=p,this._$AN=void 0,this.element=H,this.name=C,this._$AM=L,this.options=r,V.length>2||V[0]!==""||V[1]!==""?(this._$AH=Array(V.length-1).fill(new String),this.strings=V):this._$AH=p}_$AI(H,C=this,V,L){let r=this.strings,e=!1;if(r===void 0)H=R(this,H,C,0),e=!q(H)||H!==this._$AH&&H!==k,e&&(this._$AH=H);else{let i=H,t,n;for(H=r[0],t=0;t<r.length-1;t++)n=R(this,i[V+t],C,t),n===k&&(n=this._$AH[t]),e||=!q(n)||n!==this._$AH[t],n===p?H=p:H!==p&&(H+=(n??"")+r[t+1]),this._$AH[t]=n}e&&!L&&this.j(H)}j(H){H===p?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,H??"")}},i1=class extends D{constructor(){super(...arguments),this.type=3}j(H){this.element[this.name]=H===p?void 0:H}},A1=class extends D{constructor(){super(...arguments),this.type=4}j(H){this.element.toggleAttribute(this.name,!!H&&H!==p)}},o1=class extends D{constructor(H,C,V,L,r){super(H,C,V,L,r),this.type=5}_$AI(H,C=this){if((H=R(this,H,C,0)??p)===k)return;let V=this._$AH,L=H===p&&V!==p||H.capture!==V.capture||H.once!==V.once||H.passive!==V.passive,r=H!==p&&(V===p||L);L&&this.element.removeEventListener(this.name,this,V),r&&this.element.addEventListener(this.name,this,H),this._$AH=H}handleEvent(H){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,H):this._$AH.handleEvent(H)}},a1=class{constructor(H,C,V){this.element=H,this.type=6,this._$AN=void 0,this._$AM=C,this.options=V}get _$AU(){return this._$AM._$AU}_$AI(H){R(this,H)}},K1={M:g1,P:f,A:f1,C:1,L:z1,R:t1,D:U1,V:R,I:$,H:D,N:A1,U:o1,B:i1,F:a1},u2=O1.litHtmlPolyfillSupport;u2?.(j,$),(O1.litHtmlVersions??=[]).push("3.3.3");var q1=(M,H,C)=>{let V=C?.renderBefore??H,L=V._$litPart$;if(L===void 0){let r=C?.renderBefore??null;V._$litPart$=L=new $(H.insertBefore(K(),r),r,void 0,C??{})}return L._$AI(M),L};var B1=globalThis,u=class extends g{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let H=super.createRenderRoot();return this.renderOptions.renderBefore??=H.firstChild,H}update(H){let C=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(H),this._$Do=q1(C,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return k}};u._$litElement$=!0,u.finalized=!0,B1.litElementHydrateSupport?.({LitElement:u});var s2=B1.litElementPolyfillSupport;s2?.({LitElement:u});(B1.litElementVersions??=[]).push("4.2.2");var y=M=>(H,C)=>{C!==void 0?C.addInitializer(()=>{customElements.define(M,H)}):customElements.define(M,H)};var c2={attribute:!0,type:String,converter:G,reflect:!1,hasChanged:r1},h2=(M=c2,H,C)=>{let{kind:V,metadata:L}=C,r=globalThis.litPropertyMetadata.get(L);if(r===void 0&&globalThis.litPropertyMetadata.set(L,r=new Map),V==="setter"&&((M=Object.create(M)).wrapped=!0),r.set(C.name,M),V==="accessor"){let{name:e}=C;return{set(i){let t=H.get.call(this);H.set.call(this,i),this.requestUpdate(e,t,M,!0,i)},init(i){return i!==void 0&&this.C(e,void 0,M,i),i}}}if(V==="setter"){let{name:e}=C;return function(i){let t=this[e];H.call(this,i),this.requestUpdate(e,t,M,!0,i)}}throw Error("Unsupported decorator location: "+V)};function c(M){return(H,C)=>typeof C=="object"?h2(M,H,C):((V,L,r)=>{let e=L.hasOwnProperty(r);return L.constructor.createProperty(r,V),e?Object.getOwnPropertyDescriptor(L,r):void 0})(M,H,C)}function d(M){return c({...M,state:!0,attribute:!1})}var _=(M,H,C)=>(C.configurable=!0,C.enumerable=!0,Reflect.decorate&&typeof H!="object"&&Object.defineProperty(M,H,C),C);function d1(M,H){return(C,V,L)=>{let r=e=>e.renderRoot?.querySelector(M)??null;if(H){let{get:e,set:i}=typeof V=="object"?C:L??(()=>{let t=Symbol();return{get(){return this[t]},set(n){this[t]=n}}})();return _(C,V,{get(){let t=e.call(this);return t===void 0&&(t=r(this),(t!==null||this.hasUpdated)&&i.call(this,t)),t}})}return _(C,V,{get(){return r(this)}})}}var Y="scheduler_plus";async function j1(M){return(await M.callWS({type:`${Y}/list_schedules`})).schedules}async function Y1(M,H){return(await M.callWS({type:`${Y}/create_schedule`,...H})).schedule}async function p1(M,H,C){return(await M.callWS({type:`${Y}/update_schedule`,schedule_id:H,...C})).schedule}async function X1(M,H){await M.callWS({type:`${Y}/delete_schedule`,schedule_id:H})}async function J1(M){return M.callWS({type:`${Y}/get_preferences`})}var C2={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},m1=M=>(...H)=>({_$litDirective$:M,values:H}),N=class{constructor(H){}get _$AU(){return this._$AM._$AU}_$AT(H,C,V){this._$Ct=H,this._$AM=C,this._$Ci=V}_$AS(H,C){return this.update(H,C)}update(H,C){return this.render(...C)}};var{I:O2}=K1,H2=M=>M;var V2=()=>document.createComment(""),W=(M,H,C)=>{let V=M._$AA.parentNode,L=H===void 0?M._$AB:H._$AA;if(C===void 0){let r=V.insertBefore(V2(),L),e=V.insertBefore(V2(),L);C=new O2(r,e,M,M.options)}else{let r=C._$AB.nextSibling,e=C._$AM,i=e!==M;if(i){let t;C._$AQ?.(M),C._$AM=M,C._$AP!==void 0&&(t=M._$AU)!==e._$AU&&C._$AP(t)}if(r!==L||i){let t=C._$AA;for(;t!==r;){let n=H2(t).nextSibling;H2(V).insertBefore(t,L),t=n}}}return C},B=(M,H,C=M)=>(M._$AI(H,C),M),g2={},v1=(M,H=g2)=>M._$AH=H,L2=M=>M._$AH,n1=M=>{M._$AR(),M._$AA.remove()};var x1=m1(class extends N{constructor(){super(...arguments),this.key=p}render(M,H){return this.key=M,H}update(M,[H,C]){return H!==this.key&&(v1(M),this.key=H),C}});var M2=(M,H,C)=>{let V=new Map;for(let L=H;L<=C;L++)V.set(M[L],L);return V},l1=m1(class extends N{constructor(M){if(super(M),M.type!==C2.CHILD)throw Error("repeat() can only be used in text expressions")}dt(M,H,C){let V;C===void 0?C=H:H!==void 0&&(V=H);let L=[],r=[],e=0;for(let i of M)L[e]=V?V(i,e):e,r[e]=C(i,e),e++;return{values:r,keys:L}}render(M,H,C){return this.dt(M,H,C).values}update(M,[H,C,V]){let L=L2(M),{values:r,keys:e}=this.dt(H,C,V);if(!Array.isArray(L))return this.ut=e,r;let i=this.ut??=[],t=[],n,l,o=0,x=L.length-1,v=0,Z=r.length-1;for(;o<=x&&v<=Z;)if(L[o]===null)o++;else if(L[x]===null)x--;else if(i[o]===e[v])t[v]=B(L[o],r[v]),o++,v++;else if(i[x]===e[Z])t[Z]=B(L[x],r[Z]),x--,Z--;else if(i[o]===e[Z])t[Z]=B(L[o],r[Z]),W(M,t[Z+1],L[o]),o++,Z--;else if(i[x]===e[v])t[v]=B(L[x],r[v]),W(M,L[o],L[x]),x--,v++;else if(n===void 0&&(n=M2(e,v,Z),l=M2(i,o,x)),n.has(i[o]))if(n.has(i[x])){let h=l.get(e[v]),u1=h!==void 0?L[h]:null;if(u1===null){let b1=W(M,L[o]);B(b1,r[v]),t[v]=b1}else t[v]=B(u1,r[v]),W(M,L[o],u1),L[h]=null;v++}else n1(L[x]),x--;else n1(L[o]),o++;for(;v<=Z;){let h=W(M,t[Z+1]);B(h,r[v]),t[v++]=h}for(;o<=x;){let h=L[o++];h!==null&&n1(h)}return this.ut=e,v1(M,t),k}});var X=["light","climate","switch"],Z1={light:"Light",climate:"Climate",switch:"Switch"},r2=["fixed","sunrise","sunset"],J={fixed:"Fixed time",sunrise:"Sunrise",sunset:"Sunset",yidcal:"YidCal"},b=["mon","tue","wed","thu","fri","sat","sun"],S1={mon:"Monday",tue:"Tuesday",wed:"Wednesday",thu:"Thursday",fri:"Friday",sat:"Saturday",sun:"Sunday"},e2=["always","include","exclude"],t2={always:"Always",include:"Only on these dates",exclude:"Except these dates"},i2=["shabbos","yom_tov","erev_shabbos","erev_yom_tov"],C1={shabbos:"Shabbos",yom_tov:"Yom Tov",erev_shabbos:"Erev Shabbos",erev_yom_tov:"Erev Yom Tov"};var E=class extends u{constructor(){super(...arguments);this._handleTitleChange=C=>{let V=C.target.value;this._fireConfigChanged({...this._config,title:V||void 0})};this._addEntity=C=>{!C||this._entities.includes(C)||this._fireConfigChanged({...this._config,entities:[...this._entities,C]})};this._updateEntity=(C,V)=>{if(!V){this._removeEntity(C);return}let L=this._entities.map((r,e)=>e===C?V:r);this._fireConfigChanged({...this._config,entities:L})};this._removeEntity=C=>{let V=this._entities.filter((L,r)=>r!==C);this._fireConfigChanged({...this._config,entities:V})}}setConfig(C){this._config=C}_fireConfigChanged(C){this._config=C,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:C}}))}get _entities(){return this._config?.entities??[]}render(){return this._config?a`
      <div class="editor">
        <label class="field-label" for="card-title">Title</label>
        <input
          id="card-title"
          type="text"
          class="native-input"
          .value=${this._config.title??""}
          @input=${this._handleTitleChange}
        />

        <label class="field-label">Devices to show</label>
        <span class="hint">
          Leave empty to show every schedule. Otherwise, only schedules
          targeting at least one of these devices appear in this card -
          useful for putting a device-specific card on a room's own
          dashboard page.
        </span>
        <div class="entities">
          ${l1(this._entities,C=>C,(C,V)=>a`
              <div class="entity-row">
                <ha-entity-picker
                  .hass=${this.hass}
                  .value=${C}
                  .includeDomains=${X}
                  @value-changed=${L=>this._updateEntity(V,L.detail.value)}
                ></ha-entity-picker>
                <ha-icon-button
                  .path=${T}
                  label="Remove device"
                  @click=${()=>this._removeEntity(V)}
                ></ha-icon-button>
              </div>
            `)}
          ${x1(this._entities.length,a`
              <ha-entity-picker
                .hass=${this.hass}
                .includeDomains=${X}
                @value-changed=${C=>this._addEntity(C.detail.value)}
              ></ha-entity-picker>
            `)}
        </div>
      </div>
    `:a``}};E.styles=O`
    .editor {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px 0;
    }
    .field-label {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .hint {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .native-input {
      font: inherit;
      color: var(--primary-text-color);
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      padding: 8px;
    }
    .entities {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .entity-row {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .entity-row ha-entity-picker {
      flex: 1;
    }
  `,A([c({attribute:!1})],E.prototype,"hass",2),A([d()],E.prototype,"_config",2),E=A([y("scheduler-plus-card-editor")],E);var f2=["heat","cool","heat_cool","auto","dry","fan_only"],k2={heat:"Heat",cool:"Cool",heat_cool:"Heat/Cool",auto:"Auto",dry:"Dry",fan_only:"Fan only"},y2={weekday_days:["mon","tue","wed","thu","fri"],weekend_days:["sat","sun"],working_hours_start:"09:00",working_hours_end:"17:00"};function I(M){let H=new Date(`${M}T00:00:00`);return Number.isNaN(H.getTime())?M:H.toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})}var m=class extends u{constructor(){super(...arguments);this._open=!1;this._preferences=y2;this._deviceType="light";this._name="";this._enabled=!0;this._days=[];this._dateMode="always";this._dates=[];this._newDate="";this._dateRanges=[];this._newRangeStart="";this._newRangeEnd="";this._dayConditions=[];this._onTime={provider:"fixed",params:{time:"06:00"}};this._offTime={provider:"fixed",params:{time:"21:00"}};this._setBrightness=!1;this._brightnessPct=100;this._useTransition=!1;this._transitionSeconds=0;this._hvacMode="heat";this._useTargetTemperature=!1;this._targetTemperature=70;this._closeDialog=()=>{this._open=!1};this._toggleDay=C=>{this._days=this._days.includes(C)?this._days.filter(V=>V!==C):[...this._days,C]};this._applyDayPreset=C=>{this._days=[...C]};this._applyAfterHoursPreset=()=>{this._days=[...b],this._onTime={provider:"fixed",params:{time:this._preferences.working_hours_end.slice(0,5)}},this._offTime={provider:"fixed",params:{time:this._preferences.working_hours_start.slice(0,5)}}};this._handleDateModeChange=C=>{let V=C.target.value;this._dateMode=V,V==="include"&&(this._days=[...b])};this._addDate=()=>{!this._newDate||this._dates.includes(this._newDate)||(this._dates=[...this._dates,this._newDate].sort(),this._newDate="")};this._removeDate=C=>{this._dates=this._dates.filter(V=>V!==C)};this._addDateRange=()=>{!this._newRangeStart||!this._newRangeEnd||this._newRangeStart>this._newRangeEnd||(this._dateRanges=[...this._dateRanges,[this._newRangeStart,this._newRangeEnd]],this._newRangeStart="",this._newRangeEnd="")};this._removeDateRange=C=>{this._dateRanges=this._dateRanges.filter(V=>V[0]!==C[0]||V[1]!==C[1])};this._toggleDayCondition=C=>{this._dayConditions=this._dayConditions.includes(C)?this._dayConditions.filter(V=>V!==C):[...this._dayConditions,C]};this._save=()=>{let C=this._name.trim();if(!C){this._error="Name is required.";return}if(this._dateMode!=="include"&&this._days.length===0){this._error="At least one day is required.";return}if(this._dateMode!=="always"&&this._dates.length===0&&this._dateRanges.length===0&&this._dayConditions.length===0){this._error="At least one date, date range, or special condition is required.";return}let V={};this._deviceType==="light"?V={...this._setBrightness?{brightness:Math.round(this._brightnessPct/100*255)}:{},...this._useTransition?{transition:this._transitionSeconds}:{}}:this._deviceType==="climate"&&(V={hvac_mode:this._hvacMode,...this._useTargetTemperature?{target_temperature:this._targetTemperature}:{}}),this._onSave?.({id:this._rule?.id,name:C,enabled:this._enabled,days:this._days,date_mode:this._dateMode,dates:this._dates,date_ranges:this._dateRanges,day_conditions:this._dayConditions,on_time:this._onTime,off_time:this._offTime,action:V}),this._open=!1}}showDialog(C){let{deviceType:V,rule:L,onSave:r}=C;if(this._deviceType=V,this._rule=L,this._onSave=r,this._loadPreferences(),this._name=L?.name??"",this._enabled=L?.enabled??!0,this._days=L?[...L.days]:[],this._dateMode=L?.date_mode??"always",this._dates=L?[...L.dates]:[],this._newDate="",this._dateRanges=L?L.date_ranges.map(([e,i])=>[e,i]):[],this._newRangeStart="",this._newRangeEnd="",this._dayConditions=L?[...L.day_conditions]:[],this._onTime=L?.on_time??{provider:"fixed",params:{time:"06:00"}},this._offTime=L?.off_time??{provider:"fixed",params:{time:"21:00"}},V==="light"){this._setBrightness=L?.action.brightness!==void 0;let e=L?.action.brightness??255;this._brightnessPct=Math.round(e/255*100),this._useTransition=L?.action.transition!==void 0,this._transitionSeconds=L?.action.transition??0}else V==="climate"&&(this._hvacMode=L?.action.hvac_mode??"heat",this._useTargetTemperature=L?.action.target_temperature!==void 0,this._targetTemperature=L?.action.target_temperature??70);this._error=void 0,this._open=!0}async _loadPreferences(){try{this._preferences=await J1(this.hass)}catch{}}_summarizeDateFilter(){let C=[...this._dates.map(V=>I(V)),...this._dateRanges.map(([V,L])=>`${I(V)}\u2013${I(L)}`),...this._dayConditions.map(V=>C1[V])];return this._dateMode==="include"?C.length===0?"Nothing selected yet - as configured, this rule will never run.":`Runs only when it's ${C.join(", ")} - the Days above are ignored.`:C.length===0?"Nothing excluded yet - this behaves the same as \u201CAlways\u201D.":`Runs on the Days above as usual, except when it's ${C.join(", ")}.`}render(){return this._open?a`
      <ha-dialog open @closed=${this._closeDialog}>
        <div class="form">
          <div class="dialog-title">${this._rule?"Edit rule":"Add rule"}</div>
          ${this._error?a`<div class="error">${this._error}</div>`:p}

          <section class="section">
            <label class="field-label" for="rule-name">Name</label>
            <input
              id="rule-name"
              type="text"
              class="native-input"
              .value=${this._name}
              @input=${C=>{this._name=C.target.value}}
            />

            <ha-formfield label="Enabled">
              <ha-switch
                .checked=${this._enabled}
                @change=${C=>{this._enabled=C.target.checked}}
              ></ha-switch>
            </ha-formfield>
          </section>

          <section class="section">
            <h3 class="section-title">When this rule runs</h3>

            <label class="field-label">Days</label>
            <div class="day-presets">
              <button type="button" class="btn" @click=${()=>this._applyDayPreset(b)}>
                Every day
              </button>
              <button
                type="button"
                class="btn"
                @click=${()=>this._applyDayPreset(this._preferences.weekday_days)}
              >
                Weekdays
              </button>
              <button
                type="button"
                class="btn"
                @click=${()=>this._applyDayPreset(this._preferences.weekend_days)}
              >
                Weekend
              </button>
              <button type="button" class="btn" @click=${this._applyAfterHoursPreset}>
                After hours
              </button>
            </div>
            <div class="days">
              ${b.map(C=>a`
                  <button
                    type="button"
                    class="day-chip ${this._days.includes(C)?"active":""}"
                    ?disabled=${this._dateMode==="include"}
                    @click=${()=>this._toggleDay(C)}
                  >
                    ${S1[C].slice(0,3)}
                  </button>
                `)}
            </div>
            ${this._dateMode==="include"?a`<span class="hint">Ignored - this rule uses a date filter instead.</span>`:p}

            <label class="field-label" for="date-mode">Date filter</label>
            <select
              id="date-mode"
              class="native-select"
              .value=${this._dateMode}
              @change=${this._handleDateModeChange}
            >
              ${e2.map(C=>a`<option value=${C}>${t2[C]}</option>`)}
            </select>

            ${this._dateMode!=="always"?a`
                  <div class="filter-panel">
                    <p class="filter-summary">${this._summarizeDateFilter()}</p>

                    <label class="panel-label">Specific dates</label>
                    <div class="dates">
                      ${this._dates.map(C=>a`
                          <div class="date-row">
                            <span>${I(C)}</span>
                            <button
                              type="button"
                              class="btn"
                              @click=${()=>this._removeDate(C)}
                            >
                              Remove
                            </button>
                          </div>
                        `)}
                      <div class="date-row">
                        <input
                          type="date"
                          class="native-input"
                          .value=${this._newDate}
                          @input=${C=>{this._newDate=C.target.value}}
                        />
                        <button type="button" class="btn" @click=${this._addDate}>
                          Add date
                        </button>
                      </div>
                    </div>

                    <label class="panel-label">Date range</label>
                    <div class="dates">
                      ${this._dateRanges.map(C=>a`
                          <div class="date-row">
                            <span>${I(C[0])} – ${I(C[1])}</span>
                            <button
                              type="button"
                              class="btn"
                              @click=${()=>this._removeDateRange(C)}
                            >
                              Remove
                            </button>
                          </div>
                        `)}
                      <div class="range-add-row">
                        <input
                          type="date"
                          class="native-input"
                          .value=${this._newRangeStart}
                          @input=${C=>{this._newRangeStart=C.target.value}}
                        />
                        <span class="sep">to</span>
                        <input
                          type="date"
                          class="native-input"
                          .value=${this._newRangeEnd}
                          @input=${C=>{this._newRangeEnd=C.target.value}}
                        />
                        <button type="button" class="btn" @click=${this._addDateRange}>
                          Add range
                        </button>
                      </div>
                    </div>

                    <label class="panel-label">Special conditions (YidCal)</label>
                    <div class="days">
                      ${i2.map(C=>a`
                          <button
                            type="button"
                            class="day-chip ${this._dayConditions.includes(C)?"active":""}"
                            @click=${()=>this._toggleDayCondition(C)}
                          >
                            ${C1[C]}
                          </button>
                        `)}
                    </div>
                    <span class="hint">
                      Reflects YidCal's current state, so this can only be
                      confirmed for today - a future Shabbos/Yom Tov won't
                      show up in "Next event" ahead of time, but the rule
                      still applies correctly once that day arrives.
                    </span>
                  </div>
                `:p}
          </section>

          <section class="section">
            <h3 class="section-title">Time</h3>
            ${this._renderTimeFields("On time",this._onTime,C=>this._onTime=C)}
            ${this._renderTimeFields("Off time",this._offTime,C=>this._offTime=C)}
          </section>

          <section class="section">
            <h3 class="section-title">Action</h3>
            ${this._renderActionFields()}
          </section>

          <div class="dialog-actions">
            <button type="button" class="btn" @click=${this._closeDialog}>Cancel</button>
            <button type="button" class="btn btn-primary" @click=${this._save}>Save</button>
          </div>
        </div>
      </ha-dialog>
    `:p}_renderTimeFields(C,V,L){return a`
      <label class="field-label">${C}</label>
      <div class="time-row">
        <select
          class="native-select"
          .value=${V.provider}
          @change=${r=>{let e=r.target.value;L({provider:e,params:e==="fixed"?{time:"06:00"}:{offset_minutes:0}})}}
        >
          ${r2.map(r=>a`<option value=${r}>${J[r]}</option>`)}
        </select>
        ${V.provider==="fixed"?a`
              <input
                type="time"
                class="native-input"
                .value=${V.params.time??""}
                @input=${r=>L({...V,params:{time:r.target.value}})}
              />
            `:a`
              <input
                type="number"
                class="native-input offset"
                .value=${String(V.params.offset_minutes??0)}
                @input=${r=>L({...V,params:{offset_minutes:Number(r.target.value)||0}})}
              />
              <span class="hint">minutes</span>
            `}
      </div>
    `}_renderActionFields(){return this._deviceType==="light"?this._renderLightAction():this._deviceType==="climate"?this._renderClimateAction():a`
      <span class="hint">Switches just turn on and off - nothing else to configure.</span>
    `}_renderLightAction(){return a`
      <ha-formfield label="Set brightness">
        <ha-switch
          .checked=${this._setBrightness}
          @change=${C=>{this._setBrightness=C.target.checked}}
        ></ha-switch>
      </ha-formfield>
      <span class="hint">
        Off by default - the light just turns on at whatever brightness it
        was last set to.
      </span>
      ${this._setBrightness?a`
            <label class="field-label">Brightness (${this._brightnessPct}%)</label>
            <input
              type="range"
              min="1"
              max="100"
              class="native-input"
              .value=${String(this._brightnessPct)}
              @input=${C=>{this._brightnessPct=Number(C.target.value)}}
            />
          `:p}

      <ha-formfield label="Fade in gradually">
        <ha-switch
          .checked=${this._useTransition}
          @change=${C=>{this._useTransition=C.target.checked}}
        ></ha-switch>
      </ha-formfield>
      <span class="hint">
        Instead of snapping on instantly, the light ramps up to its target
        level over the given number of seconds.
      </span>
      ${this._useTransition?a`
            <label class="field-label" for="fade-duration">Fade duration (seconds)</label>
            <input
              id="fade-duration"
              type="number"
              class="native-input"
              .value=${String(this._transitionSeconds)}
              @input=${C=>{this._transitionSeconds=Number(C.target.value)||0}}
            />
          `:p}
    `}_renderClimateAction(){return a`
      <label class="field-label" for="hvac-mode">HVAC mode</label>
      <select
        id="hvac-mode"
        class="native-select"
        .value=${this._hvacMode}
        @change=${C=>{this._hvacMode=C.target.value}}
      >
        ${f2.map(C=>a`<option value=${C}>${k2[C]}</option>`)}
      </select>

      <ha-formfield label="Set target temperature">
        <ha-switch
          .checked=${this._useTargetTemperature}
          @change=${C=>{this._useTargetTemperature=C.target.checked}}
        ></ha-switch>
      </ha-formfield>
      ${this._useTargetTemperature?a`
            <label class="field-label" for="target-temperature">Target temperature</label>
            <input
              id="target-temperature"
              type="number"
              class="native-input"
              .value=${String(this._targetTemperature)}
              @input=${C=>{this._targetTemperature=Number(C.target.value)||0}}
            />
          `:p}
    `}};m.styles=O`
    .form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 320px;
      max-width: 420px;
    }
    .dialog-title {
      font-size: 1.25rem;
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .section {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-top: 18px;
      border-top: 1px solid var(--divider-color);
    }
    .section:first-of-type {
      padding-top: 0;
      border-top: none;
    }
    .section-title {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--primary-text-color);
    }
    .filter-panel {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.03));
    }
    .filter-summary {
      margin: 0 0 4px;
      font-size: 0.9em;
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .panel-label {
      font-size: 0.75em;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--secondary-text-color);
      margin-top: 6px;
    }
    .panel-label:first-of-type {
      margin-top: 0;
    }
    .range-add-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .range-add-row .native-input {
      flex: 1;
      min-width: 0;
    }
    .range-add-row .sep {
      font-size: 0.85em;
      color: var(--secondary-text-color);
      flex: none;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--divider-color);
    }
    .btn {
      font: inherit;
      font-weight: 500;
      font-size: 14px;
      padding: 8px 16px;
      border-radius: 6px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
    }
    .btn:hover {
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.06));
    }
    .btn:disabled {
      opacity: 0.5;
      cursor: default;
    }
    .btn-primary {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: var(--text-primary-color, #fff);
    }
    .btn-primary:hover {
      filter: brightness(0.95);
    }
    .error {
      color: var(--error-color);
    }
    .field-label {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .native-select,
    .native-input {
      font: inherit;
      color: var(--primary-text-color);
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      padding: 8px;
    }
    .day-presets {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .day-presets .btn {
      padding: 6px 12px;
      font-size: 13px;
    }
    .native-input.offset {
      width: 80px;
    }
    .days {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .day-chip {
      font: inherit;
      color: var(--primary-text-color);
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 16px;
      padding: 6px 12px;
      cursor: pointer;
    }
    .day-chip.active {
      color: var(--text-primary-color, #fff);
      background: var(--primary-color);
      border-color: var(--primary-color);
    }
    .day-chip:disabled {
      opacity: 0.4;
      cursor: default;
    }
    .dates {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .date-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .date-row span {
      flex: 1;
    }
    .time-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .hint {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
  `,A([c({attribute:!1})],m.prototype,"hass",2),A([d()],m.prototype,"_open",2),A([d()],m.prototype,"_preferences",2),A([d()],m.prototype,"_deviceType",2),A([d()],m.prototype,"_name",2),A([d()],m.prototype,"_enabled",2),A([d()],m.prototype,"_days",2),A([d()],m.prototype,"_dateMode",2),A([d()],m.prototype,"_dates",2),A([d()],m.prototype,"_newDate",2),A([d()],m.prototype,"_dateRanges",2),A([d()],m.prototype,"_newRangeStart",2),A([d()],m.prototype,"_newRangeEnd",2),A([d()],m.prototype,"_dayConditions",2),A([d()],m.prototype,"_onTime",2),A([d()],m.prototype,"_offTime",2),A([d()],m.prototype,"_setBrightness",2),A([d()],m.prototype,"_brightnessPct",2),A([d()],m.prototype,"_useTransition",2),A([d()],m.prototype,"_transitionSeconds",2),A([d()],m.prototype,"_hvacMode",2),A([d()],m.prototype,"_useTargetTemperature",2),A([d()],m.prototype,"_targetTemperature",2),A([d()],m.prototype,"_error",2),m=A([y("scheduler-plus-rule-editor")],m);function B2(M){let[H,C]=M.split(":"),V=Number(H),L=Number(C),r=V>=12?"PM":"AM";return`${V%12===0?12:V%12}:${L.toString().padStart(2,"0")} ${r}`}function A2(M){if(M.provider==="fixed")return B2(M.params.time??"00:00");let H=M.params.offset_minutes??0;return H===0?J[M.provider]:`${J[M.provider]} ${H>0?"+":""}${H}`}var S=class extends u{constructor(){super(...arguments);this._open=!1;this._name="";this._deviceType="light";this._enabled=!0;this._entities=[];this._rules=[];this._saving=!1;this._closeDialog=()=>{this._open=!1};this._handleDeviceTypeChange=C=>{this._deviceType=C.target.value,this._entities=[],this._rules=[]};this._addEntity=C=>{!C||this._entities.includes(C)||(this._entities=[...this._entities,C])};this._removeEntity=C=>{this._entities=this._entities.filter((V,L)=>L!==C)};this._updateEntity=(C,V)=>{if(!V){this._removeEntity(C);return}this._entities=this._entities.map((L,r)=>r===C?V:L)};this._openAddRuleDialog=()=>{this._ruleEditor?.showDialog({deviceType:this._deviceType,onSave:C=>{this._rules=[...this._rules,C]}})};this._openEditRuleDialog=C=>{this._ruleEditor?.showDialog({deviceType:this._deviceType,rule:this._rules[C],onSave:V=>{this._rules=this._rules.map((L,r)=>r===C?V:L)}})};this._removeRule=C=>{let V=this._rules[C];!V||!window.confirm(`Delete rule "${V.name}"?`)||(this._rules=this._rules.filter((L,r)=>r!==C))};this._toggleRuleEnabled=C=>{this._rules=this._rules.map((V,L)=>L===C?{...V,enabled:!V.enabled}:V)};this._save=async()=>{let C=this._name.trim();if(!C){this._error="Name is required.";return}if(this._entities.length===0){this._error="At least one entity is required.";return}this._saving=!0,this._error=void 0;try{let V={name:C,device_type:this._deviceType,entities:this._entities,enabled:this._enabled,rules:this._rules};this._schedule?await p1(this.hass,this._schedule.id,V):await Y1(this.hass,V),this._open=!1,this.dispatchEvent(new CustomEvent("schedule-plus-saved"))}catch(V){this._error=V instanceof Error?V.message:String(V)}finally{this._saving=!1}}}showDialog(C){this._schedule=C,this._name=C?.name??"",this._deviceType=C?.device_type??"light",this._enabled=C?.enabled??!0,this._entities=C?[...C.entities]:[],this._rules=C?C.rules.map(V=>({...V})):[],this._error=void 0,this._open=!0}get _includeEntities(){return this.entityFilter&&this.entityFilter.length>0?this.entityFilter:void 0}render(){return this._open?a`
      <ha-dialog open @closed=${this._closeDialog}>
        <div class="form">
          <div class="dialog-title">
            ${this._schedule?"Edit schedule":"Add schedule"}
          </div>
          ${this._error?a`<div class="error">${this._error}</div>`:p}

          <label class="field-label" for="schedule-name">Name</label>
          <input
            id="schedule-name"
            type="text"
            class="native-input"
            .value=${this._name}
            @input=${C=>{this._name=C.target.value}}
          />

          <label class="field-label" for="device-type">Device type</label>
          <select
            id="device-type"
            class="native-select"
            .value=${this._deviceType}
            ?disabled=${this._schedule!==void 0}
            @change=${this._handleDeviceTypeChange}
          >
            ${X.map(C=>a`<option value=${C}>${Z1[C]}</option>`)}
          </select>

          <ha-formfield label="Enabled">
            <ha-switch
              .checked=${this._enabled}
              @change=${C=>{this._enabled=C.target.checked}}
            ></ha-switch>
          </ha-formfield>

          <label class="field-label">Entities</label>
          <div class="entities">
            ${l1(this._entities,C=>C,(C,V)=>a`
                <div class="entity-row">
                  <ha-entity-picker
                    .hass=${this.hass}
                    .value=${C}
                    .includeDomains=${[this._deviceType]}
                    .includeEntities=${this._includeEntities}
                    @value-changed=${L=>this._updateEntity(V,L.detail.value)}
                  ></ha-entity-picker>
                  <ha-icon-button
                    .path=${T}
                    label="Remove entity"
                    @click=${()=>this._removeEntity(V)}
                  ></ha-icon-button>
                </div>
              `)}
            ${x1(this._entities.length,a`
                <ha-entity-picker
                  .hass=${this.hass}
                  .includeDomains=${[this._deviceType]}
                  .includeEntities=${this._includeEntities}
                  @value-changed=${C=>this._addEntity(C.detail.value)}
                ></ha-entity-picker>
              `)}
          </div>

          <div class="rules-header">
            <label class="field-label">Rules</label>
            <button type="button" class="btn" @click=${this._openAddRuleDialog}>
              Add rule
            </button>
          </div>
          ${this._rules.length===0?a`<div class="placeholder">No rules yet.</div>`:a`
                <ul class="rules">
                  ${this._rules.map((C,V)=>this._renderRule(C,V))}
                </ul>
              `}

          <div class="dialog-actions">
            <button type="button" class="btn" @click=${this._closeDialog}>Cancel</button>
            <button
              type="button"
              class="btn btn-primary"
              ?disabled=${this._saving}
              @click=${this._save}
            >
              Save
            </button>
          </div>
        </div>
      </ha-dialog>
      <scheduler-plus-rule-editor .hass=${this.hass}></scheduler-plus-rule-editor>
    `:p}_renderRule(C,V){let L=[...C.days].sort((i,t)=>b.indexOf(i)-b.indexOf(t)).map(i=>S1[i].slice(0,3)).join(", "),r=[...C.dates.length>0?[`${C.dates.length} date${C.dates.length===1?"":"s"}`]:[],...C.date_ranges.length>0?[`${C.date_ranges.length} range${C.date_ranges.length===1?"":"s"}`]:[],...C.day_conditions.map(i=>C1[i])],e=r.length===0?"":C.date_mode==="exclude"?` \xB7 except ${r.join(", ")}`:C.date_mode==="include"?` \xB7 only ${r.join(", ")}`:"";return a`
      <li class="rule ${C.enabled?"":"disabled"}">
        <ha-switch
          .checked=${C.enabled}
          @change=${()=>this._toggleRuleEnabled(V)}
        ></ha-switch>
        <div class="rule-info">
          <span class="rule-name">${C.name}</span>
          <span class="rule-meta">
            ${L} · ${A2(C.on_time)} → ${A2(C.off_time)}${e}
          </span>
        </div>
        <div class="row-actions">
          <ha-icon-button
            .path=${H1}
            label="Edit rule"
            @click=${()=>this._openEditRuleDialog(V)}
          ></ha-icon-button>
          <ha-icon-button
            .path=${T}
            label="Remove rule"
            @click=${()=>this._removeRule(V)}
          ></ha-icon-button>
        </div>
      </li>
    `}};S.styles=O`
    .form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 320px;
    }
    .dialog-title {
      font-size: 1.25rem;
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--divider-color);
    }
    .btn {
      font: inherit;
      font-weight: 500;
      font-size: 14px;
      padding: 8px 16px;
      border-radius: 6px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
    }
    .btn:hover {
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.06));
    }
    .btn:disabled {
      opacity: 0.5;
      cursor: default;
    }
    .btn-primary {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: var(--text-primary-color, #fff);
    }
    .btn-primary:hover {
      filter: brightness(0.95);
    }
    .error {
      color: var(--error-color);
    }
    .field-label {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .native-select,
    .native-input {
      font: inherit;
      color: var(--primary-text-color);
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      padding: 8px;
    }
    .entities {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .entity-row {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .entity-row ha-entity-picker {
      flex: 1;
    }
    .rules-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .placeholder {
      padding: 8px 0;
      color: var(--secondary-text-color);
    }
    ul.rules {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .rule {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid var(--divider-color);
    }
    .rule ha-switch {
      flex: none;
    }
    .rule:last-child {
      border-bottom: none;
    }
    .rule.disabled .rule-name {
      color: var(--disabled-text-color);
    }
    .rule-info {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }
    .rule-name {
      font-weight: 500;
    }
    .rule-meta {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .row-actions {
      display: flex;
    }
  `,A([c({attribute:!1})],S.prototype,"hass",2),A([c({attribute:!1})],S.prototype,"entityFilter",2),A([d()],S.prototype,"_schedule",2),A([d()],S.prototype,"_open",2),A([d()],S.prototype,"_name",2),A([d()],S.prototype,"_deviceType",2),A([d()],S.prototype,"_enabled",2),A([d()],S.prototype,"_entities",2),A([d()],S.prototype,"_rules",2),A([d()],S.prototype,"_saving",2),A([d()],S.prototype,"_error",2),A([d1("scheduler-plus-rule-editor")],S.prototype,"_ruleEditor",2),S=A([y("scheduler-plus-schedule-editor")],S);function b2(M){if(!M.next_event)return;let H=new Date(M.next_event);if(Number.isNaN(H.getTime()))return;let C=M.next_event_action==="off"?"Off":"On",V=H.toLocaleString(void 0,{weekday:"short",hour:"numeric",minute:"2-digit"});return`Next: ${C} ${V}`}var T2="#F2A93B",s=class extends u{constructor(){super(...arguments);this._schedules=[];this._loading=!0;this._pendingToggle=new Set;this._toggleScheduleEnabled=async C=>{this._pendingToggle=new Set(this._pendingToggle).add(C.id);try{await p1(this.hass,C.id,{name:C.name,device_type:C.device_type,entities:C.entities,enabled:!C.enabled,rules:C.rules}),await this._refresh()}catch(V){window.alert(V instanceof Error?V.message:String(V))}finally{let V=new Set(this._pendingToggle);V.delete(C.id),this._pendingToggle=V}};this._openAddDialog=()=>{this._editor?.showDialog()};this._openEditDialog=C=>{this._editor?.showDialog(C)}}static getStubConfig(){return{type:"custom:scheduler-plus-card"}}static getConfigElement(){return document.createElement("scheduler-plus-card-editor")}setConfig(C){this._config=C}getCardSize(){return 2+this._visibleSchedules.length}get _visibleSchedules(){let C=this._config?.entities;return!C||C.length===0?this._schedules:this._schedules.filter(V=>V.entities.some(L=>C.includes(L)))}connectedCallback(){super.connectedCallback(),this._refresh()}async _refresh(){this._loading=!0;try{this._schedules=await j1(this.hass),this._error=void 0}catch(C){this._error=C instanceof Error?C.message:String(C)}finally{this._loading=!1}}async _handleDelete(C){window.confirm(`Delete schedule "${C.name}"?`)&&(await X1(this.hass,C.id),await this._refresh())}render(){return a`
      <ha-card>
        <div class="header">
          ${this._renderBrandMark()}
          <span>${this._config?.title??"Scheduler+"}</span>
        </div>
        <div class="content">${this._renderContent()}</div>
        <div class="card-actions">
          <button type="button" class="btn btn-primary" @click=${this._openAddDialog}>
            Add schedule
          </button>
        </div>
      </ha-card>
      <scheduler-plus-schedule-editor
        .hass=${this.hass}
        .entityFilter=${this._config?.entities}
        @schedule-plus-saved=${this._refresh}
      ></scheduler-plus-schedule-editor>
    `}_renderBrandMark(){return a`
      <svg class="brand-mark" viewBox="0 0 60 60" aria-hidden="true">
        <rect
          x="9"
          y="13"
          width="34"
          height="14"
          rx="7"
          fill="var(--card-background-color)"
          stroke="var(--primary-text-color)"
          stroke-width="4"
        />
        <circle cx="37" cy="20" r="8.5" fill="var(--primary-text-color)" />
        <rect
          x="9"
          y="31"
          width="34"
          height="14"
          rx="7"
          fill="var(--card-background-color)"
          stroke="var(--primary-text-color)"
          stroke-width="4"
        />
        <circle cx="15" cy="38" r="8.5" fill="var(--primary-text-color)" />
        <circle
          cx="47"
          cy="47"
          r="12"
          fill=${T2}
          stroke="var(--card-background-color)"
          stroke-width="3.5"
        />
        <line
          x1="41"
          y1="47"
          x2="53"
          y2="47"
          stroke="var(--card-background-color)"
          stroke-width="3"
          stroke-linecap="round"
        />
        <line
          x1="47"
          y1="41"
          x2="47"
          y2="53"
          stroke="var(--card-background-color)"
          stroke-width="3"
          stroke-linecap="round"
        />
      </svg>
    `}_renderContent(){if(this._loading)return a`<div class="placeholder">Loading schedules…</div>`;if(this._error)return a`<div class="placeholder error">${this._error}</div>`;let C=this._visibleSchedules;if(C.length===0){let V=this._schedules.length===0?"No schedules yet.":"No schedules for this card's selected devices.";return a`<div class="placeholder">${V}</div>`}return a`
      <ul class="schedules">
        ${C.map(V=>this._renderSchedule(V))}
      </ul>
    `}_renderSchedule(C){let V=C.enabled?b2(C):void 0;return a`
      <li class="schedule ${C.enabled?"":"disabled"}">
        <ha-switch
          .checked=${C.enabled}
          ?disabled=${this._pendingToggle.has(C.id)}
          @change=${()=>this._toggleScheduleEnabled(C)}
        ></ha-switch>
        <div class="schedule-info">
          <span class="schedule-name">${C.name}</span>
          <span class="schedule-meta">
            ${Z1[C.device_type]} ·
            ${C.entities.length}
            ${C.entities.length===1?"entity":"entities"} ·
            ${C.rules.length}
            ${C.rules.length===1?"rule":"rules"}
          </span>
          ${V?a`<span class="schedule-next">${V}</span>`:p}
        </div>
        <div class="row-actions">
          <ha-icon-button
            .path=${H1}
            label="Edit"
            @click=${()=>this._openEditDialog(C)}
          ></ha-icon-button>
          <ha-icon-button
            .path=${T}
            label="Delete"
            @click=${()=>this._handleDelete(C)}
          ></ha-icon-button>
        </div>
      </li>
    `}};s.styles=O`
    .header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 16px 0;
    }
    .brand-mark {
      width: 28px;
      height: 28px;
      flex: none;
    }
    .header span {
      font-size: 1.5rem;
      font-weight: 500;
      line-height: 1.2;
      color: var(--ha-card-header-color, var(--primary-text-color));
    }
    .content {
      padding: 0 16px 16px;
    }
    .btn {
      font: inherit;
      font-weight: 500;
      font-size: 14px;
      padding: 8px 16px;
      border-radius: 6px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
    }
    .btn:hover {
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.06));
    }
    .btn-primary {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: var(--text-primary-color, #fff);
    }
    .btn-primary:hover {
      filter: brightness(0.95);
    }
    .placeholder {
      padding: 16px 0;
      color: var(--secondary-text-color);
      text-align: center;
    }
    .placeholder.error {
      color: var(--error-color);
    }
    ul.schedules {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .schedule {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid var(--divider-color);
    }
    .schedule ha-switch {
      flex: none;
    }
    .schedule:last-child {
      border-bottom: none;
    }
    .schedule.disabled .schedule-name {
      color: var(--disabled-text-color);
    }
    .schedule-info {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }
    .schedule-name {
      font-weight: 500;
    }
    .schedule-meta {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .schedule-next {
      font-size: 0.85em;
      color: var(--primary-color);
    }
    .row-actions {
      display: flex;
    }
    .card-actions {
      display: flex;
      justify-content: flex-end;
      padding: 8px 8px 8px 16px;
    }
  `,A([c({attribute:!1})],s.prototype,"hass",2),A([d()],s.prototype,"_config",2),A([d()],s.prototype,"_schedules",2),A([d()],s.prototype,"_loading",2),A([d()],s.prototype,"_error",2),A([d()],s.prototype,"_pendingToggle",2),A([d1("scheduler-plus-schedule-editor")],s.prototype,"_editor",2),s=A([y("scheduler-plus-card")],s);window.customCards=window.customCards??[];window.customCards.push({type:"scheduler-plus-card",name:"Scheduler+",description:"Visual scheduling for lights and climate devices."});export{s as SchedulerPlusCard};
/*! Bundled license information:

@lit/reactive-element/css-tag.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/reactive-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/lit-html.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-element/lit-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/is-server.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/custom-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/property.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/state.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/event-options.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/base.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-all.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-async.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-assigned-elements.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-assigned-nodes.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directive.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directive-helpers.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directives/keyed.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directives/repeat.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
