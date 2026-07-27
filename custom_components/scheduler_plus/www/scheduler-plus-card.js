var i2=Object.defineProperty;var A2=Object.getOwnPropertyDescriptor;var o=(M,H,C,V)=>{for(var L=V>1?void 0:V?A2(H,C):H,r=M.length-1,e;r>=0;r--)(e=M[r])&&(L=(V?e(H,C,L):e(L))||L);return V&&L&&i2(H,C,L),L};var N="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z";var Y="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z";var X=globalThis,J=X.ShadowRoot&&(X.ShadyCSS===void 0||X.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,x1=Symbol(),f1=new WeakMap,$=class{constructor(H,C,V){if(this._$cssResult$=!0,V!==x1)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=H,this.t=C}get styleSheet(){let H=this.o,C=this.t;if(J&&H===void 0){let V=C!==void 0&&C.length===1;V&&(H=f1.get(C)),H===void 0&&((this.o=H=new CSSStyleSheet).replaceSync(this.cssText),V&&f1.set(C,H))}return H}toString(){return this.cssText}},g1=M=>new $(typeof M=="string"?M:M+"",void 0,x1),B=(M,...H)=>{let C=M.length===1?M[0]:H.reduce((V,L,r)=>V+(e=>{if(e._$cssResult$===!0)return e.cssText;if(typeof e=="number")return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(L)+M[r+1],M[0]);return new $(C,M,x1)},k1=(M,H)=>{if(J)M.adoptedStyleSheets=H.map(C=>C instanceof CSSStyleSheet?C:C.styleSheet);else for(let C of H){let V=document.createElement("style"),L=X.litNonce;L!==void 0&&V.setAttribute("nonce",L),V.textContent=C.cssText,M.appendChild(V)}},n1=J?M=>M:M=>M instanceof CSSStyleSheet?(H=>{let C="";for(let V of H.cssRules)C+=V.cssText;return g1(C)})(M):M;var{is:o2,defineProperty:a2,getOwnPropertyDescriptor:d2,getOwnPropertyNames:p2,getOwnPropertySymbols:m2,getPrototypeOf:v2}=Object,C1=globalThis,y1=C1.trustedTypes,x2=y1?y1.emptyScript:"",n2=C1.reactiveElementPolyfillSupport,I=(M,H)=>M,U={toAttribute(M,H){switch(H){case Boolean:M=M?x2:null;break;case Object:case Array:M=M==null?M:JSON.stringify(M)}return M},fromAttribute(M,H){let C=M;switch(H){case Boolean:C=M!==null;break;case Number:C=M===null?null:Number(M);break;case Object:case Array:try{C=JSON.parse(M)}catch{C=null}}return C}},H1=(M,H)=>!o2(M,H),B1={attribute:!0,type:String,converter:U,reflect:!1,useDefault:!1,hasChanged:H1};Symbol.metadata??=Symbol("metadata"),C1.litPropertyMetadata??=new WeakMap;var h=class extends HTMLElement{static addInitializer(H){this._$Ei(),(this.l??=[]).push(H)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(H,C=B1){if(C.state&&(C.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(H)&&((C=Object.create(C)).wrapped=!0),this.elementProperties.set(H,C),!C.noAccessor){let V=Symbol(),L=this.getPropertyDescriptor(H,V,C);L!==void 0&&a2(this.prototype,H,L)}}static getPropertyDescriptor(H,C,V){let{get:L,set:r}=d2(this.prototype,H)??{get(){return this[C]},set(e){this[C]=e}};return{get:L,set(e){let i=L?.call(this);r?.call(this,e),this.requestUpdate(H,i,V)},configurable:!0,enumerable:!0}}static getPropertyOptions(H){return this.elementProperties.get(H)??B1}static _$Ei(){if(this.hasOwnProperty(I("elementProperties")))return;let H=v2(this);H.finalize(),H.l!==void 0&&(this.l=[...H.l]),this.elementProperties=new Map(H.elementProperties)}static finalize(){if(this.hasOwnProperty(I("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(I("properties"))){let C=this.properties,V=[...p2(C),...m2(C)];for(let L of V)this.createProperty(L,C[L])}let H=this[Symbol.metadata];if(H!==null){let C=litPropertyMetadata.get(H);if(C!==void 0)for(let[V,L]of C)this.elementProperties.set(V,L)}this._$Eh=new Map;for(let[C,V]of this.elementProperties){let L=this._$Eu(C,V);L!==void 0&&this._$Eh.set(L,C)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(H){let C=[];if(Array.isArray(H)){let V=new Set(H.flat(1/0).reverse());for(let L of V)C.unshift(n1(L))}else H!==void 0&&C.push(n1(H));return C}static _$Eu(H,C){let V=C.attribute;return V===!1?void 0:typeof V=="string"?V:typeof H=="string"?H.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(H=>this.enableUpdating=H),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(H=>H(this))}addController(H){(this._$EO??=new Set).add(H),this.renderRoot!==void 0&&this.isConnected&&H.hostConnected?.()}removeController(H){this._$EO?.delete(H)}_$E_(){let H=new Map,C=this.constructor.elementProperties;for(let V of C.keys())this.hasOwnProperty(V)&&(H.set(V,this[V]),delete this[V]);H.size>0&&(this._$Ep=H)}createRenderRoot(){let H=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return k1(H,this.constructor.elementStyles),H}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(H=>H.hostConnected?.())}enableUpdating(H){}disconnectedCallback(){this._$EO?.forEach(H=>H.hostDisconnected?.())}attributeChangedCallback(H,C,V){this._$AK(H,V)}_$ET(H,C){let V=this.constructor.elementProperties.get(H),L=this.constructor._$Eu(H,V);if(L!==void 0&&V.reflect===!0){let r=(V.converter?.toAttribute!==void 0?V.converter:U).toAttribute(C,V.type);this._$Em=H,r==null?this.removeAttribute(L):this.setAttribute(L,r),this._$Em=null}}_$AK(H,C){let V=this.constructor,L=V._$Eh.get(H);if(L!==void 0&&this._$Em!==L){let r=V.getPropertyOptions(L),e=typeof r.converter=="function"?{fromAttribute:r.converter}:r.converter?.fromAttribute!==void 0?r.converter:U;this._$Em=L;let i=e.fromAttribute(C,r.type);this[L]=i??this._$Ej?.get(L)??i,this._$Em=null}}requestUpdate(H,C,V,L=!1,r){if(H!==void 0){let e=this.constructor;if(L===!1&&(r=this[H]),V??=e.getPropertyOptions(H),!((V.hasChanged??H1)(r,C)||V.useDefault&&V.reflect&&r===this._$Ej?.get(H)&&!this.hasAttribute(e._$Eu(H,V))))return;this.C(H,C,V)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(H,C,{useDefault:V,reflect:L,wrapped:r},e){V&&!(this._$Ej??=new Map).has(H)&&(this._$Ej.set(H,e??C??this[H]),r!==!0||e!==void 0)||(this._$AL.has(H)||(this.hasUpdated||V||(C=void 0),this._$AL.set(H,C)),L===!0&&this._$Em!==H&&(this._$Eq??=new Set).add(H))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(C){Promise.reject(C)}let H=this.scheduleUpdate();return H!=null&&await H,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[L,r]of this._$Ep)this[L]=r;this._$Ep=void 0}let V=this.constructor.elementProperties;if(V.size>0)for(let[L,r]of V){let{wrapped:e}=r,i=this[L];e!==!0||this._$AL.has(L)||i===void 0||this.C(L,void 0,r,i)}}let H=!1,C=this._$AL;try{H=this.shouldUpdate(C),H?(this.willUpdate(C),this._$EO?.forEach(V=>V.hostUpdate?.()),this.update(C)):this._$EM()}catch(V){throw H=!1,this._$EM(),V}H&&this._$AE(C)}willUpdate(H){}_$AE(H){this._$EO?.forEach(C=>C.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(H)),this.updated(H)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(H){return!0}update(H){this._$Eq&&=this._$Eq.forEach(C=>this._$ET(C,this[C])),this._$EM()}updated(H){}firstUpdated(H){}};h.elementStyles=[],h.shadowRootOptions={mode:"open"},h[I("elementProperties")]=new Map,h[I("finalized")]=new Map,n2?.({ReactiveElement:h}),(C1.reactiveElementVersions??=[]).push("2.1.2");var Z1=globalThis,b1=M=>M,V1=Z1.trustedTypes,T1=V1?V1.createPolicy("lit-html",{createHTML:M=>M}):void 0,S1="$lit$",O=`lit$${Math.random().toFixed(9).slice(2)}$`,u1="?"+O,l2=`<${u1}>`,P=document,G=()=>P.createComment(""),z=M=>M===null||typeof M!="object"&&typeof M!="function",s1=Array.isArray,E1=M=>s1(M)||typeof M?.[Symbol.iterator]=="function",l1=`[ 	
\f\r]`,Q=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,P1=/-->/g,w1=/>/g,b=RegExp(`>|${l1}(?:([^\\s"'>=/]+)(${l1}*=${l1}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),F1=/'/g,R1=/"/g,_1=/^(?:script|style|textarea|title)$/i,c1=M=>(H,...C)=>({_$litType$:M,strings:H,values:C}),a=c1(1),D2=c1(2),E2=c1(3),f=Symbol.for("lit-noChange"),p=Symbol.for("lit-nothing"),D1=new WeakMap,T=P.createTreeWalker(P,129);function W1(M,H){if(!s1(M)||!M.hasOwnProperty("raw"))throw Error("invalid template strings array");return T1!==void 0?T1.createHTML(H):H}var N1=(M,H)=>{let C=M.length-1,V=[],L,r=H===2?"<svg>":H===3?"<math>":"",e=Q;for(let i=0;i<C;i++){let t=M[i],v,l,A=-1,n=0;for(;n<t.length&&(e.lastIndex=n,l=e.exec(t),l!==null);)n=e.lastIndex,e===Q?l[1]==="!--"?e=P1:l[1]!==void 0?e=w1:l[2]!==void 0?(_1.test(l[2])&&(L=RegExp("</"+l[2],"g")),e=b):l[3]!==void 0&&(e=b):e===b?l[0]===">"?(e=L??Q,A=-1):l[1]===void 0?A=-2:(A=e.lastIndex-l[2].length,v=l[1],e=l[3]===void 0?b:l[3]==='"'?R1:F1):e===R1||e===F1?e=b:e===P1||e===w1?e=Q:(e=b,L=void 0);let m=e===b&&M[i+1].startsWith("/>")?" ":"";r+=e===Q?t+l2:A>=0?(V.push(v),t.slice(0,A)+S1+t.slice(A)+O+m):t+O+(A===-2?i:m)}return[W1(M,r+(M[C]||"<?>")+(H===2?"</svg>":H===3?"</math>":"")),V]},K=class M{constructor({strings:H,_$litType$:C},V){let L;this.parts=[];let r=0,e=0,i=H.length-1,t=this.parts,[v,l]=N1(H,C);if(this.el=M.createElement(v,V),T.currentNode=this.el.content,C===2||C===3){let A=this.el.content.firstChild;A.replaceWith(...A.childNodes)}for(;(L=T.nextNode())!==null&&t.length<i;){if(L.nodeType===1){if(L.hasAttributes())for(let A of L.getAttributeNames())if(A.endsWith(S1)){let n=l[e++],m=L.getAttribute(A).split(O),Z=/([.?@])?(.*)/.exec(n);t.push({type:1,index:r,name:Z[2],strings:m,ctor:Z[1]==="."?M1:Z[1]==="?"?r1:Z[1]==="@"?e1:F}),L.removeAttribute(A)}else A.startsWith(O)&&(t.push({type:6,index:r}),L.removeAttribute(A));if(_1.test(L.tagName)){let A=L.textContent.split(O),n=A.length-1;if(n>0){L.textContent=V1?V1.emptyScript:"";for(let m=0;m<n;m++)L.append(A[m],G()),T.nextNode(),t.push({type:2,index:++r});L.append(A[n],G())}}}else if(L.nodeType===8)if(L.data===u1)t.push({type:2,index:r});else{let A=-1;for(;(A=L.data.indexOf(O,A+1))!==-1;)t.push({type:7,index:r}),A+=O.length-1}r++}}static createElement(H,C){let V=P.createElement("template");return V.innerHTML=H,V}};function w(M,H,C=M,V){if(H===f)return H;let L=V!==void 0?C._$Co?.[V]:C._$Cl,r=z(H)?void 0:H._$litDirective$;return L?.constructor!==r&&(L?._$AO?.(!1),r===void 0?L=void 0:(L=new r(M),L._$AT(M,C,V)),V!==void 0?(C._$Co??=[])[V]=L:C._$Cl=L),L!==void 0&&(H=w(M,L._$AS(M,H.values),L,V)),H}var L1=class{constructor(H,C){this._$AV=[],this._$AN=void 0,this._$AD=H,this._$AM=C}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(H){let{el:{content:C},parts:V}=this._$AD,L=(H?.creationScope??P).importNode(C,!0);T.currentNode=L;let r=T.nextNode(),e=0,i=0,t=V[0];for(;t!==void 0;){if(e===t.index){let v;t.type===2?v=new D(r,r.nextSibling,this,H):t.type===1?v=new t.ctor(r,t.name,t.strings,this,H):t.type===6&&(v=new t1(r,this,H)),this._$AV.push(v),t=V[++i]}e!==t?.index&&(r=T.nextNode(),e++)}return T.currentNode=P,L}p(H){let C=0;for(let V of this._$AV)V!==void 0&&(V.strings!==void 0?(V._$AI(H,V,C),C+=V.strings.length-2):V._$AI(H[C])),C++}},D=class M{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(H,C,V,L){this.type=2,this._$AH=p,this._$AN=void 0,this._$AA=H,this._$AB=C,this._$AM=V,this.options=L,this._$Cv=L?.isConnected??!0}get parentNode(){let H=this._$AA.parentNode,C=this._$AM;return C!==void 0&&H?.nodeType===11&&(H=C.parentNode),H}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(H,C=this){H=w(this,H,C),z(H)?H===p||H==null||H===""?(this._$AH!==p&&this._$AR(),this._$AH=p):H!==this._$AH&&H!==f&&this._(H):H._$litType$!==void 0?this.$(H):H.nodeType!==void 0?this.T(H):E1(H)?this.k(H):this._(H)}O(H){return this._$AA.parentNode.insertBefore(H,this._$AB)}T(H){this._$AH!==H&&(this._$AR(),this._$AH=this.O(H))}_(H){this._$AH!==p&&z(this._$AH)?this._$AA.nextSibling.data=H:this.T(P.createTextNode(H)),this._$AH=H}$(H){let{values:C,_$litType$:V}=H,L=typeof V=="number"?this._$AC(H):(V.el===void 0&&(V.el=K.createElement(W1(V.h,V.h[0]),this.options)),V);if(this._$AH?._$AD===L)this._$AH.p(C);else{let r=new L1(L,this),e=r.u(this.options);r.p(C),this.T(e),this._$AH=r}}_$AC(H){let C=D1.get(H.strings);return C===void 0&&D1.set(H.strings,C=new K(H)),C}k(H){s1(this._$AH)||(this._$AH=[],this._$AR());let C=this._$AH,V,L=0;for(let r of H)L===C.length?C.push(V=new M(this.O(G()),this.O(G()),this,this.options)):V=C[L],V._$AI(r),L++;L<C.length&&(this._$AR(V&&V._$AB.nextSibling,L),C.length=L)}_$AR(H=this._$AA.nextSibling,C){for(this._$AP?.(!1,!0,C);H!==this._$AB;){let V=b1(H).nextSibling;b1(H).remove(),H=V}}setConnected(H){this._$AM===void 0&&(this._$Cv=H,this._$AP?.(H))}},F=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(H,C,V,L,r){this.type=1,this._$AH=p,this._$AN=void 0,this.element=H,this.name=C,this._$AM=L,this.options=r,V.length>2||V[0]!==""||V[1]!==""?(this._$AH=Array(V.length-1).fill(new String),this.strings=V):this._$AH=p}_$AI(H,C=this,V,L){let r=this.strings,e=!1;if(r===void 0)H=w(this,H,C,0),e=!z(H)||H!==this._$AH&&H!==f,e&&(this._$AH=H);else{let i=H,t,v;for(H=r[0],t=0;t<r.length-1;t++)v=w(this,i[V+t],C,t),v===f&&(v=this._$AH[t]),e||=!z(v)||v!==this._$AH[t],v===p?H=p:H!==p&&(H+=(v??"")+r[t+1]),this._$AH[t]=v}e&&!L&&this.j(H)}j(H){H===p?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,H??"")}},M1=class extends F{constructor(){super(...arguments),this.type=3}j(H){this.element[this.name]=H===p?void 0:H}},r1=class extends F{constructor(){super(...arguments),this.type=4}j(H){this.element.toggleAttribute(this.name,!!H&&H!==p)}},e1=class extends F{constructor(H,C,V,L,r){super(H,C,V,L,r),this.type=5}_$AI(H,C=this){if((H=w(this,H,C,0)??p)===f)return;let V=this._$AH,L=H===p&&V!==p||H.capture!==V.capture||H.once!==V.once||H.passive!==V.passive,r=H!==p&&(V===p||L);L&&this.element.removeEventListener(this.name,this,V),r&&this.element.addEventListener(this.name,this,H),this._$AH=H}handleEvent(H){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,H):this._$AH.handleEvent(H)}},t1=class{constructor(H,C,V){this.element=H,this.type=6,this._$AN=void 0,this._$AM=C,this.options=V}get _$AU(){return this._$AM._$AU}_$AI(H){w(this,H)}},$1={M:S1,P:O,A:u1,C:1,L:N1,R:L1,D:E1,V:w,I:D,H:F,N:r1,U:e1,B:M1,F:t1},Z2=Z1.litHtmlPolyfillSupport;Z2?.(K,D),(Z1.litHtmlVersions??=[]).push("3.3.3");var I1=(M,H,C)=>{let V=C?.renderBefore??H,L=V._$litPart$;if(L===void 0){let r=C?.renderBefore??null;V._$litPart$=L=new D(H.insertBefore(G(),r),r,void 0,C??{})}return L._$AI(M),L};var h1=globalThis,u=class extends h{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let H=super.createRenderRoot();return this.renderOptions.renderBefore??=H.firstChild,H}update(H){let C=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(H),this._$Do=I1(C,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return f}};u._$litElement$=!0,u.finalized=!0,h1.litElementHydrateSupport?.({LitElement:u});var S2=h1.litElementPolyfillSupport;S2?.({LitElement:u});(h1.litElementVersions??=[]).push("4.2.2");var E=M=>(H,C)=>{C!==void 0?C.addInitializer(()=>{customElements.define(M,H)}):customElements.define(M,H)};var u2={attribute:!0,type:String,converter:U,reflect:!1,hasChanged:H1},s2=(M=u2,H,C)=>{let{kind:V,metadata:L}=C,r=globalThis.litPropertyMetadata.get(L);if(r===void 0&&globalThis.litPropertyMetadata.set(L,r=new Map),V==="setter"&&((M=Object.create(M)).wrapped=!0),r.set(C.name,M),V==="accessor"){let{name:e}=C;return{set(i){let t=H.get.call(this);H.set.call(this,i),this.requestUpdate(e,t,M,!0,i)},init(i){return i!==void 0&&this.C(e,void 0,M,i),i}}}if(V==="setter"){let{name:e}=C;return function(i){let t=this[e];H.call(this,i),this.requestUpdate(e,t,M,!0,i)}}throw Error("Unsupported decorator location: "+V)};function g(M){return(H,C)=>typeof C=="object"?s2(M,H,C):((V,L,r)=>{let e=L.hasOwnProperty(r);return L.constructor.createProperty(r,V),e?Object.getOwnPropertyDescriptor(L,r):void 0})(M,H,C)}function d(M){return g({...M,state:!0,attribute:!1})}var R=(M,H,C)=>(C.configurable=!0,C.enumerable=!0,Reflect.decorate&&typeof H!="object"&&Object.defineProperty(M,H,C),C);function i1(M,H){return(C,V,L)=>{let r=e=>e.renderRoot?.querySelector(M)??null;if(H){let{get:e,set:i}=typeof V=="object"?C:L??(()=>{let t=Symbol();return{get(){return this[t]},set(v){this[t]=v}}})();return R(C,V,{get(){let t=e.call(this);return t===void 0&&(t=r(this),(t!==null||this.hasUpdated)&&i.call(this,t)),t}})}return R(C,V,{get(){return r(this)}})}}var q="scheduler_plus";async function U1(M){return(await M.callWS({type:`${q}/list_schedules`})).schedules}async function Q1(M,H){return(await M.callWS({type:`${q}/create_schedule`,...H})).schedule}async function G1(M,H,C){return(await M.callWS({type:`${q}/update_schedule`,schedule_id:H,...C})).schedule}async function z1(M,H){await M.callWS({type:`${q}/delete_schedule`,schedule_id:H})}async function K1(M){return M.callWS({type:`${q}/get_preferences`})}var q1={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},A1=M=>(...H)=>({_$litDirective$:M,values:H}),_=class{constructor(H){}get _$AU(){return this._$AM._$AU}_$AT(H,C,V){this._$Ct=H,this._$AM=C,this._$Ci=V}_$AS(H,C){return this.update(H,C)}update(H,C){return this.render(...C)}};var{I:c2}=$1,j1=M=>M;var Y1=()=>document.createComment(""),W=(M,H,C)=>{let V=M._$AA.parentNode,L=H===void 0?M._$AB:H._$AA;if(C===void 0){let r=V.insertBefore(Y1(),L),e=V.insertBefore(Y1(),L);C=new c2(r,e,M,M.options)}else{let r=C._$AB.nextSibling,e=C._$AM,i=e!==M;if(i){let t;C._$AQ?.(M),C._$AM=M,C._$AP!==void 0&&(t=M._$AU)!==e._$AU&&C._$AP(t)}if(r!==L||i){let t=C._$AA;for(;t!==r;){let v=j1(t).nextSibling;j1(V).insertBefore(t,L),t=v}}}return C},k=(M,H,C=M)=>(M._$AI(H,C),M),h2={},o1=(M,H=h2)=>M._$AH=H,X1=M=>M._$AH,a1=M=>{M._$AR(),M._$AA.remove()};var J1=A1(class extends _{constructor(){super(...arguments),this.key=p}render(M,H){return this.key=M,H}update(M,[H,C]){return H!==this.key&&(o1(M),this.key=H),C}});var C2=(M,H,C)=>{let V=new Map;for(let L=H;L<=C;L++)V.set(M[L],L);return V},H2=A1(class extends _{constructor(M){if(super(M),M.type!==q1.CHILD)throw Error("repeat() can only be used in text expressions")}dt(M,H,C){let V;C===void 0?C=H:H!==void 0&&(V=H);let L=[],r=[],e=0;for(let i of M)L[e]=V?V(i,e):e,r[e]=C(i,e),e++;return{values:r,keys:L}}render(M,H,C){return this.dt(M,H,C).values}update(M,[H,C,V]){let L=X1(M),{values:r,keys:e}=this.dt(H,C,V);if(!Array.isArray(L))return this.ut=e,r;let i=this.ut??=[],t=[],v,l,A=0,n=L.length-1,m=0,Z=r.length-1;for(;A<=n&&m<=Z;)if(L[A]===null)A++;else if(L[n]===null)n--;else if(i[A]===e[m])t[m]=k(L[A],r[m]),A++,m++;else if(i[n]===e[Z])t[Z]=k(L[n],r[Z]),n--,Z--;else if(i[A]===e[Z])t[Z]=k(L[A],r[Z]),W(M,t[Z+1],L[A]),A++,Z--;else if(i[n]===e[m])t[m]=k(L[n],r[m]),W(M,L[A],L[n]),n--,m++;else if(v===void 0&&(v=C2(e,m,Z),l=C2(i,A,n)),v.has(i[A]))if(v.has(i[n])){let c=l.get(e[m]),v1=c!==void 0?L[c]:null;if(v1===null){let O1=W(M,L[A]);k(O1,r[m]),t[m]=O1}else t[m]=k(v1,r[m]),W(M,L[A],v1),L[c]=null;m++}else a1(L[n]),n--;else a1(L[A]),A++;for(;m<=Z;){let c=W(M,t[Z+1]);k(c,r[m]),t[m++]=c}for(;A<=n;){let c=L[A++];c!==null&&a1(c)}return this.ut=e,o1(M,t),f}});var V2=["light","climate","switch"],d1={light:"Light",climate:"Climate",switch:"Switch"},L2=["fixed","sunrise","sunset"],j={fixed:"Fixed time",sunrise:"Sunrise",sunset:"Sunset",yidcal:"YidCal"},y=["mon","tue","wed","thu","fri","sat","sun"],p1={mon:"Monday",tue:"Tuesday",wed:"Wednesday",thu:"Thursday",fri:"Friday",sat:"Saturday",sun:"Sunday"},M2=["always","include","exclude"],r2={always:"Always",include:"Only on these dates",exclude:"Except these dates"},e2=["shabbos","yom_tov","erev_shabbos","erev_yom_tov"],m1={shabbos:"Shabbos",yom_tov:"Yom Tov",erev_shabbos:"Erev Shabbos",erev_yom_tov:"Erev Yom Tov"};var O2=["heat","cool","heat_cool","auto","dry","fan_only"],f2={heat:"Heat",cool:"Cool",heat_cool:"Heat/Cool",auto:"Auto",dry:"Dry",fan_only:"Fan only"},g2={weekday_days:["mon","tue","wed","thu","fri"],weekend_days:["sat","sun"],working_hours_start:"09:00",working_hours_end:"17:00"},x=class extends u{constructor(){super(...arguments);this._open=!1;this._preferences=g2;this._deviceType="light";this._name="";this._enabled=!0;this._days=[];this._dateMode="always";this._dates=[];this._newDate="";this._dayConditions=[];this._onTime={provider:"fixed",params:{time:"06:00"}};this._offTime={provider:"fixed",params:{time:"21:00"}};this._setBrightness=!1;this._brightnessPct=100;this._useTransition=!1;this._transitionSeconds=0;this._hvacMode="heat";this._useTargetTemperature=!1;this._targetTemperature=70;this._closeDialog=()=>{this._open=!1};this._toggleDay=C=>{this._days=this._days.includes(C)?this._days.filter(V=>V!==C):[...this._days,C]};this._applyDayPreset=C=>{this._days=[...C]};this._applyAfterHoursPreset=()=>{this._days=[...y],this._onTime={provider:"fixed",params:{time:this._preferences.working_hours_end.slice(0,5)}},this._offTime={provider:"fixed",params:{time:this._preferences.working_hours_start.slice(0,5)}}};this._handleDateModeChange=C=>{let V=C.target.value;this._dateMode=V,V==="include"&&(this._days=[...y])};this._addDate=()=>{!this._newDate||this._dates.includes(this._newDate)||(this._dates=[...this._dates,this._newDate].sort(),this._newDate="")};this._removeDate=C=>{this._dates=this._dates.filter(V=>V!==C)};this._toggleDayCondition=C=>{this._dayConditions=this._dayConditions.includes(C)?this._dayConditions.filter(V=>V!==C):[...this._dayConditions,C]};this._save=()=>{let C=this._name.trim();if(!C){this._error="Name is required.";return}if(this._dateMode!=="include"&&this._days.length===0){this._error="At least one day is required.";return}if(this._dateMode!=="always"&&this._dates.length===0&&this._dayConditions.length===0){this._error="At least one date or day condition is required.";return}let V={};this._deviceType==="light"?V={...this._setBrightness?{brightness:Math.round(this._brightnessPct/100*255)}:{},...this._useTransition?{transition:this._transitionSeconds}:{}}:this._deviceType==="climate"&&(V={hvac_mode:this._hvacMode,...this._useTargetTemperature?{target_temperature:this._targetTemperature}:{}}),this._onSave?.({id:this._rule?.id,name:C,enabled:this._enabled,days:this._days,date_mode:this._dateMode,dates:this._dates,day_conditions:this._dayConditions,on_time:this._onTime,off_time:this._offTime,action:V}),this._open=!1}}showDialog(C){let{deviceType:V,rule:L,onSave:r}=C;if(this._deviceType=V,this._rule=L,this._onSave=r,this._loadPreferences(),this._name=L?.name??"",this._enabled=L?.enabled??!0,this._days=L?[...L.days]:[],this._dateMode=L?.date_mode??"always",this._dates=L?[...L.dates]:[],this._newDate="",this._dayConditions=L?[...L.day_conditions]:[],this._onTime=L?.on_time??{provider:"fixed",params:{time:"06:00"}},this._offTime=L?.off_time??{provider:"fixed",params:{time:"21:00"}},V==="light"){this._setBrightness=L?.action.brightness!==void 0;let e=L?.action.brightness??255;this._brightnessPct=Math.round(e/255*100),this._useTransition=L?.action.transition!==void 0,this._transitionSeconds=L?.action.transition??0}else V==="climate"&&(this._hvacMode=L?.action.hvac_mode??"heat",this._useTargetTemperature=L?.action.target_temperature!==void 0,this._targetTemperature=L?.action.target_temperature??70);this._error=void 0,this._open=!0}async _loadPreferences(){try{this._preferences=await K1(this.hass)}catch{}}render(){return this._open?a`
      <ha-dialog open @closed=${this._closeDialog}>
        <div class="form">
          <div class="dialog-title">${this._rule?"Edit rule":"Add rule"}</div>
          ${this._error?a`<div class="error">${this._error}</div>`:p}

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

          <label class="field-label">Days</label>
          <div class="day-presets">
            <button type="button" class="btn" @click=${()=>this._applyDayPreset(y)}>
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
            ${y.map(C=>a`
                <button
                  type="button"
                  class="day-chip ${this._days.includes(C)?"active":""}"
                  ?disabled=${this._dateMode==="include"}
                  @click=${()=>this._toggleDay(C)}
                >
                  ${p1[C].slice(0,3)}
                </button>
              `)}
          </div>

          <label class="field-label" for="date-mode">Date filter</label>
          <select
            id="date-mode"
            class="native-select"
            .value=${this._dateMode}
            @change=${this._handleDateModeChange}
          >
            ${M2.map(C=>a`<option value=${C}>${r2[C]}</option>`)}
          </select>
          ${this._dateMode!=="always"?a`
                <span class="hint">
                  ${this._dateMode==="include"?"This rule only runs on the dates below, regardless of the Days selection.":"This rule follows the Days selection above, except on the dates below - use this to override a recurring rule for one date."}
                </span>
                <div class="dates">
                  ${this._dates.map(C=>a`
                      <div class="date-row">
                        <span>${C}</span>
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

                <label class="field-label">Day conditions (YidCal)</label>
                <div class="days">
                  ${e2.map(C=>a`
                      <button
                        type="button"
                        class="day-chip ${this._dayConditions.includes(C)?"active":""}"
                        @click=${()=>this._toggleDayCondition(C)}
                      >
                        ${m1[C]}
                      </button>
                    `)}
                </div>
                <span class="hint">
                  Reflects YidCal's current state, so this can only be
                  confirmed for today - a future Shabbos/Yom Tov won't show
                  up in "Next event" ahead of time, but the rule still
                  applies correctly once that day arrives.
                </span>
              `:p}

          ${this._renderTimeFields("On time",this._onTime,C=>this._onTime=C)}
          ${this._renderTimeFields("Off time",this._offTime,C=>this._offTime=C)}

          ${this._renderActionFields()}

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
          ${L2.map(r=>a`<option value=${r}>${j[r]}</option>`)}
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
        ${O2.map(C=>a`<option value=${C}>${f2[C]}</option>`)}
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
    `}};x.styles=B`
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
  `,o([g({attribute:!1})],x.prototype,"hass",2),o([d()],x.prototype,"_open",2),o([d()],x.prototype,"_preferences",2),o([d()],x.prototype,"_deviceType",2),o([d()],x.prototype,"_name",2),o([d()],x.prototype,"_enabled",2),o([d()],x.prototype,"_days",2),o([d()],x.prototype,"_dateMode",2),o([d()],x.prototype,"_dates",2),o([d()],x.prototype,"_newDate",2),o([d()],x.prototype,"_dayConditions",2),o([d()],x.prototype,"_onTime",2),o([d()],x.prototype,"_offTime",2),o([d()],x.prototype,"_setBrightness",2),o([d()],x.prototype,"_brightnessPct",2),o([d()],x.prototype,"_useTransition",2),o([d()],x.prototype,"_transitionSeconds",2),o([d()],x.prototype,"_hvacMode",2),o([d()],x.prototype,"_useTargetTemperature",2),o([d()],x.prototype,"_targetTemperature",2),o([d()],x.prototype,"_error",2),x=o([E("scheduler-plus-rule-editor")],x);function k2(M){let[H,C]=M.split(":"),V=Number(H),L=Number(C),r=V>=12?"PM":"AM";return`${V%12===0?12:V%12}:${L.toString().padStart(2,"0")} ${r}`}function t2(M){if(M.provider==="fixed")return k2(M.params.time??"00:00");let H=M.params.offset_minutes??0;return H===0?j[M.provider]:`${j[M.provider]} ${H>0?"+":""}${H}`}var S=class extends u{constructor(){super(...arguments);this._open=!1;this._name="";this._deviceType="light";this._enabled=!0;this._entities=[];this._rules=[];this._saving=!1;this._closeDialog=()=>{this._open=!1};this._handleDeviceTypeChange=C=>{this._deviceType=C.target.value,this._entities=[],this._rules=[]};this._addEntity=C=>{!C||this._entities.includes(C)||(this._entities=[...this._entities,C])};this._removeEntity=C=>{this._entities=this._entities.filter((V,L)=>L!==C)};this._updateEntity=(C,V)=>{if(!V){this._removeEntity(C);return}this._entities=this._entities.map((L,r)=>r===C?V:L)};this._openAddRuleDialog=()=>{this._ruleEditor?.showDialog({deviceType:this._deviceType,onSave:C=>{this._rules=[...this._rules,C]}})};this._openEditRuleDialog=C=>{this._ruleEditor?.showDialog({deviceType:this._deviceType,rule:this._rules[C],onSave:V=>{this._rules=this._rules.map((L,r)=>r===C?V:L)}})};this._removeRule=C=>{let V=this._rules[C];!V||!window.confirm(`Delete rule "${V.name}"?`)||(this._rules=this._rules.filter((L,r)=>r!==C))};this._save=async()=>{let C=this._name.trim();if(!C){this._error="Name is required.";return}if(this._entities.length===0){this._error="At least one entity is required.";return}this._saving=!0,this._error=void 0;try{let V={name:C,device_type:this._deviceType,entities:this._entities,enabled:this._enabled,rules:this._rules};this._schedule?await G1(this.hass,this._schedule.id,V):await Q1(this.hass,V),this._open=!1,this.dispatchEvent(new CustomEvent("schedule-plus-saved"))}catch(V){this._error=V instanceof Error?V.message:String(V)}finally{this._saving=!1}}}showDialog(C){this._schedule=C,this._name=C?.name??"",this._deviceType=C?.device_type??"light",this._enabled=C?.enabled??!0,this._entities=C?[...C.entities]:[],this._rules=C?C.rules.map(V=>({...V})):[],this._error=void 0,this._open=!0}render(){return this._open?a`
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
            ${V2.map(C=>a`<option value=${C}>${d1[C]}</option>`)}
          </select>

          <ha-formfield label="Enabled">
            <ha-switch
              .checked=${this._enabled}
              @change=${C=>{this._enabled=C.target.checked}}
            ></ha-switch>
          </ha-formfield>

          <label class="field-label">Entities</label>
          <div class="entities">
            ${H2(this._entities,C=>C,(C,V)=>a`
                <div class="entity-row">
                  <ha-entity-picker
                    .hass=${this.hass}
                    .value=${C}
                    .includeDomains=${[this._deviceType]}
                    @value-changed=${L=>this._updateEntity(V,L.detail.value)}
                  ></ha-entity-picker>
                  <ha-icon-button
                    .path=${N}
                    label="Remove entity"
                    @click=${()=>this._removeEntity(V)}
                  ></ha-icon-button>
                </div>
              `)}
            ${J1(this._entities.length,a`
                <ha-entity-picker
                  .hass=${this.hass}
                  .includeDomains=${[this._deviceType]}
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
    `:p}_renderRule(C,V){let L=[...C.days].sort((i,t)=>y.indexOf(i)-y.indexOf(t)).map(i=>p1[i].slice(0,3)).join(", "),r=[...C.dates.length>0?[`${C.dates.length} date${C.dates.length===1?"":"s"}`]:[],...C.day_conditions.map(i=>m1[i])],e=r.length===0?"":C.date_mode==="exclude"?` \xB7 except ${r.join(", ")}`:C.date_mode==="include"?` \xB7 only ${r.join(", ")}`:"";return a`
      <li class="rule ${C.enabled?"":"disabled"}">
        <div class="rule-info">
          <span class="rule-name">${C.name}</span>
          <span class="rule-meta">
            ${L} · ${t2(C.on_time)} → ${t2(C.off_time)}${e}
          </span>
        </div>
        <div class="row-actions">
          <ha-icon-button
            .path=${Y}
            label="Edit rule"
            @click=${()=>this._openEditRuleDialog(V)}
          ></ha-icon-button>
          <ha-icon-button
            .path=${N}
            label="Remove rule"
            @click=${()=>this._removeRule(V)}
          ></ha-icon-button>
        </div>
      </li>
    `}};S.styles=B`
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
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--divider-color);
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
  `,o([g({attribute:!1})],S.prototype,"hass",2),o([d()],S.prototype,"_schedule",2),o([d()],S.prototype,"_open",2),o([d()],S.prototype,"_name",2),o([d()],S.prototype,"_deviceType",2),o([d()],S.prototype,"_enabled",2),o([d()],S.prototype,"_entities",2),o([d()],S.prototype,"_rules",2),o([d()],S.prototype,"_saving",2),o([d()],S.prototype,"_error",2),o([i1("scheduler-plus-rule-editor")],S.prototype,"_ruleEditor",2),S=o([E("scheduler-plus-schedule-editor")],S);function y2(M){if(!M.next_event)return;let H=new Date(M.next_event);if(Number.isNaN(H.getTime()))return;let C=M.next_event_action==="off"?"Off":"On",V=H.toLocaleString(void 0,{weekday:"short",hour:"numeric",minute:"2-digit"});return`Next: ${C} ${V}`}var B2="#F2A93B",s=class extends u{constructor(){super(...arguments);this._schedules=[];this._loading=!0;this._openAddDialog=()=>{this._editor?.showDialog()};this._openEditDialog=C=>{this._editor?.showDialog(C)}}static getStubConfig(){return{type:"custom:scheduler-plus-card"}}setConfig(C){this._config=C}getCardSize(){return 2+this._schedules.length}connectedCallback(){super.connectedCallback(),this._refresh()}async _refresh(){this._loading=!0;try{this._schedules=await U1(this.hass),this._error=void 0}catch(C){this._error=C instanceof Error?C.message:String(C)}finally{this._loading=!1}}async _handleDelete(C){window.confirm(`Delete schedule "${C.name}"?`)&&(await z1(this.hass,C.id),await this._refresh())}render(){return a`
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
          fill=${B2}
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
    `}_renderContent(){return this._loading?a`<div class="placeholder">Loading schedules…</div>`:this._error?a`<div class="placeholder error">${this._error}</div>`:this._schedules.length===0?a`<div class="placeholder">No schedules yet.</div>`:a`
      <ul class="schedules">
        ${this._schedules.map(C=>this._renderSchedule(C))}
      </ul>
    `}_renderSchedule(C){let V=C.enabled?y2(C):void 0;return a`
      <li class="schedule ${C.enabled?"":"disabled"}">
        <div class="schedule-info">
          <span class="schedule-name">${C.name}</span>
          <span class="schedule-meta">
            ${d1[C.device_type]} ·
            ${C.entities.length}
            ${C.entities.length===1?"entity":"entities"} ·
            ${C.rules.length}
            ${C.rules.length===1?"rule":"rules"}
          </span>
          ${V?a`<span class="schedule-next">${V}</span>`:p}
        </div>
        <div class="row-actions">
          <ha-icon-button
            .path=${Y}
            label="Edit"
            @click=${()=>this._openEditDialog(C)}
          ></ha-icon-button>
          <ha-icon-button
            .path=${N}
            label="Delete"
            @click=${()=>this._handleDelete(C)}
          ></ha-icon-button>
        </div>
      </li>
    `}};s.styles=B`
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
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--divider-color);
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
  `,o([g({attribute:!1})],s.prototype,"hass",2),o([d()],s.prototype,"_config",2),o([d()],s.prototype,"_schedules",2),o([d()],s.prototype,"_loading",2),o([d()],s.prototype,"_error",2),o([i1("scheduler-plus-schedule-editor")],s.prototype,"_editor",2),s=o([E("scheduler-plus-card")],s);window.customCards=window.customCards??[];window.customCards.push({type:"scheduler-plus-card",name:"Scheduler+",description:"Visual scheduling for lights and climate devices."});export{s as SchedulerPlusCard};
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
