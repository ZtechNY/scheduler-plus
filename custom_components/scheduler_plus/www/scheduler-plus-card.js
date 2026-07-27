var o2=Object.defineProperty;var A2=Object.getOwnPropertyDescriptor;var e=(M,H,C,V)=>{for(var L=V>1?void 0:V?A2(H,C):H,r=M.length-1,t;r>=0;r--)(t=M[r])&&(L=(V?t(H,C,L):t(L))||L);return V&&L&&o2(H,C,L),L};var f1="M10.63,14.1C12.23,10.58 16.38,9.03 19.9,10.63C23.42,12.23 24.97,16.38 23.37,19.9C22.24,22.4 19.75,24 17,24C14.3,24 11.83,22.44 10.67,20H1V18C1.06,16.86 1.84,15.93 3.34,15.18C4.84,14.43 6.72,14.04 9,14C9.57,14 10.11,14.05 10.63,14.1V14.1M9,4C10.12,4.03 11.06,4.42 11.81,5.17C12.56,5.92 12.93,6.86 12.93,8C12.93,9.14 12.56,10.08 11.81,10.83C11.06,11.58 10.12,11.95 9,11.95C7.88,11.95 6.94,11.58 6.19,10.83C5.44,10.08 5.07,9.14 5.07,8C5.07,6.86 5.44,5.92 6.19,5.17C6.94,4.42 7.88,4.03 9,4M17,22A5,5 0 0,0 22,17A5,5 0 0,0 17,12A5,5 0 0,0 12,17A5,5 0 0,0 17,22M16,14H17.5V16.82L19.94,18.23L19.19,19.53L16,17.69V14Z";var k1="M15,13H16.5V15.82L18.94,17.23L18.19,18.53L15,16.69V13M19,8H5V19H9.67C9.24,18.09 9,17.07 9,16A7,7 0 0,1 16,9C17.07,9 18.09,9.24 19,9.67V8M5,21C3.89,21 3,20.1 3,19V5C3,3.89 3.89,3 5,3H6V1H8V3H16V1H18V3H19A2,2 0 0,1 21,5V11.1C22.24,12.36 23,14.09 23,16A7,7 0 0,1 16,23C14.09,23 12.36,22.24 11.1,21H5M16,11.15A4.85,4.85 0 0,0 11.15,16C11.15,18.68 13.32,20.85 16,20.85A4.85,4.85 0 0,0 20.85,16C20.85,13.32 18.68,11.15 16,11.15Z";var $="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z";var H1="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z";var V1=globalThis,L1=V1.ShadowRoot&&(V1.ShadyCSS===void 0||V1.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,m1=Symbol(),y1=new WeakMap,G=class{constructor(H,C,V){if(this._$cssResult$=!0,V!==m1)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=H,this.t=C}get styleSheet(){let H=this.o,C=this.t;if(L1&&H===void 0){let V=C!==void 0&&C.length===1;V&&(H=y1.get(C)),H===void 0&&((this.o=H=new CSSStyleSheet).replaceSync(this.cssText),V&&y1.set(C,H))}return H}toString(){return this.cssText}},b1=M=>new G(typeof M=="string"?M:M+"",void 0,m1),s=(M,...H)=>{let C=M.length===1?M[0]:H.reduce((V,L,r)=>V+(t=>{if(t._$cssResult$===!0)return t.cssText;if(typeof t=="number")return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(L)+M[r+1],M[0]);return new G(C,M,m1)},B1=(M,H)=>{if(L1)M.adoptedStyleSheets=H.map(C=>C instanceof CSSStyleSheet?C:C.styleSheet);else for(let C of H){let V=document.createElement("style"),L=V1.litNonce;L!==void 0&&V.setAttribute("nonce",L),V.textContent=C.cssText,M.appendChild(V)}},n1=L1?M=>M:M=>M instanceof CSSStyleSheet?(H=>{let C="";for(let V of H.cssRules)C+=V.cssText;return b1(C)})(M):M;var{is:a2,defineProperty:d2,getOwnPropertyDescriptor:p2,getOwnPropertyNames:m2,getOwnPropertySymbols:n2,getPrototypeOf:v2}=Object,M1=globalThis,w1=M1.trustedTypes,l2=w1?w1.emptyScript:"",x2=M1.reactiveElementPolyfillSupport,Q=(M,H)=>M,z={toAttribute(M,H){switch(H){case Boolean:M=M?l2:null;break;case Object:case Array:M=M==null?M:JSON.stringify(M)}return M},fromAttribute(M,H){let C=M;switch(H){case Boolean:C=M!==null;break;case Number:C=M===null?null:Number(M);break;case Object:case Array:try{C=JSON.parse(M)}catch{C=null}}return C}},r1=(M,H)=>!a2(M,H),T1={attribute:!0,type:String,converter:z,reflect:!1,useDefault:!1,hasChanged:r1};Symbol.metadata??=Symbol("metadata"),M1.litPropertyMetadata??=new WeakMap;var k=class extends HTMLElement{static addInitializer(H){this._$Ei(),(this.l??=[]).push(H)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(H,C=T1){if(C.state&&(C.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(H)&&((C=Object.create(C)).wrapped=!0),this.elementProperties.set(H,C),!C.noAccessor){let V=Symbol(),L=this.getPropertyDescriptor(H,V,C);L!==void 0&&d2(this.prototype,H,L)}}static getPropertyDescriptor(H,C,V){let{get:L,set:r}=p2(this.prototype,H)??{get(){return this[C]},set(t){this[C]=t}};return{get:L,set(t){let a=L?.call(this);r?.call(this,t),this.requestUpdate(H,a,V)},configurable:!0,enumerable:!0}}static getPropertyOptions(H){return this.elementProperties.get(H)??T1}static _$Ei(){if(this.hasOwnProperty(Q("elementProperties")))return;let H=v2(this);H.finalize(),H.l!==void 0&&(this.l=[...H.l]),this.elementProperties=new Map(H.elementProperties)}static finalize(){if(this.hasOwnProperty(Q("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(Q("properties"))){let C=this.properties,V=[...m2(C),...n2(C)];for(let L of V)this.createProperty(L,C[L])}let H=this[Symbol.metadata];if(H!==null){let C=litPropertyMetadata.get(H);if(C!==void 0)for(let[V,L]of C)this.elementProperties.set(V,L)}this._$Eh=new Map;for(let[C,V]of this.elementProperties){let L=this._$Eu(C,V);L!==void 0&&this._$Eh.set(L,C)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(H){let C=[];if(Array.isArray(H)){let V=new Set(H.flat(1/0).reverse());for(let L of V)C.unshift(n1(L))}else H!==void 0&&C.push(n1(H));return C}static _$Eu(H,C){let V=C.attribute;return V===!1?void 0:typeof V=="string"?V:typeof H=="string"?H.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(H=>this.enableUpdating=H),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(H=>H(this))}addController(H){(this._$EO??=new Set).add(H),this.renderRoot!==void 0&&this.isConnected&&H.hostConnected?.()}removeController(H){this._$EO?.delete(H)}_$E_(){let H=new Map,C=this.constructor.elementProperties;for(let V of C.keys())this.hasOwnProperty(V)&&(H.set(V,this[V]),delete this[V]);H.size>0&&(this._$Ep=H)}createRenderRoot(){let H=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return B1(H,this.constructor.elementStyles),H}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(H=>H.hostConnected?.())}enableUpdating(H){}disconnectedCallback(){this._$EO?.forEach(H=>H.hostDisconnected?.())}attributeChangedCallback(H,C,V){this._$AK(H,V)}_$ET(H,C){let V=this.constructor.elementProperties.get(H),L=this.constructor._$Eu(H,V);if(L!==void 0&&V.reflect===!0){let r=(V.converter?.toAttribute!==void 0?V.converter:z).toAttribute(C,V.type);this._$Em=H,r==null?this.removeAttribute(L):this.setAttribute(L,r),this._$Em=null}}_$AK(H,C){let V=this.constructor,L=V._$Eh.get(H);if(L!==void 0&&this._$Em!==L){let r=V.getPropertyOptions(L),t=typeof r.converter=="function"?{fromAttribute:r.converter}:r.converter?.fromAttribute!==void 0?r.converter:z;this._$Em=L;let a=t.fromAttribute(C,r.type);this[L]=a??this._$Ej?.get(L)??a,this._$Em=null}}requestUpdate(H,C,V,L=!1,r){if(H!==void 0){let t=this.constructor;if(L===!1&&(r=this[H]),V??=t.getPropertyOptions(H),!((V.hasChanged??r1)(r,C)||V.useDefault&&V.reflect&&r===this._$Ej?.get(H)&&!this.hasAttribute(t._$Eu(H,V))))return;this.C(H,C,V)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(H,C,{useDefault:V,reflect:L,wrapped:r},t){V&&!(this._$Ej??=new Map).has(H)&&(this._$Ej.set(H,t??C??this[H]),r!==!0||t!==void 0)||(this._$AL.has(H)||(this.hasUpdated||V||(C=void 0),this._$AL.set(H,C)),L===!0&&this._$Em!==H&&(this._$Eq??=new Set).add(H))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(C){Promise.reject(C)}let H=this.scheduleUpdate();return H!=null&&await H,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[L,r]of this._$Ep)this[L]=r;this._$Ep=void 0}let V=this.constructor.elementProperties;if(V.size>0)for(let[L,r]of V){let{wrapped:t}=r,a=this[L];t!==!0||this._$AL.has(L)||a===void 0||this.C(L,void 0,r,a)}}let H=!1,C=this._$AL;try{H=this.shouldUpdate(C),H?(this.willUpdate(C),this._$EO?.forEach(V=>V.hostUpdate?.()),this.update(C)):this._$EM()}catch(V){throw H=!1,this._$EM(),V}H&&this._$AE(C)}willUpdate(H){}_$AE(H){this._$EO?.forEach(C=>C.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(H)),this.updated(H)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(H){return!0}update(H){this._$Eq&&=this._$Eq.forEach(C=>this._$ET(C,this[C])),this._$EM()}updated(H){}firstUpdated(H){}};k.elementStyles=[],k.shadowRootOptions={mode:"open"},k[Q("elementProperties")]=new Map,k[Q("finalized")]=new Map,x2?.({ReactiveElement:k}),(M1.reactiveElementVersions??=[]).push("2.1.2");var u1=globalThis,P1=M=>M,e1=u1.trustedTypes,F1=e1?e1.createPolicy("lit-html",{createHTML:M=>M}):void 0,N1="$lit$",b=`lit$${Math.random().toFixed(9).slice(2)}$`,W1="?"+b,Z2=`<${W1}>`,T=document,q=()=>T.createComment(""),j=M=>M===null||typeof M!="object"&&typeof M!="function",c1=Array.isArray,s2=M=>c1(M)||typeof M?.[Symbol.iterator]=="function",v1=`[ 	
\f\r]`,K=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,_1=/-->/g,R1=/>/g,B=RegExp(`>|${v1}(?:([^\\s"'>=/]+)(${v1}*=${v1}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),D1=/'/g,E1=/"/g,I1=/^(?:script|style|textarea|title)$/i,h1=M=>(H,...C)=>({_$litType$:M,strings:H,values:C}),i=h1(1),$2=h1(2),N2=h1(3),P=Symbol.for("lit-noChange"),d=Symbol.for("lit-nothing"),$1=new WeakMap,w=T.createTreeWalker(T,129);function U1(M,H){if(!c1(M)||!M.hasOwnProperty("raw"))throw Error("invalid template strings array");return F1!==void 0?F1.createHTML(H):H}var S2=(M,H)=>{let C=M.length-1,V=[],L,r=H===2?"<svg>":H===3?"<math>":"",t=K;for(let a=0;a<C;a++){let A=M[a],n,x,m=-1,f=0;for(;f<A.length&&(t.lastIndex=f,x=t.exec(A),x!==null);)f=t.lastIndex,t===K?x[1]==="!--"?t=_1:x[1]!==void 0?t=R1:x[2]!==void 0?(I1.test(x[2])&&(L=RegExp("</"+x[2],"g")),t=B):x[3]!==void 0&&(t=B):t===B?x[0]===">"?(t=L??K,m=-1):x[1]===void 0?m=-2:(m=t.lastIndex-x[2].length,n=x[1],t=x[3]===void 0?B:x[3]==='"'?E1:D1):t===E1||t===D1?t=B:t===_1||t===R1?t=K:(t=B,L=void 0);let y=t===B&&M[a+1].startsWith("/>")?" ":"";r+=t===K?A+Z2:m>=0?(V.push(n),A.slice(0,m)+N1+A.slice(m)+b+y):A+b+(m===-2?a:y)}return[U1(M,r+(M[C]||"<?>")+(H===2?"</svg>":H===3?"</math>":"")),V]},Y=class M{constructor({strings:H,_$litType$:C},V){let L;this.parts=[];let r=0,t=0,a=H.length-1,A=this.parts,[n,x]=S2(H,C);if(this.el=M.createElement(n,V),w.currentNode=this.el.content,C===2||C===3){let m=this.el.content.firstChild;m.replaceWith(...m.childNodes)}for(;(L=w.nextNode())!==null&&A.length<a;){if(L.nodeType===1){if(L.hasAttributes())for(let m of L.getAttributeNames())if(m.endsWith(N1)){let f=x[t++],y=L.getAttribute(m).split(b),C1=/([.?@])?(.*)/.exec(f);A.push({type:1,index:r,name:C1[2],strings:y,ctor:C1[1]==="."?x1:C1[1]==="?"?Z1:C1[1]==="@"?s1:W}),L.removeAttribute(m)}else m.startsWith(b)&&(A.push({type:6,index:r}),L.removeAttribute(m));if(I1.test(L.tagName)){let m=L.textContent.split(b),f=m.length-1;if(f>0){L.textContent=e1?e1.emptyScript:"";for(let y=0;y<f;y++)L.append(m[y],q()),w.nextNode(),A.push({type:2,index:++r});L.append(m[f],q())}}}else if(L.nodeType===8)if(L.data===W1)A.push({type:2,index:r});else{let m=-1;for(;(m=L.data.indexOf(b,m+1))!==-1;)A.push({type:7,index:r}),m+=b.length-1}r++}}static createElement(H,C){let V=T.createElement("template");return V.innerHTML=H,V}};function N(M,H,C=M,V){if(H===P)return H;let L=V!==void 0?C._$Co?.[V]:C._$Cl,r=j(H)?void 0:H._$litDirective$;return L?.constructor!==r&&(L?._$AO?.(!1),r===void 0?L=void 0:(L=new r(M),L._$AT(M,C,V)),V!==void 0?(C._$Co??=[])[V]=L:C._$Cl=L),L!==void 0&&(H=N(M,L._$AS(M,H.values),L,V)),H}var l1=class{constructor(H,C){this._$AV=[],this._$AN=void 0,this._$AD=H,this._$AM=C}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(H){let{el:{content:C},parts:V}=this._$AD,L=(H?.creationScope??T).importNode(C,!0);w.currentNode=L;let r=w.nextNode(),t=0,a=0,A=V[0];for(;A!==void 0;){if(t===A.index){let n;A.type===2?n=new X(r,r.nextSibling,this,H):A.type===1?n=new A.ctor(r,A.name,A.strings,this,H):A.type===6&&(n=new S1(r,this,H)),this._$AV.push(n),A=V[++a]}t!==A?.index&&(r=w.nextNode(),t++)}return w.currentNode=T,L}p(H){let C=0;for(let V of this._$AV)V!==void 0&&(V.strings!==void 0?(V._$AI(H,V,C),C+=V.strings.length-2):V._$AI(H[C])),C++}},X=class M{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(H,C,V,L){this.type=2,this._$AH=d,this._$AN=void 0,this._$AA=H,this._$AB=C,this._$AM=V,this.options=L,this._$Cv=L?.isConnected??!0}get parentNode(){let H=this._$AA.parentNode,C=this._$AM;return C!==void 0&&H?.nodeType===11&&(H=C.parentNode),H}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(H,C=this){H=N(this,H,C),j(H)?H===d||H==null||H===""?(this._$AH!==d&&this._$AR(),this._$AH=d):H!==this._$AH&&H!==P&&this._(H):H._$litType$!==void 0?this.$(H):H.nodeType!==void 0?this.T(H):s2(H)?this.k(H):this._(H)}O(H){return this._$AA.parentNode.insertBefore(H,this._$AB)}T(H){this._$AH!==H&&(this._$AR(),this._$AH=this.O(H))}_(H){this._$AH!==d&&j(this._$AH)?this._$AA.nextSibling.data=H:this.T(T.createTextNode(H)),this._$AH=H}$(H){let{values:C,_$litType$:V}=H,L=typeof V=="number"?this._$AC(H):(V.el===void 0&&(V.el=Y.createElement(U1(V.h,V.h[0]),this.options)),V);if(this._$AH?._$AD===L)this._$AH.p(C);else{let r=new l1(L,this),t=r.u(this.options);r.p(C),this.T(t),this._$AH=r}}_$AC(H){let C=$1.get(H.strings);return C===void 0&&$1.set(H.strings,C=new Y(H)),C}k(H){c1(this._$AH)||(this._$AH=[],this._$AR());let C=this._$AH,V,L=0;for(let r of H)L===C.length?C.push(V=new M(this.O(q()),this.O(q()),this,this.options)):V=C[L],V._$AI(r),L++;L<C.length&&(this._$AR(V&&V._$AB.nextSibling,L),C.length=L)}_$AR(H=this._$AA.nextSibling,C){for(this._$AP?.(!1,!0,C);H!==this._$AB;){let V=P1(H).nextSibling;P1(H).remove(),H=V}}setConnected(H){this._$AM===void 0&&(this._$Cv=H,this._$AP?.(H))}},W=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(H,C,V,L,r){this.type=1,this._$AH=d,this._$AN=void 0,this.element=H,this.name=C,this._$AM=L,this.options=r,V.length>2||V[0]!==""||V[1]!==""?(this._$AH=Array(V.length-1).fill(new String),this.strings=V):this._$AH=d}_$AI(H,C=this,V,L){let r=this.strings,t=!1;if(r===void 0)H=N(this,H,C,0),t=!j(H)||H!==this._$AH&&H!==P,t&&(this._$AH=H);else{let a=H,A,n;for(H=r[0],A=0;A<r.length-1;A++)n=N(this,a[V+A],C,A),n===P&&(n=this._$AH[A]),t||=!j(n)||n!==this._$AH[A],n===d?H=d:H!==d&&(H+=(n??"")+r[A+1]),this._$AH[A]=n}t&&!L&&this.j(H)}j(H){H===d?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,H??"")}},x1=class extends W{constructor(){super(...arguments),this.type=3}j(H){this.element[this.name]=H===d?void 0:H}},Z1=class extends W{constructor(){super(...arguments),this.type=4}j(H){this.element.toggleAttribute(this.name,!!H&&H!==d)}},s1=class extends W{constructor(H,C,V,L,r){super(H,C,V,L,r),this.type=5}_$AI(H,C=this){if((H=N(this,H,C,0)??d)===P)return;let V=this._$AH,L=H===d&&V!==d||H.capture!==V.capture||H.once!==V.once||H.passive!==V.passive,r=H!==d&&(V===d||L);L&&this.element.removeEventListener(this.name,this,V),r&&this.element.addEventListener(this.name,this,H),this._$AH=H}handleEvent(H){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,H):this._$AH.handleEvent(H)}},S1=class{constructor(H,C,V){this.element=H,this.type=6,this._$AN=void 0,this._$AM=C,this.options=V}get _$AU(){return this._$AM._$AU}_$AI(H){N(this,H)}};var u2=u1.litHtmlPolyfillSupport;u2?.(Y,X),(u1.litHtmlVersions??=[]).push("3.3.3");var G1=(M,H,C)=>{let V=C?.renderBefore??H,L=V._$litPart$;if(L===void 0){let r=C?.renderBefore??null;V._$litPart$=L=new X(H.insertBefore(q(),r),r,void 0,C??{})}return L._$AI(M),L};var O1=globalThis,l=class extends k{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let H=super.createRenderRoot();return this.renderOptions.renderBefore??=H.firstChild,H}update(H){let C=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(H),this._$Do=G1(C,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return P}};l._$litElement$=!0,l.finalized=!0,O1.litElementHydrateSupport?.({LitElement:l});var c2=O1.litElementPolyfillSupport;c2?.({LitElement:l});(O1.litElementVersions??=[]).push("4.2.2");var S=M=>(H,C)=>{C!==void 0?C.addInitializer(()=>{customElements.define(M,H)}):customElements.define(M,H)};var h2={attribute:!0,type:String,converter:z,reflect:!1,hasChanged:r1},O2=(M=h2,H,C)=>{let{kind:V,metadata:L}=C,r=globalThis.litPropertyMetadata.get(L);if(r===void 0&&globalThis.litPropertyMetadata.set(L,r=new Map),V==="setter"&&((M=Object.create(M)).wrapped=!0),r.set(C.name,M),V==="accessor"){let{name:t}=C;return{set(a){let A=H.get.call(this);H.set.call(this,a),this.requestUpdate(t,A,M,!0,a)},init(a){return a!==void 0&&this.C(t,void 0,M,a),a}}}if(V==="setter"){let{name:t}=C;return function(a){let A=this[t];H.call(this,a),this.requestUpdate(t,A,M,!0,a)}}throw Error("Unsupported decorator location: "+V)};function v(M){return(H,C)=>typeof C=="object"?O2(M,H,C):((V,L,r)=>{let t=L.hasOwnProperty(r);return L.constructor.createProperty(r,V),t?Object.getOwnPropertyDescriptor(L,r):void 0})(M,H,C)}function o(M){return v({...M,state:!0,attribute:!1})}var F=(M,H,C)=>(C.configurable=!0,C.enumerable=!0,Reflect.decorate&&typeof H!="object"&&Object.defineProperty(M,H,C),C);function I(M,H){return(C,V,L)=>{let r=t=>t.renderRoot?.querySelector(M)??null;if(H){let{get:t,set:a}=typeof V=="object"?C:L??(()=>{let A=Symbol();return{get(){return this[A]},set(n){this[A]=n}}})();return F(C,V,{get(){let A=t.call(this);return A===void 0&&(A=r(this),(A!==null||this.hasUpdated)&&a.call(this,A)),A}})}return F(C,V,{get(){return r(this)}})}}var _="scheduler_plus";async function Q1(M){return(await M.callWS({type:`${_}/list_schedules`})).schedules}async function z1(M,H){return(await M.callWS({type:`${_}/create_schedule`,...H})).schedule}async function t1(M,H,C){return(await M.callWS({type:`${_}/update_schedule`,schedule_id:H,...C})).schedule}async function K1(M,H){await M.callWS({type:`${_}/delete_schedule`,schedule_id:H})}async function i1(M){return M.callWS({type:`${_}/get_preferences`})}async function q1(M,H){return M.callWS({type:`${_}/set_preferences`,...H})}async function j1(M,H,C){return(await M.callWS({type:`${_}/get_day_schedule`,date:H,...C?{device_type:C}:{}})).events}var O=class extends l{constructor(){super(...arguments);this.value=[];this.domains=[];this._search="";this._pending=new Set;this._addSelected=()=>{this._pending.size!==0&&(this._fireChange([...this.value,...this._pending]),this._pending=new Set,this._search="")}}_entityName(C){let V=this.hass.states[C]?.attributes.friendly_name;return typeof V=="string"?V:C}get _candidates(){let C=this._search.trim().toLowerCase();return Object.keys(this.hass.states).filter(V=>this.domains.some(L=>V.startsWith(`${L}.`))).filter(V=>!this.value.includes(V)).filter(V=>!this.includeEntities||this.includeEntities.includes(V)).filter(V=>!C||V.toLowerCase().includes(C)||this._entityName(V).toLowerCase().includes(C)).sort((V,L)=>this._entityName(V).localeCompare(this._entityName(L)))}_fireChange(C){this.value=C,this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:C}}))}_removeEntity(C){this._fireChange(this.value.filter(V=>V!==C))}_toggleCandidate(C){let V=new Set(this._pending);V.has(C)?V.delete(C):V.add(C),this._pending=V}render(){let C=this._pending.size>0?`Add ${this._pending.size} device${this._pending.size===1?"":"s"}`:"Add selected";return i`
      ${this.value.length>0?i`
            <ul class="selected">
              ${this.value.map(V=>i`
                  <li>
                    <span>${this._entityName(V)}</span>
                    <ha-icon-button
                      .path=${$}
                      label="Remove"
                      @click=${()=>this._removeEntity(V)}
                    ></ha-icon-button>
                  </li>
                `)}
            </ul>
          `:d}

      <input
        type="text"
        class="native-input"
        placeholder="Search devices…"
        .value=${this._search}
        @input=${V=>{this._search=V.target.value}}
      />
      <div class="candidates">
        ${this._candidates.length===0?i`<div class="empty">No matching devices.</div>`:this._candidates.map(V=>i`
                <label class="candidate">
                  <input
                    type="checkbox"
                    .checked=${this._pending.has(V)}
                    @change=${()=>this._toggleCandidate(V)}
                  />
                  <span>${this._entityName(V)}</span>
                </label>
              `)}
      </div>
      <button
        type="button"
        class="btn btn-primary"
        ?disabled=${this._pending.size===0}
        @click=${this._addSelected}
      >
        ${C}
      </button>
    `}};O.styles=s`
    :host {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    ul.selected {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    ul.selected li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 10px;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      background: var(--card-background-color);
    }
    ul.selected li span {
      font-size: 0.9em;
      color: var(--primary-text-color);
    }
    .native-input {
      font: inherit;
      color: var(--primary-text-color);
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      padding: 8px;
    }
    .candidates {
      display: flex;
      flex-direction: column;
      max-height: 180px;
      overflow-y: auto;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
    }
    .candidate {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      font-size: 0.9em;
      color: var(--primary-text-color);
      cursor: pointer;
    }
    .candidate:hover {
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.04));
    }
    .candidate input {
      flex: none;
    }
    .empty {
      padding: 10px;
      font-size: 0.85em;
      color: var(--secondary-text-color);
      text-align: center;
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
      align-self: flex-start;
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
    .btn-primary:disabled {
      background: var(--card-background-color);
      color: var(--primary-text-color);
    }
  `,e([v({attribute:!1})],O.prototype,"hass",2),e([v({attribute:!1})],O.prototype,"value",2),e([v({attribute:!1})],O.prototype,"domains",2),e([v({attribute:!1})],O.prototype,"includeEntities",2),e([o()],O.prototype,"_search",2),e([o()],O.prototype,"_pending",2),O=e([S("scheduler-plus-entity-multi-picker")],O);var Y1=["light_switch","climate"],o1={light:"Light",climate:"Climate",switch:"Switch",light_switch:"Lights & Switches"},X1={light:["light"],climate:["climate"],switch:["switch"],light_switch:["light","switch"]},J1=["light","climate","switch"],C2=["heat","cool","heat_cool","auto","dry","fan_only"],A1={heat:"Heat",cool:"Cool",heat_cool:"Heat/Cool",auto:"Auto",dry:"Dry",fan_only:"Fan only"};var R={fixed:"Fixed time",sunrise:"Sunrise",sunset:"Sunset",yidcal:"YidCal"},H2=["candle_lighting","motzei_shabbos"],a1={candle_lighting:"\u05D4\u05D3\u05DC\u05E7\u05D5\u05EA \u05D4\u05E0\u05D9\u05E8\u05D5\u05EA",motzei_shabbos:'\u05DE\u05D5\u05E6\u05E9"\u05E7'},g=["mon","tue","wed","thu","fri","sat","sun"],D={mon:"Monday",tue:"Tuesday",wed:"Wednesday",thu:"Thursday",fri:"Friday",sat:"Saturday",sun:"Sunday"},V2=["always","include","exclude"],L2={always:"Always",include:"Only on these dates",exclude:"Except these dates"},M2=["shabbos","yom_tov","erev_shabbos","erev_yom_tov"],J={shabbos:"Shabbos",yom_tov:"Yom Tov",erev_shabbos:"Erev Shabbos",erev_yom_tov:"Erev Yom Tov"};var E=class extends l{constructor(){super(...arguments);this._handleTitleChange=C=>{let V=C.target.value;this._fireConfigChanged({...this._config,title:V||void 0})}}setConfig(C){this._config=C}_fireConfigChanged(C){this._config=C,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:C}}))}render(){return this._config?i`
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
        <scheduler-plus-entity-multi-picker
          .hass=${this.hass}
          .value=${this._config.entities??[]}
          .domains=${J1}
          @value-changed=${C=>{this._fireConfigChanged({...this._config,entities:C.detail.value})}}
        ></scheduler-plus-entity-multi-picker>
      </div>
    `:i``}};E.styles=s`
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
  `,e([v({attribute:!1})],E.prototype,"hass",2),e([o()],E.prototype,"_config",2),E=e([S("scheduler-plus-card-editor")],E);function r2(){let M=new Date,H=M.getFullYear(),C=String(M.getMonth()+1).padStart(2,"0"),V=String(M.getDate()).padStart(2,"0");return`${H}-${C}-${V}`}function d1(M){return new Date(M).toLocaleTimeString(void 0,{hour:"numeric",minute:"2-digit"})}function g2(M,H){if(M==="light"){let C=[];return typeof H.brightness=="number"&&C.push(`Brightness ${Math.round(H.brightness/255*100)}%`),typeof H.transition=="number"&&H.transition>0&&C.push(`fade ${H.transition}s`),C.length>0?C.join(" \xB7 "):void 0}if(M==="climate"){let C=[];if(typeof H.hvac_mode=="string"){let V=A1;C.push(V[H.hvac_mode]??H.hvac_mode)}return typeof H.target_temperature=="number"&&C.push(`${H.target_temperature}\xB0`),C.length>0?C.join(" \xB7 "):void 0}}var t2=["devices","climate"],i2={devices:"Lights & Switches",climate:"Climate"};function e2(M){return M==="climate"?"climate":"devices"}var f2=["all",...t2],k2={all:"All",...i2},h=class extends l{constructor(){super(...arguments);this._open=!1;this._date=r2();this._reportFilter="all";this._events=[];this._loading=!1;this._closeDialog=()=>{this._open=!1};this._handleDateChange=C=>{this._date=C.target.value,this._load()};this._handleReportFilterChange=C=>{this._reportFilter=C.target.value,this._load()}}showDialog(){this._date=r2(),this._reportFilter="all",this._open=!0,this._load()}_entityName(C){let V=this.hass.states[C]?.attributes.friendly_name;return typeof V=="string"?V:C}async _load(){this._loading=!0,this._error=void 0;try{let C=await j1(this.hass,this._date),V=this._reportFilter==="all"?C:C.filter(r=>e2(r.device_type)===this._reportFilter),L=this.entityFilter;this._events=L&&L.length>0?V.filter(r=>r.entities.some(t=>L.includes(t))):V}catch(C){this._error=C instanceof Error?C.message:String(C)}finally{this._loading=!1}}render(){return this._open?i`
      <ha-dialog open @closed=${this._closeDialog}>
        <div class="form">
          <div class="dialog-title">Day view</div>

          <div class="controls">
            <div class="control">
              <label class="field-label" for="day-view-date">Date</label>
              <input
                id="day-view-date"
                type="date"
                class="native-input"
                .value=${this._date}
                @change=${this._handleDateChange}
              />
            </div>
            <div class="control">
              <label class="field-label" for="day-view-device-type">Device type</label>
              <select
                id="day-view-device-type"
                class="native-select"
                .value=${this._reportFilter}
                @change=${this._handleReportFilterChange}
              >
                ${f2.map(C=>i`<option value=${C}>${k2[C]}</option>`)}
              </select>
            </div>
          </div>

          <div class="content">${this._renderContent()}</div>

          <div class="dialog-actions">
            <button type="button" class="btn" @click=${this._closeDialog}>Close</button>
          </div>
        </div>
      </ha-dialog>
    `:d}_renderContent(){if(this._loading)return i`<div class="placeholder">Loading…</div>`;if(this._error)return i`<div class="placeholder error">${this._error}</div>`;if(this._events.length===0)return i`<div class="placeholder">No activity scheduled for this day.</div>`;let C=t2.map(V=>({group:V,events:this._events.filter(L=>e2(L.device_type)===V).sort((L,r)=>(L.on_at??L.off_at??"").localeCompare(r.on_at??r.off_at??""))})).filter(V=>V.events.length>0);return i`
      ${C.map(V=>i`
          <div class="group">
            <h3 class="group-title">${i2[V.group]}</h3>
            <ul class="events">
              ${V.events.map(L=>this._renderEvent(L))}
            </ul>
          </div>
        `)}
    `}_renderEvent(C){let V=C.on_at!==null&&C.off_at!==null&&C.off_at.slice(0,10)!==C.on_at.slice(0,10),L=g2(C.device_type,C.action);return i`
      <li class="event">
        <span class="event-time">
          ${C.on_at!==null&&C.off_at!==null?i`${d1(C.on_at)} → ${d1(C.off_at)}`:C.on_at!==null?i`On at ${d1(C.on_at)}`:i`Off at ${d1(C.off_at)}`}
          ${V?i`<span class="hint">(next day)</span>`:d}
        </span>
        <span class="event-name">${C.schedule_name} · ${C.rule_name}</span>
        ${L?i`<span class="event-action">${L}</span>`:d}
        <span class="event-entities">
          ${C.entities.map(r=>this._entityName(r)).join(", ")}
        </span>
      </li>
    `}};h.styles=s`
    .form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 320px;
      max-width: 460px;
    }
    .dialog-title {
      font-size: 1.25rem;
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .controls {
      display: flex;
      gap: 12px;
    }
    .control {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
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
    .content {
      min-height: 80px;
    }
    .placeholder {
      padding: 16px 0;
      color: var(--secondary-text-color);
      text-align: center;
    }
    .placeholder.error {
      color: var(--error-color);
    }
    .group {
      margin-bottom: 16px;
    }
    .group:last-child {
      margin-bottom: 0;
    }
    .group-title {
      margin: 0 0 8px;
      font-size: 0.8em;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--secondary-text-color);
    }
    ul.events {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .event {
      display: flex;
      flex-direction: column;
      padding: 8px 0;
      border-bottom: 1px solid var(--divider-color);
    }
    .event:last-child {
      border-bottom: none;
    }
    .event-time {
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .event-name {
      font-size: 0.9em;
      color: var(--primary-text-color);
    }
    .event-action {
      font-size: 0.85em;
      color: var(--primary-color);
    }
    .event-entities {
      font-size: 0.8em;
      color: var(--secondary-text-color);
    }
    .hint {
      font-size: 0.85em;
      color: var(--secondary-text-color);
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
  `,e([v({attribute:!1})],h.prototype,"hass",2),e([v({attribute:!1})],h.prototype,"entityFilter",2),e([o()],h.prototype,"_open",2),e([o()],h.prototype,"_date",2),e([o()],h.prototype,"_reportFilter",2),e([o()],h.prototype,"_events",2),e([o()],h.prototype,"_loading",2),e([o()],h.prototype,"_error",2),h=e([S("scheduler-plus-day-view")],h);var u=class extends l{constructor(){super(...arguments);this._open=!1;this._weekdayDays=[];this._weekendDays=[];this._workingHoursStart="09:00";this._workingHoursEnd="17:00";this._loading=!1;this._saving=!1;this._closeDialog=()=>{this._open=!1};this._toggleWeekdayDay=C=>{this._weekdayDays=this._weekdayDays.includes(C)?this._weekdayDays.filter(V=>V!==C):[...this._weekdayDays,C],this._weekendDays=this._weekendDays.filter(V=>V!==C)};this._toggleWeekendDay=C=>{this._weekendDays=this._weekendDays.includes(C)?this._weekendDays.filter(V=>V!==C):[...this._weekendDays,C],this._weekdayDays=this._weekdayDays.filter(V=>V!==C)};this._save=async()=>{if(this._weekdayDays.length===0){this._error="At least one weekday day is required.";return}if(this._weekendDays.length===0){this._error="At least one weekend day is required.";return}this._saving=!0,this._error=void 0;try{let C={weekday_days:this._weekdayDays,weekend_days:this._weekendDays,working_hours_start:this._workingHoursStart,working_hours_end:this._workingHoursEnd};await q1(this.hass,C),this._open=!1}catch(C){this._error=C instanceof Error?C.message:String(C)}finally{this._saving=!1}}}showDialog(){this._open=!0,this._load()}async _load(){this._loading=!0,this._error=void 0;try{let C=await i1(this.hass);this._weekdayDays=[...C.weekday_days],this._weekendDays=[...C.weekend_days],this._workingHoursStart=C.working_hours_start.slice(0,5),this._workingHoursEnd=C.working_hours_end.slice(0,5)}catch(C){this._error=C instanceof Error?C.message:String(C)}finally{this._loading=!1}}render(){return this._open?i`
      <ha-dialog open @closed=${this._closeDialog}>
        <div class="form">
          <div class="dialog-title">My preferences</div>
          <span class="hint">
            Your own weekday/weekend/working-hours split, used by the rule
            editor's quick-fill presets. Only affects your account - not
            shared with other users.
          </span>
          ${this._error?i`<div class="error">${this._error}</div>`:d}

          ${this._loading?i`<div class="placeholder">Loading…</div>`:i`
                <label class="field-label">Weekday days</label>
                <div class="days">
                  ${g.map(C=>i`
                      <button
                        type="button"
                        class="day-chip ${this._weekdayDays.includes(C)?"active":""}"
                        @click=${()=>this._toggleWeekdayDay(C)}
                      >
                        ${D[C].slice(0,3)}
                      </button>
                    `)}
                </div>

                <label class="field-label">Weekend days</label>
                <div class="days">
                  ${g.map(C=>i`
                      <button
                        type="button"
                        class="day-chip ${this._weekendDays.includes(C)?"active":""}"
                        @click=${()=>this._toggleWeekendDay(C)}
                      >
                        ${D[C].slice(0,3)}
                      </button>
                    `)}
                </div>

                <div class="controls">
                  <div class="control">
                    <label class="field-label" for="working-hours-start">
                      Working hours start
                    </label>
                    <input
                      id="working-hours-start"
                      type="time"
                      class="native-input"
                      .value=${this._workingHoursStart}
                      @input=${C=>{this._workingHoursStart=C.target.value}}
                    />
                  </div>
                  <div class="control">
                    <label class="field-label" for="working-hours-end">
                      Working hours end
                    </label>
                    <input
                      id="working-hours-end"
                      type="time"
                      class="native-input"
                      .value=${this._workingHoursEnd}
                      @input=${C=>{this._workingHoursEnd=C.target.value}}
                    />
                  </div>
                </div>
              `}

          <div class="dialog-actions">
            <button type="button" class="btn" @click=${this._closeDialog}>Cancel</button>
            <button
              type="button"
              class="btn btn-primary"
              ?disabled=${this._loading||this._saving}
              @click=${this._save}
            >
              Save
            </button>
          </div>
        </div>
      </ha-dialog>
    `:d}};u.styles=s`
    .form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 320px;
      max-width: 420px;
    }
    .dialog-title {
      font-size: 1.25rem;
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .hint {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .error {
      color: var(--error-color);
    }
    .placeholder {
      padding: 16px 0;
      color: var(--secondary-text-color);
      text-align: center;
    }
    .field-label {
      font-size: 0.85em;
      color: var(--secondary-text-color);
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
    .controls {
      display: flex;
      gap: 12px;
    }
    .control {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .native-input {
      font: inherit;
      color: var(--primary-text-color);
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      padding: 8px;
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
  `,e([v({attribute:!1})],u.prototype,"hass",2),e([o()],u.prototype,"_open",2),e([o()],u.prototype,"_weekdayDays",2),e([o()],u.prototype,"_weekendDays",2),e([o()],u.prototype,"_workingHoursStart",2),e([o()],u.prototype,"_workingHoursEnd",2),e([o()],u.prototype,"_loading",2),e([o()],u.prototype,"_saving",2),e([o()],u.prototype,"_error",2),u=e([S("scheduler-plus-preferences")],u);var y2={weekday_days:["mon","tue","wed","thu","fri"],weekend_days:["sat","sun"],working_hours_start:"09:00",working_hours_end:"17:00"},g1=[{key:"fixed",label:R.fixed,makeSpec:()=>({provider:"fixed",params:{time:"06:00"}}),matches:M=>M.provider==="fixed"},{key:"sunrise",label:R.sunrise,makeSpec:()=>({provider:"sunrise",params:{offset_minutes:0}}),matches:M=>M.provider==="sunrise"},{key:"sunset",label:R.sunset,makeSpec:()=>({provider:"sunset",params:{offset_minutes:0}}),matches:M=>M.provider==="sunset"},...H2.map(M=>({key:`yidcal:${M}`,label:a1[M],makeSpec:()=>({provider:"yidcal",params:{zman:M,offset_minutes:0}}),matches:H=>H.provider==="yidcal"&&H.params.zman===M}))];function U(M){let H=new Date(`${M}T00:00:00`);return Number.isNaN(H.getTime())?M:H.toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})}var p=class extends l{constructor(){super(...arguments);this._open=!1;this._preferences=y2;this._deviceType="light";this._name="";this._enabled=!0;this._days=[];this._dateMode="always";this._dates=[];this._newDate="";this._dateRanges=[];this._newRangeStart="";this._newRangeEnd="";this._dayConditions=[];this._onTime={provider:"fixed",params:{time:"06:00"}};this._offTime={provider:"fixed",params:{time:"21:00"}};this._onEnabled=!0;this._offEnabled=!0;this._setBrightness=!1;this._brightnessPct=100;this._useTransition=!1;this._transitionSeconds=0;this._hvacMode="heat";this._useTargetTemperature=!1;this._targetTemperature=70;this._closeDialog=()=>{this._open=!1};this._toggleDay=C=>{this._days=this._days.includes(C)?this._days.filter(V=>V!==C):[...this._days,C]};this._applyDayPreset=C=>{this._days=[...C]};this._applyAfterHoursPreset=()=>{this._days=[...g],this._onTime={provider:"fixed",params:{time:this._preferences.working_hours_end.slice(0,5)}},this._offTime={provider:"fixed",params:{time:this._preferences.working_hours_start.slice(0,5)}}};this._handleDateModeChange=C=>{let V=C.target.value;this._dateMode=V,V==="include"&&(this._days=[...g])};this._addDate=()=>{!this._newDate||this._dates.includes(this._newDate)||(this._dates=[...this._dates,this._newDate].sort(),this._newDate="")};this._removeDate=C=>{this._dates=this._dates.filter(V=>V!==C)};this._addDateRange=()=>{!this._newRangeStart||!this._newRangeEnd||this._newRangeStart>this._newRangeEnd||(this._dateRanges=[...this._dateRanges,[this._newRangeStart,this._newRangeEnd]],this._newRangeStart="",this._newRangeEnd="")};this._removeDateRange=C=>{this._dateRanges=this._dateRanges.filter(V=>V[0]!==C[0]||V[1]!==C[1])};this._toggleDayCondition=C=>{this._dayConditions=this._dayConditions.includes(C)?this._dayConditions.filter(V=>V!==C):[...this._dayConditions,C]};this._save=()=>{let C=this._name.trim();if(!C){this._error="Name is required.";return}if(this._dateMode!=="include"&&this._days.length===0){this._error="At least one day is required.";return}if(this._dateMode!=="always"&&this._dates.length===0&&this._dateRanges.length===0&&this._dayConditions.length===0){this._error="At least one date, date range, or special condition is required.";return}if(!this._onEnabled&&!this._offEnabled){this._error="At least one of On time or Off time must be enabled.";return}let V={};this._deviceType==="light"||this._deviceType==="light_switch"?V={...this._setBrightness?{brightness:Math.round(this._brightnessPct/100*255)}:{},...this._useTransition?{transition:this._transitionSeconds}:{}}:this._deviceType==="climate"&&(V={hvac_mode:this._hvacMode,...this._useTargetTemperature?{target_temperature:this._targetTemperature}:{}}),this._onSave?.({id:this._rule?.id,name:C,enabled:this._enabled,days:this._days,date_mode:this._dateMode,dates:this._dates,date_ranges:this._dateRanges,day_conditions:this._dayConditions,on_time:this._onTime,off_time:this._offTime,on_enabled:this._onEnabled,off_enabled:this._offEnabled,action:V}),this._open=!1}}showDialog(C){let{deviceType:V,rule:L,onSave:r}=C;if(this._deviceType=V,this._rule=L,this._onSave=r,this._loadPreferences(),this._name=L?.name??"",this._enabled=L?.enabled??!0,this._days=L?[...L.days]:[],this._dateMode=L?.date_mode??"always",this._dates=L?[...L.dates]:[],this._newDate="",this._dateRanges=L?L.date_ranges.map(([t,a])=>[t,a]):[],this._newRangeStart="",this._newRangeEnd="",this._dayConditions=L?[...L.day_conditions]:[],this._onTime=L?.on_time??{provider:"fixed",params:{time:"06:00"}},this._offTime=L?.off_time??{provider:"fixed",params:{time:"21:00"}},this._onEnabled=L?.on_enabled??!0,this._offEnabled=L?.off_enabled??!0,V==="light"||V==="light_switch"){this._setBrightness=L?.action.brightness!==void 0;let t=L?.action.brightness??255;this._brightnessPct=Math.round(t/255*100),this._useTransition=L?.action.transition!==void 0,this._transitionSeconds=L?.action.transition??0}else V==="climate"&&(this._hvacMode=L?.action.hvac_mode??"heat",this._useTargetTemperature=L?.action.target_temperature!==void 0,this._targetTemperature=L?.action.target_temperature??70);this._error=void 0,this._open=!0}async _loadPreferences(){try{this._preferences=await i1(this.hass)}catch{}}_summarizeDateFilter(){let C=[...this._dates.map(V=>U(V)),...this._dateRanges.map(([V,L])=>`${U(V)}\u2013${U(L)}`),...this._dayConditions.map(V=>J[V])];return this._dateMode==="include"?C.length===0?"Nothing selected yet - as configured, this rule will never run.":`Runs only when it's ${C.join(", ")} - the Days above are ignored.`:C.length===0?"Nothing excluded yet - this behaves the same as \u201CAlways\u201D.":`Runs on the Days above as usual, except when it's ${C.join(", ")}.`}render(){return this._open?i`
      <ha-dialog open @closed=${this._closeDialog}>
        <div class="form">
          <div class="dialog-title">${this._rule?"Edit rule":"Add rule"}</div>
          ${this._error?i`<div class="error">${this._error}</div>`:d}

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
              <button type="button" class="btn" @click=${()=>this._applyDayPreset(g)}>
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
              ${g.map(C=>i`
                  <button
                    type="button"
                    class="day-chip ${this._days.includes(C)?"active":""}"
                    ?disabled=${this._dateMode==="include"}
                    @click=${()=>this._toggleDay(C)}
                  >
                    ${D[C].slice(0,3)}
                  </button>
                `)}
            </div>
            ${this._dateMode==="include"?i`<span class="hint">Ignored - this rule uses a date filter instead.</span>`:d}

            <label class="field-label" for="date-mode">Date filter</label>
            <select
              id="date-mode"
              class="native-select"
              .value=${this._dateMode}
              @change=${this._handleDateModeChange}
            >
              ${V2.map(C=>i`<option value=${C}>${L2[C]}</option>`)}
            </select>

            ${this._dateMode!=="always"?i`
                  <div class="filter-panel">
                    <p class="filter-summary">${this._summarizeDateFilter()}</p>

                    <label class="panel-label">Specific dates</label>
                    <div class="dates">
                      ${this._dates.map(C=>i`
                          <div class="date-row">
                            <span>${U(C)}</span>
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
                      ${this._dateRanges.map(C=>i`
                          <div class="date-row">
                            <span>${U(C[0])} – ${U(C[1])}</span>
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
                      ${M2.map(C=>i`
                          <button
                            type="button"
                            class="day-chip ${this._dayConditions.includes(C)?"active":""}"
                            @click=${()=>this._toggleDayCondition(C)}
                          >
                            ${J[C]}
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
                `:d}
          </section>

          <section class="section">
            <h3 class="section-title">Time</h3>
            <div class="time-columns">
              ${this._renderTimeFields("On time",this._onTime,C=>this._onTime=C,this._onEnabled,C=>this._onEnabled=C)}
              ${this._renderTimeFields("Off time",this._offTime,C=>this._offTime=C,this._offEnabled,C=>this._offEnabled=C)}
            </div>
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
    `:d}_renderTimeFields(C,V,L,r,t){let a=g1.find(A=>A.matches(V))?.key??"fixed";return i`
      <div class="time-field">
        <ha-formfield label=${C}>
          <ha-switch
            .checked=${r}
            @change=${A=>{t(A.target.checked)}}
          ></ha-switch>
        </ha-formfield>
        ${r?i`
              <div class="time-row">
                <select
                  class="native-select"
                  .value=${a}
                  @change=${A=>{let n=A.target.value,x=g1.find(m=>m.key===n);x&&L(x.makeSpec())}}
                >
                  ${g1.map(A=>i`<option value=${A.key}>${A.label}</option>`)}
                </select>
                ${V.provider==="fixed"?i`
                      <input
                        type="time"
                        class="native-input"
                        .value=${V.params.time??""}
                        @input=${A=>L({...V,params:{time:A.target.value}})}
                      />
                    `:i`
                      <input
                        type="number"
                        class="native-input offset"
                        .value=${String(V.params.offset_minutes??0)}
                        @input=${A=>L({...V,params:{...V.params,offset_minutes:Number(A.target.value)||0}})}
                      />
                      <span class="hint">minutes</span>
                    `}
              </div>
            `:d}
      </div>
    `}_renderActionFields(){return this._deviceType==="light"||this._deviceType==="light_switch"?this._renderLightAction():this._deviceType==="climate"?this._renderClimateAction():i`
      <span class="hint">Switches just turn on and off - nothing else to configure.</span>
    `}_renderLightAction(){return i`
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
      ${this._setBrightness?i`
            <label class="field-label">Brightness (${this._brightnessPct}%)</label>
            <input
              type="range"
              min="1"
              max="100"
              class="native-input"
              .value=${String(this._brightnessPct)}
              @input=${C=>{this._brightnessPct=Number(C.target.value)}}
            />
          `:d}

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
      ${this._useTransition?i`
            <label class="field-label" for="fade-duration">Fade duration (seconds)</label>
            <input
              id="fade-duration"
              type="number"
              class="native-input"
              .value=${String(this._transitionSeconds)}
              @input=${C=>{this._transitionSeconds=Number(C.target.value)||0}}
            />
          `:d}
    `}_renderClimateAction(){return i`
      <label class="field-label" for="hvac-mode">HVAC mode</label>
      <select
        id="hvac-mode"
        class="native-select"
        .value=${this._hvacMode}
        @change=${C=>{this._hvacMode=C.target.value}}
      >
        ${C2.map(C=>i`<option value=${C}>${A1[C]}</option>`)}
      </select>

      <ha-formfield label="Set target temperature">
        <ha-switch
          .checked=${this._useTargetTemperature}
          @change=${C=>{this._useTargetTemperature=C.target.checked}}
        ></ha-switch>
      </ha-formfield>
      ${this._useTargetTemperature?i`
            <label class="field-label" for="target-temperature">Target temperature</label>
            <input
              id="target-temperature"
              type="number"
              class="native-input"
              .value=${String(this._targetTemperature)}
              @input=${C=>{this._targetTemperature=Number(C.target.value)||0}}
            />
          `:d}
    `}};p.styles=s`
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
    .time-columns {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }
    .time-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1 1 200px;
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
  `,e([v({attribute:!1})],p.prototype,"hass",2),e([o()],p.prototype,"_open",2),e([o()],p.prototype,"_preferences",2),e([o()],p.prototype,"_deviceType",2),e([o()],p.prototype,"_name",2),e([o()],p.prototype,"_enabled",2),e([o()],p.prototype,"_days",2),e([o()],p.prototype,"_dateMode",2),e([o()],p.prototype,"_dates",2),e([o()],p.prototype,"_newDate",2),e([o()],p.prototype,"_dateRanges",2),e([o()],p.prototype,"_newRangeStart",2),e([o()],p.prototype,"_newRangeEnd",2),e([o()],p.prototype,"_dayConditions",2),e([o()],p.prototype,"_onTime",2),e([o()],p.prototype,"_offTime",2),e([o()],p.prototype,"_onEnabled",2),e([o()],p.prototype,"_offEnabled",2),e([o()],p.prototype,"_setBrightness",2),e([o()],p.prototype,"_brightnessPct",2),e([o()],p.prototype,"_useTransition",2),e([o()],p.prototype,"_transitionSeconds",2),e([o()],p.prototype,"_hvacMode",2),e([o()],p.prototype,"_useTargetTemperature",2),e([o()],p.prototype,"_targetTemperature",2),e([o()],p.prototype,"_error",2),p=e([S("scheduler-plus-rule-editor")],p);function b2(M){let[H,C]=M.split(":"),V=Number(H),L=Number(C),r=V>=12?"PM":"AM";return`${V%12===0?12:V%12}:${L.toString().padStart(2,"0")} ${r}`}function p1(M){if(M.provider==="fixed")return b2(M.params.time??"00:00");let H=M.provider==="yidcal"?a1[M.params.zman]??R.yidcal:R[M.provider],C=M.params.offset_minutes??0;return C===0?H:`${H} ${C>0?"+":""}${C}`}function B2(M){return M.on_enabled&&M.off_enabled?`${p1(M.on_time)} \u2192 ${p1(M.off_time)}`:M.on_enabled?`${p1(M.on_time)} only`:`until ${p1(M.off_time)}`}var Z=class extends l{constructor(){super(...arguments);this._open=!1;this._name="";this._deviceType="light_switch";this._enabled=!0;this._entities=[];this._rules=[];this._saving=!1;this._closeDialog=()=>{this._open=!1};this._handleDeviceTypeChange=C=>{this._deviceType=C.target.value,this._entities=[],this._rules=[]};this._openAddRuleDialog=()=>{this._ruleEditor?.showDialog({deviceType:this._deviceType,onSave:C=>{this._rules=[...this._rules,C]}})};this._openEditRuleDialog=C=>{this._ruleEditor?.showDialog({deviceType:this._deviceType,rule:this._rules[C],onSave:V=>{this._rules=this._rules.map((L,r)=>r===C?V:L)}})};this._removeRule=C=>{let V=this._rules[C];!V||!window.confirm(`Delete rule "${V.name}"?`)||(this._rules=this._rules.filter((L,r)=>r!==C))};this._toggleRuleEnabled=C=>{this._rules=this._rules.map((V,L)=>L===C?{...V,enabled:!V.enabled}:V)};this._save=async()=>{let C=this._name.trim();if(!C){this._error="Name is required.";return}if(this._entities.length===0){this._error="At least one entity is required.";return}this._saving=!0,this._error=void 0;try{let V={name:C,device_type:this._deviceType,entities:this._entities,enabled:this._enabled,rules:this._rules};this._schedule?await t1(this.hass,this._schedule.id,V):await z1(this.hass,V),this._open=!1,this.dispatchEvent(new CustomEvent("schedule-plus-saved"))}catch(V){this._error=V instanceof Error?V.message:String(V)}finally{this._saving=!1}}}showDialog(C){this._schedule=C,this._name=C?.name??"",this._deviceType=C?.device_type??"light_switch",this._enabled=C?.enabled??!0,this._entities=C?[...C.entities]:[],this._rules=C?C.rules.map(V=>({...V})):[],this._error=void 0,this._open=!0}render(){return this._open?i`
      <ha-dialog open @closed=${this._closeDialog}>
        <div class="form">
          <div class="dialog-title">
            ${this._schedule?"Edit schedule":"Add schedule"}
          </div>
          ${this._error?i`<div class="error">${this._error}</div>`:d}

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
            ${Y1.map(C=>i`<option value=${C}>${o1[C]}</option>`)}
          </select>

          <ha-formfield label="Enabled">
            <ha-switch
              .checked=${this._enabled}
              @change=${C=>{this._enabled=C.target.checked}}
            ></ha-switch>
          </ha-formfield>

          <label class="field-label">Entities</label>
          <scheduler-plus-entity-multi-picker
            .hass=${this.hass}
            .value=${this._entities}
            .domains=${X1[this._deviceType]}
            .includeEntities=${this.entityFilter}
            @value-changed=${C=>{this._entities=C.detail.value}}
          ></scheduler-plus-entity-multi-picker>

          <div class="rules-header">
            <label class="field-label">Rules</label>
            <button type="button" class="btn" @click=${this._openAddRuleDialog}>
              Add rule
            </button>
          </div>
          ${this._rules.length===0?i`<div class="placeholder">No rules yet.</div>`:i`
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
    `:d}_renderRule(C,V){let L=[...C.days].sort((a,A)=>g.indexOf(a)-g.indexOf(A)).map(a=>D[a].slice(0,3)).join(", "),r=[...C.dates.length>0?[`${C.dates.length} date${C.dates.length===1?"":"s"}`]:[],...C.date_ranges.length>0?[`${C.date_ranges.length} range${C.date_ranges.length===1?"":"s"}`]:[],...C.day_conditions.map(a=>J[a])],t=r.length===0?"":C.date_mode==="exclude"?` \xB7 except ${r.join(", ")}`:C.date_mode==="include"?` \xB7 only ${r.join(", ")}`:"";return i`
      <li class="rule ${C.enabled?"":"disabled"}">
        <ha-switch
          .checked=${C.enabled}
          @change=${()=>this._toggleRuleEnabled(V)}
        ></ha-switch>
        <div class="rule-info">
          <span class="rule-name">${C.name}</span>
          <span class="rule-meta">
            ${L} · ${B2(C)}${t}
          </span>
        </div>
        <div class="row-actions">
          <ha-icon-button
            .path=${H1}
            label="Edit rule"
            @click=${()=>this._openEditRuleDialog(V)}
          ></ha-icon-button>
          <ha-icon-button
            .path=${$}
            label="Remove rule"
            @click=${()=>this._removeRule(V)}
          ></ha-icon-button>
        </div>
      </li>
    `}};Z.styles=s`
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
  `,e([v({attribute:!1})],Z.prototype,"hass",2),e([v({attribute:!1})],Z.prototype,"entityFilter",2),e([o()],Z.prototype,"_schedule",2),e([o()],Z.prototype,"_open",2),e([o()],Z.prototype,"_name",2),e([o()],Z.prototype,"_deviceType",2),e([o()],Z.prototype,"_enabled",2),e([o()],Z.prototype,"_entities",2),e([o()],Z.prototype,"_rules",2),e([o()],Z.prototype,"_saving",2),e([o()],Z.prototype,"_error",2),e([I("scheduler-plus-rule-editor")],Z.prototype,"_ruleEditor",2),Z=e([S("scheduler-plus-schedule-editor")],Z);function w2(M){if(!M.next_event)return;let H=new Date(M.next_event);if(Number.isNaN(H.getTime()))return;let C=M.next_event_action==="off"?"Off":"On",V=H.toLocaleString(void 0,{weekday:"short",hour:"numeric",minute:"2-digit"});return`Next: ${C} ${V}`}var T2="#F2A93B",c=class extends l{constructor(){super(...arguments);this._schedules=[];this._loading=!0;this._pendingToggle=new Set;this._toggleScheduleEnabled=async C=>{this._pendingToggle=new Set(this._pendingToggle).add(C.id);try{await t1(this.hass,C.id,{name:C.name,device_type:C.device_type,entities:C.entities,enabled:!C.enabled,rules:C.rules}),await this._refresh()}catch(V){window.alert(V instanceof Error?V.message:String(V))}finally{let V=new Set(this._pendingToggle);V.delete(C.id),this._pendingToggle=V}};this._openAddDialog=()=>{this._editor?.showDialog()};this._openEditDialog=C=>{this._editor?.showDialog(C)};this._openDayView=()=>{this._dayView?.showDialog()};this._openPreferences=()=>{this._preferences?.showDialog()}}static getStubConfig(){return{type:"custom:scheduler-plus-card"}}static getConfigElement(){return document.createElement("scheduler-plus-card-editor")}setConfig(C){this._config=C}getCardSize(){return 2+this._visibleSchedules.length}get _visibleSchedules(){let C=this._config?.entities;return!C||C.length===0?this._schedules:this._schedules.filter(V=>V.entities.some(L=>C.includes(L)))}connectedCallback(){super.connectedCallback(),this._refresh()}async _refresh(){this._loading=!0;try{this._schedules=await Q1(this.hass),this._error=void 0}catch(C){this._error=C instanceof Error?C.message:String(C)}finally{this._loading=!1}}async _handleDelete(C){window.confirm(`Delete schedule "${C.name}"?`)&&(await K1(this.hass,C.id),await this._refresh())}render(){return i`
      <ha-card>
        <div class="header">
          ${this._renderBrandMark()}
          <span>${this._config?.title??"Scheduler+"}</span>
          <ha-icon-button
            .path=${f1}
            label="My preferences"
            @click=${this._openPreferences}
          ></ha-icon-button>
          <ha-icon-button
            .path=${k1}
            label="Day view"
            @click=${this._openDayView}
          ></ha-icon-button>
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
      <scheduler-plus-day-view
        .hass=${this.hass}
        .entityFilter=${this._config?.entities}
      ></scheduler-plus-day-view>
      <scheduler-plus-preferences .hass=${this.hass}></scheduler-plus-preferences>
    `}_renderBrandMark(){return i`
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
    `}_renderContent(){if(this._loading)return i`<div class="placeholder">Loading schedules…</div>`;if(this._error)return i`<div class="placeholder error">${this._error}</div>`;let C=this._visibleSchedules;if(C.length===0){let V=this._schedules.length===0?"No schedules yet.":"No schedules for this card's selected devices.";return i`<div class="placeholder">${V}</div>`}return i`
      <ul class="schedules">
        ${C.map(V=>this._renderSchedule(V))}
      </ul>
    `}_renderSchedule(C){let V=C.enabled?w2(C):void 0;return i`
      <li class="schedule ${C.enabled?"":"disabled"}">
        <ha-switch
          .checked=${C.enabled}
          ?disabled=${this._pendingToggle.has(C.id)}
          @change=${()=>this._toggleScheduleEnabled(C)}
        ></ha-switch>
        <div class="schedule-info">
          <span class="schedule-name">${C.name}</span>
          <span class="schedule-meta">
            ${o1[C.device_type]} ·
            ${C.entities.length}
            ${C.entities.length===1?"entity":"entities"} ·
            ${C.rules.length}
            ${C.rules.length===1?"rule":"rules"}
          </span>
          ${V?i`<span class="schedule-next">${V}</span>`:d}
        </div>
        <div class="row-actions">
          <ha-icon-button
            .path=${H1}
            label="Edit"
            @click=${()=>this._openEditDialog(C)}
          ></ha-icon-button>
          <ha-icon-button
            .path=${$}
            label="Delete"
            @click=${()=>this._handleDelete(C)}
          ></ha-icon-button>
        </div>
      </li>
    `}};c.styles=s`
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
      flex: 1;
      min-width: 0;
      font-size: 1.5rem;
      font-weight: 500;
      line-height: 1.2;
      color: var(--ha-card-header-color, var(--primary-text-color));
    }
    .header ha-icon-button {
      flex: none;
    }
    .header ha-icon-button:last-child {
      margin-right: -8px;
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
  `,e([v({attribute:!1})],c.prototype,"hass",2),e([o()],c.prototype,"_config",2),e([o()],c.prototype,"_schedules",2),e([o()],c.prototype,"_loading",2),e([o()],c.prototype,"_error",2),e([o()],c.prototype,"_pendingToggle",2),e([I("scheduler-plus-schedule-editor")],c.prototype,"_editor",2),e([I("scheduler-plus-day-view")],c.prototype,"_dayView",2),e([I("scheduler-plus-preferences")],c.prototype,"_preferences",2),c=e([S("scheduler-plus-card")],c);window.customCards=window.customCards??[];window.customCards.push({type:"scheduler-plus-card",name:"Scheduler+",description:"Visual scheduling for lights and climate devices."});export{c as SchedulerPlusCard};
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
*/
