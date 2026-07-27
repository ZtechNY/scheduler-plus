var j1=Object.defineProperty;var X1=Object.getOwnPropertyDescriptor;var v=(M,C,H,V)=>{for(var L=V>1?void 0:V?X1(C,H):C,r=M.length-1,e;r>=0;r--)(e=M[r])&&(L=(V?e(C,H,L):e(L))||L);return V&&L&&j1(C,H,L),L};var U="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z";var l1="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z";var Q=globalThis,G=Q.ShadowRoot&&(Q.ShadyCSS===void 0||Q.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,t1=Symbol(),n1=new WeakMap,R=class{constructor(C,H,V){if(this._$cssResult$=!0,V!==t1)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=C,this.t=H}get styleSheet(){let C=this.o,H=this.t;if(G&&C===void 0){let V=H!==void 0&&H.length===1;V&&(C=n1.get(H)),C===void 0&&((this.o=C=new CSSStyleSheet).replaceSync(this.cssText),V&&n1.set(H,C))}return C}toString(){return this.cssText}},Z1=M=>new R(typeof M=="string"?M:M+"",void 0,t1),D=(M,...C)=>{let H=M.length===1?M[0]:C.reduce((V,L,r)=>V+(e=>{if(e._$cssResult$===!0)return e.cssText;if(typeof e=="number")return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(L)+M[r+1],M[0]);return new R(H,M,t1)},S1=(M,C)=>{if(G)M.adoptedStyleSheets=C.map(H=>H instanceof CSSStyleSheet?H:H.styleSheet);else for(let H of C){let V=document.createElement("style"),L=Q.litNonce;L!==void 0&&V.setAttribute("nonce",L),V.textContent=H.cssText,M.appendChild(V)}},A1=G?M=>M:M=>M instanceof CSSStyleSheet?(C=>{let H="";for(let V of C.cssRules)H+=V.cssText;return Z1(H)})(M):M;var{is:Y1,defineProperty:J1,getOwnPropertyDescriptor:C2,getOwnPropertyNames:H2,getOwnPropertySymbols:V2,getPrototypeOf:L2}=Object,z=globalThis,u1=z.trustedTypes,M2=u1?u1.emptyScript:"",r2=z.reactiveElementPolyfillSupport,E=(M,C)=>M,W={toAttribute(M,C){switch(C){case Boolean:M=M?M2:null;break;case Object:case Array:M=M==null?M:JSON.stringify(M)}return M},fromAttribute(M,C){let H=M;switch(C){case Boolean:H=M!==null;break;case Number:H=M===null?null:Number(M);break;case Object:case Array:try{H=JSON.parse(M)}catch{H=null}}return H}},K=(M,C)=>!Y1(M,C),s1={attribute:!0,type:String,converter:W,reflect:!1,useDefault:!1,hasChanged:K};Symbol.metadata??=Symbol("metadata"),z.litPropertyMetadata??=new WeakMap;var c=class extends HTMLElement{static addInitializer(C){this._$Ei(),(this.l??=[]).push(C)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(C,H=s1){if(H.state&&(H.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(C)&&((H=Object.create(H)).wrapped=!0),this.elementProperties.set(C,H),!H.noAccessor){let V=Symbol(),L=this.getPropertyDescriptor(C,V,H);L!==void 0&&J1(this.prototype,C,L)}}static getPropertyDescriptor(C,H,V){let{get:L,set:r}=C2(this.prototype,C)??{get(){return this[H]},set(e){this[H]=e}};return{get:L,set(e){let A=L?.call(this);r?.call(this,e),this.requestUpdate(C,A,V)},configurable:!0,enumerable:!0}}static getPropertyOptions(C){return this.elementProperties.get(C)??s1}static _$Ei(){if(this.hasOwnProperty(E("elementProperties")))return;let C=L2(this);C.finalize(),C.l!==void 0&&(this.l=[...C.l]),this.elementProperties=new Map(C.elementProperties)}static finalize(){if(this.hasOwnProperty(E("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(E("properties"))){let H=this.properties,V=[...H2(H),...V2(H)];for(let L of V)this.createProperty(L,H[L])}let C=this[Symbol.metadata];if(C!==null){let H=litPropertyMetadata.get(C);if(H!==void 0)for(let[V,L]of H)this.elementProperties.set(V,L)}this._$Eh=new Map;for(let[H,V]of this.elementProperties){let L=this._$Eu(H,V);L!==void 0&&this._$Eh.set(L,H)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(C){let H=[];if(Array.isArray(C)){let V=new Set(C.flat(1/0).reverse());for(let L of V)H.unshift(A1(L))}else C!==void 0&&H.push(A1(C));return H}static _$Eu(C,H){let V=H.attribute;return V===!1?void 0:typeof V=="string"?V:typeof C=="string"?C.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(C=>this.enableUpdating=C),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(C=>C(this))}addController(C){(this._$EO??=new Set).add(C),this.renderRoot!==void 0&&this.isConnected&&C.hostConnected?.()}removeController(C){this._$EO?.delete(C)}_$E_(){let C=new Map,H=this.constructor.elementProperties;for(let V of H.keys())this.hasOwnProperty(V)&&(C.set(V,this[V]),delete this[V]);C.size>0&&(this._$Ep=C)}createRenderRoot(){let C=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return S1(C,this.constructor.elementStyles),C}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(C=>C.hostConnected?.())}enableUpdating(C){}disconnectedCallback(){this._$EO?.forEach(C=>C.hostDisconnected?.())}attributeChangedCallback(C,H,V){this._$AK(C,V)}_$ET(C,H){let V=this.constructor.elementProperties.get(C),L=this.constructor._$Eu(C,V);if(L!==void 0&&V.reflect===!0){let r=(V.converter?.toAttribute!==void 0?V.converter:W).toAttribute(H,V.type);this._$Em=C,r==null?this.removeAttribute(L):this.setAttribute(L,r),this._$Em=null}}_$AK(C,H){let V=this.constructor,L=V._$Eh.get(C);if(L!==void 0&&this._$Em!==L){let r=V.getPropertyOptions(L),e=typeof r.converter=="function"?{fromAttribute:r.converter}:r.converter?.fromAttribute!==void 0?r.converter:W;this._$Em=L;let A=e.fromAttribute(H,r.type);this[L]=A??this._$Ej?.get(L)??A,this._$Em=null}}requestUpdate(C,H,V,L=!1,r){if(C!==void 0){let e=this.constructor;if(L===!1&&(r=this[C]),V??=e.getPropertyOptions(C),!((V.hasChanged??K)(r,H)||V.useDefault&&V.reflect&&r===this._$Ej?.get(C)&&!this.hasAttribute(e._$Eu(C,V))))return;this.C(C,H,V)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(C,H,{useDefault:V,reflect:L,wrapped:r},e){V&&!(this._$Ej??=new Map).has(C)&&(this._$Ej.set(C,e??H??this[C]),r!==!0||e!==void 0)||(this._$AL.has(C)||(this.hasUpdated||V||(H=void 0),this._$AL.set(C,H)),L===!0&&this._$Em!==C&&(this._$Eq??=new Set).add(C))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(H){Promise.reject(H)}let C=this.scheduleUpdate();return C!=null&&await C,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[L,r]of this._$Ep)this[L]=r;this._$Ep=void 0}let V=this.constructor.elementProperties;if(V.size>0)for(let[L,r]of V){let{wrapped:e}=r,A=this[L];e!==!0||this._$AL.has(L)||A===void 0||this.C(L,void 0,r,A)}}let C=!1,H=this._$AL;try{C=this.shouldUpdate(H),C?(this.willUpdate(H),this._$EO?.forEach(V=>V.hostUpdate?.()),this.update(H)):this._$EM()}catch(V){throw C=!1,this._$EM(),V}C&&this._$AE(H)}willUpdate(C){}_$AE(C){this._$EO?.forEach(H=>H.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(C)),this.updated(C)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(C){return!0}update(C){this._$Eq&&=this._$Eq.forEach(H=>this._$ET(H,this[H])),this._$EM()}updated(C){}firstUpdated(C){}};c.elementStyles=[],c.shadowRootOptions={mode:"open"},c[E("elementProperties")]=new Map,c[E("finalized")]=new Map,r2?.({ReactiveElement:c}),(z.reactiveElementVersions??=[]).push("2.1.2");var o1=globalThis,c1=M=>M,q=o1.trustedTypes,O1=q?q.createPolicy("lit-html",{createHTML:M=>M}):void 0,a1="$lit$",O=`lit$${Math.random().toFixed(9).slice(2)}$`,d1="?"+O,e2=`<${d1}>`,B=document,_=()=>B.createComment(""),I=M=>M===null||typeof M!="object"&&typeof M!="function",p1=Array.isArray,P1=M=>p1(M)||typeof M?.[Symbol.iterator]=="function",i1=`[ 	
\f\r]`,N=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,h1=/-->/g,g1=/>/g,f=RegExp(`>|${i1}(?:([^\\s"'>=/]+)(${i1}*=${i1}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),f1=/'/g,k1=/"/g,T1=/^(?:script|style|textarea|title)$/i,m1=M=>(C,...H)=>({_$litType$:M,strings:C,values:H}),Z=m1(1),Z2=m1(2),S2=m1(3),h=Symbol.for("lit-noChange"),p=Symbol.for("lit-nothing"),B1=new WeakMap,k=B.createTreeWalker(B,129);function y1(M,C){if(!p1(M)||!M.hasOwnProperty("raw"))throw Error("invalid template strings array");return O1!==void 0?O1.createHTML(C):C}var w1=(M,C)=>{let H=M.length-1,V=[],L,r=C===2?"<svg>":C===3?"<math>":"",e=N;for(let A=0;A<H;A++){let t=M[A],a,m,i=-1,d=0;for(;d<t.length&&(e.lastIndex=d,m=e.exec(t),m!==null);)d=e.lastIndex,e===N?m[1]==="!--"?e=h1:m[1]!==void 0?e=g1:m[2]!==void 0?(T1.test(m[2])&&(L=RegExp("</"+m[2],"g")),e=f):m[3]!==void 0&&(e=f):e===f?m[0]===">"?(e=L??N,i=-1):m[1]===void 0?i=-2:(i=e.lastIndex-m[2].length,a=m[1],e=m[3]===void 0?f:m[3]==='"'?k1:f1):e===k1||e===f1?e=f:e===h1||e===g1?e=N:(e=f,L=void 0);let o=e===f&&M[A+1].startsWith("/>")?" ":"";r+=e===N?t+e2:i>=0?(V.push(a),t.slice(0,i)+a1+t.slice(i)+O+o):t+O+(i===-2?A:o)}return[y1(M,r+(M[H]||"<?>")+(C===2?"</svg>":C===3?"</math>":"")),V]},$=class M{constructor({strings:C,_$litType$:H},V){let L;this.parts=[];let r=0,e=0,A=C.length-1,t=this.parts,[a,m]=w1(C,H);if(this.el=M.createElement(a,V),k.currentNode=this.el.content,H===2||H===3){let i=this.el.content.firstChild;i.replaceWith(...i.childNodes)}for(;(L=k.nextNode())!==null&&t.length<A;){if(L.nodeType===1){if(L.hasAttributes())for(let i of L.getAttributeNames())if(i.endsWith(a1)){let d=m[e++],o=L.getAttribute(i).split(O),x=/([.?@])?(.*)/.exec(d);t.push({type:1,index:r,name:x[2],strings:o,ctor:x[1]==="."?X:x[1]==="?"?Y:x[1]==="@"?J:T}),L.removeAttribute(i)}else i.startsWith(O)&&(t.push({type:6,index:r}),L.removeAttribute(i));if(T1.test(L.tagName)){let i=L.textContent.split(O),d=i.length-1;if(d>0){L.textContent=q?q.emptyScript:"";for(let o=0;o<d;o++)L.append(i[o],_()),k.nextNode(),t.push({type:2,index:++r});L.append(i[d],_())}}}else if(L.nodeType===8)if(L.data===d1)t.push({type:2,index:r});else{let i=-1;for(;(i=L.data.indexOf(O,i+1))!==-1;)t.push({type:7,index:r}),i+=O.length-1}r++}}static createElement(C,H){let V=B.createElement("template");return V.innerHTML=C,V}};function P(M,C,H=M,V){if(C===h)return C;let L=V!==void 0?H._$Co?.[V]:H._$Cl,r=I(C)?void 0:C._$litDirective$;return L?.constructor!==r&&(L?._$AO?.(!1),r===void 0?L=void 0:(L=new r(M),L._$AT(M,H,V)),V!==void 0?(H._$Co??=[])[V]=L:H._$Cl=L),L!==void 0&&(C=P(M,L._$AS(M,C.values),L,V)),C}var j=class{constructor(C,H){this._$AV=[],this._$AN=void 0,this._$AD=C,this._$AM=H}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(C){let{el:{content:H},parts:V}=this._$AD,L=(C?.creationScope??B).importNode(H,!0);k.currentNode=L;let r=k.nextNode(),e=0,A=0,t=V[0];for(;t!==void 0;){if(e===t.index){let a;t.type===2?a=new w(r,r.nextSibling,this,C):t.type===1?a=new t.ctor(r,t.name,t.strings,this,C):t.type===6&&(a=new C1(r,this,C)),this._$AV.push(a),t=V[++A]}e!==t?.index&&(r=k.nextNode(),e++)}return k.currentNode=B,L}p(C){let H=0;for(let V of this._$AV)V!==void 0&&(V.strings!==void 0?(V._$AI(C,V,H),H+=V.strings.length-2):V._$AI(C[H])),H++}},w=class M{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(C,H,V,L){this.type=2,this._$AH=p,this._$AN=void 0,this._$AA=C,this._$AB=H,this._$AM=V,this.options=L,this._$Cv=L?.isConnected??!0}get parentNode(){let C=this._$AA.parentNode,H=this._$AM;return H!==void 0&&C?.nodeType===11&&(C=H.parentNode),C}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(C,H=this){C=P(this,C,H),I(C)?C===p||C==null||C===""?(this._$AH!==p&&this._$AR(),this._$AH=p):C!==this._$AH&&C!==h&&this._(C):C._$litType$!==void 0?this.$(C):C.nodeType!==void 0?this.T(C):P1(C)?this.k(C):this._(C)}O(C){return this._$AA.parentNode.insertBefore(C,this._$AB)}T(C){this._$AH!==C&&(this._$AR(),this._$AH=this.O(C))}_(C){this._$AH!==p&&I(this._$AH)?this._$AA.nextSibling.data=C:this.T(B.createTextNode(C)),this._$AH=C}$(C){let{values:H,_$litType$:V}=C,L=typeof V=="number"?this._$AC(C):(V.el===void 0&&(V.el=$.createElement(y1(V.h,V.h[0]),this.options)),V);if(this._$AH?._$AD===L)this._$AH.p(H);else{let r=new j(L,this),e=r.u(this.options);r.p(H),this.T(e),this._$AH=r}}_$AC(C){let H=B1.get(C.strings);return H===void 0&&B1.set(C.strings,H=new $(C)),H}k(C){p1(this._$AH)||(this._$AH=[],this._$AR());let H=this._$AH,V,L=0;for(let r of C)L===H.length?H.push(V=new M(this.O(_()),this.O(_()),this,this.options)):V=H[L],V._$AI(r),L++;L<H.length&&(this._$AR(V&&V._$AB.nextSibling,L),H.length=L)}_$AR(C=this._$AA.nextSibling,H){for(this._$AP?.(!1,!0,H);C!==this._$AB;){let V=c1(C).nextSibling;c1(C).remove(),C=V}}setConnected(C){this._$AM===void 0&&(this._$Cv=C,this._$AP?.(C))}},T=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(C,H,V,L,r){this.type=1,this._$AH=p,this._$AN=void 0,this.element=C,this.name=H,this._$AM=L,this.options=r,V.length>2||V[0]!==""||V[1]!==""?(this._$AH=Array(V.length-1).fill(new String),this.strings=V):this._$AH=p}_$AI(C,H=this,V,L){let r=this.strings,e=!1;if(r===void 0)C=P(this,C,H,0),e=!I(C)||C!==this._$AH&&C!==h,e&&(this._$AH=C);else{let A=C,t,a;for(C=r[0],t=0;t<r.length-1;t++)a=P(this,A[V+t],H,t),a===h&&(a=this._$AH[t]),e||=!I(a)||a!==this._$AH[t],a===p?C=p:C!==p&&(C+=(a??"")+r[t+1]),this._$AH[t]=a}e&&!L&&this.j(C)}j(C){C===p?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,C??"")}},X=class extends T{constructor(){super(...arguments),this.type=3}j(C){this.element[this.name]=C===p?void 0:C}},Y=class extends T{constructor(){super(...arguments),this.type=4}j(C){this.element.toggleAttribute(this.name,!!C&&C!==p)}},J=class extends T{constructor(C,H,V,L,r){super(C,H,V,L,r),this.type=5}_$AI(C,H=this){if((C=P(this,C,H,0)??p)===h)return;let V=this._$AH,L=C===p&&V!==p||C.capture!==V.capture||C.once!==V.once||C.passive!==V.passive,r=C!==p&&(V===p||L);L&&this.element.removeEventListener(this.name,this,V),r&&this.element.addEventListener(this.name,this,C),this._$AH=C}handleEvent(C){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,C):this._$AH.handleEvent(C)}},C1=class{constructor(C,H,V){this.element=C,this.type=6,this._$AN=void 0,this._$AM=H,this.options=V}get _$AU(){return this._$AM._$AU}_$AI(C){P(this,C)}},b1={M:a1,P:O,A:d1,C:1,L:w1,R:j,D:P1,V:P,I:w,H:T,N:Y,U:J,B:X,F:C1},t2=o1.litHtmlPolyfillSupport;t2?.($,w),(o1.litHtmlVersions??=[]).push("3.3.3");var F1=(M,C,H)=>{let V=H?.renderBefore??C,L=V._$litPart$;if(L===void 0){let r=H?.renderBefore??null;V._$litPart$=L=new w(C.insertBefore(_(),r),r,void 0,H??{})}return L._$AI(M),L};var v1=globalThis,u=class extends c{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let C=super.createRenderRoot();return this.renderOptions.renderBefore??=C.firstChild,C}update(C){let H=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(C),this._$Do=F1(H,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return h}};u._$litElement$=!0,u.finalized=!0,v1.litElementHydrateSupport?.({LitElement:u});var A2=v1.litElementPolyfillSupport;A2?.({LitElement:u});(v1.litElementVersions??=[]).push("4.2.2");var H1=M=>(C,H)=>{H!==void 0?H.addInitializer(()=>{customElements.define(M,C)}):customElements.define(M,C)};var i2={attribute:!0,type:String,converter:W,reflect:!1,hasChanged:K},o2=(M=i2,C,H)=>{let{kind:V,metadata:L}=H,r=globalThis.litPropertyMetadata.get(L);if(r===void 0&&globalThis.litPropertyMetadata.set(L,r=new Map),V==="setter"&&((M=Object.create(M)).wrapped=!0),r.set(H.name,M),V==="accessor"){let{name:e}=H;return{set(A){let t=C.get.call(this);C.set.call(this,A),this.requestUpdate(e,t,M,!0,A)},init(A){return A!==void 0&&this.C(e,void 0,M,A),A}}}if(V==="setter"){let{name:e}=H;return function(A){let t=this[e];C.call(this,A),this.requestUpdate(e,t,M,!0,A)}}throw Error("Unsupported decorator location: "+V)};function b(M){return(C,H)=>typeof H=="object"?o2(M,C,H):((V,L,r)=>{let e=L.hasOwnProperty(r);return L.constructor.createProperty(r,V),e?Object.getOwnPropertyDescriptor(L,r):void 0})(M,C,H)}function l(M){return b({...M,state:!0,attribute:!1})}var y=(M,C,H)=>(H.configurable=!0,H.enumerable=!0,Reflect.decorate&&typeof C!="object"&&Object.defineProperty(M,C,H),H);function R1(M,C){return(H,V,L)=>{let r=e=>e.renderRoot?.querySelector(M)??null;if(C){let{get:e,set:A}=typeof V=="object"?H:L??(()=>{let t=Symbol();return{get(){return this[t]},set(a){this[t]=a}}})();return y(H,V,{get(){let t=e.call(this);return t===void 0&&(t=r(this),(t!==null||this.hasUpdated)&&A.call(this,t)),t}})}return y(H,V,{get(){return r(this)}})}}var V1="scheduler_plus";async function D1(M){return(await M.callWS({type:`${V1}/list_schedules`})).schedules}async function E1(M,C){return(await M.callWS({type:`${V1}/create_schedule`,...C})).schedule}async function W1(M,C,H){return(await M.callWS({type:`${V1}/update_schedule`,schedule_id:C,...H})).schedule}async function N1(M,C){await M.callWS({type:`${V1}/delete_schedule`,schedule_id:C})}var _1={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},I1=M=>(...C)=>({_$litDirective$:M,values:C}),L1=class{constructor(C){}get _$AU(){return this._$AM._$AU}_$AT(C,H,V){this._$Ct=C,this._$AM=H,this._$Ci=V}_$AS(C,H){return this.update(C,H)}update(C,H){return this.render(...H)}};var{I:a2}=b1,$1=M=>M;var U1=()=>document.createComment(""),F=(M,C,H)=>{let V=M._$AA.parentNode,L=C===void 0?M._$AB:C._$AA;if(H===void 0){let r=V.insertBefore(U1(),L),e=V.insertBefore(U1(),L);H=new a2(r,e,M,M.options)}else{let r=H._$AB.nextSibling,e=H._$AM,A=e!==M;if(A){let t;H._$AQ?.(M),H._$AM=M,H._$AP!==void 0&&(t=M._$AU)!==e._$AU&&H._$AP(t)}if(r!==L||A){let t=H._$AA;for(;t!==r;){let a=$1(t).nextSibling;$1(V).insertBefore(t,L),t=a}}}return H},g=(M,C,H=M)=>(M._$AI(C,H),M),d2={},Q1=(M,C=d2)=>M._$AH=C,G1=M=>M._$AH,M1=M=>{M._$AR(),M._$AA.remove()};var z1=(M,C,H)=>{let V=new Map;for(let L=C;L<=H;L++)V.set(M[L],L);return V},K1=I1(class extends L1{constructor(M){if(super(M),M.type!==_1.CHILD)throw Error("repeat() can only be used in text expressions")}dt(M,C,H){let V;H===void 0?H=C:C!==void 0&&(V=C);let L=[],r=[],e=0;for(let A of M)L[e]=V?V(A,e):e,r[e]=H(A,e),e++;return{values:r,keys:L}}render(M,C,H){return this.dt(M,C,H).values}update(M,[C,H,V]){let L=G1(M),{values:r,keys:e}=this.dt(C,H,V);if(!Array.isArray(L))return this.ut=e,r;let A=this.ut??=[],t=[],a,m,i=0,d=L.length-1,o=0,x=r.length-1;for(;i<=d&&o<=x;)if(L[i]===null)i++;else if(L[d]===null)d--;else if(A[i]===e[o])t[o]=g(L[i],r[o]),i++,o++;else if(A[d]===e[x])t[x]=g(L[d],r[x]),d--,x--;else if(A[i]===e[x])t[x]=g(L[i],r[x]),F(M,t[x+1],L[i]),i++,x--;else if(A[d]===e[o])t[o]=g(L[d],r[o]),F(M,L[i],L[d]),d--,o++;else if(a===void 0&&(a=z1(e,o,x),m=z1(A,i,d)),a.has(A[i]))if(a.has(A[d])){let s=m.get(e[o]),e1=s!==void 0?L[s]:null;if(e1===null){let x1=F(M,L[i]);g(x1,r[o]),t[o]=x1}else t[o]=g(e1,r[o]),F(M,L[i],e1),L[s]=null;o++}else M1(L[d]),d--;else M1(L[i]),i++;for(;o<=x;){let s=F(M,t[x+1]);g(s,r[o]),t[o++]=s}for(;i<=d;){let s=L[i++];s!==null&&M1(s)}return this.ut=e,Q1(M,t),h}});var q1=["light","climate"],r1={light:"Light",climate:"Climate"};var n=class extends u{constructor(){super(...arguments);this._open=!1;this._name="";this._deviceType="light";this._enabled=!0;this._entities=[];this._saving=!1;this._closeDialog=()=>{this._open=!1};this._handleDeviceTypeChange=H=>{this._deviceType=H.target.value,this._entities=[]};this._addEntity=H=>{!H||this._entities.includes(H)||(this._entities=[...this._entities,H])};this._removeEntity=H=>{this._entities=this._entities.filter((V,L)=>L!==H)};this._updateEntity=(H,V)=>{if(!V){this._removeEntity(H);return}this._entities=this._entities.map((L,r)=>r===H?V:L)};this._save=async()=>{let H=this._name.trim();if(!H){this._error="Name is required.";return}if(this._entities.length===0){this._error="At least one entity is required.";return}this._saving=!0,this._error=void 0;try{let V={name:H,device_type:this._deviceType,entities:this._entities,enabled:this._enabled,rules:this._schedule?.rules??[]};this._schedule?await W1(this.hass,this._schedule.id,V):await E1(this.hass,V),this._open=!1,this.dispatchEvent(new CustomEvent("schedule-plus-saved"))}catch(V){this._error=V instanceof Error?V.message:String(V)}finally{this._saving=!1}}}showDialog(H){this._schedule=H,this._name=H?.name??"",this._deviceType=H?.device_type??"light",this._enabled=H?.enabled??!0,this._entities=H?[...H.entities]:[],this._error=void 0,this._open=!0}render(){return this._open?Z`
      <ha-dialog
        open
        .heading=${this._schedule?"Edit schedule":"Add schedule"}
        @closed=${this._closeDialog}
      >
        <div class="form">
          ${this._error?Z`<div class="error">${this._error}</div>`:p}

          <ha-textfield
            label="Name"
            .value=${this._name}
            @input=${H=>{this._name=H.target.value}}
          ></ha-textfield>

          <label class="field-label" for="device-type">Device type</label>
          <select
            id="device-type"
            class="native-select"
            .value=${this._deviceType}
            ?disabled=${this._schedule!==void 0}
            @change=${this._handleDeviceTypeChange}
          >
            ${q1.map(H=>Z`<option value=${H}>${r1[H]}</option>`)}
          </select>

          <ha-formfield label="Enabled">
            <ha-switch
              .checked=${this._enabled}
              @change=${H=>{this._enabled=H.target.checked}}
            ></ha-switch>
          </ha-formfield>

          <label class="field-label">Entities</label>
          <div class="entities">
            ${K1(this._entities,H=>H,(H,V)=>Z`
                <div class="entity-row">
                  <ha-entity-picker
                    .hass=${this.hass}
                    .value=${H}
                    .includeDomains=${[this._deviceType]}
                    @value-changed=${L=>this._updateEntity(V,L.detail.value)}
                  ></ha-entity-picker>
                  <ha-icon-button
                    .path=${U}
                    label="Remove entity"
                    @click=${()=>this._removeEntity(V)}
                  ></ha-icon-button>
                </div>
              `)}
            <ha-entity-picker
              .hass=${this.hass}
              .includeDomains=${[this._deviceType]}
              @value-changed=${H=>this._addEntity(H.detail.value)}
            ></ha-entity-picker>
          </div>
        </div>

        <mwc-button slot="secondaryAction" @click=${this._closeDialog}>
          Cancel
        </mwc-button>
        <mwc-button slot="primaryAction" .disabled=${this._saving} @click=${this._save}>
          Save
        </mwc-button>
      </ha-dialog>
    `:p}};n.styles=D`
    .form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 320px;
    }
    .error {
      color: var(--error-color);
    }
    .field-label {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .native-select {
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
  `,v([b({attribute:!1})],n.prototype,"hass",2),v([l()],n.prototype,"_schedule",2),v([l()],n.prototype,"_open",2),v([l()],n.prototype,"_name",2),v([l()],n.prototype,"_deviceType",2),v([l()],n.prototype,"_enabled",2),v([l()],n.prototype,"_entities",2),v([l()],n.prototype,"_saving",2),v([l()],n.prototype,"_error",2),n=v([H1("scheduler-plus-schedule-editor")],n);var S=class extends u{constructor(){super(...arguments);this._schedules=[];this._loading=!0;this._openAddDialog=()=>{this._editor?.showDialog()};this._openEditDialog=H=>{this._editor?.showDialog(H)}}static getStubConfig(){return{type:"custom:scheduler-plus-card"}}setConfig(H){this._config=H}getCardSize(){return 2+this._schedules.length}connectedCallback(){super.connectedCallback(),this._refresh()}async _refresh(){this._loading=!0;try{this._schedules=await D1(this.hass),this._error=void 0}catch(H){this._error=H instanceof Error?H.message:String(H)}finally{this._loading=!1}}async _handleDelete(H){window.confirm(`Delete schedule "${H.name}"?`)&&(await N1(this.hass,H.id),await this._refresh())}render(){return Z`
      <ha-card .header=${this._config?.title??"Scheduler+"}>
        <div class="content">${this._renderContent()}</div>
        <div class="card-actions">
          <mwc-button @click=${this._openAddDialog}>Add schedule</mwc-button>
        </div>
      </ha-card>
      <scheduler-plus-schedule-editor
        .hass=${this.hass}
        @schedule-plus-saved=${this._refresh}
      ></scheduler-plus-schedule-editor>
    `}_renderContent(){return this._loading?Z`<div class="placeholder">Loading schedules…</div>`:this._error?Z`<div class="placeholder error">${this._error}</div>`:this._schedules.length===0?Z`<div class="placeholder">No schedules yet.</div>`:Z`
      <ul class="schedules">
        ${this._schedules.map(H=>this._renderSchedule(H))}
      </ul>
    `}_renderSchedule(H){return Z`
      <li class="schedule ${H.enabled?"":"disabled"}">
        <div class="schedule-info">
          <span class="schedule-name">${H.name}</span>
          <span class="schedule-meta">
            ${r1[H.device_type]} ·
            ${H.entities.length}
            ${H.entities.length===1?"entity":"entities"} ·
            ${H.rules.length}
            ${H.rules.length===1?"rule":"rules"}
          </span>
        </div>
        <div class="row-actions">
          <ha-icon-button
            .path=${l1}
            label="Edit"
            @click=${()=>this._openEditDialog(H)}
          ></ha-icon-button>
          <ha-icon-button
            .path=${U}
            label="Delete"
            @click=${()=>this._handleDelete(H)}
          ></ha-icon-button>
        </div>
      </li>
    `}};S.styles=D`
    .content {
      padding: 0 16px 16px;
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
    .row-actions {
      display: flex;
    }
    .card-actions {
      display: flex;
      justify-content: flex-end;
      padding: 8px 8px 8px 16px;
    }
  `,v([b({attribute:!1})],S.prototype,"hass",2),v([l()],S.prototype,"_config",2),v([l()],S.prototype,"_schedules",2),v([l()],S.prototype,"_loading",2),v([l()],S.prototype,"_error",2),v([R1("scheduler-plus-schedule-editor")],S.prototype,"_editor",2),S=v([H1("scheduler-plus-card")],S);window.customCards=window.customCards??[];window.customCards.push({type:"scheduler-plus-card",name:"Scheduler+",description:"Visual scheduling for lights and climate devices."});export{S as SchedulerPlusCard};
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

lit-html/directives/repeat.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
