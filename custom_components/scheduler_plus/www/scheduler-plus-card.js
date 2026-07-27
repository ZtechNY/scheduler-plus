var V2=Object.defineProperty;var L2=Object.getOwnPropertyDescriptor;var o=(M,H,C,V)=>{for(var L=V>1?void 0:V?L2(H,C):H,r=M.length-1,e;r>=0;r--)(e=M[r])&&(L=(V?e(H,C,L):e(L))||L);return V&&L&&V2(H,C,L),L};var _="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z";var q="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z";var j=globalThis,Y=j.ShadowRoot&&(j.ShadyCSS===void 0||j.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,p1=Symbol(),c1=new WeakMap,W=class{constructor(H,C,V){if(this._$cssResult$=!0,V!==p1)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=H,this.t=C}get styleSheet(){let H=this.o,C=this.t;if(Y&&H===void 0){let V=C!==void 0&&C.length===1;V&&(H=c1.get(C)),H===void 0&&((this.o=H=new CSSStyleSheet).replaceSync(this.cssText),V&&c1.set(C,H))}return H}toString(){return this.cssText}},O1=M=>new W(typeof M=="string"?M:M+"",void 0,p1),k=(M,...H)=>{let C=M.length===1?M[0]:H.reduce((V,L,r)=>V+(e=>{if(e._$cssResult$===!0)return e.cssText;if(typeof e=="number")return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(L)+M[r+1],M[0]);return new W(C,M,p1)},h1=(M,H)=>{if(Y)M.adoptedStyleSheets=H.map(C=>C instanceof CSSStyleSheet?C:C.styleSheet);else for(let C of H){let V=document.createElement("style"),L=j.litNonce;L!==void 0&&V.setAttribute("nonce",L),V.textContent=C.cssText,M.appendChild(V)}},m1=Y?M=>M:M=>M instanceof CSSStyleSheet?(H=>{let C="";for(let V of H.cssRules)C+=V.cssText;return O1(C)})(M):M;var{is:M2,defineProperty:r2,getOwnPropertyDescriptor:e2,getOwnPropertyNames:t2,getOwnPropertySymbols:i2,getPrototypeOf:A2}=Object,X=globalThis,f1=X.trustedTypes,o2=f1?f1.emptyScript:"",a2=X.reactiveElementPolyfillSupport,N=(M,H)=>M,$={toAttribute(M,H){switch(H){case Boolean:M=M?o2:null;break;case Object:case Array:M=M==null?M:JSON.stringify(M)}return M},fromAttribute(M,H){let C=M;switch(H){case Boolean:C=M!==null;break;case Number:C=M===null?null:Number(M);break;case Object:case Array:try{C=JSON.parse(M)}catch{C=null}}return C}},J=(M,H)=>!M2(M,H),g1={attribute:!0,type:String,converter:$,reflect:!1,useDefault:!1,hasChanged:J};Symbol.metadata??=Symbol("metadata"),X.litPropertyMetadata??=new WeakMap;var O=class extends HTMLElement{static addInitializer(H){this._$Ei(),(this.l??=[]).push(H)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(H,C=g1){if(C.state&&(C.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(H)&&((C=Object.create(C)).wrapped=!0),this.elementProperties.set(H,C),!C.noAccessor){let V=Symbol(),L=this.getPropertyDescriptor(H,V,C);L!==void 0&&r2(this.prototype,H,L)}}static getPropertyDescriptor(H,C,V){let{get:L,set:r}=e2(this.prototype,H)??{get(){return this[C]},set(e){this[C]=e}};return{get:L,set(e){let i=L?.call(this);r?.call(this,e),this.requestUpdate(H,i,V)},configurable:!0,enumerable:!0}}static getPropertyOptions(H){return this.elementProperties.get(H)??g1}static _$Ei(){if(this.hasOwnProperty(N("elementProperties")))return;let H=A2(this);H.finalize(),H.l!==void 0&&(this.l=[...H.l]),this.elementProperties=new Map(H.elementProperties)}static finalize(){if(this.hasOwnProperty(N("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(N("properties"))){let C=this.properties,V=[...t2(C),...i2(C)];for(let L of V)this.createProperty(L,C[L])}let H=this[Symbol.metadata];if(H!==null){let C=litPropertyMetadata.get(H);if(C!==void 0)for(let[V,L]of C)this.elementProperties.set(V,L)}this._$Eh=new Map;for(let[C,V]of this.elementProperties){let L=this._$Eu(C,V);L!==void 0&&this._$Eh.set(L,C)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(H){let C=[];if(Array.isArray(H)){let V=new Set(H.flat(1/0).reverse());for(let L of V)C.unshift(m1(L))}else H!==void 0&&C.push(m1(H));return C}static _$Eu(H,C){let V=C.attribute;return V===!1?void 0:typeof V=="string"?V:typeof H=="string"?H.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(H=>this.enableUpdating=H),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(H=>H(this))}addController(H){(this._$EO??=new Set).add(H),this.renderRoot!==void 0&&this.isConnected&&H.hostConnected?.()}removeController(H){this._$EO?.delete(H)}_$E_(){let H=new Map,C=this.constructor.elementProperties;for(let V of C.keys())this.hasOwnProperty(V)&&(H.set(V,this[V]),delete this[V]);H.size>0&&(this._$Ep=H)}createRenderRoot(){let H=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return h1(H,this.constructor.elementStyles),H}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(H=>H.hostConnected?.())}enableUpdating(H){}disconnectedCallback(){this._$EO?.forEach(H=>H.hostDisconnected?.())}attributeChangedCallback(H,C,V){this._$AK(H,V)}_$ET(H,C){let V=this.constructor.elementProperties.get(H),L=this.constructor._$Eu(H,V);if(L!==void 0&&V.reflect===!0){let r=(V.converter?.toAttribute!==void 0?V.converter:$).toAttribute(C,V.type);this._$Em=H,r==null?this.removeAttribute(L):this.setAttribute(L,r),this._$Em=null}}_$AK(H,C){let V=this.constructor,L=V._$Eh.get(H);if(L!==void 0&&this._$Em!==L){let r=V.getPropertyOptions(L),e=typeof r.converter=="function"?{fromAttribute:r.converter}:r.converter?.fromAttribute!==void 0?r.converter:$;this._$Em=L;let i=e.fromAttribute(C,r.type);this[L]=i??this._$Ej?.get(L)??i,this._$Em=null}}requestUpdate(H,C,V,L=!1,r){if(H!==void 0){let e=this.constructor;if(L===!1&&(r=this[H]),V??=e.getPropertyOptions(H),!((V.hasChanged??J)(r,C)||V.useDefault&&V.reflect&&r===this._$Ej?.get(H)&&!this.hasAttribute(e._$Eu(H,V))))return;this.C(H,C,V)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(H,C,{useDefault:V,reflect:L,wrapped:r},e){V&&!(this._$Ej??=new Map).has(H)&&(this._$Ej.set(H,e??C??this[H]),r!==!0||e!==void 0)||(this._$AL.has(H)||(this.hasUpdated||V||(C=void 0),this._$AL.set(H,C)),L===!0&&this._$Em!==H&&(this._$Eq??=new Set).add(H))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(C){Promise.reject(C)}let H=this.scheduleUpdate();return H!=null&&await H,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[L,r]of this._$Ep)this[L]=r;this._$Ep=void 0}let V=this.constructor.elementProperties;if(V.size>0)for(let[L,r]of V){let{wrapped:e}=r,i=this[L];e!==!0||this._$AL.has(L)||i===void 0||this.C(L,void 0,r,i)}}let H=!1,C=this._$AL;try{H=this.shouldUpdate(C),H?(this.willUpdate(C),this._$EO?.forEach(V=>V.hostUpdate?.()),this.update(C)):this._$EM()}catch(V){throw H=!1,this._$EM(),V}H&&this._$AE(C)}willUpdate(H){}_$AE(H){this._$EO?.forEach(C=>C.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(H)),this.updated(H)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(H){return!0}update(H){this._$Eq&&=this._$Eq.forEach(C=>this._$ET(C,this[C])),this._$EM()}updated(H){}firstUpdated(H){}};O.elementStyles=[],O.shadowRootOptions={mode:"open"},O[N("elementProperties")]=new Map,O[N("finalized")]=new Map,a2?.({ReactiveElement:O}),(X.reactiveElementVersions??=[]).push("2.1.2");var x1=globalThis,k1=M=>M,C1=x1.trustedTypes,B1=C1?C1.createPolicy("lit-html",{createHTML:M=>M}):void 0,l1="$lit$",h=`lit$${Math.random().toFixed(9).slice(2)}$`,n1="?"+h,d2=`<${n1}>`,P=document,U=()=>P.createComment(""),Q=M=>M===null||typeof M!="object"&&typeof M!="function",Z1=Array.isArray,F1=M=>Z1(M)||typeof M?.[Symbol.iterator]=="function",v1=`[ 	
\f\r]`,I=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,y1=/-->/g,P1=/>/g,B=RegExp(`>|${v1}(?:([^\\s"'>=/]+)(${v1}*=${v1}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),T1=/'/g,w1=/"/g,R1=/^(?:script|style|textarea|title)$/i,S1=M=>(H,...C)=>({_$litType$:M,strings:H,values:C}),a=S1(1),y2=S1(2),P2=S1(3),f=Symbol.for("lit-noChange"),p=Symbol.for("lit-nothing"),b1=new WeakMap,y=P.createTreeWalker(P,129);function D1(M,H){if(!Z1(M)||!M.hasOwnProperty("raw"))throw Error("invalid template strings array");return B1!==void 0?B1.createHTML(H):H}var E1=(M,H)=>{let C=M.length-1,V=[],L,r=H===2?"<svg>":H===3?"<math>":"",e=I;for(let i=0;i<C;i++){let t=M[i],v,n,A=-1,x=0;for(;x<t.length&&(e.lastIndex=x,n=e.exec(t),n!==null);)x=e.lastIndex,e===I?n[1]==="!--"?e=y1:n[1]!==void 0?e=P1:n[2]!==void 0?(R1.test(n[2])&&(L=RegExp("</"+n[2],"g")),e=B):n[3]!==void 0&&(e=B):e===B?n[0]===">"?(e=L??I,A=-1):n[1]===void 0?A=-2:(A=e.lastIndex-n[2].length,v=n[1],e=n[3]===void 0?B:n[3]==='"'?w1:T1):e===w1||e===T1?e=B:e===y1||e===P1?e=I:(e=B,L=void 0);let m=e===B&&M[i+1].startsWith("/>")?" ":"";r+=e===I?t+d2:A>=0?(V.push(v),t.slice(0,A)+l1+t.slice(A)+h+m):t+h+(A===-2?i:m)}return[D1(M,r+(M[C]||"<?>")+(H===2?"</svg>":H===3?"</math>":"")),V]},G=class M{constructor({strings:H,_$litType$:C},V){let L;this.parts=[];let r=0,e=0,i=H.length-1,t=this.parts,[v,n]=E1(H,C);if(this.el=M.createElement(v,V),y.currentNode=this.el.content,C===2||C===3){let A=this.el.content.firstChild;A.replaceWith(...A.childNodes)}for(;(L=y.nextNode())!==null&&t.length<i;){if(L.nodeType===1){if(L.hasAttributes())for(let A of L.getAttributeNames())if(A.endsWith(l1)){let x=n[e++],m=L.getAttribute(A).split(h),Z=/([.?@])?(.*)/.exec(x);t.push({type:1,index:r,name:Z[2],strings:m,ctor:Z[1]==="."?V1:Z[1]==="?"?L1:Z[1]==="@"?M1:w}),L.removeAttribute(A)}else A.startsWith(h)&&(t.push({type:6,index:r}),L.removeAttribute(A));if(R1.test(L.tagName)){let A=L.textContent.split(h),x=A.length-1;if(x>0){L.textContent=C1?C1.emptyScript:"";for(let m=0;m<x;m++)L.append(A[m],U()),y.nextNode(),t.push({type:2,index:++r});L.append(A[x],U())}}}else if(L.nodeType===8)if(L.data===n1)t.push({type:2,index:r});else{let A=-1;for(;(A=L.data.indexOf(h,A+1))!==-1;)t.push({type:7,index:r}),A+=h.length-1}r++}}static createElement(H,C){let V=P.createElement("template");return V.innerHTML=H,V}};function T(M,H,C=M,V){if(H===f)return H;let L=V!==void 0?C._$Co?.[V]:C._$Cl,r=Q(H)?void 0:H._$litDirective$;return L?.constructor!==r&&(L?._$AO?.(!1),r===void 0?L=void 0:(L=new r(M),L._$AT(M,C,V)),V!==void 0?(C._$Co??=[])[V]=L:C._$Cl=L),L!==void 0&&(H=T(M,L._$AS(M,H.values),L,V)),H}var H1=class{constructor(H,C){this._$AV=[],this._$AN=void 0,this._$AD=H,this._$AM=C}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(H){let{el:{content:C},parts:V}=this._$AD,L=(H?.creationScope??P).importNode(C,!0);y.currentNode=L;let r=y.nextNode(),e=0,i=0,t=V[0];for(;t!==void 0;){if(e===t.index){let v;t.type===2?v=new F(r,r.nextSibling,this,H):t.type===1?v=new t.ctor(r,t.name,t.strings,this,H):t.type===6&&(v=new r1(r,this,H)),this._$AV.push(v),t=V[++i]}e!==t?.index&&(r=y.nextNode(),e++)}return y.currentNode=P,L}p(H){let C=0;for(let V of this._$AV)V!==void 0&&(V.strings!==void 0?(V._$AI(H,V,C),C+=V.strings.length-2):V._$AI(H[C])),C++}},F=class M{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(H,C,V,L){this.type=2,this._$AH=p,this._$AN=void 0,this._$AA=H,this._$AB=C,this._$AM=V,this.options=L,this._$Cv=L?.isConnected??!0}get parentNode(){let H=this._$AA.parentNode,C=this._$AM;return C!==void 0&&H?.nodeType===11&&(H=C.parentNode),H}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(H,C=this){H=T(this,H,C),Q(H)?H===p||H==null||H===""?(this._$AH!==p&&this._$AR(),this._$AH=p):H!==this._$AH&&H!==f&&this._(H):H._$litType$!==void 0?this.$(H):H.nodeType!==void 0?this.T(H):F1(H)?this.k(H):this._(H)}O(H){return this._$AA.parentNode.insertBefore(H,this._$AB)}T(H){this._$AH!==H&&(this._$AR(),this._$AH=this.O(H))}_(H){this._$AH!==p&&Q(this._$AH)?this._$AA.nextSibling.data=H:this.T(P.createTextNode(H)),this._$AH=H}$(H){let{values:C,_$litType$:V}=H,L=typeof V=="number"?this._$AC(H):(V.el===void 0&&(V.el=G.createElement(D1(V.h,V.h[0]),this.options)),V);if(this._$AH?._$AD===L)this._$AH.p(C);else{let r=new H1(L,this),e=r.u(this.options);r.p(C),this.T(e),this._$AH=r}}_$AC(H){let C=b1.get(H.strings);return C===void 0&&b1.set(H.strings,C=new G(H)),C}k(H){Z1(this._$AH)||(this._$AH=[],this._$AR());let C=this._$AH,V,L=0;for(let r of H)L===C.length?C.push(V=new M(this.O(U()),this.O(U()),this,this.options)):V=C[L],V._$AI(r),L++;L<C.length&&(this._$AR(V&&V._$AB.nextSibling,L),C.length=L)}_$AR(H=this._$AA.nextSibling,C){for(this._$AP?.(!1,!0,C);H!==this._$AB;){let V=k1(H).nextSibling;k1(H).remove(),H=V}}setConnected(H){this._$AM===void 0&&(this._$Cv=H,this._$AP?.(H))}},w=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(H,C,V,L,r){this.type=1,this._$AH=p,this._$AN=void 0,this.element=H,this.name=C,this._$AM=L,this.options=r,V.length>2||V[0]!==""||V[1]!==""?(this._$AH=Array(V.length-1).fill(new String),this.strings=V):this._$AH=p}_$AI(H,C=this,V,L){let r=this.strings,e=!1;if(r===void 0)H=T(this,H,C,0),e=!Q(H)||H!==this._$AH&&H!==f,e&&(this._$AH=H);else{let i=H,t,v;for(H=r[0],t=0;t<r.length-1;t++)v=T(this,i[V+t],C,t),v===f&&(v=this._$AH[t]),e||=!Q(v)||v!==this._$AH[t],v===p?H=p:H!==p&&(H+=(v??"")+r[t+1]),this._$AH[t]=v}e&&!L&&this.j(H)}j(H){H===p?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,H??"")}},V1=class extends w{constructor(){super(...arguments),this.type=3}j(H){this.element[this.name]=H===p?void 0:H}},L1=class extends w{constructor(){super(...arguments),this.type=4}j(H){this.element.toggleAttribute(this.name,!!H&&H!==p)}},M1=class extends w{constructor(H,C,V,L,r){super(H,C,V,L,r),this.type=5}_$AI(H,C=this){if((H=T(this,H,C,0)??p)===f)return;let V=this._$AH,L=H===p&&V!==p||H.capture!==V.capture||H.once!==V.once||H.passive!==V.passive,r=H!==p&&(V===p||L);L&&this.element.removeEventListener(this.name,this,V),r&&this.element.addEventListener(this.name,this,H),this._$AH=H}handleEvent(H){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,H):this._$AH.handleEvent(H)}},r1=class{constructor(H,C,V){this.element=H,this.type=6,this._$AN=void 0,this._$AM=C,this.options=V}get _$AU(){return this._$AM._$AU}_$AI(H){T(this,H)}},_1={M:l1,P:h,A:n1,C:1,L:E1,R:H1,D:F1,V:T,I:F,H:w,N:L1,U:M1,B:V1,F:r1},p2=x1.litHtmlPolyfillSupport;p2?.(G,F),(x1.litHtmlVersions??=[]).push("3.3.3");var W1=(M,H,C)=>{let V=C?.renderBefore??H,L=V._$litPart$;if(L===void 0){let r=C?.renderBefore??null;V._$litPart$=L=new F(H.insertBefore(U(),r),r,void 0,C??{})}return L._$AI(M),L};var u1=globalThis,u=class extends O{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let H=super.createRenderRoot();return this.renderOptions.renderBefore??=H.firstChild,H}update(H){let C=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(H),this._$Do=W1(C,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return f}};u._$litElement$=!0,u.finalized=!0,u1.litElementHydrateSupport?.({LitElement:u});var m2=u1.litElementPolyfillSupport;m2?.({LitElement:u});(u1.litElementVersions??=[]).push("4.2.2");var R=M=>(H,C)=>{C!==void 0?C.addInitializer(()=>{customElements.define(M,H)}):customElements.define(M,H)};var v2={attribute:!0,type:String,converter:$,reflect:!1,hasChanged:J},x2=(M=v2,H,C)=>{let{kind:V,metadata:L}=C,r=globalThis.litPropertyMetadata.get(L);if(r===void 0&&globalThis.litPropertyMetadata.set(L,r=new Map),V==="setter"&&((M=Object.create(M)).wrapped=!0),r.set(C.name,M),V==="accessor"){let{name:e}=C;return{set(i){let t=H.get.call(this);H.set.call(this,i),this.requestUpdate(e,t,M,!0,i)},init(i){return i!==void 0&&this.C(e,void 0,M,i),i}}}if(V==="setter"){let{name:e}=C;return function(i){let t=this[e];H.call(this,i),this.requestUpdate(e,t,M,!0,i)}}throw Error("Unsupported decorator location: "+V)};function D(M){return(H,C)=>typeof C=="object"?x2(M,H,C):((V,L,r)=>{let e=L.hasOwnProperty(r);return L.constructor.createProperty(r,V),e?Object.getOwnPropertyDescriptor(L,r):void 0})(M,H,C)}function d(M){return D({...M,state:!0,attribute:!1})}var b=(M,H,C)=>(C.configurable=!0,C.enumerable=!0,Reflect.decorate&&typeof H!="object"&&Object.defineProperty(M,H,C),C);function e1(M,H){return(C,V,L)=>{let r=e=>e.renderRoot?.querySelector(M)??null;if(H){let{get:e,set:i}=typeof V=="object"?C:L??(()=>{let t=Symbol();return{get(){return this[t]},set(v){this[t]=v}}})();return b(C,V,{get(){let t=e.call(this);return t===void 0&&(t=r(this),(t!==null||this.hasUpdated)&&i.call(this,t)),t}})}return b(C,V,{get(){return r(this)}})}}var t1="scheduler_plus";async function N1(M){return(await M.callWS({type:`${t1}/list_schedules`})).schedules}async function $1(M,H){return(await M.callWS({type:`${t1}/create_schedule`,...H})).schedule}async function I1(M,H,C){return(await M.callWS({type:`${t1}/update_schedule`,schedule_id:H,...C})).schedule}async function U1(M,H){await M.callWS({type:`${t1}/delete_schedule`,schedule_id:H})}var Q1={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},G1=M=>(...H)=>({_$litDirective$:M,values:H}),i1=class{constructor(H){}get _$AU(){return this._$AM._$AU}_$AT(H,C,V){this._$Ct=H,this._$AM=C,this._$Ci=V}_$AS(H,C){return this.update(H,C)}update(H,C){return this.render(...C)}};var{I:l2}=_1,z1=M=>M;var K1=()=>document.createComment(""),E=(M,H,C)=>{let V=M._$AA.parentNode,L=H===void 0?M._$AB:H._$AA;if(C===void 0){let r=V.insertBefore(K1(),L),e=V.insertBefore(K1(),L);C=new l2(r,e,M,M.options)}else{let r=C._$AB.nextSibling,e=C._$AM,i=e!==M;if(i){let t;C._$AQ?.(M),C._$AM=M,C._$AP!==void 0&&(t=M._$AU)!==e._$AU&&C._$AP(t)}if(r!==L||i){let t=C._$AA;for(;t!==r;){let v=z1(t).nextSibling;z1(V).insertBefore(t,L),t=v}}}return C},g=(M,H,C=M)=>(M._$AI(H,C),M),n2={},q1=(M,H=n2)=>M._$AH=H,j1=M=>M._$AH,A1=M=>{M._$AR(),M._$AA.remove()};var Y1=(M,H,C)=>{let V=new Map;for(let L=H;L<=C;L++)V.set(M[L],L);return V},X1=G1(class extends i1{constructor(M){if(super(M),M.type!==Q1.CHILD)throw Error("repeat() can only be used in text expressions")}dt(M,H,C){let V;C===void 0?C=H:H!==void 0&&(V=H);let L=[],r=[],e=0;for(let i of M)L[e]=V?V(i,e):e,r[e]=C(i,e),e++;return{values:r,keys:L}}render(M,H,C){return this.dt(M,H,C).values}update(M,[H,C,V]){let L=j1(M),{values:r,keys:e}=this.dt(H,C,V);if(!Array.isArray(L))return this.ut=e,r;let i=this.ut??=[],t=[],v,n,A=0,x=L.length-1,m=0,Z=r.length-1;for(;A<=x&&m<=Z;)if(L[A]===null)A++;else if(L[x]===null)x--;else if(i[A]===e[m])t[m]=g(L[A],r[m]),A++,m++;else if(i[x]===e[Z])t[Z]=g(L[x],r[Z]),x--,Z--;else if(i[A]===e[Z])t[Z]=g(L[A],r[Z]),E(M,t[Z+1],L[A]),A++,Z--;else if(i[x]===e[m])t[m]=g(L[x],r[m]),E(M,L[A],L[x]),x--,m++;else if(v===void 0&&(v=Y1(e,m,Z),n=Y1(i,A,x)),v.has(i[A]))if(v.has(i[x])){let c=n.get(e[m]),d1=c!==void 0?L[c]:null;if(d1===null){let s1=E(M,L[A]);g(s1,r[m]),t[m]=s1}else t[m]=g(d1,r[m]),E(M,L[A],d1),L[c]=null;m++}else A1(L[x]),x--;else A1(L[A]),A++;for(;m<=Z;){let c=E(M,t[Z+1]);g(c,r[m]),t[m++]=c}for(;A<=x;){let c=L[A++];c!==null&&A1(c)}return this.ut=e,q1(M,t),f}});var J1=["light","climate"],o1={light:"Light",climate:"Climate"},C2=["fixed","sunrise","sunset"],z={fixed:"Fixed time",sunrise:"Sunrise",sunset:"Sunset",yidcal:"YidCal"},K=["mon","tue","wed","thu","fri","sat","sun"],a1={mon:"Monday",tue:"Tuesday",wed:"Wednesday",thu:"Thursday",fri:"Friday",sat:"Saturday",sun:"Sunday"};var Z2=["heat","cool","heat_cool","auto","dry","fan_only"],S2={heat:"Heat",cool:"Cool",heat_cool:"Heat/Cool",auto:"Auto",dry:"Dry",fan_only:"Fan only"},l=class extends u{constructor(){super(...arguments);this._open=!1;this._deviceType="light";this._name="";this._enabled=!0;this._days=[];this._onTime={provider:"fixed",params:{time:"06:00"}};this._offTime={provider:"fixed",params:{time:"21:00"}};this._setBrightness=!1;this._brightnessPct=100;this._useTransition=!1;this._transitionSeconds=0;this._hvacMode="heat";this._useTargetTemperature=!1;this._targetTemperature=70;this._closeDialog=()=>{this._open=!1};this._toggleDay=C=>{this._days=this._days.includes(C)?this._days.filter(V=>V!==C):[...this._days,C]};this._save=()=>{let C=this._name.trim();if(!C){this._error="Name is required.";return}if(this._days.length===0){this._error="At least one day is required.";return}let V=this._deviceType==="light"?{...this._setBrightness?{brightness:Math.round(this._brightnessPct/100*255)}:{},...this._useTransition?{transition:this._transitionSeconds}:{}}:{hvac_mode:this._hvacMode,...this._useTargetTemperature?{target_temperature:this._targetTemperature}:{}};this._onSave?.({id:this._rule?.id,name:C,enabled:this._enabled,days:this._days,on_time:this._onTime,off_time:this._offTime,action:V}),this._open=!1}}showDialog(C){let{deviceType:V,rule:L,onSave:r}=C;if(this._deviceType=V,this._rule=L,this._onSave=r,this._name=L?.name??"",this._enabled=L?.enabled??!0,this._days=L?[...L.days]:[],this._onTime=L?.on_time??{provider:"fixed",params:{time:"06:00"}},this._offTime=L?.off_time??{provider:"fixed",params:{time:"21:00"}},V==="light"){this._setBrightness=L?.action.brightness!==void 0;let e=L?.action.brightness??255;this._brightnessPct=Math.round(e/255*100),this._useTransition=L?.action.transition!==void 0,this._transitionSeconds=L?.action.transition??0}else this._hvacMode=L?.action.hvac_mode??"heat",this._useTargetTemperature=L?.action.target_temperature!==void 0,this._targetTemperature=L?.action.target_temperature??70;this._error=void 0,this._open=!0}render(){return this._open?a`
      <ha-dialog open @closed=${this._closeDialog}>
        <div class="form">
          <div class="dialog-title">${this._rule?"Edit rule":"Add rule"}</div>
          ${this._error?a`<div class="error">${this._error}</div>`:p}

          <ha-textfield
            label="Name"
            .value=${this._name}
            @input=${C=>{this._name=C.target.value}}
          ></ha-textfield>

          <ha-formfield label="Enabled">
            <ha-switch
              .checked=${this._enabled}
              @change=${C=>{this._enabled=C.target.checked}}
            ></ha-switch>
          </ha-formfield>

          <label class="field-label">Days</label>
          <div class="days">
            ${K.map(C=>a`
                <button
                  type="button"
                  class="day-chip ${this._days.includes(C)?"active":""}"
                  @click=${()=>this._toggleDay(C)}
                >
                  ${a1[C].slice(0,3)}
                </button>
              `)}
          </div>

          ${this._renderTimeFields("On time",this._onTime,C=>this._onTime=C)}
          ${this._renderTimeFields("Off time",this._offTime,C=>this._offTime=C)}

          ${this._deviceType==="light"?this._renderLightAction():this._renderClimateAction()}

          <div class="dialog-actions">
            <mwc-button @click=${this._closeDialog}>Cancel</mwc-button>
            <mwc-button @click=${this._save}>Save</mwc-button>
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
          ${C2.map(r=>a`<option value=${r}>${z[r]}</option>`)}
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
            <ha-textfield
              label="Fade duration (seconds)"
              type="number"
              .value=${String(this._transitionSeconds)}
              @input=${C=>{this._transitionSeconds=Number(C.target.value)||0}}
            ></ha-textfield>
          `:p}
    `}_renderClimateAction(){return a`
      <label class="field-label" for="hvac-mode">HVAC mode</label>
      <select
        id="hvac-mode"
        class="native-select"
        .value=${this._hvacMode}
        @change=${C=>{this._hvacMode=C.target.value}}
      >
        ${Z2.map(C=>a`<option value=${C}>${S2[C]}</option>`)}
      </select>

      <ha-formfield label="Set target temperature">
        <ha-switch
          .checked=${this._useTargetTemperature}
          @change=${C=>{this._useTargetTemperature=C.target.checked}}
        ></ha-switch>
      </ha-formfield>
      ${this._useTargetTemperature?a`
            <ha-textfield
              label="Target temperature"
              type="number"
              .value=${String(this._targetTemperature)}
              @input=${C=>{this._targetTemperature=Number(C.target.value)||0}}
            ></ha-textfield>
          `:p}
    `}};l.styles=k`
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
    .time-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .hint {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
  `,o([d()],l.prototype,"_open",2),o([d()],l.prototype,"_deviceType",2),o([d()],l.prototype,"_name",2),o([d()],l.prototype,"_enabled",2),o([d()],l.prototype,"_days",2),o([d()],l.prototype,"_onTime",2),o([d()],l.prototype,"_offTime",2),o([d()],l.prototype,"_setBrightness",2),o([d()],l.prototype,"_brightnessPct",2),o([d()],l.prototype,"_useTransition",2),o([d()],l.prototype,"_transitionSeconds",2),o([d()],l.prototype,"_hvacMode",2),o([d()],l.prototype,"_useTargetTemperature",2),o([d()],l.prototype,"_targetTemperature",2),o([d()],l.prototype,"_error",2),l=o([R("scheduler-plus-rule-editor")],l);function u2(M){let[H,C]=M.split(":"),V=Number(H),L=Number(C),r=V>=12?"PM":"AM";return`${V%12===0?12:V%12}:${L.toString().padStart(2,"0")} ${r}`}function H2(M){if(M.provider==="fixed")return u2(M.params.time??"00:00");let H=M.params.offset_minutes??0;return H===0?z[M.provider]:`${z[M.provider]} ${H>0?"+":""}${H}`}var S=class extends u{constructor(){super(...arguments);this._open=!1;this._name="";this._deviceType="light";this._enabled=!0;this._entities=[];this._rules=[];this._saving=!1;this._closeDialog=()=>{this._open=!1};this._handleDeviceTypeChange=C=>{this._deviceType=C.target.value,this._entities=[],this._rules=[]};this._addEntity=C=>{!C||this._entities.includes(C)||(this._entities=[...this._entities,C])};this._removeEntity=C=>{this._entities=this._entities.filter((V,L)=>L!==C)};this._updateEntity=(C,V)=>{if(!V){this._removeEntity(C);return}this._entities=this._entities.map((L,r)=>r===C?V:L)};this._openAddRuleDialog=()=>{this._ruleEditor?.showDialog({deviceType:this._deviceType,onSave:C=>{this._rules=[...this._rules,C]}})};this._openEditRuleDialog=C=>{this._ruleEditor?.showDialog({deviceType:this._deviceType,rule:this._rules[C],onSave:V=>{this._rules=this._rules.map((L,r)=>r===C?V:L)}})};this._removeRule=C=>{let V=this._rules[C];!V||!window.confirm(`Delete rule "${V.name}"?`)||(this._rules=this._rules.filter((L,r)=>r!==C))};this._save=async()=>{let C=this._name.trim();if(!C){this._error="Name is required.";return}if(this._entities.length===0){this._error="At least one entity is required.";return}this._saving=!0,this._error=void 0;try{let V={name:C,device_type:this._deviceType,entities:this._entities,enabled:this._enabled,rules:this._rules};this._schedule?await I1(this.hass,this._schedule.id,V):await $1(this.hass,V),this._open=!1,this.dispatchEvent(new CustomEvent("schedule-plus-saved"))}catch(V){this._error=V instanceof Error?V.message:String(V)}finally{this._saving=!1}}}showDialog(C){this._schedule=C,this._name=C?.name??"",this._deviceType=C?.device_type??"light",this._enabled=C?.enabled??!0,this._entities=C?[...C.entities]:[],this._rules=C?C.rules.map(V=>({...V})):[],this._error=void 0,this._open=!0}render(){return this._open?a`
      <ha-dialog open @closed=${this._closeDialog}>
        <div class="form">
          <div class="dialog-title">
            ${this._schedule?"Edit schedule":"Add schedule"}
          </div>
          ${this._error?a`<div class="error">${this._error}</div>`:p}

          <ha-textfield
            label="Name"
            .value=${this._name}
            @input=${C=>{this._name=C.target.value}}
          ></ha-textfield>

          <label class="field-label" for="device-type">Device type</label>
          <select
            id="device-type"
            class="native-select"
            .value=${this._deviceType}
            ?disabled=${this._schedule!==void 0}
            @change=${this._handleDeviceTypeChange}
          >
            ${J1.map(C=>a`<option value=${C}>${o1[C]}</option>`)}
          </select>

          <ha-formfield label="Enabled">
            <ha-switch
              .checked=${this._enabled}
              @change=${C=>{this._enabled=C.target.checked}}
            ></ha-switch>
          </ha-formfield>

          <label class="field-label">Entities</label>
          <div class="entities">
            ${X1(this._entities,C=>C,(C,V)=>a`
                <div class="entity-row">
                  <ha-entity-picker
                    .hass=${this.hass}
                    .value=${C}
                    .includeDomains=${[this._deviceType]}
                    @value-changed=${L=>this._updateEntity(V,L.detail.value)}
                  ></ha-entity-picker>
                  <ha-icon-button
                    .path=${_}
                    label="Remove entity"
                    @click=${()=>this._removeEntity(V)}
                  ></ha-icon-button>
                </div>
              `)}
            <ha-entity-picker
              .hass=${this.hass}
              .includeDomains=${[this._deviceType]}
              @value-changed=${C=>this._addEntity(C.detail.value)}
            ></ha-entity-picker>
          </div>

          <div class="rules-header">
            <label class="field-label">Rules</label>
            <mwc-button @click=${this._openAddRuleDialog}>Add rule</mwc-button>
          </div>
          ${this._rules.length===0?a`<div class="placeholder">No rules yet.</div>`:a`
                <ul class="rules">
                  ${this._rules.map((C,V)=>this._renderRule(C,V))}
                </ul>
              `}

          <div class="dialog-actions">
            <mwc-button @click=${this._closeDialog}>Cancel</mwc-button>
            <mwc-button .disabled=${this._saving} @click=${this._save}>Save</mwc-button>
          </div>
        </div>
      </ha-dialog>
      <scheduler-plus-rule-editor></scheduler-plus-rule-editor>
    `:p}_renderRule(C,V){let L=[...C.days].sort((r,e)=>K.indexOf(r)-K.indexOf(e)).map(r=>a1[r].slice(0,3)).join(", ");return a`
      <li class="rule ${C.enabled?"":"disabled"}">
        <div class="rule-info">
          <span class="rule-name">${C.name}</span>
          <span class="rule-meta">
            ${L} · ${H2(C.on_time)} → ${H2(C.off_time)}
          </span>
        </div>
        <div class="row-actions">
          <ha-icon-button
            .path=${q}
            label="Edit rule"
            @click=${()=>this._openEditRuleDialog(V)}
          ></ha-icon-button>
          <ha-icon-button
            .path=${_}
            label="Remove rule"
            @click=${()=>this._removeRule(V)}
          ></ha-icon-button>
        </div>
      </li>
    `}};S.styles=k`
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
  `,o([D({attribute:!1})],S.prototype,"hass",2),o([d()],S.prototype,"_schedule",2),o([d()],S.prototype,"_open",2),o([d()],S.prototype,"_name",2),o([d()],S.prototype,"_deviceType",2),o([d()],S.prototype,"_enabled",2),o([d()],S.prototype,"_entities",2),o([d()],S.prototype,"_rules",2),o([d()],S.prototype,"_saving",2),o([d()],S.prototype,"_error",2),o([e1("scheduler-plus-rule-editor")],S.prototype,"_ruleEditor",2),S=o([R("scheduler-plus-schedule-editor")],S);function s2(M){if(!M||M.state==="unknown"||M.state==="unavailable")return;let H=new Date(M.state);if(Number.isNaN(H.getTime()))return;let C=M.attributes.action==="off"?"Off":"On",V=H.toLocaleString(void 0,{weekday:"short",hour:"numeric",minute:"2-digit"});return`Next: ${C} ${V}`}var c2="#F2A93B",s=class extends u{constructor(){super(...arguments);this._schedules=[];this._loading=!0;this._openAddDialog=()=>{this._editor?.showDialog()};this._openEditDialog=C=>{this._editor?.showDialog(C)}}static getStubConfig(){return{type:"custom:scheduler-plus-card"}}setConfig(C){this._config=C}getCardSize(){return 2+this._schedules.length}connectedCallback(){super.connectedCallback(),this._refresh()}async _refresh(){this._loading=!0;try{this._schedules=await N1(this.hass),this._error=void 0}catch(C){this._error=C instanceof Error?C.message:String(C)}finally{this._loading=!1}}async _handleDelete(C){window.confirm(`Delete schedule "${C.name}"?`)&&(await U1(this.hass,C.id),await this._refresh())}_nextEventFor(C){let V=Object.values(this.hass.entities??{}).find(L=>L.unique_id===`${C}_next_event`)?.entity_id;return V?this.hass.states[V]:void 0}render(){return a`
      <ha-card>
        <div class="header">
          ${this._renderBrandMark()}
          <span>${this._config?.title??"Scheduler+"}</span>
        </div>
        <div class="content">${this._renderContent()}</div>
        <div class="card-actions">
          <mwc-button @click=${this._openAddDialog}>Add schedule</mwc-button>
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
          fill=${c2}
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
    `}_renderSchedule(C){let V=C.enabled?s2(this._nextEventFor(C.id)):void 0;return a`
      <li class="schedule ${C.enabled?"":"disabled"}">
        <div class="schedule-info">
          <span class="schedule-name">${C.name}</span>
          <span class="schedule-meta">
            ${o1[C.device_type]} ·
            ${C.entities.length}
            ${C.entities.length===1?"entity":"entities"} ·
            ${C.rules.length}
            ${C.rules.length===1?"rule":"rules"}
          </span>
          ${V?a`<span class="schedule-next">${V}</span>`:p}
        </div>
        <div class="row-actions">
          <ha-icon-button
            .path=${q}
            label="Edit"
            @click=${()=>this._openEditDialog(C)}
          ></ha-icon-button>
          <ha-icon-button
            .path=${_}
            label="Delete"
            @click=${()=>this._handleDelete(C)}
          ></ha-icon-button>
        </div>
      </li>
    `}};s.styles=k`
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
  `,o([D({attribute:!1})],s.prototype,"hass",2),o([d()],s.prototype,"_config",2),o([d()],s.prototype,"_schedules",2),o([d()],s.prototype,"_loading",2),o([d()],s.prototype,"_error",2),o([e1("scheduler-plus-schedule-editor")],s.prototype,"_editor",2),s=o([R("scheduler-plus-card")],s);window.customCards=window.customCards??[];window.customCards.push({type:"scheduler-plus-card",name:"Scheduler+",description:"Visual scheduling for lights and climate devices."});export{s as SchedulerPlusCard};
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
