var i5=Object.defineProperty;var a5=Object.getOwnPropertyDescriptor;var t=(L,V,C,H)=>{for(var e=H>1?void 0:H?a5(V,C):V,M=L.length-1,i;M>=0;M--)(i=L[M])&&(e=(H?i(V,C,e):i(e))||e);return H&&e&&i5(V,C,e),e};var h1=globalThis,g1=h1.ShadowRoot&&(h1.ShadyCSS===void 0||h1.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,G1=Symbol(),p2=new WeakMap,n1=class{constructor(V,C,H){if(this._$cssResult$=!0,H!==G1)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=V,this.t=C}get styleSheet(){let V=this.o,C=this.t;if(g1&&V===void 0){let H=C!==void 0&&C.length===1;H&&(V=p2.get(C)),V===void 0&&((this.o=V=new CSSStyleSheet).replaceSync(this.cssText),H&&p2.set(C,V))}return V}toString(){return this.cssText}},l2=L=>new n1(typeof L=="string"?L:L+"",void 0,G1),x=(L,...V)=>{let C=L.length===1?L[0]:V.reduce((H,e,M)=>H+(i=>{if(i._$cssResult$===!0)return i.cssText;if(typeof i=="number")return i;throw Error("Value passed to 'css' function must be a 'css' function result: "+i+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(e)+L[M+1],L[0]);return new n1(C,L,G1)},m2=(L,V)=>{if(g1)L.adoptedStyleSheets=V.map(C=>C instanceof CSSStyleSheet?C:C.styleSheet);else for(let C of V){let H=document.createElement("style"),e=h1.litNonce;e!==void 0&&H.setAttribute("nonce",e),H.textContent=C.cssText,L.appendChild(H)}},Q1=g1?L=>L:L=>L instanceof CSSStyleSheet?(V=>{let C="";for(let H of V.cssRules)C+=H.cssText;return l2(C)})(L):L;var{is:o5,defineProperty:A5,getOwnPropertyDescriptor:d5,getOwnPropertyNames:n5,getOwnPropertySymbols:p5,getPrototypeOf:l5}=Object,f1=globalThis,v2=f1.trustedTypes,m5=v2?v2.emptyScript:"",v5=f1.reactiveElementPolyfillSupport,p1=(L,V)=>L,l1={toAttribute(L,V){switch(V){case Boolean:L=L?m5:null;break;case Object:case Array:L=L==null?L:JSON.stringify(L)}return L},fromAttribute(L,V){let C=L;switch(V){case Boolean:C=L!==null;break;case Number:C=L===null?null:Number(L);break;case Object:case Array:try{C=JSON.parse(L)}catch{C=null}}return C}},O1=(L,V)=>!o5(L,V),s2={attribute:!0,type:String,converter:l1,reflect:!1,useDefault:!1,hasChanged:O1};Symbol.metadata??=Symbol("metadata"),f1.litPropertyMetadata??=new WeakMap;var E=class extends HTMLElement{static addInitializer(V){this._$Ei(),(this.l??=[]).push(V)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(V,C=s2){if(C.state&&(C.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(V)&&((C=Object.create(C)).wrapped=!0),this.elementProperties.set(V,C),!C.noAccessor){let H=Symbol(),e=this.getPropertyDescriptor(V,H,C);e!==void 0&&A5(this.prototype,V,e)}}static getPropertyDescriptor(V,C,H){let{get:e,set:M}=d5(this.prototype,V)??{get(){return this[C]},set(i){this[C]=i}};return{get:e,set(i){let n=e?.call(this);M?.call(this,i),this.requestUpdate(V,n,H)},configurable:!0,enumerable:!0}}static getPropertyOptions(V){return this.elementProperties.get(V)??s2}static _$Ei(){if(this.hasOwnProperty(p1("elementProperties")))return;let V=l5(this);V.finalize(),V.l!==void 0&&(this.l=[...V.l]),this.elementProperties=new Map(V.elementProperties)}static finalize(){if(this.hasOwnProperty(p1("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(p1("properties"))){let C=this.properties,H=[...n5(C),...p5(C)];for(let e of H)this.createProperty(e,C[e])}let V=this[Symbol.metadata];if(V!==null){let C=litPropertyMetadata.get(V);if(C!==void 0)for(let[H,e]of C)this.elementProperties.set(H,e)}this._$Eh=new Map;for(let[C,H]of this.elementProperties){let e=this._$Eu(C,H);e!==void 0&&this._$Eh.set(e,C)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(V){let C=[];if(Array.isArray(V)){let H=new Set(V.flat(1/0).reverse());for(let e of H)C.unshift(Q1(e))}else V!==void 0&&C.push(Q1(V));return C}static _$Eu(V,C){let H=C.attribute;return H===!1?void 0:typeof H=="string"?H:typeof V=="string"?V.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(V=>this.enableUpdating=V),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(V=>V(this))}addController(V){(this._$EO??=new Set).add(V),this.renderRoot!==void 0&&this.isConnected&&V.hostConnected?.()}removeController(V){this._$EO?.delete(V)}_$E_(){let V=new Map,C=this.constructor.elementProperties;for(let H of C.keys())this.hasOwnProperty(H)&&(V.set(H,this[H]),delete this[H]);V.size>0&&(this._$Ep=V)}createRenderRoot(){let V=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return m2(V,this.constructor.elementStyles),V}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(V=>V.hostConnected?.())}enableUpdating(V){}disconnectedCallback(){this._$EO?.forEach(V=>V.hostDisconnected?.())}attributeChangedCallback(V,C,H){this._$AK(V,H)}_$ET(V,C){let H=this.constructor.elementProperties.get(V),e=this.constructor._$Eu(V,H);if(e!==void 0&&H.reflect===!0){let M=(H.converter?.toAttribute!==void 0?H.converter:l1).toAttribute(C,H.type);this._$Em=V,M==null?this.removeAttribute(e):this.setAttribute(e,M),this._$Em=null}}_$AK(V,C){let H=this.constructor,e=H._$Eh.get(V);if(e!==void 0&&this._$Em!==e){let M=H.getPropertyOptions(e),i=typeof M.converter=="function"?{fromAttribute:M.converter}:M.converter?.fromAttribute!==void 0?M.converter:l1;this._$Em=e;let n=i.fromAttribute(C,M.type);this[e]=n??this._$Ej?.get(e)??n,this._$Em=null}}requestUpdate(V,C,H,e=!1,M){if(V!==void 0){let i=this.constructor;if(e===!1&&(M=this[V]),H??=i.getPropertyOptions(V),!((H.hasChanged??O1)(M,C)||H.useDefault&&H.reflect&&M===this._$Ej?.get(V)&&!this.hasAttribute(i._$Eu(V,H))))return;this.C(V,C,H)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(V,C,{useDefault:H,reflect:e,wrapped:M},i){H&&!(this._$Ej??=new Map).has(V)&&(this._$Ej.set(V,i??C??this[V]),M!==!0||i!==void 0)||(this._$AL.has(V)||(this.hasUpdated||H||(C=void 0),this._$AL.set(V,C)),e===!0&&this._$Em!==V&&(this._$Eq??=new Set).add(V))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(C){Promise.reject(C)}let V=this.scheduleUpdate();return V!=null&&await V,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[e,M]of this._$Ep)this[e]=M;this._$Ep=void 0}let H=this.constructor.elementProperties;if(H.size>0)for(let[e,M]of H){let{wrapped:i}=M,n=this[e];i!==!0||this._$AL.has(e)||n===void 0||this.C(e,void 0,M,n)}}let V=!1,C=this._$AL;try{V=this.shouldUpdate(C),V?(this.willUpdate(C),this._$EO?.forEach(H=>H.hostUpdate?.()),this.update(C)):this._$EM()}catch(H){throw V=!1,this._$EM(),H}V&&this._$AE(C)}willUpdate(V){}_$AE(V){this._$EO?.forEach(C=>C.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(V)),this.updated(V)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(V){return!0}update(V){this._$Eq&&=this._$Eq.forEach(C=>this._$ET(C,this[C])),this._$EM()}updated(V){}firstUpdated(V){}};E.elementStyles=[],E.shadowRootOptions={mode:"open"},E[p1("elementProperties")]=new Map,E[p1("finalized")]=new Map,v5?.({ReactiveElement:E}),(f1.reactiveElementVersions??=[]).push("2.1.2");var C2=globalThis,x2=L=>L,y1=C2.trustedTypes,c2=y1?y1.createPolicy("lit-html",{createHTML:L=>L}):void 0,f2="$lit$",W=`lit$${Math.random().toFixed(9).slice(2)}$`,O2="?"+W,s5=`<${O2}>`,q=document,v1=()=>q.createComment(""),s1=L=>L===null||typeof L!="object"&&typeof L!="function",H2=Array.isArray,x5=L=>H2(L)||typeof L?.[Symbol.iterator]=="function",K1=`[ 	
\f\r]`,m1=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,u2=/-->/g,Z2=/>/g,Q=RegExp(`>|${K1}(?:([^\\s"'>=/]+)(${K1}*=${K1}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),S2=/'/g,h2=/"/g,y2=/^(?:script|style|textarea|title)$/i,V2=L=>(V,...C)=>({_$litType$:L,strings:V,values:C}),r=V2(1),M1=V2(2),r3=V2(3),j=Symbol.for("lit-noChange"),o=Symbol.for("lit-nothing"),g2=new WeakMap,K=q.createTreeWalker(q,129);function b2(L,V){if(!H2(L)||!L.hasOwnProperty("raw"))throw Error("invalid template strings array");return c2!==void 0?c2.createHTML(V):V}var c5=(L,V)=>{let C=L.length-1,H=[],e,M=V===2?"<svg>":V===3?"<math>":"",i=m1;for(let n=0;n<C;n++){let d=L[n],p,A,v=-1,w=0;for(;w<d.length&&(i.lastIndex=w,A=i.exec(d),A!==null);)w=i.lastIndex,i===m1?A[1]==="!--"?i=u2:A[1]!==void 0?i=Z2:A[2]!==void 0?(y2.test(A[2])&&(e=RegExp("</"+A[2],"g")),i=Q):A[3]!==void 0&&(i=Q):i===Q?A[0]===">"?(i=e??m1,v=-1):A[1]===void 0?v=-2:(v=i.lastIndex-A[2].length,p=A[1],i=A[3]===void 0?Q:A[3]==='"'?h2:S2):i===h2||i===S2?i=Q:i===u2||i===Z2?i=m1:(i=Q,e=void 0);let T=i===Q&&L[n+1].startsWith("/>")?" ":"";M+=i===m1?d+s5:v>=0?(H.push(p),d.slice(0,v)+f2+d.slice(v)+W+T):d+W+(v===-2?n:T)}return[b2(L,M+(L[C]||"<?>")+(V===2?"</svg>":V===3?"</math>":"")),H]},x1=class L{constructor({strings:V,_$litType$:C},H){let e;this.parts=[];let M=0,i=0,n=V.length-1,d=this.parts,[p,A]=c5(V,C);if(this.el=L.createElement(p,H),K.currentNode=this.el.content,C===2||C===3){let v=this.el.content.firstChild;v.replaceWith(...v.childNodes)}for(;(e=K.nextNode())!==null&&d.length<n;){if(e.nodeType===1){if(e.hasAttributes())for(let v of e.getAttributeNames())if(v.endsWith(f2)){let w=A[i++],T=e.getAttribute(v).split(W),S1=/([.?@])?(.*)/.exec(w);d.push({type:1,index:M,name:S1[2],strings:T,ctor:S1[1]==="."?j1:S1[1]==="?"?Y1:S1[1]==="@"?X1:e1}),e.removeAttribute(v)}else v.startsWith(W)&&(d.push({type:6,index:M}),e.removeAttribute(v));if(y2.test(e.tagName)){let v=e.textContent.split(W),w=v.length-1;if(w>0){e.textContent=y1?y1.emptyScript:"";for(let T=0;T<w;T++)e.append(v[T],v1()),K.nextNode(),d.push({type:2,index:++M});e.append(v[w],v1())}}}else if(e.nodeType===8)if(e.data===O2)d.push({type:2,index:M});else{let v=-1;for(;(v=e.data.indexOf(W,v+1))!==-1;)d.push({type:7,index:M}),v+=W.length-1}M++}}static createElement(V,C){let H=q.createElement("template");return H.innerHTML=V,H}};function L1(L,V,C=L,H){if(V===j)return V;let e=H!==void 0?C._$Co?.[H]:C._$Cl,M=s1(V)?void 0:V._$litDirective$;return e?.constructor!==M&&(e?._$AO?.(!1),M===void 0?e=void 0:(e=new M(L),e._$AT(L,C,H)),H!==void 0?(C._$Co??=[])[H]=e:C._$Cl=e),e!==void 0&&(V=L1(L,e._$AS(L,V.values),e,H)),V}var q1=class{constructor(V,C){this._$AV=[],this._$AN=void 0,this._$AD=V,this._$AM=C}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(V){let{el:{content:C},parts:H}=this._$AD,e=(V?.creationScope??q).importNode(C,!0);K.currentNode=e;let M=K.nextNode(),i=0,n=0,d=H[0];for(;d!==void 0;){if(i===d.index){let p;d.type===2?p=new c1(M,M.nextSibling,this,V):d.type===1?p=new d.ctor(M,d.name,d.strings,this,V):d.type===6&&(p=new J1(M,this,V)),this._$AV.push(p),d=H[++n]}i!==d?.index&&(M=K.nextNode(),i++)}return K.currentNode=q,e}p(V){let C=0;for(let H of this._$AV)H!==void 0&&(H.strings!==void 0?(H._$AI(V,H,C),C+=H.strings.length-2):H._$AI(V[C])),C++}},c1=class L{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(V,C,H,e){this.type=2,this._$AH=o,this._$AN=void 0,this._$AA=V,this._$AB=C,this._$AM=H,this.options=e,this._$Cv=e?.isConnected??!0}get parentNode(){let V=this._$AA.parentNode,C=this._$AM;return C!==void 0&&V?.nodeType===11&&(V=C.parentNode),V}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(V,C=this){V=L1(this,V,C),s1(V)?V===o||V==null||V===""?(this._$AH!==o&&this._$AR(),this._$AH=o):V!==this._$AH&&V!==j&&this._(V):V._$litType$!==void 0?this.$(V):V.nodeType!==void 0?this.T(V):x5(V)?this.k(V):this._(V)}O(V){return this._$AA.parentNode.insertBefore(V,this._$AB)}T(V){this._$AH!==V&&(this._$AR(),this._$AH=this.O(V))}_(V){this._$AH!==o&&s1(this._$AH)?this._$AA.nextSibling.data=V:this.T(q.createTextNode(V)),this._$AH=V}$(V){let{values:C,_$litType$:H}=V,e=typeof H=="number"?this._$AC(V):(H.el===void 0&&(H.el=x1.createElement(b2(H.h,H.h[0]),this.options)),H);if(this._$AH?._$AD===e)this._$AH.p(C);else{let M=new q1(e,this),i=M.u(this.options);M.p(C),this.T(i),this._$AH=M}}_$AC(V){let C=g2.get(V.strings);return C===void 0&&g2.set(V.strings,C=new x1(V)),C}k(V){H2(this._$AH)||(this._$AH=[],this._$AR());let C=this._$AH,H,e=0;for(let M of V)e===C.length?C.push(H=new L(this.O(v1()),this.O(v1()),this,this.options)):H=C[e],H._$AI(M),e++;e<C.length&&(this._$AR(H&&H._$AB.nextSibling,e),C.length=e)}_$AR(V=this._$AA.nextSibling,C){for(this._$AP?.(!1,!0,C);V!==this._$AB;){let H=x2(V).nextSibling;x2(V).remove(),V=H}}setConnected(V){this._$AM===void 0&&(this._$Cv=V,this._$AP?.(V))}},e1=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(V,C,H,e,M){this.type=1,this._$AH=o,this._$AN=void 0,this.element=V,this.name=C,this._$AM=e,this.options=M,H.length>2||H[0]!==""||H[1]!==""?(this._$AH=Array(H.length-1).fill(new String),this.strings=H):this._$AH=o}_$AI(V,C=this,H,e){let M=this.strings,i=!1;if(M===void 0)V=L1(this,V,C,0),i=!s1(V)||V!==this._$AH&&V!==j,i&&(this._$AH=V);else{let n=V,d,p;for(V=M[0],d=0;d<M.length-1;d++)p=L1(this,n[H+d],C,d),p===j&&(p=this._$AH[d]),i||=!s1(p)||p!==this._$AH[d],p===o?V=o:V!==o&&(V+=(p??"")+M[d+1]),this._$AH[d]=p}i&&!e&&this.j(V)}j(V){V===o?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,V??"")}},j1=class extends e1{constructor(){super(...arguments),this.type=3}j(V){this.element[this.name]=V===o?void 0:V}},Y1=class extends e1{constructor(){super(...arguments),this.type=4}j(V){this.element.toggleAttribute(this.name,!!V&&V!==o)}},X1=class extends e1{constructor(V,C,H,e,M){super(V,C,H,e,M),this.type=5}_$AI(V,C=this){if((V=L1(this,V,C,0)??o)===j)return;let H=this._$AH,e=V===o&&H!==o||V.capture!==H.capture||V.once!==H.once||V.passive!==H.passive,M=V!==o&&(H===o||e);e&&this.element.removeEventListener(this.name,this,H),M&&this.element.addEventListener(this.name,this,V),this._$AH=V}handleEvent(V){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,V):this._$AH.handleEvent(V)}},J1=class{constructor(V,C,H){this.element=V,this.type=6,this._$AN=void 0,this._$AM=C,this.options=H}get _$AU(){return this._$AM._$AU}_$AI(V){L1(this,V)}};var u5=C2.litHtmlPolyfillSupport;u5?.(x1,c1),(C2.litHtmlVersions??=[]).push("3.3.3");var _2=(L,V,C)=>{let H=C?.renderBefore??V,e=H._$litPart$;if(e===void 0){let M=C?.renderBefore??null;H._$litPart$=e=new c1(V.insertBefore(v1(),M),M,void 0,C??{})}return e._$AI(L),e};var L2=globalThis,s=class extends E{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let V=super.createRenderRoot();return this.renderOptions.renderBefore??=V.firstChild,V}update(V){let C=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(V),this._$Do=_2(C,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return j}};s._$litElement$=!0,s.finalized=!0,L2.litElementHydrateSupport?.({LitElement:s});var Z5=L2.litElementPolyfillSupport;Z5?.({LitElement:s});(L2.litElementVersions??=[]).push("4.2.2");var c=L=>(V,C)=>{C!==void 0?C.addInitializer(()=>{customElements.define(L,V)}):customElements.define(L,V)};var S5={attribute:!0,type:String,converter:l1,reflect:!1,hasChanged:O1},h5=(L=S5,V,C)=>{let{kind:H,metadata:e}=C,M=globalThis.litPropertyMetadata.get(e);if(M===void 0&&globalThis.litPropertyMetadata.set(e,M=new Map),H==="setter"&&((L=Object.create(L)).wrapped=!0),M.set(C.name,L),H==="accessor"){let{name:i}=C;return{set(n){let d=V.get.call(this);V.set.call(this,n),this.requestUpdate(i,d,L,!0,n)},init(n){return n!==void 0&&this.C(i,void 0,L,n),n}}}if(H==="setter"){let{name:i}=C;return function(n){let d=this[i];V.call(this,n),this.requestUpdate(i,d,L,!0,n)}}throw Error("Unsupported decorator location: "+H)};function l(L){return(V,C)=>typeof C=="object"?h5(L,V,C):((H,e,M)=>{let i=e.hasOwnProperty(M);return e.constructor.createProperty(M,H),i?Object.getOwnPropertyDescriptor(e,M):void 0})(L,V,C)}function a(L){return l({...L,state:!0,attribute:!1})}var Y=(L,V,C)=>(C.configurable=!0,C.enumerable=!0,Reflect.decorate&&typeof V!="object"&&Object.defineProperty(L,V,C),C);function _(L,V){return(C,H,e)=>{let M=i=>i.renderRoot?.querySelector(L)??null;if(V){let{get:i,set:n}=typeof H=="object"?C:e??(()=>{let d=Symbol();return{get(){return this[d]},set(p){this[d]=p}}})();return Y(C,H,{get(){let d=i.call(this);return d===void 0&&(d=M(this),(d!==null||this.hasUpdated)&&n.call(this,d)),d}})}return Y(C,H,{get(){return M(this)}})}}var h="scheduler_plus";function e2(L){return L.callWS({type:`${h}/list_modes`})}function k2(L,V){return L.callWS({type:`${h}/save_mode`,name:V.name,weekdays:V.weekdays,run_schedules:V.run_schedules,skip_schedules:V.skip_schedules,...V.id?{mode_id:V.id,rev:V.rev}:{}})}function w2(L,V){return L.callWS({type:`${h}/delete_mode`,mode_id:V})}function M2(L,V,C,H){return L.callWS({type:`${h}/set_mode_date`,mode_id:V,date:C,active:H})}function z(L){if(L instanceof Error)return L.message;if(typeof L=="string")return L;if(L&&typeof L=="object"){let V=L;if(typeof V.message=="string")return V.message;if(typeof V.error=="string")return V.error;try{return JSON.stringify(L)}catch{}}return String(L)}function X(L){return{name:L.name,device_type:L.device_type,entities:L.entities,enabled:L.enabled,rules:L.rules,active_date_mode:L.active_date_mode,active_date_ranges:L.active_date_ranges,override_until:L.override_until}}async function r1(L){return(await L.callWS({type:`${h}/list_schedules`})).schedules}async function b1(L,V){return(await L.callWS({type:`${h}/create_schedule`,...V})).schedule}async function $(L,V,C){return(await L.callWS({type:`${h}/update_schedule`,schedule_id:V,...C})).schedule}async function T2(L,V){await L.callWS({type:`${h}/delete_schedule`,schedule_id:V})}async function _1(L){return L.callWS({type:`${h}/get_preferences`})}async function B2(L,V){return L.callWS({type:`${h}/set_preferences`,...V})}async function t1(L,V,C){return(await L.callWS({type:`${h}/get_day_schedule`,date:V,...C?{device_type:C}:{}})).events}async function k1(L,V,C){return(await L.callWS({type:`${h}/get_week_schedule`,start_date:V,...C?{device_type:C}:{}})).days}async function w1(L){return(await L.callWS({type:`${h}/list_templates`})).templates}async function P2(L,V){return(await L.callWS({type:`${h}/create_template`,...V})).template}async function T1(L,V){await L.callWS({type:`${h}/delete_template`,template_id:V})}async function B1(L,V,C){return(await L.callWS({type:`${h}/check_schedule_conflicts`,...V?{schedule_id:V}:{},...C})).conflicts}async function R2(L,V,C,H){return L.callWS({type:`${h}/generate_report`,entities:V,start_date:C,end_date:H})}function D2(L,V,C){return`/api/scheduler_plus/report/pdf?${new URLSearchParams({entities:L.join(","),start:V,end:C}).toString()}`}var F2=["light_switch","climate"],i1={light:"Light",climate:"Climate",switch:"Switch",light_switch:"Lights & Switches"},P1={light:["light"],climate:["climate"],switch:["switch"],light_switch:["light","switch"]},a1=["light","climate","switch"],R1=["heat","cool","heat_cool","auto","dry","fan_only"],o1={heat:"Heat",cool:"Cool",heat_cool:"Heat/Cool",auto:"Auto",dry:"Dry",fan_only:"Fan only"};var J={fixed:"Fixed time",sunrise:"Sunrise",sunset:"Sunset",yidcal:"YidCal"},E2=["candle_lighting","motzei_shabbos"],D1={candle_lighting:"\u05D4\u05D3\u05DC\u05E7\u05D5\u05EA \u05D4\u05E0\u05D9\u05E8\u05D5\u05EA",motzei_shabbos:'\u05DE\u05D5\u05E6\u05E9"\u05E7'},f=["mon","tue","wed","thu","fri","sat","sun"],N={mon:"Monday",tue:"Tuesday",wed:"Wednesday",thu:"Thursday",fri:"Friday",sat:"Saturday",sun:"Sunday"},F1=["always","include","exclude"],$2={always:"Always",include:"Only on these dates",exclude:"Except these dates"},N2=["shabbos","yom_tov","erev_shabbos","erev_yom_tov"],u1={shabbos:"Shabbos",yom_tov:"Yom Tov",erev_shabbos:"Erev Shabbos",erev_yom_tov:"Erev Yom Tov"};function k(L,V){if(L==="light"){let C=[];return typeof V.brightness=="number"&&C.push(`Brightness ${Math.round(V.brightness/255*100)}%`),typeof V.transition=="number"&&V.transition>0&&C.push(`fade ${V.transition}s`),C.length>0?C.join(" \xB7 "):void 0}if(L==="climate"){let C=[];if(typeof V.hvac_mode=="string"){let H=o1;C.push(H[V.hvac_mode]??V.hvac_mode)}return typeof V.target_temperature=="number"&&C.push(`${V.target_temperature}\xB0`),C.length>0?C.join(" \xB7 "):void 0}}var I2=["No school","Short day","Bris","Chasunah","Rabbi here","Rabbi away","Friday night Tish"],g5=3e4,r2={now:0,"24h":1,week:7};function t2(L,V){let C=new Date(`${L}T12:00:00Z`);return C.setUTCDate(C.getUTCDate()+V),C.toISOString().slice(0,10)}function Z1(L,V){let C=f[(new Date(`${V}T12:00:00Z`).getUTCDay()+6)%7];return L.dates[V]??L.weekdays.includes(C)}function f5(L){if(!L.length)return"";let V=L.map(H=>`\u201C${H}\u201D`).join(", "),C=L.length===1?"it is":"they are";return`Paused ${V}: ${C} no longer set to run in any mode. Re-enable in the main Scheduler+ card once assigned to one.`}function O5(L){let V=L.device_type==="climate"?"Climate":"Lights & switches",C=`${L.entities.length} ${L.entities.length===1?"device":"devices"}`,H=L.rules.find(p=>p.enabled&&p.on_enabled),e=L.rules.find(p=>p.enabled&&p.off_enabled),M=L.device_type==="light_switch"?"light":L.device_type,i=H?k(M,H.action)??"Turn on":"No on action",n=e?e.off_action?k(M,e.off_action)??"Setback":"Turn off":"No off action",d=H?.on_time?.provider==="fixed"&&typeof H.on_time.params.time=="string"?`Starts ${H.on_time.params.time}`:H?.on_time?.provider?`Starts at ${H.on_time.provider}`:"Timing set in schedule";return{type:V,deviceCount:C,onAction:i,offAction:n,timing:d}}var Z=class extends s{constructor(){super(...arguments);this.embedded=!1;this._config={};this._modes=[];this._schedules=[];this._events=[];this._date="";this._today="";this._timezone="UTC";this._view="24h";this._error="";this._notice="";this._busy=!1;this._loaded=!1;this._editing=null;this._loading=!1;this._epoch=0;this._tick=()=>{document.hidden||this._load()}}setConfig(C){this._config=C,this._view=C.default_view??"24h"}static getConfigElement(){return document.createElement("scheduler-plus-dashboard-editor")}static getStubConfig(){return{title:"Operations dashboard",default_view:"24h",show_devices:!0}}getCardSize(){return 8}connectedCallback(){super.connectedCallback(),this._timer=setInterval(this._tick,g5),document.addEventListener("visibilitychange",this._tick),this.hass&&this._load()}disconnectedCallback(){super.disconnectedCallback(),clearInterval(this._timer),document.removeEventListener("visibilitychange",this._tick),this._epoch++}updated(C){C.has("hass")&&!this._loaded&&!this._loading&&this._load()}async _fetchEvents(C){let H=this.hass;if(this._view==="week"){let[i,n,d]=await Promise.all([t1(H,t2(C,-1)),k1(H,C),t1(H,t2(C,r2.week))]);return[...i,...n.flatMap(p=>p.events),...d]}let e=[-1,...Array.from({length:r2[this._view]+1},(i,n)=>n)];return(await Promise.all(e.map(i=>t1(H,t2(C,i))))).flat()}async _load(){if(!this.hass)return;let C=++this._epoch;this._loading=!0;try{let[H,e]=await Promise.all([e2(this.hass),r1(this.hass)]),M=await this._fetchEvents(H.today);if(C!==this._epoch)return;this._apply(H),this._schedules=e,this._events=M,this._loaded=!0,this._error=""}catch(H){C===this._epoch&&(this._error=z(H))}finally{C===this._epoch&&(this._loading=!1)}}_apply(C){this._modes=C.modes,(!this._date||this._date===this._today)&&(this._date=C.today),this._today=C.today,this._timezone=C.timezone}async _write(C){if(!this._busy){this._busy=!0;try{let H=await C();this._editing=null,this._error="",this._notice=f5(H.paused_schedules??[]),this._apply(H),await this._load()}catch(H){this._error=z(H)}finally{this._busy=!1}}}async _setView(C){this._view!==C&&(this._view=C,await this._load())}_newMode(C=""){this._edit({id:"",rev:0,name:C,weekdays:[],dates:{},run_schedules:[],skip_schedules:[]})}_edit(C){this._editing=structuredClone(C),this.updateComplete.then(()=>this.renderRoot.querySelector(".editor")?.scrollIntoView({behavior:"smooth",block:"nearest"}))}_effect(C,H){let e=this._editing;this._editing={...e,run_schedules:[...e.run_schedules.filter(M=>M!==C),...H==="run"?[C]:[]],skip_schedules:[...e.skip_schedules.filter(M=>M!==C),...H==="skip"?[C]:[]]}}_time(C){return new Date(C).toLocaleString(void 0,{timeZone:this._timezone,weekday:"short",hour:"numeric",minute:"2-digit"})}_editor(){let C=this._editing;return C?r`<section class="editor" aria-label="Configure mode">
      <h2>${C.id?"Configure mode":"Create a mode"}</h2>
      <label>Mode name<input maxlength="80" .value=${C.name} @input=${H=>this._editing={...C,name:H.target.value}} placeholder="e.g. No school"></label>
      <p>Repeat on these days, or leave blank and select individual dates on the dashboard.</p>
      <div class="days">${f.map(H=>r`<label><input type="checkbox" .checked=${C.weekdays.includes(H)} @change=${e=>this._editing={...C,weekdays:e.target.checked?[...C.weekdays,H]:C.weekdays.filter(M=>M!==H)}}>${N[H].slice(0,3)}</label>`)}</div>
      <h3>Mode includes</h3>
      <p>Build each device action as a schedule in the Schedules view, then include it here. Lights and climate can have different actions and timing: one can turn on once while another starts heating or cooling at its own fixed, sunrise, sunset, or preset system time.</p>
      ${this._schedules.length?r`<div class="schedule-reference"><b>Available device actions</b>${this._schedules.map(H=>{let e=O5(H);return r`<div class="schedule-reference-row"><span><b>${H.name}</b><small><span class="device-chip">${e.type}</span> · ${e.deviceCount} · ${e.onAction} → ${e.offAction} · ${e.timing}</small></span></div>`})}</div>`:o}
      ${this._schedules.length?this._schedules.map(H=>r`<label class="assignment"><span>${H.name}${H.enabled?"":" (paused)"}<small>${H.rules.length} rules · ${H.entities.length} devices</small></span><select .value=${C.run_schedules.includes(H.id)?"run":C.skip_schedules.includes(H.id)?"skip":"none"} @change=${e=>this._effect(H.id,e.target.value)}><option value="none">Not included</option><option value="run">Include when on</option><option value="skip">Skip when on</option></select></label>`):r`<p>Create schedules in the main Scheduler+ card first, then assign them here.</p>`}
      <p class="note">Changing today's mode recalculates schedules immediately and can start an active rule. Skipping cancels its remaining actions; it does not turn devices off. Use a replacement schedule for an early shutdown. Removing a schedule's last “Run” assignment pauses that schedule. Individual dates are set from the toggles above, not here - this form never overwrites them.</p>
      <div class="row"><button class="primary" ?disabled=${this._busy||!C.name.trim()} @click=${()=>this._write(()=>k2(this.hass,C))}>${this._busy?"Saving\u2026":"Save mode"}</button><button ?disabled=${this._busy} @click=${()=>this._editing=null}>Cancel</button>${C.id?r`<button ?disabled=${this._busy} @click=${()=>{confirm("Delete this mode? Its exclusive schedules will be paused. Regular schedules it skipped will resume.")&&this._write(()=>w2(this.hass,C.id))}}>Delete mode</button>`:o}</div>
    </section>`:o}render(){let C=Date.now(),H=C+Math.max(r2[this._view],1)*864e5,e=this._modes.filter(A=>!this._config.modes||this._config.modes.includes(A.id)),M=this._config.mode_presets??I2,i=this._events.filter(A=>A.on_at&&A.off_at&&Date.parse(A.on_at)<=C&&Date.parse(A.off_at)>C),n=this._events.flatMap(A=>[...A.on_at?[{at:A.on_at,event:A,label:k(A.device_type,A.action)??"On"}]:[],...A.off_at?[{at:A.off_at,event:A,label:A.off_action?k(A.device_type,A.off_action)??"Setback":"Off"}]:[]]).filter(A=>Date.parse(A.at)>C&&Date.parse(A.at)<=H).sort((A,v)=>Date.parse(A.at)-Date.parse(v.at)),d=[...new Set(this._schedules.flatMap(A=>A.entities))],p=r`
      ${this.embedded?o:r`<header><div class="eyebrow">SCHEDULER+ · OPERATIONS</div><h1>${this._config.title??"Your day, under control"}</h1><p>Daily routines and special days, in one place.</p></header>`}
      ${this._error?r`<div role="alert" class="banner error">${this._error}<button @click=${()=>void this._load()}>Retry</button></div>`:o}
      ${this._notice?r`<div role="status" class="banner notice">${this._notice}<button @click=${()=>this._notice=""}>Dismiss</button></div>`:o}
      ${this._loaded?r`
      <div class="stats"><div><strong>${this._modes.filter(A=>Z1(A,this._today)).length}</strong><span>Modes on today</span></div><div><strong>${i.length}</strong><span>Scheduled windows now</span></div><div><strong>${d.length}</strong><span>Connected devices</span></div></div>
      <section><div class="row spread"><div><h2>Day modes</h2><p>Choose a day, switch modes on or off, and let each included device action run at its configured time.</p></div><button @click=${()=>this._newMode()}>+ Create mode</button></div>
      <div class="row"><label>Date<input type="date" .value=${this._date} @change=${A=>{let v=A.target.value;v&&(this._date=v)}}></label><button @click=${()=>this._date=this._today}>Today</button><small>${this._timezone}</small></div>
      ${this._modes.length?o:r`<div class="empty"><h3>Start with a familiar routine</h3><p>Choose a name, then select the schedules it runs or skips.</p><div class="row">${M.map(A=>r`<button @click=${()=>this._newMode(A)}>${A}</button>`)}</div></div>`}
      <div class="grid">${e.map(A=>r`<article class=${Z1(A,this._date)?"mode on":"mode"}><div class="row spread"><h3>${A.name}</h3><button class="toggle" role="switch" aria-label=${`${A.name} on ${this._date}`} aria-checked=${Z1(A,this._date)} ?disabled=${this._busy} @click=${()=>this._write(()=>M2(this.hass,A.id,this._date,!Z1(A,this._date)))}>${Z1(A,this._date)?"On":"Off"}</button></div><p>${A.run_schedules.length} special schedules · ${A.skip_schedules.length} skipped</p><small>${this._date in A.dates?"Set for this date":A.weekdays.length?"Weekly routine":"No date selected"}</small><div class="row"><button class="text" @click=${()=>this._edit(A)}>Configure</button>${this._date in A.dates?r`<button class="text" ?disabled=${this._busy} @click=${()=>this._write(()=>M2(this.hass,A.id,this._date,null))}>Use weekly routine</button>`:o}</div></article>`)}</div>
      <p class="note">Modes apply to the selected date, including events ending the next morning. Skipping a schedule does not switch off a device already running. Past dates are tidied away automatically.</p>
      </section>${this._editor()}
      <section><div class="row spread"><div><h2>Activity outlook</h2><p>From now · ${this._timezone} · refreshes every 30 seconds while this tab is open</p></div><div class="row" role="group" aria-label="Outlook range">${[["now","Now"],["24h","Next 24 hours"],["week","Next 7 days"]].map(([A,v])=>r`<button aria-pressed=${this._view===A} class=${this._view===A?"primary":""} @click=${()=>void this._setView(A)}>${v}</button>`)}</div></div>
      ${this._view==="now"?r`<p>Scheduled windows are planned activity. Device states below show what is actually happening.</p>${i.length?i.map(A=>r`<div class="event"><span class="dot"></span><div><b>${A.schedule_name}</b><small>${A.rule_name} · until ${this._time(A.off_at)}</small></div><span>${k(A.device_type,A.action)??"On window"}</span></div>`):r`<div class="empty">No scheduled windows are active right now.</div>`}`:n.length?n.map((A,v)=>{let w=new Date(A.at).toLocaleDateString(void 0,{timeZone:this._timezone,weekday:"long",month:"short",day:"numeric"}),T=n[v-1];return r`${!T||new Date(T.at).toLocaleDateString(void 0,{timeZone:this._timezone})!==new Date(A.at).toLocaleDateString(void 0,{timeZone:this._timezone})?r`<h3 class="day">${w}</h3>`:o}<div class="event"><time>${this._time(A.at)}</time><div><b>${A.event.schedule_name}</b><small>${A.event.rule_name} · ${A.event.entities.length} devices</small></div><span class="badge">${A.label}</span></div>`}):r`<div class="empty">No actions scheduled in this period.</div>`}
      </section>
      ${this._config.show_devices!==!1?r`<section><h2>Live device states</h2><div class="grid">${d.map(A=>{let v=this.hass?.states[A];return r`<div class="device"><b>${v?.attributes.friendly_name??A}</b><span>${v?.state??"unavailable"}</span></div>`})}</div></section>`:o}
      `:r`<p class="pad">Loading dashboard…</p>`}`;return this.embedded?p:r`<ha-card>${p}</ha-card>`}};Z.styles=x`
    .schedule-reference{margin:14px 0 18px;padding:12px;border:1px solid var(--divider-color,#dce4e4);border-radius:10px;background:rgba(127,127,127,.04);font-size:12px}.schedule-reference-row{padding:9px 0;border-top:1px solid var(--divider-color,#e7ecec)}.schedule-reference-row:first-of-type{margin-top:8px}.schedule-reference small{font-size:11px;line-height:1.5}.device-chip{color:var(--primary-color);font-weight:700;text-transform:uppercase;letter-spacing:.3px}
    :host{display:block;color:var(--primary-text-color);font-family:inherit}ha-card{overflow:hidden;background:var(--card-background-color,#fff)}header{padding:28px;background:linear-gradient(120deg,rgba(16,145,132,.15),rgba(57,120,201,.08))}.eyebrow{font-size:11px;letter-spacing:2px;font-weight:700;color:var(--primary-color,#087f73)}h1{font-size:28px;margin:10px 0}h2{font-size:19px;margin:0 0 6px}h3{font-size:15px;margin:0}p{font-size:13px;color:var(--secondary-text-color);line-height:1.6;margin:6px 0 14px}section{padding:22px;border-top:1px solid var(--divider-color,#e7ecec)}.stats{display:grid;grid-template-columns:repeat(3,1fr);padding:22px;gap:12px}.stats div{display:flex;flex-direction:column;gap:6px}.stats strong{font-size:28px}.stats span,small{font-size:12px;color:var(--secondary-text-color)}small{display:block;margin-top:5px}.row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.spread{justify-content:space-between}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin-top:16px}.mode{padding:17px;border:1px solid var(--divider-color,#dce4e4);border-radius:14px}.mode.on{border-color:#169c89;background:rgba(16,145,132,.07)}.mode p{margin:12px 0 4px}.toggle{min-width:58px;border-radius:30px;font-weight:bold}.on .toggle,.primary{background:var(--primary-color,#087f73);color:var(--text-primary-color,#fff);border-color:transparent}.text{border:0;background:transparent;padding:9px 0;color:var(--primary-color,#087f73);font-size:12px}.empty{padding:22px;border:1px dashed var(--divider-color,#cad5d5);border-radius:12px;margin-top:16px;color:var(--secondary-text-color)}button,input,select{font:inherit;border:1px solid var(--divider-color,#cbd5d5);border-radius:8px;padding:9px 12px;color:var(--primary-text-color);background:var(--card-background-color,#fff)}button{cursor:pointer;font-size:13px}button:disabled{opacity:.5;cursor:wait}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--primary-color);outline-offset:3px}label{font-size:13px;display:flex;gap:8px;align-items:center}input[type=text]{min-width:160px}.editor{background:rgba(16,145,132,.04)}.editor>label{margin:16px 0}.days{display:flex;flex-wrap:wrap;gap:14px;margin:16px 0 24px}.assignment{display:flex;justify-content:space-between;flex-wrap:wrap;padding:12px 0;border-bottom:1px solid var(--divider-color,#ddd)}.note{font-size:12px;margin-top:16px}.event{display:flex;gap:16px;align-items:center;padding:14px 0;border-bottom:1px solid var(--divider-color,#eee);font-size:13px}.event>div{flex:1}.event time{min-width:100px;color:var(--secondary-text-color);font-size:12px}.badge{border-radius:8px;padding:6px 10px;background:rgba(16,145,132,.1);max-width:130px}.day{margin-top:22px;color:var(--primary-color)}.dot{width:8px;height:8px;border-radius:50%;background:#169c89}.device{display:flex;justify-content:space-between;gap:12px;padding:12px;background:rgba(127,127,127,.06);border-radius:8px;font-size:13px}:host([embedded]) section:first-of-type{border-top:0}.banner{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:16px;font-size:13px;line-height:1.5}.banner button{flex:none}.error{background:rgba(220,50,50,.12)}.notice{background:rgba(16,145,132,.12)}.pad{padding:22px}@media(max-width:480px){header,section{padding:16px}h1{font-size:24px}.event{gap:8px}.event time{min-width:80px}.stats span{font-size:11px}.assignment select{width:100%}}
  `,t([l({attribute:!1})],Z.prototype,"hass",2),t([l({type:Boolean,reflect:!0})],Z.prototype,"embedded",2),t([a()],Z.prototype,"_config",2),t([a()],Z.prototype,"_modes",2),t([a()],Z.prototype,"_schedules",2),t([a()],Z.prototype,"_events",2),t([a()],Z.prototype,"_date",2),t([a()],Z.prototype,"_today",2),t([a()],Z.prototype,"_timezone",2),t([a()],Z.prototype,"_view",2),t([a()],Z.prototype,"_error",2),t([a()],Z.prototype,"_notice",2),t([a()],Z.prototype,"_busy",2),t([a()],Z.prototype,"_loaded",2),t([a()],Z.prototype,"_editing",2),Z=t([c("scheduler-plus-dashboard-card")],Z);window.customCards=window.customCards??[];window.customCards.push({type:"scheduler-plus-dashboard-card",name:"Scheduler+ Operations",description:"Day modes, live device states, and the next 24 hours or week."});var I=class extends s{constructor(){super(...arguments);this._config={};this._modes=[];this._error=""}setConfig(C){this._config=C}updated(C){C.has("hass")&&this.hass&&!this._modes.length&&e2(this.hass).then(H=>{this._modes=H.modes}).catch(H=>{this._error=z(H)})}_change(C){this._config={...this._config,...C},this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this._config},bubbles:!0,composed:!0}))}_changePresets(C){let H=C.split(",").map(e=>e.trim()).filter(Boolean);this._change({mode_presets:H.length?H:void 0})}render(){return r`<label>Dashboard title<input .value=${this._config.title??""} @input=${C=>this._change({title:C.target.value})}></label>
      <label>Default view<select .value=${this._config.default_view??"24h"} @change=${C=>this._change({default_view:C.target.value})}><option value="now">Now</option><option value="24h">Next 24 hours</option><option value="week">Next 7 days</option></select></label>
      <label><input type="checkbox" .checked=${this._config.show_devices!==!1} @change=${C=>this._change({show_devices:C.target.checked})}>Show live devices</label>
      <h3>Suggested mode names</h3><p>Offered as one-tap starting points until the first mode exists. Comma separated; leave empty for the defaults.</p>
      <label><input .value=${(this._config.mode_presets??I2).join(", ")} @change=${C=>this._changePresets(C.target.value)}></label>
      <h3>Visible mode controls</h3><p>All modes are shown by default. These choices only change the display.</p>
      ${this._error?r`<p role="alert">${this._error}</p>`:o}
      ${this._modes.map(C=>r`<label><input type="checkbox" .checked=${!this._config.modes||this._config.modes.includes(C.id)} @change=${H=>{let e=this._config.modes??this._modes.map(M=>M.id);this._change({modes:H.target.checked?[...e,C.id]:e.filter(M=>M!==C.id)})}}>${C.name}</label>`)}`}};I.styles=x`label{display:flex;align-items:center;gap:12px;margin:16px 0;font-size:14px}input,select{padding:10px;border:1px solid var(--divider-color);border-radius:6px;background:var(--card-background-color);color:var(--primary-text-color);font:inherit}input:not([type=checkbox]){flex:1;min-width:0}p{font-size:13px;color:var(--secondary-text-color)}`,t([l({attribute:!1})],I.prototype,"hass",2),t([a()],I.prototype,"_config",2),t([a()],I.prototype,"_modes",2),t([a()],I.prototype,"_error",2),I=t([c("scheduler-plus-dashboard-editor")],I);var W2="M10.63,14.1C12.23,10.58 16.38,9.03 19.9,10.63C23.42,12.23 24.97,16.38 23.37,19.9C22.24,22.4 19.75,24 17,24C14.3,24 11.83,22.44 10.67,20H1V18C1.06,16.86 1.84,15.93 3.34,15.18C4.84,14.43 6.72,14.04 9,14C9.57,14 10.11,14.05 10.63,14.1V14.1M9,4C10.12,4.03 11.06,4.42 11.81,5.17C12.56,5.92 12.93,6.86 12.93,8C12.93,9.14 12.56,10.08 11.81,10.83C11.06,11.58 10.12,11.95 9,11.95C7.88,11.95 6.94,11.58 6.19,10.83C5.44,10.08 5.07,9.14 5.07,8C5.07,6.86 5.44,5.92 6.19,5.17C6.94,4.42 7.88,4.03 9,4M17,22A5,5 0 0,0 22,17A5,5 0 0,0 17,12A5,5 0 0,0 12,17A5,5 0 0,0 17,22M16,14H17.5V16.82L19.94,18.23L19.19,19.53L16,17.69V14Z";var z2="M15,13H16.5V15.82L18.94,17.23L18.19,18.53L15,16.69V13M19,8H5V19H9.67C9.24,18.09 9,17.07 9,16A7,7 0 0,1 16,9C17.07,9 18.09,9.24 19,9.67V8M5,21C3.89,21 3,20.1 3,19V5C3,3.89 3.89,3 5,3H6V1H8V3H16V1H18V3H19A2,2 0 0,1 21,5V11.1C22.24,12.36 23,14.09 23,16A7,7 0 0,1 16,23C14.09,23 12.36,22.24 11.1,21H5M16,11.15A4.85,4.85 0 0,0 11.15,16C11.15,18.68 13.32,20.85 16,20.85A4.85,4.85 0 0,0 20.85,16C20.85,13.32 18.68,11.15 16,11.15Z";var U2="M19 19V8H5V19H19M16 1H18V3H19C20.11 3 21 3.9 21 5V19C21 20.11 20.11 21 19 21H5C3.89 21 3 20.1 3 19V5C3 3.89 3.89 3 5 3H6V1H8V3H16V1M11 9.5H13V12.5H16V14.5H13V17.5H11V14.5H8V12.5H11V9.5Z";var G2="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z";var U="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z";var Q2="M13,16V8H15V16H13M9,16V8H11V16H9M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4Z";var E1="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z";var K2="M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M10,16.5L16,12L10,7.5V16.5Z";var q2="M3 21H11V13H3M5 15H9V19H5M3 11H11V3H3M5 5H9V9H5M13 3V11H21V3M19 9H15V5H19M18 16H21V18H18V21H16V18H13V16H16V13H18Z";var R=class extends s{constructor(){super(...arguments);this._open=!1;this._templates=[];this._loading=!1;this._closeDialog=()=>{this._open=!1};this._useTemplate=C=>{this._open=!1,this.dispatchEvent(new CustomEvent("scheduler-plus-use-template",{detail:{template:C}}))};this._deleteTemplateRow=async C=>{if(window.confirm(`Delete template "${C.name}"?`))try{await T1(this.hass,C.id),await this._load()}catch(H){window.alert(H instanceof Error?H.message:String(H))}}}showDialog(){this._error=void 0,this._open=!0,this._load()}async _load(){this._loading=!0,this._error=void 0;try{let C=await w1(this.hass);this._templates=C.filter(H=>H.scope==="schedule")}catch(C){this._error=C instanceof Error?C.message:String(C)}finally{this._loading=!1}}render(){return this._open?r`
      <ha-dialog open @closed=${this._closeDialog}>
        <div class="form">
          <div class="dialog-title">From template</div>
          ${this._error?r`<div class="error">${this._error}</div>`:o}
          ${this._renderContent()}
          <div class="dialog-actions">
            <button type="button" class="btn" @click=${this._closeDialog}>Close</button>
          </div>
        </div>
      </ha-dialog>
    `:o}_renderContent(){return this._loading?r`<div class="placeholder">Loading templates…</div>`:this._templates.length===0?r`
        <div class="placeholder">
          No schedule templates saved yet. Save one from an existing
          schedule's editor ("Save as template").
        </div>
      `:r`
      <ul class="templates">
        ${this._templates.map(C=>r`
            <li class="template">
              <div class="template-info">
                <span class="template-name">${C.name}</span>
                <span class="template-meta">
                  ${i1[C.device_type]} ·
                  ${C.rules.length}
                  ${C.rules.length===1?"rule":"rules"}
                </span>
              </div>
              <div class="row-actions">
                <button type="button" class="btn" @click=${()=>this._useTemplate(C)}>
                  Use
                </button>
                <ha-icon-button
                  .path=${U}
                  label="Delete template"
                  @click=${()=>this._deleteTemplateRow(C)}
                ></ha-icon-button>
              </div>
            </li>
          `)}
      </ul>
    `}};R.styles=x`
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
    .error {
      color: var(--error-color);
    }
    .placeholder {
      padding: 16px 0;
      color: var(--secondary-text-color);
      text-align: center;
    }
    ul.templates {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .template {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid var(--divider-color);
    }
    .template:last-child {
      border-bottom: none;
    }
    .template-info {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }
    .template-name {
      font-weight: 500;
    }
    .template-meta {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .row-actions {
      display: flex;
      align-items: center;
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
  `,t([l({attribute:!1})],R.prototype,"hass",2),t([a()],R.prototype,"_open",2),t([a()],R.prototype,"_templates",2),t([a()],R.prototype,"_loading",2),t([a()],R.prototype,"_error",2),R=t([c("scheduler-plus-apply-template-dialog")],R);var B=class extends s{constructor(){super(...arguments);this.value=[];this.domains=[];this._search="";this._pending=new Set;this._addSelected=()=>{this._pending.size!==0&&(this._fireChange([...this.value,...this._pending]),this._pending=new Set,this._search="")}}_entityName(C){let H=this.hass.states[C]?.attributes.friendly_name;return typeof H=="string"?H:C}get _candidates(){let C=this._search.trim().toLowerCase();return Object.keys(this.hass.states).filter(H=>this.domains.some(e=>H.startsWith(`${e}.`))).filter(H=>!this.value.includes(H)).filter(H=>!this.includeEntities||this.includeEntities.includes(H)).filter(H=>!C||H.toLowerCase().includes(C)||this._entityName(H).toLowerCase().includes(C)).sort((H,e)=>this._entityName(H).localeCompare(this._entityName(e)))}_fireChange(C){this.value=C,this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:C}}))}_removeEntity(C){this._fireChange(this.value.filter(H=>H!==C))}_toggleCandidate(C){let H=new Set(this._pending);H.has(C)?H.delete(C):H.add(C),this._pending=H}render(){let C=this._pending.size>0?`Add ${this._pending.size} device${this._pending.size===1?"":"s"}`:"Add selected";return r`
      ${this.value.length>0?r`
            <ul class="selected">
              ${this.value.map(H=>r`
                  <li class="chip">
                    <span>${this._entityName(H)}</span>
                    <button
                      type="button"
                      class="chip-remove"
                      aria-label="Remove ${this._entityName(H)}"
                      @click=${()=>this._removeEntity(H)}
                    >
                      ×
                    </button>
                  </li>
                `)}
            </ul>
          `:o}

      <input
        type="text"
        class="native-input"
        placeholder="Search devices…"
        .value=${this._search}
        @input=${H=>{this._search=H.target.value}}
      />
      <div class="candidates">
        ${this._candidates.length===0?r`<div class="empty">No matching devices.</div>`:this._candidates.map(H=>r`
                <label class="candidate">
                  <input
                    type="checkbox"
                    .checked=${this._pending.has(H)}
                    @change=${()=>this._toggleCandidate(H)}
                  />
                  <span>${this._entityName(H)}</span>
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
    `}};B.styles=x`
    :host {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    /* Wrapping chips instead of one full-width row per entity - a schedule
       with dozens of entities (a whole building's worth of rooms) used to
       mean dozens of rows and a lot of scrolling just to see them all. */
    ul.selected {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      max-height: 220px;
      overflow-y: auto;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 4px 4px 4px 10px;
      border: 1px solid var(--divider-color);
      border-radius: 14px;
      background: var(--card-background-color);
      font-size: 0.85em;
      color: var(--primary-text-color);
      max-width: 100%;
    }
    .chip span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .chip-remove {
      flex: none;
      font: inherit;
      font-size: 1rem;
      line-height: 1;
      width: 20px;
      height: 20px;
      border: none;
      border-radius: 50%;
      background: transparent;
      color: var(--secondary-text-color);
      cursor: pointer;
    }
    .chip-remove:hover {
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.08));
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
  `,t([l({attribute:!1})],B.prototype,"hass",2),t([l({attribute:!1})],B.prototype,"value",2),t([l({attribute:!1})],B.prototype,"domains",2),t([l({attribute:!1})],B.prototype,"includeEntities",2),t([a()],B.prototype,"_search",2),t([a()],B.prototype,"_pending",2),B=t([c("scheduler-plus-entity-multi-picker")],B);var C1=class extends s{constructor(){super(...arguments);this._handleTitleChange=C=>{let H=C.target.value;this._fireConfigChanged({...this._config,title:H||void 0})}}setConfig(C){this._config=C}_fireConfigChanged(C){this._config=C,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:C}}))}render(){return this._config?r`
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
          .domains=${a1}
          @value-changed=${C=>{this._fireConfigChanged({...this._config,entities:C.detail.value})}}
        ></scheduler-plus-entity-multi-picker>
      </div>
    `:r``}};C1.styles=x`
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
  `,t([l({attribute:!1})],C1.prototype,"hass",2),t([a()],C1.prototype,"_config",2),C1=t([c("scheduler-plus-card-editor")],C1);function Y2(L){let V=L.getFullYear(),C=String(L.getMonth()+1).padStart(2,"0"),H=String(L.getDate()).padStart(2,"0");return`${V}-${C}-${H}`}function $1(){return Y2(new Date)}function G(L){return new Date(L).toLocaleTimeString(void 0,{hour:"numeric",minute:"2-digit"})}function N1(L,V){let C=new Date(L),H=Y2(C);return H>V?100:H<V?0:(C.getHours()*60+C.getMinutes())/(24*60)*100}function X2(L,V){let C=`${L.schedule_name} \xB7 ${L.rule_name}`;if(L.on_at!==null&&L.off_at!==null){let H=N1(L.on_at,V),e=N1(L.off_at,V);return{leftPct:H,widthPct:Math.max(e-H,1),title:`${C} (${G(L.on_at)} \u2192 ${G(L.off_at)})`}}return L.on_at!==null?{leftPct:N1(L.on_at,V),widthPct:1,title:`${C} (on at ${G(L.on_at)})`}:{leftPct:N1(L.off_at,V),widthPct:1,title:`${C} (off at ${G(L.off_at)})`}}function y5(L){return L.events.map(V=>X2(V,L.date))}function b5(L,V,C,H){return L<H&&C<V}function _5(L,V){let{on_at:C,off_at:H,schedule_id:e}=L;return C===null||H===null?!1:V.some(M=>M.schedule_id===e||M.on_at===null||M.off_at===null?!1:b5(C,H,M.on_at,M.off_at))}function k5(L,V){let C=new Map;for(let H of L){let e=C.get(H.schedule_id);e?e.push(H):C.set(H.schedule_id,[H])}return[...C.values()].map(H=>{let[{schedule_id:e,schedule_name:M}]=H,i=H.map(n=>({...X2(n,V),conflict:_5(n,L)}));return{scheduleId:e,scheduleName:M,segments:i}}).sort((H,e)=>H.scheduleName.localeCompare(e.scheduleName))}function w5(L,V=4){let C=L.join(", ");return L.length<=V?{visible:C,full:C,overflow:0}:{visible:L.slice(0,V).join(", "),full:C,overflow:L.length-V}}var J2=["devices","climate"],C5={devices:"Lights & Switches",climate:"Climate"};function j2(L){return L==="climate"?"climate":"devices"}var T5=["all",...J2],B5={all:"All",...C5},O=class extends s{constructor(){super(...arguments);this._open=!1;this._viewMode="day";this._date=$1();this._reportFilter="all";this._events=[];this._weekDays=[];this._loading=!1;this._closeDialog=()=>{this._open=!1};this._handleViewModeChange=C=>{this._viewMode=C,this._load()};this._handleDateChange=C=>{this._date=C.target.value,this._load()};this._handleReportFilterChange=C=>{this._reportFilter=C.target.value,this._load()}}showDialog(){this._viewMode="day",this._date=$1(),this._reportFilter="all",this._open=!0,this._load()}_entityName(C){let H=this.hass.states[C]?.attributes.friendly_name;return typeof H=="string"?H:C}_matchesFilters(C){if(this._reportFilter!=="all"&&j2(C.device_type)!==this._reportFilter)return!1;let H=this.entityFilter;return!(H&&H.length>0&&!C.entities.some(e=>H.includes(e)))}async _load(){this._loading=!0,this._error=void 0;try{if(this._viewMode==="day"){let C=await t1(this.hass,this._date);this._events=C.filter(H=>this._matchesFilters(H))}else{let C=await k1(this.hass,this._date);this._weekDays=C.map(H=>({date:H.date,events:H.events.filter(e=>this._matchesFilters(e))}))}}catch(C){this._error=C instanceof Error?C.message:String(C)}finally{this._loading=!1}}render(){return this._open?r`
      <ha-dialog open @closed=${this._closeDialog}>
        <div class="form">
          <div class="dialog-title">Day view</div>

          <div class="view-toggle">
            <button
              type="button"
              class="day-chip ${this._viewMode==="day"?"active":""}"
              @click=${()=>this._handleViewModeChange("day")}
            >
              Day
            </button>
            <button
              type="button"
              class="day-chip ${this._viewMode==="week"?"active":""}"
              @click=${()=>this._handleViewModeChange("week")}
            >
              Week
            </button>
          </div>

          <div class="controls">
            <div class="control">
              <label class="field-label" for="day-view-date">
                ${this._viewMode==="week"?"Week starting":"Date"}
              </label>
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
                ${T5.map(C=>r`<option value=${C}>${B5[C]}</option>`)}
              </select>
            </div>
          </div>

          <div class="content">
            ${this._viewMode==="day"?this._renderContent():this._renderWeekContent()}
          </div>

          <div class="dialog-actions">
            <button type="button" class="btn" @click=${this._closeDialog}>Close</button>
          </div>
        </div>
      </ha-dialog>
    `:o}_renderContent(){if(this._loading)return r`<div class="placeholder">Loading…</div>`;if(this._error)return r`<div class="placeholder error">${this._error}</div>`;if(this._events.length===0)return r`<div class="placeholder">No activity scheduled for this day.</div>`;let C=J2.map(H=>({group:H,events:this._events.filter(e=>j2(e.device_type)===H).sort((e,M)=>(e.on_at??e.off_at??"").localeCompare(M.on_at??M.off_at??""))})).filter(H=>H.events.length>0);return r`
      ${this._renderDayTimeline()}
      ${C.map(H=>r`
          <div class="group">
            <h3 class="group-title">${C5[H.group]}</h3>
            <ul class="events">
              ${H.events.map(e=>this._renderEvent(e))}
            </ul>
          </div>
        `)}
    `}_renderDayTimeline(){let C=k5(this._events,this._date),H=this._date===$1(),e=new Date,M=H?(e.getHours()*60+e.getMinutes())/(24*60)*100:null;return r`
      <div class="swimlanes">
        ${C.map(i=>r`
            <div class="swimlane">
              <span class="swimlane-label" title=${i.scheduleName}>${i.scheduleName}</span>
              <div class="day-timeline" title="12 AM to 12 AM">
                <span class="day-timeline-tick" style="left: 25%"></span>
                <span class="day-timeline-tick" style="left: 50%"></span>
                <span class="day-timeline-tick" style="left: 75%"></span>
                ${i.segments.map(n=>r`
                    <span
                      class="day-timeline-segment ${n.conflict?"conflict":""}"
                      style="left: ${n.leftPct}%; width: ${n.widthPct}%"
                      title="${n.conflict?"\u26A0 Overlaps another schedule - ":""}${n.title}"
                    ></span>
                  `)}
                ${M!==null?r`<span class="day-timeline-now" style="left: ${M}%" title="Now"></span>`:o}
              </div>
            </div>
          `)}
      </div>
    `}_renderWeekContent(){return this._loading?r`<div class="placeholder">Loading…</div>`:this._error?r`<div class="placeholder error">${this._error}</div>`:this._weekDays.every(C=>C.events.length===0)?r`<div class="placeholder">No activity scheduled this week.</div>`:r`
      <div class="week-list">${this._weekDays.map(C=>this._renderWeekDay(C))}</div>
    `}_renderWeekDay(C){let H=new Date(`${C.date}T00:00:00`).toLocaleDateString(void 0,{weekday:"long",month:"short",day:"numeric"}),e=C.date===$1(),M=[...C.events].sort((p,A)=>(p.on_at??p.off_at??"").localeCompare(A.on_at??A.off_at??"")),i=y5(C),n=new Date,d=e?(n.getHours()*60+n.getMinutes())/(24*60)*100:null;return r`
      <div class="week-day">
        <div class="week-day-header">
          <span class=${e?"today":""}>${H}</span>
          ${e?r`<span class="today-badge">Today</span>`:o}
        </div>
        <div class="day-timeline" title="12 AM to 12 AM">
          <span class="day-timeline-tick" style="left: 25%"></span>
          <span class="day-timeline-tick" style="left: 50%"></span>
          <span class="day-timeline-tick" style="left: 75%"></span>
          ${i.map(p=>r`
              <span
                class="day-timeline-segment"
                style="left: ${p.leftPct}%; width: ${p.widthPct}%"
                title=${p.title}
              ></span>
            `)}
          ${d!==null?r`<span class="day-timeline-now" style="left: ${d}%" title="Now"></span>`:o}
        </div>
        ${M.length===0?r`<div class="placeholder small">Nothing scheduled</div>`:r`<ul class="events">${M.map(p=>this._renderEvent(p))}</ul>`}
      </div>
    `}_renderEvent(C){let H=C.on_at!==null&&C.off_at!==null&&C.off_at.slice(0,10)!==C.on_at.slice(0,10),e=k(C.device_type,C.action),M=w5(C.entities.map(i=>this._entityName(i)));return r`
      <li class="event">
        <div class="event-top">
          <span class="event-time">
            ${C.on_at!==null&&C.off_at!==null?r`${G(C.on_at)} → ${G(C.off_at)}`:C.on_at!==null?r`On at ${G(C.on_at)}`:r`Off at ${G(C.off_at)}`}
          </span>
          ${H?r`<span class="hint">next day</span>`:o}
        </div>
        <span class="event-name">${C.schedule_name} · ${C.rule_name}</span>
        ${e?r`<span class="event-action">${e}</span>`:o}
        <span class="event-entities" title=${M.full}>
          ${M.visible}${M.overflow>0?r` <span class="event-entities-more">+${M.overflow} more</span>`:o}
        </span>
      </li>
    `}};O.styles=x`
    .form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 320px;
      max-width: min(92vw, 520px);
    }
    .dialog-title {
      font-size: 1.25rem;
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .view-toggle {
      display: flex;
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
    .week-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .week-day {
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      padding: 10px 12px;
    }
    .week-day-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 0.9em;
      font-weight: 600;
      color: var(--primary-text-color);
    }
    .week-day-header .today {
      color: var(--primary-color);
    }
    .today-badge {
      font-size: 0.68em;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--text-primary-color, #fff);
      background: var(--primary-color);
      padding: 2px 8px;
      border-radius: 10px;
    }
    .placeholder.small {
      padding: 0;
      font-size: 0.85em;
      text-align: left;
    }
    .day-timeline {
      position: relative;
      height: 8px;
      margin-bottom: 10px;
      border-radius: 4px;
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.06));
      overflow: hidden;
    }
    .day-timeline-tick {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 1px;
      background: var(--card-background-color);
      opacity: 0.6;
    }
    .day-timeline-segment {
      position: absolute;
      top: 0;
      bottom: 0;
      min-width: 3px;
      border-radius: 3px;
      background: var(--primary-color);
      opacity: 0.8;
    }
    .day-timeline-now {
      position: absolute;
      top: -2px;
      bottom: -2px;
      width: 2px;
      background: var(--error-color, #db4437);
      border-radius: 1px;
    }
    .day-timeline-segment.conflict {
      background: var(--warning-color, #ffa600);
      opacity: 1;
    }
    .swimlanes {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 18px;
    }
    .swimlane {
      display: grid;
      grid-template-columns: minmax(0, 100px) 1fr;
      align-items: center;
      gap: 8px;
    }
    .swimlane-label {
      font-size: 0.78em;
      color: var(--secondary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .swimlane .day-timeline {
      margin-bottom: 0;
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
      margin-bottom: 18px;
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
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .event {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 10px 12px;
      border-radius: 8px;
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.035));
    }
    .event-top {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }
    .event-time {
      font-weight: 600;
      font-size: 0.9em;
      color: var(--primary-color);
    }
    .event-name {
      font-size: 0.9em;
      font-weight: 500;
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
    .event-entities-more {
      font-style: italic;
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
  `,t([l({attribute:!1})],O.prototype,"hass",2),t([l({attribute:!1})],O.prototype,"entityFilter",2),t([a()],O.prototype,"_open",2),t([a()],O.prototype,"_viewMode",2),t([a()],O.prototype,"_date",2),t([a()],O.prototype,"_reportFilter",2),t([a()],O.prototype,"_events",2),t([a()],O.prototype,"_weekDays",2),t([a()],O.prototype,"_loading",2),t([a()],O.prototype,"_error",2),O=t([c("scheduler-plus-day-view")],O);var P=class extends s{constructor(){super(...arguments);this._open=!1;this._until="";this._saving=!1;this._closeDialog=()=>{this._open=!1};this._save=async()=>{if(this._schedule){if(!this._until){this._error="Pick a date to pause through.";return}this._saving=!0,this._error=void 0;try{await $(this.hass,this._schedule.id,{...X(this._schedule),override_until:this._until}),this._open=!1,this.dispatchEvent(new CustomEvent("schedule-plus-saved"))}catch(C){this._error=C instanceof Error?C.message:String(C)}finally{this._saving=!1}}}}showDialog(C){this._schedule=C,this._until=C.override_until??"",this._error=void 0,this._open=!0}render(){return!this._open||!this._schedule?o:r`
      <ha-dialog open @closed=${this._closeDialog}>
        <div class="form">
          <div class="dialog-title">Pause "${this._schedule.name}"</div>
          <span class="hint">
            Suppresses this schedule entirely through the date below, then
            resumes automatically the next day - nothing to remember to turn
            back on.
          </span>
          ${this._error?r`<div class="error">${this._error}</div>`:o}

          <label class="field-label" for="override-until">Paused through</label>
          <input
            id="override-until"
            type="date"
            class="native-input"
            .value=${this._until}
            @input=${C=>{this._until=C.target.value}}
          />

          <div class="dialog-actions">
            <button type="button" class="btn" @click=${this._closeDialog}>Cancel</button>
            <button
              type="button"
              class="btn btn-primary"
              ?disabled=${this._saving}
              @click=${this._save}
            >
              Pause
            </button>
          </div>
        </div>
      </ha-dialog>
    `}};P.styles=x`
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
    .field-label {
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
  `,t([l({attribute:!1})],P.prototype,"hass",2),t([a()],P.prototype,"_open",2),t([a()],P.prototype,"_schedule",2),t([a()],P.prototype,"_until",2),t([a()],P.prototype,"_saving",2),t([a()],P.prototype,"_error",2),P=t([c("scheduler-plus-override-dialog")],P);var y=class extends s{constructor(){super(...arguments);this._open=!1;this._weekdayDays=[];this._weekendDays=[];this._workingHoursStart="09:00";this._workingHoursEnd="17:00";this._loading=!1;this._saving=!1;this._closeDialog=()=>{this._open=!1};this._toggleWeekdayDay=C=>{this._weekdayDays=this._weekdayDays.includes(C)?this._weekdayDays.filter(H=>H!==C):[...this._weekdayDays,C],this._weekendDays=this._weekendDays.filter(H=>H!==C)};this._toggleWeekendDay=C=>{this._weekendDays=this._weekendDays.includes(C)?this._weekendDays.filter(H=>H!==C):[...this._weekendDays,C],this._weekdayDays=this._weekdayDays.filter(H=>H!==C)};this._save=async()=>{if(this._weekdayDays.length===0){this._error="At least one weekday day is required.";return}if(this._weekendDays.length===0){this._error="At least one weekend day is required.";return}this._saving=!0,this._error=void 0;try{let C={weekday_days:this._weekdayDays,weekend_days:this._weekendDays,working_hours_start:this._workingHoursStart,working_hours_end:this._workingHoursEnd};await B2(this.hass,C),this._open=!1}catch(C){this._error=C instanceof Error?C.message:String(C)}finally{this._saving=!1}}}showDialog(){this._open=!0,this._load()}async _load(){this._loading=!0,this._error=void 0;try{let C=await _1(this.hass);this._weekdayDays=[...C.weekday_days],this._weekendDays=[...C.weekend_days],this._workingHoursStart=C.working_hours_start.slice(0,5),this._workingHoursEnd=C.working_hours_end.slice(0,5)}catch(C){this._error=C instanceof Error?C.message:String(C)}finally{this._loading=!1}}render(){return this._open?r`
      <ha-dialog open @closed=${this._closeDialog}>
        <div class="form">
          <div class="dialog-title">My preferences</div>
          <span class="hint">
            Your own weekday/weekend/working-hours split, used by the rule
            editor's quick-fill presets. Only affects your account - not
            shared with other users.
          </span>
          ${this._error?r`<div class="error">${this._error}</div>`:o}

          ${this._loading?r`<div class="placeholder">Loading…</div>`:r`
                <label class="field-label">Weekday days</label>
                <div class="days">
                  ${f.map(C=>r`
                      <button
                        type="button"
                        class="day-chip ${this._weekdayDays.includes(C)?"active":""}"
                        @click=${()=>this._toggleWeekdayDay(C)}
                      >
                        ${N[C].slice(0,3)}
                      </button>
                    `)}
                </div>

                <label class="field-label">Weekend days</label>
                <div class="days">
                  ${f.map(C=>r`
                      <button
                        type="button"
                        class="day-chip ${this._weekendDays.includes(C)?"active":""}"
                        @click=${()=>this._toggleWeekendDay(C)}
                      >
                        ${N[C].slice(0,3)}
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
    `:o}};y.styles=x`
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
  `,t([l({attribute:!1})],y.prototype,"hass",2),t([a()],y.prototype,"_open",2),t([a()],y.prototype,"_weekdayDays",2),t([a()],y.prototype,"_weekendDays",2),t([a()],y.prototype,"_workingHoursStart",2),t([a()],y.prototype,"_workingHoursEnd",2),t([a()],y.prototype,"_loading",2),t([a()],y.prototype,"_saving",2),t([a()],y.prototype,"_error",2),y=t([c("scheduler-plus-preferences")],y);function H5(L){return new Date(L).toLocaleTimeString(void 0,{hour:"numeric",minute:"2-digit"})}function P5(L){return new Date(`${L}T00:00:00`).toLocaleDateString(void 0,{month:"short",day:"numeric"})}function I1(L){return`Overlaps "${L.conflicting_schedule_name}" -> "${L.conflicting_rule_name}" on ${P5(L.date)}, ${H5(L.conflicting_on_at)} - ${H5(L.conflicting_off_at)}`}async function W1(L,V){let H=(await r1(L)).find(i=>i.id===V.conflicting_schedule_id);if(!H)throw new Error(`"${V.conflicting_schedule_name}" no longer exists.`);let e=!1,M=H.rules.map(i=>i.id!==V.conflicting_rule_id?i:(e=!0,i.date_mode==="include"?{...i,dates:i.dates.filter(n=>n!==V.date)}:{...i,date_mode:"exclude",dates:i.dates.includes(V.date)?i.dates:[...i.dates,V.date]}));if(!e)throw new Error(`"${V.conflicting_rule_name}" no longer exists.`);await $(L,H.id,{...X(H),rules:M})}function V5(){let L=new Date;return`${L.getFullYear()}-${String(L.getMonth()+1).padStart(2,"0")}-${String(L.getDate()).padStart(2,"0")}`}var g=class extends s{constructor(){super(...arguments);this._open=!1;this._entities=[];this._name="";this._date=V5();this._onTime="18:00";this._offTime="22:00";this._saving=!1;this._checkingConflicts=!1;this._conflicts=[];this._closeDialog=()=>{this._open=!1};this._save=async()=>{if(this._entities.length===0){this._error="At least one entity is required.";return}let C=this._buildInput();this._checkingConflicts=!0,this._error=void 0;try{let H=await B1(this.hass,null,C);H.length===0?(this._conflicts=[],await this._persist(C)):this._conflicts=H}catch(H){this._error=H instanceof Error?H.message:String(H)}finally{this._checkingConflicts=!1}};this._createAnyway=()=>{this._persist(this._buildInput())};this._excludeConflict=async C=>{try{await W1(this.hass,C),this._conflicts=this._conflicts.filter(H=>!(H.conflicting_rule_id===C.conflicting_rule_id&&H.date===C.date)),this._conflicts.length===0&&await this._persist(this._buildInput())}catch(H){window.alert(H instanceof Error?H.message:String(H))}}}showDialog(){this._entities=[],this._date=V5(),this._name="",this._onTime="18:00",this._offTime="22:00",this._conflicts=[],this._error=void 0,this._open=!0}_buildInput(){let C={name:"Quick event",enabled:!0,days:[...f],date_mode:"include",dates:[this._date],date_ranges:[],day_conditions:[],on_time:{provider:"fixed",params:{time:this._onTime}},off_time:{provider:"fixed",params:{time:this._offTime}},on_enabled:!0,off_enabled:!0,allow_override:!0,override_grace_minutes:15,action:{},off_action:null};return{name:this._name.trim()||`Event \u2013 ${this._date}`,device_type:"light_switch",entities:this._entities,enabled:!0,rules:[C]}}async _persist(C){this._saving=!0,this._error=void 0;try{await b1(this.hass,C),this._open=!1,this.dispatchEvent(new CustomEvent("schedule-plus-saved"))}catch(H){this._error=H instanceof Error?H.message:String(H)}finally{this._saving=!1}}render(){return this._open?r`
      <ha-dialog open @closed=${this._closeDialog}>
        <div class="form">
          <div class="dialog-title">Quick event</div>
          <span class="hint">
            A one-off on/off for a single date - lights and switches only.
            For climate or a recurring schedule, use Add schedule instead.
          </span>
          ${this._error?r`<div class="error">${this._error}</div>`:o}

          <label class="field-label" for="event-name">Name</label>
          <input
            id="event-name"
            type="text"
            class="native-input"
            placeholder="Event – ${this._date}"
            .value=${this._name}
            @input=${C=>{this._name=C.target.value}}
          />

          <label class="field-label">Entities</label>
          <scheduler-plus-entity-multi-picker
            .hass=${this.hass}
            .value=${this._entities}
            .domains=${P1.light_switch}
            .includeEntities=${this.entityFilter}
            @value-changed=${C=>{this._entities=C.detail.value}}
          ></scheduler-plus-entity-multi-picker>

          <label class="field-label" for="event-date">Date</label>
          <input
            id="event-date"
            type="date"
            class="native-input"
            .value=${this._date}
            @input=${C=>{this._date=C.target.value}}
          />

          <div class="time-columns">
            <div class="time-field">
              <label class="field-label" for="event-on-time">On</label>
              <input
                id="event-on-time"
                type="time"
                class="native-input"
                .value=${this._onTime}
                @input=${C=>{this._onTime=C.target.value}}
              />
            </div>
            <div class="time-field">
              <label class="field-label" for="event-off-time">Off</label>
              <input
                id="event-off-time"
                type="time"
                class="native-input"
                .value=${this._offTime}
                @input=${C=>{this._offTime=C.target.value}}
              />
            </div>
          </div>

          ${this._conflicts.length>0?this._renderConflictPanel():o}

          <div class="dialog-actions">
            <button
              type="button"
              class="btn"
              ?disabled=${this._saving||this._checkingConflicts}
              @click=${this._closeDialog}
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary"
              ?disabled=${this._saving||this._checkingConflicts}
              @click=${this._save}
            >
              ${this._checkingConflicts?"Checking\u2026":"Create"}
            </button>
          </div>
        </div>
      </ha-dialog>
    `:o}_renderConflictPanel(){return r`
      <div class="conflict-panel">
        <span class="conflict-title">
          This overlaps ${this._conflicts.length===1?"another schedule":"other schedules"}
        </span>
        <ul class="conflicts">
          ${this._conflicts.map(C=>r`
              <li class="conflict-row">
                <div class="conflict-info">
                  <span>${I1(C)}</span>
                  <span class="hint">${C.entity_ids.join(", ")}</span>
                </div>
                ${C.fixable?r`
                      <button
                        type="button"
                        class="btn"
                        @click=${()=>this._excludeConflict(C)}
                      >
                        Exclude "${C.conflicting_schedule_name}" on ${C.date}
                      </button>
                    `:r`<span class="hint">Adjust manually - can't auto-fix this one.</span>`}
              </li>
            `)}
        </ul>
        <button type="button" class="btn" @click=${this._createAnyway}>Create anyway</button>
      </div>
    `}};g.styles=x`
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
    .field-label {
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
    .time-columns {
      display: flex;
      gap: 12px;
    }
    .time-field {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .conflict-panel {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      border: 1px solid var(--warning-color, #ffa600);
      border-radius: 6px;
    }
    .conflict-title {
      font-weight: 500;
      color: var(--warning-color, #ffa600);
    }
    ul.conflicts {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .conflict-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--divider-color);
    }
    .conflict-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .conflict-info {
      display: flex;
      flex-direction: column;
      font-size: 0.9em;
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
  `,t([l({attribute:!1})],g.prototype,"hass",2),t([l({attribute:!1})],g.prototype,"entityFilter",2),t([a()],g.prototype,"_open",2),t([a()],g.prototype,"_entities",2),t([a()],g.prototype,"_name",2),t([a()],g.prototype,"_date",2),t([a()],g.prototype,"_onTime",2),t([a()],g.prototype,"_offTime",2),t([a()],g.prototype,"_saving",2),t([a()],g.prototype,"_checkingConflicts",2),t([a()],g.prototype,"_conflicts",2),t([a()],g.prototype,"_error",2),g=t([c("scheduler-plus-quick-event-dialog")],g);function i2(L,V,C){let H=new Date(L).getTime(),e=new Date(V).getTime(),M=new Date(C).getTime();if(!(M>e))return 0;let i=(H-e)/(M-e)*100;return Math.min(100,Math.max(0,i))}function L5(L,V,C){let H=new Date(V).getTime(),e=new Date(C).getTime(),M=Math.min(100,Math.max(0,L));return new Date(H+(e-H)*M/100).toISOString()}function e5(L,V,C){let H=[];for(let e=0;e<L.length;e+=1){let M=L[e];if(!M||M.state!=="on")continue;let i=L[e+1],n=i2(M.at,V,C),d=i?i2(i.at,V,C):100;H.push({leftPct:n,widthPct:Math.max(d-n,.4),title:i?`On: ${A1(M.at)} \u2192 ${A1(i.at)}`:`On since ${A1(M.at)} (ongoing)`})}return H}function a2(L,V){return L.map(C=>({at:C.at,value:C.attributes[V]})).filter(C=>typeof C.value=="number")}function M5(L,V){let C=V.flatMap(n=>a2(L,n).map(d=>d.value));if(C.length===0)return null;let H=Math.min(...C),e=Math.max(...C),i=(e-H||Math.abs(e)||1)*.08;return{min:H-i,max:e+i}}function z1(L,V){let C=V.max-V.min||1;return 100-(L-V.min)/C*100}function o2(L,V,C,H,e){let M=a2(L,V);return M.length===0?null:{path:M.map((n,d)=>{let p=i2(n.at,H,e),A=z1(n.value,C);return`${d===0?"M":"L"}${p.toFixed(2)},${A.toFixed(2)}`}).join(" ")}}function A2(L,V,C){let H=a2(L,V);if(H.length===0)return null;let e=new Date(C).getTime(),M=H[0];for(let i of H){if(new Date(i.at).getTime()>e)break;M=i}return M.value}function A1(L){return new Date(L).toLocaleString(void 0,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}function H1(L){return`${Math.round(L*10)/10}\xB0`}var R5=["current_temperature","temperature"];function d2(L){let V=L.getFullYear(),C=String(L.getMonth()+1).padStart(2,"0"),H=String(L.getDate()).padStart(2,"0");return`${V}-${C}-${H}`}function D5(){return d2(new Date)}function F5(){let L=new Date;return L.setDate(L.getDate()-6),d2(L)}function r5(L){let V=L.replace(/_/g," ");return V.charAt(0).toUpperCase()+V.slice(1)}function E5(L,V){if(L==="climate"){let C=[],H=V.attributes.temperature,e=V.attributes.current_temperature,M=V.attributes.hvac_action;return typeof H=="number"&&C.push(`Target ${H1(H)}`),typeof e=="number"&&C.push(`Room ${H1(e)}`),typeof M=="string"&&M&&C.push(r5(M)),C.join(" \xB7 ")}if(L==="light"){let C=V.attributes.brightness;return typeof C=="number"?`Brightness ${Math.round(C/255*100)}%`:""}return""}function $5(L){return L.source==="rule"?`Scheduler+: ${L.rule_name} (${L.schedule_name})`:"Other"}var N5={climate:L=>`${L.state}|${L.attributes.temperature}|${L.attributes.hvac_action}`};function I5(L,V){let C=N5[V];if(!C)return L;let H=[],e;for(let M of L){let i=C(M);(H.length===0||i!==e)&&(H.push(M),e=i)}return H}function W5(L){let V=new Map;for(let C of L){let H=new Date(C.at),e=d2(H),M=V.get(e)??[];M.push(C),V.set(e,M)}return[...V.entries()].map(([C,H])=>({key:C,label:new Intl.DateTimeFormat(void 0,{weekday:"long",month:"long",day:"numeric",year:"numeric"}).format(new Date(`${C}T12:00:00`)),points:H}))}var b=class extends s{constructor(){super(...arguments);this._entities=[];this._startDate=F5();this._endDate=D5();this._loading=!1;this._handleEntitiesChanged=C=>{this._entities=C.detail.value};this._handleStartDateChange=C=>{this._startDate=C.target.value};this._handleEndDateChange=C=>{this._endDate=C.target.value};this._generate=async()=>{if(!this._canGenerate){this._error=this._entities.length===0?"Pick at least one entity.":"Start date must not be after end date.";return}this._loading=!0,this._error=void 0;try{this._report=await R2(this.hass,this._entities,this._startDate,this._endDate)}catch(C){this._error=C instanceof Error?C.message:String(C)}finally{this._loading=!1}};this._downloadPdf=async()=>{if(!this._canGenerate)return;let C={},H=this.hass.auth?.data?.access_token;H&&(C.Authorization=`Bearer ${H}`);let e=await fetch(D2(this._entities,this._startDate,this._endDate),{headers:C});if(!e.ok)throw new Error(`PDF download failed (${e.status} ${e.statusText})`);let M=await e.blob(),i=URL.createObjectURL(M),n=document.createElement("a");n.href=i,n.download="scheduler-plus-report.pdf",n.click(),URL.revokeObjectURL(i)};this._handleChartMouseMove=(C,H)=>{let e=H.currentTarget.getBoundingClientRect();if(e.width===0)return;let M=Math.min(100,Math.max(0,(H.clientX-e.left)/e.width*100)),i=L5(M,this._startDate,this._endDate);this._hover={entityId:C.entity_id,xPct:M,time:i,actual:A2(C.points,"current_temperature",i),target:A2(C.points,"temperature",i)}};this._handleChartMouseLeave=()=>{this._hover=void 0}}static getStubConfig(){return{type:"custom:scheduler-plus-report-card"}}static getConfigElement(){return document.createElement("scheduler-plus-report-card-editor")}setConfig(C){this._config=C,this._entities=C.entities??[]}getCardSize(){return 6}get _canGenerate(){return this._entities.length>0&&!!this._startDate&&!!this._endDate&&this._startDate<=this._endDate}render(){return r`
      <ha-card>
        <div class="header">
          <span>${this._config?.title??"Report"}</span>
        </div>
        <div class="content">
          <scheduler-plus-entity-multi-picker
            .hass=${this.hass}
            .value=${this._entities}
            .domains=${a1}
            @value-changed=${this._handleEntitiesChanged}
          ></scheduler-plus-entity-multi-picker>

          <div class="controls">
            <div class="control">
              <label class="field-label" for="report-start-date">From</label>
              <input
                id="report-start-date"
                type="date"
                class="native-input"
                .value=${this._startDate}
                @change=${this._handleStartDateChange}
              />
            </div>
            <div class="control">
              <label class="field-label" for="report-end-date">To</label>
              <input
                id="report-end-date"
                type="date"
                class="native-input"
                .value=${this._endDate}
                @change=${this._handleEndDateChange}
              />
            </div>
          </div>

          <div class="actions-row">
            <button
              type="button"
              class="btn btn-primary"
              ?disabled=${this._loading}
              @click=${this._generate}
            >
              ${this._loading?"Generating\u2026":"Generate"}
            </button>
            <button type="button" class="btn" @click=${this._downloadPdf}>Download PDF</button>
          </div>

          ${this._error?r`<div class="placeholder error">${this._error}</div>`:o}

          ${this._renderResults()}
        </div>
      </ha-card>
    `}_renderResults(){return this._report?this._report.entities.length===0?r`<div class="placeholder">No entities selected.</div>`:r`
      <div class="entities">
        ${this._report.entities.map(C=>this._renderEntity(C))}
      </div>
    `:o}_renderEntity(C){return r`
      <div class="entity-report">
        <div class="entity-title">${C.friendly_name}</div>
        ${C.no_data?r`<div class="placeholder small">
              No data found - may be outside your Home Assistant history retention.
            </div>`:r`
              ${this._renderChart(C)}
              ${C.truncated?r`<div class="hint">Truncated - too many changes to list them all.</div>`:o}
              <ul class="points">
                ${W5(I5(C.points,C.domain)).map(H=>r`
                    <li class="day-group">
                      <div class="day-header"><span>${H.label}</span><span>${H.points.length} changes</span></div>
                      <ul class="day-points">
                        ${H.points.map(e=>r`
                          <li class="point">
                            <span class="point-time">${A1(e.at)}</span>
                            <span class="point-state">${r5(e.state)}</span>
                            <span class="point-details">${E5(C.domain,e)}</span>
                            <span class="point-source ${e.source}">${$5(e)}</span>
                          </li>
                        `)}
                      </ul>
                    </li>
                  `)}
              </ul>
            `}
      </div>
    `}_renderChart(C){return C.domain==="climate"?this._renderNumericChart(C):this._renderTimeline(C)}_renderNumericChart(C){let H=M5(C.points,[...R5]);if(!H)return o;let e=o2(C.points,"current_temperature",H,this._startDate,this._endDate),M=o2(C.points,"temperature",H,this._startDate,this._endDate),i=this._hover?.entityId===C.entity_id?this._hover:void 0,n=i?.actual!=null?z1(i.actual,H):void 0,d=i?.target!=null?z1(i.target,H):void 0;return r`
      <div class="chart">
        <div class="chart-body">
          <div class="y-axis">
            <span>${H1(H.max)}</span>
            <span>${H1(H.min)}</span>
          </div>
          <div
            class="chart-plot"
            @mousemove=${p=>this._handleChartMouseMove(C,p)}
            @mouseleave=${this._handleChartMouseLeave}
          >
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <line class="gridline" x1="0" y1="25" x2="100" y2="25"></line>
              <line class="gridline" x1="0" y1="50" x2="100" y2="50"></line>
              <line class="gridline" x1="0" y1="75" x2="100" y2="75"></line>
              ${e?M1`<path class="series actual" d=${e.path}></path>`:o}
              ${M?M1`<path class="series target" d=${M.path}></path>`:o}
              ${i?M1`
                    <line
                      class="hover-guide"
                      x1=${i.xPct} y1="0" x2=${i.xPct} y2="100"
                    ></line>
                    ${n!==void 0?M1`<circle class="hover-dot actual" cx=${i.xPct} cy=${n} r="2"></circle>`:o}
                    ${d!==void 0?M1`<circle class="hover-dot target" cx=${i.xPct} cy=${d} r="2"></circle>`:o}
                  `:o}
            </svg>
            ${i?r`
                  <div
                    class="chart-tooltip"
                    style="left: ${Math.min(88,Math.max(12,i.xPct))}%"
                  >
                    <div class="chart-tooltip-time">${A1(i.time)}</div>
                    ${i.actual!=null?r`<div class="chart-tooltip-row actual">
                          Actual: ${H1(i.actual)}
                        </div>`:o}
                    ${i.target!=null?r`<div class="chart-tooltip-row target">
                          Target: ${H1(i.target)}
                        </div>`:o}
                  </div>
                `:o}
          </div>
        </div>
        <div class="legend">
          ${e?r`<span class="legend-item actual">Actual temperature</span>`:o}
          ${M?r`<span class="legend-item target">Target temperature</span>`:o}
        </div>
      </div>
    `}_renderTimeline(C){let H=e5(C.points,this._startDate,this._endDate);return r`
      <div class="timeline" title="${this._startDate} to ${this._endDate}">
        ${H.map(e=>r`
            <span
              class="timeline-bar"
              style="left: ${e.leftPct}%; width: ${e.widthPct}%"
              title=${e.title}
            ></span>
          `)}
      </div>
    `}};b.styles=x`
    .header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 16px 4px;
      font-size: 1.25rem;
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 8px 16px 16px;
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
    .native-input {
      font: inherit;
      color: var(--primary-text-color);
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      padding: 8px;
    }
    .actions-row {
      display: flex;
      gap: 8px;
    }
    .placeholder {
      padding: 16px 0;
      color: var(--secondary-text-color);
      text-align: center;
    }
    .placeholder.small {
      padding: 8px 0;
      font-size: 0.85em;
    }
    .placeholder.error {
      color: var(--error-color);
      padding: 4px 0;
      text-align: left;
    }
    .hint {
      font-size: 0.8em;
      color: var(--secondary-text-color);
      font-style: italic;
    }
    .entities {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .entity-report {
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      padding: 10px 12px;
    }
    .entity-title {
      font-size: 0.95em;
      font-weight: 600;
      color: var(--primary-text-color);
      margin-bottom: 8px;
    }
    .timeline {
      position: relative;
      height: 10px;
      margin-bottom: 10px;
      border-radius: 4px;
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.06));
      overflow: hidden;
    }
    .timeline-bar {
      position: absolute;
      top: 0;
      bottom: 0;
      min-width: 2px;
      background: var(--primary-color);
      opacity: 0.85;
    }
    .chart {
      margin-bottom: 10px;
    }
    .chart-body {
      display: flex;
      gap: 6px;
    }
    .y-axis {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: flex-end;
      flex: none;
      width: 40px;
      padding: 4px 0;
      font-size: 0.7em;
      color: var(--secondary-text-color);
    }
    .chart-plot {
      position: relative;
      flex: 1;
      min-width: 0;
    }
    .chart-plot svg {
      width: 100%;
      height: 130px;
      display: block;
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.04));
      border-radius: 4px;
      cursor: crosshair;
    }
    .gridline {
      stroke: var(--divider-color);
      stroke-width: 0.5;
      vector-effect: non-scaling-stroke;
    }
    .series {
      fill: none;
      stroke-width: 2;
      vector-effect: non-scaling-stroke;
    }
    .series.actual {
      stroke: var(--primary-color);
    }
    .series.target {
      stroke: var(--warning-color, #ffa600);
      stroke-dasharray: 4 3;
    }
    .hover-guide {
      stroke: var(--secondary-text-color);
      stroke-width: 1;
      vector-effect: non-scaling-stroke;
      opacity: 0.6;
    }
    .hover-dot {
      vector-effect: non-scaling-stroke;
      stroke: var(--card-background-color);
      stroke-width: 1;
    }
    .hover-dot.actual {
      fill: var(--primary-color);
    }
    .hover-dot.target {
      fill: var(--warning-color, #ffa600);
    }
    .chart-tooltip {
      position: absolute;
      top: 6px;
      transform: translateX(-50%);
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 0.78em;
      white-space: nowrap;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      pointer-events: none;
    }
    .chart-tooltip-time {
      color: var(--secondary-text-color);
      margin-bottom: 2px;
    }
    .chart-tooltip-row.actual {
      color: var(--primary-color);
      font-weight: 600;
    }
    .chart-tooltip-row.target {
      color: var(--warning-color, #ffa600);
      font-weight: 600;
    }
    .legend {
      display: flex;
      gap: 12px;
      margin-top: 4px;
      font-size: 0.75em;
      color: var(--secondary-text-color);
    }
    .legend-item.actual::before,
    .legend-item.target::before {
      content: "";
      display: inline-block;
      width: 10px;
      height: 2px;
      margin-right: 4px;
      vertical-align: middle;
    }
    .legend-item.actual::before {
      background: var(--primary-color);
    }
    .legend-item.target::before {
      background: var(--warning-color, #ffa600);
    }
    ul.points {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 260px;
      overflow-y: auto;
    }
    .day-group {
      margin: 2px 0 8px;
    }
    .day-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 7px 8px;
      border-left: 4px solid var(--primary-color);
      border-bottom: 1px solid var(--divider-color);
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.06));
      color: var(--primary-text-color);
      font-size: 0.82em;
      font-weight: 700;
    }
    .day-header span:last-child {
      color: var(--secondary-text-color);
      font-size: 0.9em;
      font-weight: 500;
    }
    ul.day-points {
      list-style: none;
      margin: 4px 0 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .point {
      display: grid;
      grid-template-columns: 96px 48px 1fr auto;
      gap: 8px;
      align-items: baseline;
      padding: 4px 6px;
      border-radius: 4px;
      font-size: 0.8em;
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.03));
    }
    .point-time {
      color: var(--secondary-text-color);
      white-space: nowrap;
    }
    .point-state {
      font-weight: 600;
      color: var(--primary-text-color);
    }
    .point-details {
      color: var(--secondary-text-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .point-source {
      font-size: 0.9em;
      white-space: nowrap;
      color: var(--secondary-text-color);
    }
    .point-source.rule {
      color: var(--primary-color);
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
  `,t([l({attribute:!1})],b.prototype,"hass",2),t([a()],b.prototype,"_config",2),t([a()],b.prototype,"_entities",2),t([a()],b.prototype,"_startDate",2),t([a()],b.prototype,"_endDate",2),t([a()],b.prototype,"_loading",2),t([a()],b.prototype,"_error",2),t([a()],b.prototype,"_report",2),t([a()],b.prototype,"_hover",2),b=t([c("scheduler-plus-report-card")],b);window.customCards=window.customCards??[];window.customCards.push({type:"scheduler-plus-report-card",name:"Scheduler+ Report",description:"History report for any entities and date range, with PDF export."});var V1=class extends s{constructor(){super(...arguments);this._handleTitleChange=C=>{let H=C.target.value;this._fireConfigChanged({...this._config,title:H||void 0})}}setConfig(C){this._config=C}_fireConfigChanged(C){this._config=C,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:C}}))}render(){return this._config?r`
      <div class="editor">
        <label class="field-label" for="card-title">Title</label>
        <input
          id="card-title"
          type="text"
          class="native-input"
          .value=${this._config.title??""}
          @input=${this._handleTitleChange}
        />

        <label class="field-label">Default entities</label>
        <span class="hint">
          Leave empty to let whoever opens this card pick entities freely
          each time. Otherwise, the entity picker starts pre-filled with
          these (still changeable per report).
        </span>
        <scheduler-plus-entity-multi-picker
          .hass=${this.hass}
          .value=${this._config.entities??[]}
          .domains=${a1}
          @value-changed=${C=>{this._fireConfigChanged({...this._config,entities:C.detail.value})}}
        ></scheduler-plus-entity-multi-picker>
      </div>
    `:r``}};V1.styles=x`
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
  `,t([l({attribute:!1})],V1.prototype,"hass",2),t([a()],V1.prototype,"_config",2),V1=t([c("scheduler-plus-report-card-editor")],V1);var D=class extends s{constructor(){super(...arguments);this._open=!1;this._templates=[];this._loading=!1;this._closeDialog=()=>{this._open=!1};this._pick=C=>{let H=C.rules[0];H&&(this._onPick?.(H),this._open=!1)};this._deleteTemplateRow=async C=>{if(window.confirm(`Delete template "${C.name}"?`))try{await T1(this.hass,C.id),await this._load()}catch(H){window.alert(H instanceof Error?H.message:String(H))}}}showDialog(C,H){this._deviceType=C,this._onPick=H,this._error=void 0,this._open=!0,this._load()}async _load(){this._loading=!0,this._error=void 0;try{let C=await w1(this.hass);this._templates=C.filter(H=>H.scope==="rule"&&H.device_type===this._deviceType)}catch(C){this._error=C instanceof Error?C.message:String(C)}finally{this._loading=!1}}render(){return this._open?r`
      <ha-dialog open @closed=${this._closeDialog}>
        <div class="form">
          <div class="dialog-title">Start from template</div>
          ${this._error?r`<div class="error">${this._error}</div>`:o}
          ${this._renderContent()}
          <div class="dialog-actions">
            <button type="button" class="btn" @click=${this._closeDialog}>Close</button>
          </div>
        </div>
      </ha-dialog>
    `:o}_renderContent(){return this._loading?r`<div class="placeholder">Loading templates…</div>`:this._templates.length===0?r`
        <div class="placeholder">
          No rule templates saved yet for this device type. Save one from a
          rule's editor with "Save as template".
        </div>
      `:r`
      <ul class="templates">
        ${this._templates.map(C=>r`
            <li class="template">
              <span class="template-name">${C.name}</span>
              <div class="row-actions">
                <button type="button" class="btn" @click=${()=>this._pick(C)}>
                  Use
                </button>
                <ha-icon-button
                  .path=${U}
                  label="Delete template"
                  @click=${()=>this._deleteTemplateRow(C)}
                ></ha-icon-button>
              </div>
            </li>
          `)}
      </ul>
    `}};D.styles=x`
    .form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 280px;
      max-width: 400px;
    }
    .dialog-title {
      font-size: 1.25rem;
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .error {
      color: var(--error-color);
    }
    .placeholder {
      padding: 16px 0;
      color: var(--secondary-text-color);
      text-align: center;
    }
    ul.templates {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .template {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid var(--divider-color);
    }
    .template:last-child {
      border-bottom: none;
    }
    .template-name {
      font-weight: 500;
    }
    .row-actions {
      display: flex;
      align-items: center;
      gap: 4px;
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
  `,t([l({attribute:!1})],D.prototype,"hass",2),t([a()],D.prototype,"_open",2),t([a()],D.prototype,"_templates",2),t([a()],D.prototype,"_loading",2),t([a()],D.prototype,"_error",2),D=t([c("scheduler-plus-rule-template-picker")],D);var F=class extends s{constructor(){super(...arguments);this._open=!1;this._name="";this._saving=!1;this._rules=[];this._scope="schedule";this._closeDialog=()=>{this._open=!1};this._save=async()=>{let C=this._name.trim();if(!C){this._error="Name is required.";return}if(this._rules.length===0){this._error="Add at least one rule before saving as a template.";return}if(this._deviceType){this._saving=!0,this._error=void 0;try{await P2(this.hass,{name:C,device_type:this._deviceType,rules:this._rules,scope:this._scope}),this._open=!1}catch(H){this._error=H instanceof Error?H.message:String(H)}finally{this._saving=!1}}}}showDialog(C,H,e){this._deviceType=C,this._rules=H,this._scope=e,this._name="",this._error=void 0,this._open=!0}render(){return this._open?r`
      <ha-dialog open @closed=${this._closeDialog}>
        <div class="form">
          <div class="dialog-title">
            ${this._scope==="rule"?"Save rule as template":"Save schedule as template"}
          </div>
          <span class="hint">
            ${this._scope==="rule"?'Saves this one rule as a reusable template - no specific entities - so it can be added to another schedule later via "Start from template".':`Saves this schedule's device type and rules as a reusable template - no specific entities - so another schedule can be built from the same setup later via "From template".`}
          </span>
          ${this._error?r`<div class="error">${this._error}</div>`:o}

          <label class="field-label" for="template-name">Template name</label>
          <input
            id="template-name"
            type="text"
            class="native-input"
            placeholder="Standard Classroom Weekday"
            .value=${this._name}
            @input=${C=>{this._name=C.target.value}}
          />

          <div class="dialog-actions">
            <button type="button" class="btn" @click=${this._closeDialog}>Cancel</button>
            <button
              type="button"
              class="btn btn-primary"
              ?disabled=${this._saving}
              @click=${this._save}
            >
              Save template
            </button>
          </div>
        </div>
      </ha-dialog>
    `:o}};F.styles=x`
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
    .field-label {
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
  `,t([l({attribute:!1})],F.prototype,"hass",2),t([a()],F.prototype,"_open",2),t([a()],F.prototype,"_name",2),t([a()],F.prototype,"_saving",2),t([a()],F.prototype,"_error",2),F=t([c("scheduler-plus-template-editor")],F);var z5={weekday_days:["mon","tue","wed","thu","fri"],weekend_days:["sat","sun"],working_hours_start:"09:00",working_hours_end:"17:00",enable_brightness:!0,enable_fade_in:!0},n2=[{key:"fixed",label:J.fixed,makeSpec:()=>({provider:"fixed",params:{time:"06:00"}}),matches:L=>L.provider==="fixed"},{key:"sunrise",label:J.sunrise,makeSpec:()=>({provider:"sunrise",params:{offset_minutes:0}}),matches:L=>L.provider==="sunrise"},{key:"sunset",label:J.sunset,makeSpec:()=>({provider:"sunset",params:{offset_minutes:0}}),matches:L=>L.provider==="sunset"},...E2.map(L=>({key:`yidcal:${L}`,label:D1[L],makeSpec:()=>({provider:"yidcal",params:{zman:L,offset_minutes:0}}),matches:V=>V.provider==="yidcal"&&V.params.zman===L}))];function d1(L){let V=new Date(`${L}T00:00:00`);return Number.isNaN(V.getTime())?L:V.toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})}var m=class extends s{constructor(){super(...arguments);this._open=!1;this._preferences=z5;this._deviceType="light";this._name="";this._enabled=!0;this._days=[];this._dateMode="always";this._dates=[];this._newDate="";this._dateRanges=[];this._newRangeStart="";this._newRangeEnd="";this._dayConditions=[];this._onTime={provider:"fixed",params:{time:"06:00"}};this._offTime={provider:"fixed",params:{time:"21:00"}};this._onEnabled=!0;this._offEnabled=!0;this._setBrightness=!1;this._brightnessPct=100;this._useTransition=!1;this._transitionSeconds=0;this._hvacMode="heat";this._useTargetTemperature=!1;this._targetTemperature=70;this._useSetback=!1;this._setbackHvacMode="heat";this._setbackTemperature=78;this._allowOverride=!0;this._overrideGraceMinutes=15;this._additionalActions=[];this._applyRuleTemplate=C=>{this._hydrateFromRule(C)};this._openTemplatePicker=()=>{this._templatePicker?.showDialog(this._deviceType,this._applyRuleTemplate)};this._closeDialog=()=>{this._open=!1};this._toggleDay=C=>{this._days=this._days.includes(C)?this._days.filter(H=>H!==C):[...this._days,C]};this._applyDayPreset=C=>{this._days=[...C]};this._applyAfterHoursPreset=()=>{this._days=[...f],this._onTime={provider:"fixed",params:{time:this._preferences.working_hours_end.slice(0,5)}},this._offTime={provider:"fixed",params:{time:this._preferences.working_hours_start.slice(0,5)}}};this._handleDateModeChange=C=>{let H=C.target.value;this._dateMode=H,H==="include"?this._days=[...f]:H==="always"&&(this._dates=[],this._dateRanges=[],this._dayConditions=[])};this._addDate=()=>{!this._newDate||this._dates.includes(this._newDate)||(this._dates=[...this._dates,this._newDate].sort(),this._newDate="")};this._removeDate=C=>{this._dates=this._dates.filter(H=>H!==C)};this._addDateRange=()=>{!this._newRangeStart||!this._newRangeEnd||this._newRangeStart>this._newRangeEnd||(this._dateRanges=[...this._dateRanges,[this._newRangeStart,this._newRangeEnd]],this._newRangeStart="",this._newRangeEnd="")};this._removeDateRange=C=>{this._dateRanges=this._dateRanges.filter(H=>H[0]!==C[0]||H[1]!==C[1])};this._toggleDayCondition=C=>{this._dayConditions=this._dayConditions.includes(C)?this._dayConditions.filter(H=>H!==C):[...this._dayConditions,C]};this._addAdditionalAction=()=>{this._additionalActions=[...this._additionalActions,{}]};this._removeAdditionalAction=C=>{this._additionalActions=this._additionalActions.filter((H,e)=>e!==C)};this._updateAdditionalAction=(C,H)=>{try{let e=JSON.parse(H);e&&typeof e=="object"&&!Array.isArray(e)&&(this._additionalActions=this._additionalActions.map((M,i)=>i===C?e:M))}catch{}};this._updateAdditionalActionField=(C,H,e)=>{this._additionalActions=this._additionalActions.map((M,i)=>i===C?{...M,[H]:e}:M)};this._save=()=>{let C=this._validate();if(C){this._error=C;return}this._onSave?.(this._buildRuleInput()),this._open=!1};this._openSaveAsTemplate=()=>{let C=this._validate();if(C){this._error=C;return}this._templateEditor?.showDialog(this._deviceType,[this._buildRuleInput()],"rule")}}showDialog(C){let{deviceType:H,rule:e,onSave:M}=C;this._deviceType=H,this._rule=e,this._onSave=M,this._loadPreferences(),this._hydrateFromRule(e),this._error=void 0,this._open=!0}_hydrateFromRule(C){if(this._name=C?.name??"",this._enabled=C?.enabled??!0,this._days=C?[...C.days]:[],this._dateMode=C?.date_mode??"always",this._dates=C?[...C.dates]:[],this._newDate="",this._dateRanges=C?C.date_ranges.map(([H,e])=>[H,e]):[],this._newRangeStart="",this._newRangeEnd="",this._dayConditions=C?[...C.day_conditions]:[],this._onTime=C?.on_time??{provider:"fixed",params:{time:"06:00"}},this._offTime=C?.off_time??{provider:"fixed",params:{time:"21:00"}},this._onEnabled=C?.on_enabled??!0,this._offEnabled=C?.off_enabled??!0,this._allowOverride=C?.allow_override??!0,this._overrideGraceMinutes=C?.override_grace_minutes??15,this._additionalActions=(C?.actions??[]).slice(1).map(H=>({...H})),this._deviceType==="light"||this._deviceType==="light_switch"){this._setBrightness=C?.action.brightness!==void 0;let H=C?.action.brightness??255;this._brightnessPct=Math.round(H/255*100),this._useTransition=C?.action.transition!==void 0,this._transitionSeconds=C?.action.transition??0}else this._deviceType==="climate"&&(this._hvacMode=C?.action.hvac_mode??"heat",this._useTargetTemperature=C?.action.target_temperature!==void 0,this._targetTemperature=C?.action.target_temperature??70,this._useSetback=!!C?.off_action,this._setbackHvacMode=C?.off_action?.hvac_mode??"heat",this._setbackTemperature=C?.off_action?.target_temperature??78)}async _loadPreferences(){try{this._preferences=await _1(this.hass)}catch{}}_summarizeDateFilter(){let C=[...this._dates.map(H=>d1(H)),...this._dateRanges.map(([H,e])=>`${d1(H)}\u2013${d1(e)}`),...this._dayConditions.map(H=>u1[H])];return this._dateMode==="include"?C.length===0?"Nothing selected yet - as configured, this rule will never run.":`Runs only when it's ${C.join(", ")} - the Days above are ignored.`:C.length===0?"Nothing excluded yet - this behaves the same as \u201CAlways\u201D.":`Runs on the Days above as usual, except when it's ${C.join(", ")}.`}_renderAdditionalAction(C,H){return this._deviceType==="climate"?r`
        <label class="field-label">HVAC mode</label>
        <select class="native-select"
          @change=${e=>this._updateAdditionalActionField(H,"hvac_mode",e.target.value)}>
          ${R1.map(e=>r`<option value=${e} ?selected=${e===(C.hvac_mode??"heat")}>${o1[e]}</option>`)}
        </select>
        <label class="check-row">
          <input type="checkbox" .checked=${C.target_temperature!==void 0}
            @change=${e=>{let M=e.target.checked;this._additionalActions=this._additionalActions.map((i,n)=>{if(n!==H)return i;let d={...i};return M?d.target_temperature=70:delete d.target_temperature,d})}} /> Set temperature
        </label>
        ${C.target_temperature!==void 0?r`
          <input class="native-input" type="number" .value=${String(C.target_temperature)}
            @input=${e=>this._updateAdditionalActionField(H,"target_temperature",Number(e.target.value))} />
        `:o}
      `:this._deviceType==="light"||this._deviceType==="light_switch"?r`
        <label class="check-row"><input type="checkbox" .checked=${C.brightness!==void 0}
          @change=${e=>this._updateAdditionalActionField(H,"brightness",e.target.checked?255:void 0)} /> Set brightness</label>
        ${C.brightness!==void 0?r`<input class="native-input" type="range" min="1" max="255" .value=${String(C.brightness)}
          @input=${e=>this._updateAdditionalActionField(H,"brightness",Number(e.target.value))} />`:o}
        <label class="check-row"><input type="checkbox" .checked=${C.transition!==void 0}
          @change=${e=>this._updateAdditionalActionField(H,"transition",e.target.checked?0:void 0)} /> Fade in</label>
        ${C.transition!==void 0?r`<input class="native-input" type="number" min="0" .value=${String(C.transition)}
          @input=${e=>this._updateAdditionalActionField(H,"transition",Number(e.target.value))} />`:o}
      `:r`<span class="hint">This action uses the selected switch entities.</span>`}_validate(){return this._name.trim()?this._dateMode!=="include"&&this._days.length===0?"At least one day is required.":this._dateMode!=="always"&&this._dates.length===0&&this._dateRanges.length===0&&this._dayConditions.length===0?"At least one date, date range, or special condition is required.":!this._onEnabled&&!this._offEnabled?"At least one of On time or Off time must be enabled.":null:"Name is required."}_buildRuleInput(){let C={},H=null;return this._deviceType==="light"||this._deviceType==="light_switch"?C={...this._setBrightness?{brightness:Math.round(this._brightnessPct/100*255)}:{},...this._useTransition?{transition:this._transitionSeconds}:{}}:this._deviceType==="climate"&&(C={hvac_mode:this._hvacMode,...this._useTargetTemperature?{target_temperature:this._targetTemperature}:{}},H=this._useSetback?{hvac_mode:this._setbackHvacMode,target_temperature:this._setbackTemperature}:null),{id:this._rule?.id,name:this._name.trim(),enabled:this._enabled,days:this._days,date_mode:this._dateMode,dates:this._dates,date_ranges:this._dateRanges,day_conditions:this._dayConditions,on_time:this._onTime,off_time:this._offTime,on_enabled:this._onEnabled,off_enabled:this._offEnabled,allow_override:this._allowOverride,override_grace_minutes:this._overrideGraceMinutes,action:C,actions:[C,...this._additionalActions],off_action:H}}render(){return this._open?r`
      <ha-dialog open @closed=${this._closeDialog}>
        <div class="form">
          <div class="dialog-title">${this._rule?"Edit rule":"Add rule"}</div>
          ${this._error?r`<div class="error">${this._error}</div>`:o}

          <button type="button" class="btn" @click=${this._openTemplatePicker}>
            Start from template
          </button>

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
              <button type="button" class="btn" @click=${()=>this._applyDayPreset(f)}>
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
              ${f.map(C=>r`
                  <button
                    type="button"
                    class="day-chip ${this._days.includes(C)?"active":""}"
                    ?disabled=${this._dateMode==="include"}
                    @click=${()=>this._toggleDay(C)}
                  >
                    ${N[C].slice(0,3)}
                  </button>
                `)}
            </div>
            ${this._dateMode==="include"?r`<span class="hint">Ignored - this rule uses a date filter instead.</span>`:o}

            <label class="field-label" for="date-mode">Date filter</label>
            <select
              id="date-mode"
              class="native-select"
              @change=${this._handleDateModeChange}
            >
              ${F1.map(C=>r`<option value=${C} ?selected=${C===this._dateMode}>${$2[C]}</option>`)}
            </select>

            ${this._dateMode!=="always"?r`
                  <div class="filter-panel">
                    <p class="filter-summary">${this._summarizeDateFilter()}</p>

                    <label class="panel-label">Specific dates</label>
                    <div class="dates">
                      ${this._dates.map(C=>r`
                          <div class="date-row">
                            <span>${d1(C)}</span>
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
                      ${this._dateRanges.map(C=>r`
                          <div class="date-row">
                            <span>${d1(C[0])} – ${d1(C[1])}</span>
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
                      ${N2.map(C=>r`
                          <button
                            type="button"
                            class="day-chip ${this._dayConditions.includes(C)?"active":""}"
                            @click=${()=>this._toggleDayCondition(C)}
                          >
                            ${u1[C]}
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
                `:o}
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
            <div class="additional-actions">
              <h4>Additional actions</h4>
              <p class="hint">These run in order on the same schedule entities.</p>
              ${this._additionalActions.map((C,H)=>r`
                  <div class="additional-action-row">
                    <label>Action ${H+2}</label>
                    ${this._renderAdditionalAction(C,H)}
                    <button type="button" class="btn" @click=${()=>this._removeAdditionalAction(H)}>
                      Remove
                    </button>
                  </div>
                `)}
              <button type="button" class="btn" @click=${this._addAdditionalAction}>
                Add action
              </button>
            </div>
          </section>

          <div class="dialog-actions">
            <button type="button" class="btn" @click=${this._openSaveAsTemplate}>
              Save as template
            </button>
            <span class="spacer"></span>
            <button type="button" class="btn" @click=${this._closeDialog}>Cancel</button>
            <button type="button" class="btn btn-primary" @click=${this._save}>Save</button>
          </div>
        </div>
      </ha-dialog>
      <scheduler-plus-template-editor .hass=${this.hass}></scheduler-plus-template-editor>
      <scheduler-plus-rule-template-picker
        .hass=${this.hass}
      ></scheduler-plus-rule-template-picker>
    `:o}_renderTimeFields(C,H,e,M,i){let n=n2.find(d=>d.matches(H))?.key??"fixed";return r`
      <div class="time-field">
        <ha-formfield label=${C}>
          <ha-switch
            .checked=${M}
            @change=${d=>{i(d.target.checked)}}
          ></ha-switch>
        </ha-formfield>
        ${M?r`
              <div class="time-row">
                <select
                  class="native-select"
                  @change=${d=>{let p=d.target.value,A=n2.find(v=>v.key===p);A&&e(A.makeSpec())}}
                >
                  ${n2.map(d=>r`<option value=${d.key} ?selected=${d.key===n}>${d.label}</option>`)}
                </select>
                ${H.provider==="fixed"?r`
                      <input
                        type="time"
                        class="native-input"
                        .value=${H.params.time??""}
                        @input=${d=>e({...H,params:{time:d.target.value}})}
                      />
                    `:r`
                      <input
                        type="number"
                        class="native-input offset"
                        .value=${String(H.params.offset_minutes??0)}
                        @input=${d=>e({...H,params:{...H.params,offset_minutes:Number(d.target.value)||0}})}
                      />
                      <span class="hint">minutes</span>
                    `}
              </div>
            `:o}
      </div>
    `}_renderActionFields(){return this._deviceType==="light"||this._deviceType==="light_switch"?this._renderLightAction():this._deviceType==="climate"?this._renderClimateAction():r`
      <span class="hint">Switches just turn on and off - nothing else to configure.</span>
    `}_renderLightAction(){return r`
      ${this._preferences.enable_brightness?r`
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
            ${this._setBrightness?r`
                  <label class="field-label">Brightness (${this._brightnessPct}%)</label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    class="native-input"
                    .value=${String(this._brightnessPct)}
                    @input=${C=>{this._brightnessPct=Number(C.target.value)}}
                  />
                `:o}
          `:o}
      ${this._preferences.enable_fade_in?r`
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
            ${this._useTransition?r`
                  <label class="field-label" for="fade-duration">Fade duration (seconds)</label>
                  <input
                    id="fade-duration"
                    type="number"
                    class="native-input"
                    .value=${String(this._transitionSeconds)}
                    @input=${C=>{this._transitionSeconds=Number(C.target.value)||0}}
                  />
                `:o}
          `:o}
    `}_renderClimateAction(){return r`
      <label class="field-label" for="hvac-mode">HVAC mode</label>
      <select
        id="hvac-mode"
        class="native-select"
        @change=${C=>{this._hvacMode=C.target.value}}
      >
        ${R1.map(C=>r`<option value=${C} ?selected=${C===this._hvacMode}>${o1[C]}</option>`)}
      </select>

      <ha-formfield label="Set target temperature">
        <ha-switch
          .checked=${this._useTargetTemperature}
          @change=${C=>{this._useTargetTemperature=C.target.checked}}
        ></ha-switch>
      </ha-formfield>
      ${this._useTargetTemperature?r`
            <label class="field-label" for="target-temperature">Target temperature</label>
            <input
              id="target-temperature"
              type="number"
              class="native-input"
              .value=${String(this._targetTemperature)}
              @input=${C=>{this._targetTemperature=Number(C.target.value)||0}}
            />
          `:o}

      <ha-formfield label="Eco setback instead of turning off">
        <ha-switch
          .checked=${this._useSetback}
          @change=${C=>{this._useSetback=C.target.checked}}
        ></ha-switch>
      </ha-formfield>
      <span class="hint">
        ${this._useSetback?"At the Off time below, the thermostat is set to this instead of being turned off - useful for avoiding humidity or freeze issues in an unoccupied space while still saving energy.":"Off by default - the Off time below simply turns the thermostat off."}
      </span>
      ${this._useSetback?r`
            <label class="field-label" for="setback-hvac-mode">Setback HVAC mode</label>
            <select
              id="setback-hvac-mode"
              class="native-select"
              @change=${C=>{this._setbackHvacMode=C.target.value}}
            >
              ${R1.map(C=>r`<option value=${C} ?selected=${C===this._setbackHvacMode}>${o1[C]}</option>`)}
            </select>

            <label class="field-label" for="setback-temperature">Setback temperature</label>
            <input
              id="setback-temperature"
              type="number"
              class="native-input"
              .value=${String(this._setbackTemperature)}
              @input=${C=>{this._setbackTemperature=Number(C.target.value)||0}}
            />
          `:o}

      <ha-formfield label="Allow override">
        <ha-switch
          .checked=${this._allowOverride}
          @change=${C=>{this._allowOverride=C.target.checked}}
        ></ha-switch>
      </ha-formfield>
      <span class="hint">
        ${this._allowOverride?"Manual changes made directly on the thermostat stick until the next scheduled event.":`If someone changes this away from the rule's setting, Scheduler+ waits ${this._overrideGraceMinutes} minutes and then reapplies it if it still doesn't match.`}
      </span>
      ${this._allowOverride?o:r`
            <label class="field-label" for="override-grace-minutes">
              Grace period (minutes)
            </label>
            <input
              id="override-grace-minutes"
              type="number"
              min="1"
              class="native-input"
              .value=${String(this._overrideGraceMinutes)}
              @input=${C=>{this._overrideGraceMinutes=Number(C.target.value)||1}}
            />
          `}
    `}};m.styles=x`
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
    .additional-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
    }
    .additional-actions h4 { margin: 0; font-size: 0.9em; }
    .additional-action-row { display: flex; flex-direction: column; gap: 6px; }
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
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--divider-color);
    }
    .spacer {
      flex: 1;
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
  `,t([l({attribute:!1})],m.prototype,"hass",2),t([a()],m.prototype,"_open",2),t([a()],m.prototype,"_preferences",2),t([a()],m.prototype,"_deviceType",2),t([a()],m.prototype,"_name",2),t([a()],m.prototype,"_enabled",2),t([a()],m.prototype,"_days",2),t([a()],m.prototype,"_dateMode",2),t([a()],m.prototype,"_dates",2),t([a()],m.prototype,"_newDate",2),t([a()],m.prototype,"_dateRanges",2),t([a()],m.prototype,"_newRangeStart",2),t([a()],m.prototype,"_newRangeEnd",2),t([a()],m.prototype,"_dayConditions",2),t([a()],m.prototype,"_onTime",2),t([a()],m.prototype,"_offTime",2),t([a()],m.prototype,"_onEnabled",2),t([a()],m.prototype,"_offEnabled",2),t([a()],m.prototype,"_setBrightness",2),t([a()],m.prototype,"_brightnessPct",2),t([a()],m.prototype,"_useTransition",2),t([a()],m.prototype,"_transitionSeconds",2),t([a()],m.prototype,"_hvacMode",2),t([a()],m.prototype,"_useTargetTemperature",2),t([a()],m.prototype,"_targetTemperature",2),t([a()],m.prototype,"_useSetback",2),t([a()],m.prototype,"_setbackHvacMode",2),t([a()],m.prototype,"_setbackTemperature",2),t([a()],m.prototype,"_allowOverride",2),t([a()],m.prototype,"_overrideGraceMinutes",2),t([a()],m.prototype,"_additionalActions",2),t([a()],m.prototype,"_error",2),t([_("scheduler-plus-template-editor")],m.prototype,"_templateEditor",2),t([_("scheduler-plus-rule-template-picker")],m.prototype,"_templatePicker",2),m=t([c("scheduler-plus-rule-editor")],m);function U5(L){let[V,C]=L.split(":"),H=Number(V),e=Number(C),M=H>=12?"PM":"AM";return`${H%12===0?12:H%12}:${e.toString().padStart(2,"0")} ${M}`}function U1(L){if(L.provider==="fixed")return U5(L.params.time??"00:00");let V=L.provider==="yidcal"?D1[L.params.zman]??J.yidcal:J[L.provider],C=L.params.offset_minutes??0;return C===0?V:`${V} ${C>0?"+":""}${C}`}function G5(L){return L.on_enabled&&L.off_enabled?`${U1(L.on_time)} \u2192 ${U1(L.off_time)}`:L.on_enabled?`${U1(L.on_time)} only`:`until ${U1(L.off_time)}`}var u=class extends s{constructor(){super(...arguments);this._open=!1;this._name="";this._deviceType="light_switch";this._enabled=!0;this._entities=[];this._rules=[];this._activeDateMode="always";this._activeDateRanges=[];this._newActiveRangeStart="";this._newActiveRangeEnd="";this._saving=!1;this._checkingConflicts=!1;this._conflicts=[];this._closeDialog=()=>{this._open=!1};this._handleDeviceTypeChange=C=>{this._deviceType=C.target.value,this._entities=[],this._rules=[]};this._handleActiveDateModeChange=C=>{this._activeDateMode=C.target.value};this._addActiveDateRange=()=>{let C=this._newActiveRangeStart,H=this._newActiveRangeEnd;!C||!H||C>H||(this._activeDateRanges.some(([e,M])=>e===C&&M===H)||(this._activeDateRanges=[...this._activeDateRanges,[C,H]]),this._newActiveRangeStart="",this._newActiveRangeEnd="")};this._removeActiveDateRange=C=>{this._activeDateRanges=this._activeDateRanges.filter((H,e)=>e!==C)};this._openSaveAsTemplate=()=>{this._templateEditor?.showDialog(this._deviceType,this._rules,"schedule")};this._openAddRuleDialog=()=>{this._ruleEditor?.showDialog({deviceType:this._deviceType,onSave:C=>{this._rules=[...this._rules,C]}})};this._openEditRuleDialog=C=>{this._ruleEditor?.showDialog({deviceType:this._deviceType,rule:this._rules[C],onSave:H=>{this._rules=this._rules.map((e,M)=>M===C?H:e)}})};this._removeRule=C=>{let H=this._rules[C];!H||!window.confirm(`Delete rule "${H.name}"?`)||(this._rules=this._rules.filter((e,M)=>M!==C))};this._toggleRuleEnabled=C=>{this._rules=this._rules.map((H,e)=>e===C?{...H,enabled:!H.enabled}:H)};this._save=async()=>{let C=this._name.trim();if(!C){this._error="Name is required.";return}if(this._entities.length===0){this._error="At least one entity is required.";return}let H=this._buildInput(C);this._checkingConflicts=!0,this._error=void 0;try{let e=await B1(this.hass,this._schedule?.id??null,H);e.length===0?(this._conflicts=[],await this._persist(H)):this._conflicts=e}catch(e){this._error=z(e)}finally{this._checkingConflicts=!1}};this._saveAnyway=()=>{let C=this._name.trim();this._persist(this._buildInput(C))};this._excludeConflict=async C=>{try{await W1(this.hass,C),this._conflicts=this._conflicts.filter(H=>!(H.conflicting_rule_id===C.conflicting_rule_id&&H.date===C.date)),this._conflicts.length===0&&await this._persist(this._buildInput(this._name.trim()))}catch(H){window.alert(z(H))}}}showDialog(C){this._schedule=C,this._name=C?.name??"",this._deviceType=C?.device_type??"light_switch",this._enabled=C?.enabled??!0,this._entities=C?[...C.entities]:[],this._rules=C?C.rules.map(H=>({...H})):[],this._activeDateMode=C?.active_date_mode??"always",this._activeDateRanges=C?.active_date_ranges?[...C.active_date_ranges]:[],this._newActiveRangeStart="",this._newActiveRangeEnd="",this._conflicts=[],this._error=void 0,this._open=!0}showDialogDuplicate(C){this._schedule=void 0,this._name=`Copy of ${C.name}`,this._deviceType=C.device_type,this._enabled=C.enabled,this._entities=[...C.entities],this._rules=C.rules.map(H=>{let{id:e,...M}=H;return{...M}}),this._activeDateMode=C.active_date_mode??"always",this._activeDateRanges=C.active_date_ranges?[...C.active_date_ranges]:[],this._newActiveRangeStart="",this._newActiveRangeEnd="",this._conflicts=[],this._error=void 0,this._open=!0}showDialogFromTemplate(C){this._schedule=void 0,this._name=C.name,this._deviceType=C.device_type,this._enabled=!0,this._entities=[],this._rules=C.rules.map(H=>{let{id:e,...M}=H;return{...M}}),this._activeDateMode="always",this._activeDateRanges=[],this._newActiveRangeStart="",this._newActiveRangeEnd="",this._conflicts=[],this._error=void 0,this._open=!0}_buildInput(C){return{name:C,device_type:this._deviceType,entities:this._entities,enabled:this._enabled,rules:this._rules,active_date_mode:this._activeDateMode,active_date_ranges:this._activeDateRanges,override_until:this._schedule?.override_until??null}}async _persist(C){this._saving=!0,this._error=void 0;try{this._schedule?await $(this.hass,this._schedule.id,C):await b1(this.hass,C),this._open=!1,this.dispatchEvent(new CustomEvent("schedule-plus-saved"))}catch(H){this._error=z(H)}finally{this._saving=!1}}render(){return this._open?r`
      <ha-dialog open @closed=${this._closeDialog}>
        <div class="form">
          <div class="dialog-title">
            ${this._schedule?"Edit schedule":"Add schedule"}
          </div>
          ${this._error?r`<div class="error">${this._error}</div>`:o}

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
            ${F2.map(C=>r`<option value=${C}>${i1[C]}</option>`)}
          </select>

          <ha-formfield label="Enabled">
            <ha-switch
              .checked=${this._enabled}
              @change=${C=>{this._enabled=C.target.checked}}
            ></ha-switch>
          </ha-formfield>

          <label class="field-label" for="active-date-mode">Active period</label>
          <select
            id="active-date-mode"
            class="native-select"
            .value=${this._activeDateMode}
            @change=${this._handleActiveDateModeChange}
          >
            ${F1.map(C=>r`<option value=${C}>
                  ${C==="always"?"Always active":C==="include"?"Only during these date ranges":"Except during these date ranges"}
                </option>`)}
          </select>
          ${this._activeDateMode!=="always"?this._renderActivePeriodPanel():o}

          <label class="field-label">Entities</label>
          <scheduler-plus-entity-multi-picker
            .hass=${this.hass}
            .value=${this._entities}
            .domains=${P1[this._deviceType]}
            .includeEntities=${this.entityFilter}
            @value-changed=${C=>{this._entities=C.detail.value}}
          ></scheduler-plus-entity-multi-picker>

          <div class="rules-header">
            <label class="field-label">Rules</label>
            <button type="button" class="btn" @click=${this._openAddRuleDialog}>
              Add rule
            </button>
          </div>
          ${this._rules.length===0?r`<div class="placeholder">No rules yet.</div>`:r`
                <ul class="rules">
                  ${this._rules.map((C,H)=>this._renderRule(C,H))}
                </ul>
              `}

          ${this._conflicts.length>0?this._renderConflictPanel():o}

          <div class="dialog-actions">
            <button
              type="button"
              class="btn"
              ?disabled=${this._saving||this._checkingConflicts}
              @click=${this._openSaveAsTemplate}
            >
              Save as template
            </button>
            <span class="spacer"></span>
            <button
              type="button"
              class="btn"
              ?disabled=${this._saving||this._checkingConflicts}
              @click=${this._closeDialog}
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary"
              ?disabled=${this._saving||this._checkingConflicts}
              @click=${this._save}
            >
              ${this._checkingConflicts?"Checking\u2026":"Save"}
            </button>
          </div>
        </div>
      </ha-dialog>
      <scheduler-plus-rule-editor .hass=${this.hass}></scheduler-plus-rule-editor>
      <scheduler-plus-template-editor .hass=${this.hass}></scheduler-plus-template-editor>
    `:o}_renderConflictPanel(){return r`
      <div class="conflict-panel">
        <span class="conflict-title">
          This overlaps ${this._conflicts.length===1?"another schedule":"other schedules"}
        </span>
        <ul class="conflicts">
          ${this._conflicts.map(C=>r`
              <li class="conflict-row">
                <div class="conflict-info">
                  <span>${I1(C)}</span>
                  <span class="hint">${C.entity_ids.join(", ")}</span>
                </div>
                ${C.fixable?r`
                      <button
                        type="button"
                        class="btn"
                        @click=${()=>this._excludeConflict(C)}
                      >
                        Exclude "${C.conflicting_schedule_name}" on ${C.date}
                      </button>
                    `:r`<span class="hint">Adjust manually - can't auto-fix this one.</span>`}
              </li>
            `)}
        </ul>
        <span class="hint">
          Checked against the modes that are on for each date today. Turning a
          mode on later can bring back an overlap that isn't listed here.
        </span>
        <button type="button" class="btn" @click=${this._saveAnyway}>Save anyway</button>
      </div>
    `}_renderActivePeriodPanel(){return r`
      <div class="filter-panel">
        <span class="panel-label">Date ranges</span>
        ${this._activeDateRanges.length===0?r`<span class="hint">None added yet.</span>`:r`
              <ul class="dates">
                ${this._activeDateRanges.map(([C,H],e)=>r`
                    <li class="date-row">
                      <span>${C} → ${H}</span>
                      <button
                        type="button"
                        class="btn"
                        @click=${()=>this._removeActiveDateRange(e)}
                      >
                        Remove
                      </button>
                    </li>
                  `)}
              </ul>
            `}
        <div class="range-add-row">
          <input
            type="date"
            class="native-input"
            .value=${this._newActiveRangeStart}
            @input=${C=>{this._newActiveRangeStart=C.target.value}}
          />
          <span class="sep">to</span>
          <input
            type="date"
            class="native-input"
            .value=${this._newActiveRangeEnd}
            @input=${C=>{this._newActiveRangeEnd=C.target.value}}
          />
          <button type="button" class="btn" @click=${this._addActiveDateRange}>
            Add range
          </button>
        </div>
      </div>
    `}_renderRule(C,H){let e=[...C.days].sort((n,d)=>f.indexOf(n)-f.indexOf(d)).map(n=>N[n].slice(0,3)).join(", "),M=[...C.dates.length>0?[`${C.dates.length} date${C.dates.length===1?"":"s"}`]:[],...C.date_ranges.length>0?[`${C.date_ranges.length} range${C.date_ranges.length===1?"":"s"}`]:[],...C.day_conditions.map(n=>u1[n])],i=M.length===0?"":C.date_mode==="exclude"?` \xB7 except ${M.join(", ")}`:C.date_mode==="include"?` \xB7 only ${M.join(", ")}`:"";return r`
      <li class="rule ${C.enabled?"":"disabled"}">
        <ha-switch
          .checked=${C.enabled}
          @change=${()=>this._toggleRuleEnabled(H)}
        ></ha-switch>
        <div class="rule-info">
          <span class="rule-name">${C.name}</span>
          <span class="rule-meta">
            ${e} · ${G5(C)}${i}
          </span>
        </div>
        <div class="row-actions">
          <ha-icon-button
            .path=${E1}
            label="Edit rule"
            @click=${()=>this._openEditRuleDialog(H)}
          ></ha-icon-button>
          <ha-icon-button
            .path=${U}
            label="Remove rule"
            @click=${()=>this._removeRule(H)}
          ></ha-icon-button>
        </div>
      </li>
    `}};u.styles=x`
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
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--divider-color);
    }
    .spacer {
      flex: 1;
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
    .filter-panel {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
    }
    .conflict-panel {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      border: 1px solid var(--warning-color, #ffa600);
      border-radius: 6px;
    }
    .conflict-title {
      font-weight: 500;
      color: var(--warning-color, #ffa600);
    }
    ul.conflicts {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .conflict-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--divider-color);
    }
    .conflict-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .conflict-info {
      display: flex;
      flex-direction: column;
      font-size: 0.9em;
    }
    .panel-label {
      font-size: 0.85em;
      font-weight: 500;
      color: var(--secondary-text-color);
    }
    .hint {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    ul.dates {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .date-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .range-add-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .sep {
      font-size: 0.85em;
      color: var(--secondary-text-color);
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
  `,t([l({attribute:!1})],u.prototype,"hass",2),t([l({attribute:!1})],u.prototype,"entityFilter",2),t([a()],u.prototype,"_schedule",2),t([a()],u.prototype,"_open",2),t([a()],u.prototype,"_name",2),t([a()],u.prototype,"_deviceType",2),t([a()],u.prototype,"_enabled",2),t([a()],u.prototype,"_entities",2),t([a()],u.prototype,"_rules",2),t([a()],u.prototype,"_activeDateMode",2),t([a()],u.prototype,"_activeDateRanges",2),t([a()],u.prototype,"_newActiveRangeStart",2),t([a()],u.prototype,"_newActiveRangeEnd",2),t([a()],u.prototype,"_saving",2),t([a()],u.prototype,"_checkingConflicts",2),t([a()],u.prototype,"_conflicts",2),t([a()],u.prototype,"_error",2),t([_("scheduler-plus-rule-editor")],u.prototype,"_ruleEditor",2),t([_("scheduler-plus-template-editor")],u.prototype,"_templateEditor",2),u=t([c("scheduler-plus-schedule-editor")],u);function Q5(){let L=new Date;return`${L.getFullYear()}-${String(L.getMonth()+1).padStart(2,"0")}-${String(L.getDate()).padStart(2,"0")}`}function t5(L){return!!L.override_until&&L.override_until>=Q5()}function K5(L){if(L.device_type!=="climate")return;let V=new Set(L.rules.filter(C=>C.enabled&&C.on_enabled).map(C=>k("climate",C.action)).filter(C=>C!==void 0));return V.size===1?[...V][0]:void 0}function q5(L){if(L.device_type!=="climate")return;let V=L.rules.filter(H=>H.enabled&&H.off_enabled);if(V.length===0||V.some(H=>!H.off_action))return;let C=new Set(V.map(H=>k("climate",H.off_action)).filter(H=>H!==void 0));return C.size===1?[...C][0]:void 0}function j5(L){if(!L.next_event)return;let V=new Date(L.next_event);if(Number.isNaN(V.getTime()))return;let C=L.next_event_action==="off"?q5(L)??"Off":K5(L)??"On",H=V.toLocaleString(void 0,{weekday:"short",hour:"numeric",minute:"2-digit"});return`Next: ${C} ${H}`}function Y5(L){if(L.mode_blocked)return"Not scheduled for today by its modes";if(L.active_now)return;if(!L.next_active_date)return"Inactive (outside its active dates)";let V=new Date(`${L.next_active_date}T00:00:00`);return Number.isNaN(V.getTime())?"Inactive (outside its active dates)":`Inactive until ${V.toLocaleDateString(void 0,{month:"short",day:"numeric"})}`}function X5(L){if(!L.override_pending_until)return;let V=new Date(L.override_pending_until),C=L.device_type==="climate"?(()=>{let e=new Set(L.rules.filter(M=>M.enabled&&M.on_enabled&&!M.allow_override).map(M=>k("climate",M.action)).filter(M=>!!M));return e.size===1?` to ${[...e][0]}`:" to the scheduled setting"})():" to the scheduled setting";if(Number.isNaN(V.getTime()))return`Manual change${C} - reverting soon`;let H=V.toLocaleString(void 0,{weekday:"short",hour:"numeric",minute:"2-digit"});return`Manual change${C} - reverting ${H}`}function J5(L){if(!t5(L)||!L.override_until)return;let V=new Date(`${L.override_until}T00:00:00`);return Number.isNaN(V.getTime())?"Paused":`Paused through ${V.toLocaleDateString(void 0,{month:"short",day:"numeric"})}`}var C3="#F2A93B",S=class extends s{constructor(){super(...arguments);this._schedules=[];this._loading=!0;this._pendingToggle=new Set;this._toggleScheduleEnabled=async C=>{this._pendingToggle=new Set(this._pendingToggle).add(C.id);try{await $(this.hass,C.id,{...X(C),enabled:!C.enabled}),await this._refresh()}catch(H){window.alert(H instanceof Error?H.message:String(H))}finally{let H=new Set(this._pendingToggle);H.delete(C.id),this._pendingToggle=H}};this._openAddDialog=()=>{this._editor?.showDialog()};this._openEditDialog=C=>{this._editor?.showDialog(C)};this._openDuplicateDialog=C=>{this._editor?.showDialogDuplicate(C)};this._openPauseDialog=C=>{this._overrideDialog?.showDialog(C)};this._resumeNow=async C=>{this._pendingToggle=new Set(this._pendingToggle).add(C.id);try{await $(this.hass,C.id,{...X(C),override_until:null}),await this._refresh()}catch(H){window.alert(H instanceof Error?H.message:String(H))}finally{let H=new Set(this._pendingToggle);H.delete(C.id),this._pendingToggle=H}};this._openDayView=()=>{this._dayView?.showDialog()};this._openPreferences=()=>{this._preferences?.showDialog()};this._openQuickEvent=()=>{this._quickEventDialog?.showDialog()};this._openApplyTemplate=()=>{this._applyTemplateDialog?.showDialog()};this._handleUseTemplate=C=>{this._editor?.showDialogFromTemplate(C.detail.template)};this._dashboard=!1}static getStubConfig(){return{type:"custom:scheduler-plus-card"}}static getConfigElement(){return document.createElement("scheduler-plus-card-editor")}setConfig(C){this._config=C}getCardSize(){return 2+this._visibleSchedules.length}get _visibleSchedules(){let C=this._config?.entities;return!C||C.length===0?this._schedules:this._schedules.filter(H=>H.entities.some(e=>C.includes(e)))}connectedCallback(){super.connectedCallback(),this._refresh()}async _refresh(){this._loading=!0;try{this._schedules=await r1(this.hass),this._error=void 0}catch(C){this._error=C instanceof Error?C.message:String(C)}finally{this._loading=!1}}async _handleDelete(C){window.confirm(`Delete schedule "${C.name}"?`)&&(await T2(this.hass,C.id),await this._refresh())}_renderViewSwitch(){return r`
      <div class="switch" role="group" aria-label="Card view">
        ${[[!1,"Schedules"],[!0,"Modes"]].map(([C,H])=>r`
            <button
              type="button"
              class="switch-option"
              aria-pressed=${this._dashboard===C}
              @click=${()=>{this._dashboard=C}}
            >
              ${H}
            </button>
          `)}
      </div>
    `}render(){return r`
      <ha-card>
        <div class="header">
          <div class="header-title">
            ${this._renderBrandMark()}
            <span>${this._config?.title??"Scheduler+"}</span>
          </div>
          <div class="header-view">${this._renderViewSwitch()}</div>
          ${this._dashboard?o:r`
                <div class="header-actions">
                <ha-icon-button
                  .path=${W2}
                  label="My preferences"
                  @click=${this._openPreferences}
                ></ha-icon-button>
                <ha-icon-button
                  .path=${z2}
                  label="Day view"
                  @click=${this._openDayView}
                ></ha-icon-button>
                <ha-icon-button
                  .path=${U2}
                  label="Quick event"
                  @click=${this._openQuickEvent}
                ></ha-icon-button>
                <ha-icon-button
                  .path=${q2}
                  label="From template"
                  @click=${this._openApplyTemplate}
                ></ha-icon-button>
                </div>
              `}
        </div>
        ${this._dashboard?r`<scheduler-plus-dashboard-card
              .hass=${this.hass}
              .embedded=${!0}
            ></scheduler-plus-dashboard-card>`:r`
              <div class="content">${this._renderContent()}</div>
              <div class="card-actions">
                <button type="button" class="btn btn-primary" @click=${this._openAddDialog}>
                  Add schedule
                </button>
              </div>
            `}
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
      <scheduler-plus-override-dialog
        .hass=${this.hass}
        @schedule-plus-saved=${this._refresh}
      ></scheduler-plus-override-dialog>
      <scheduler-plus-quick-event-dialog
        .hass=${this.hass}
        .entityFilter=${this._config?.entities}
        @schedule-plus-saved=${this._refresh}
      ></scheduler-plus-quick-event-dialog>
      <scheduler-plus-apply-template-dialog
        .hass=${this.hass}
        @scheduler-plus-use-template=${this._handleUseTemplate}
      ></scheduler-plus-apply-template-dialog>
    `}_renderBrandMark(){return r`
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
          fill=${C3}
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
    `}_renderContent(){if(this._loading)return r`<div class="placeholder">Loading schedules…</div>`;if(this._error)return r`<div class="placeholder error">${this._error}</div>`;let C=this._visibleSchedules;if(C.length===0){let H=this._schedules.length===0?"No schedules yet.":"No schedules for this card's selected devices.";return r`<div class="placeholder">${H}</div>`}return r`
      <ul class="schedules">
        ${C.map(H=>this._renderSchedule(H))}
      </ul>
    `}_renderSchedule(C){let H=t5(C),e=C.enabled&&!H?j5(C):void 0,M=C.enabled?J5(C):void 0,i=C.enabled&&!H?Y5(C):void 0,n=C.enabled?X5(C):void 0;return r`
      <li class="schedule ${C.enabled?"":"disabled"}">
        <ha-switch
          .checked=${C.enabled}
          ?disabled=${this._pendingToggle.has(C.id)}
          @change=${()=>this._toggleScheduleEnabled(C)}
        ></ha-switch>
        <div class="schedule-info">
          <span class="schedule-name">${C.name}</span>
          <span class="schedule-meta">
            ${i1[C.device_type]} ·
            ${C.entities.length}
            ${C.entities.length===1?"entity":"entities"} ·
            ${C.rules.length}
            ${C.rules.length===1?"rule":"rules"}
          </span>
          ${n?r`<span class="schedule-override-pending">${n}</span>`:o}
          ${M?r`<span class="schedule-paused">${M}</span>`:o}
          ${i?r`<span class="schedule-seasonal">${i}</span>`:o}
          ${e?r`<span class="schedule-next">${e}</span>`:o}
        </div>
        <div class="row-actions">
          <ha-icon-button
            .path=${E1}
            label="Edit"
            @click=${()=>this._openEditDialog(C)}
          ></ha-icon-button>
          <ha-icon-button
            .path=${G2}
            label="Duplicate"
            @click=${()=>this._openDuplicateDialog(C)}
          ></ha-icon-button>
          ${H?r`<ha-icon-button
                .path=${K2}
                label="Resume now"
                ?disabled=${this._pendingToggle.has(C.id)}
                @click=${()=>this._resumeNow(C)}
              ></ha-icon-button>`:r`<ha-icon-button
                .path=${Q2}
                label="Pause"
                @click=${()=>this._openPauseDialog(C)}
              ></ha-icon-button>`}
          <ha-icon-button
            .path=${U}
            label="Delete"
            @click=${()=>this._handleDelete(C)}
          ></ha-icon-button>
        </div>
      </li>
    `}};S.styles=x`
    .header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 10px;
      padding: 16px 16px 0;
    }
    .header-title {
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-mark {
      width: 28px;
      height: 28px;
      flex: none;
    }
    .header-title span {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 1.5rem;
      font-weight: 500;
      line-height: 1.2;
      color: var(--ha-card-header-color, var(--primary-text-color));
    }
    .header-view {
      justify-self: end;
    }
    .header-actions {
      grid-column: 1 / -1;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 4px;
      min-width: 0;
    }
    .header-actions ha-icon-button {
      flex: none;
    }
    .header-actions ha-icon-button:last-child {
      margin-right: -8px;
    }
    .switch {
      display: flex;
      flex: none;
      border: 1px solid var(--divider-color);
      border-radius: 999px;
      overflow: hidden;
    }
    .switch-option {
      font: inherit;
      font-size: 13px;
      padding: 6px 14px;
      border: 0;
      background: transparent;
      color: var(--secondary-text-color);
      cursor: pointer;
    }
    .switch-option[aria-pressed="true"] {
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
    }
    @media (max-width: 430px) {
      .header {
        grid-template-columns: 1fr;
      }
      .header-view {
        justify-self: start;
      }
      .header-actions {
        justify-content: flex-start;
      }
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
    .schedule-seasonal {
      font-size: 0.85em;
      color: var(--warning-color, #ffa600);
    }
    .schedule-paused {
      font-size: 0.85em;
      color: var(--error-color, #db4437);
    }
    .schedule-override-pending {
      font-size: 0.85em;
      font-weight: 500;
      color: var(--warning-color, #ffa600);
    }
    .row-actions {
      display: flex;
    }
    .card-actions {
      display: flex;
      justify-content: flex-end;
      padding: 8px 8px 8px 16px;
    }
  `,t([l({attribute:!1})],S.prototype,"hass",2),t([a()],S.prototype,"_config",2),t([a()],S.prototype,"_schedules",2),t([a()],S.prototype,"_loading",2),t([a()],S.prototype,"_error",2),t([a()],S.prototype,"_pendingToggle",2),t([_("scheduler-plus-schedule-editor")],S.prototype,"_editor",2),t([_("scheduler-plus-day-view")],S.prototype,"_dayView",2),t([_("scheduler-plus-preferences")],S.prototype,"_preferences",2),t([_("scheduler-plus-override-dialog")],S.prototype,"_overrideDialog",2),t([_("scheduler-plus-quick-event-dialog")],S.prototype,"_quickEventDialog",2),t([_("scheduler-plus-apply-template-dialog")],S.prototype,"_applyTemplateDialog",2),t([a()],S.prototype,"_dashboard",2),S=t([c("scheduler-plus-card")],S);window.customCards=window.customCards??[];window.customCards.push({type:"scheduler-plus-card",name:"Scheduler+",description:"Visual scheduling for lights and climate devices."});export{S as SchedulerPlusCard};
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
