// Skrypt startowy w <head>: Google Consent Mode v2 + ładowanie narzędzi zgodnie ze zgodą z banera cookies.
//  1) zanim cokolwiek się załaduje: zgody domyślnie „denied” (albo zapisany wcześniej wybór klienta),
//  2) window.sonaxTags(analityczne, marketingowe) ładuje GTM / gtag.js / Meta Pixel / Clarity – wołany od razu
//     i ponownie z banera po zmianie zgody (src/components/CookieConsent.tsx),
//  3) tryb „basic” – nic nie startuje bez zgody; „advanced” – GTM/gtag ruszają od razu, ale z zablokowanymi cookies.
// Zdarzenia sprzedaży wysyła src/lib/track.ts (dataLayer dla GTM, gtag dla GA4/Ads wpisanych wprost, fbq dla Meta).

import type { MarketingConfig } from "@/integrations/marketing";

export function tagsBootstrap(c: MarketingConfig) {
  const cfg = JSON.stringify(c).replace(/</g, "\\u003c");
  return `(function(){
var C=${cfg};
var w=window,d=document;
w.dataLayer=w.dataLayer||[];
function gtag(){w.dataLayer.push(arguments);}
w.gtag=gtag;
w.sonaxCfg=C;
var s=null;try{s=JSON.parse(localStorage.getItem("sonax-consent-v1")||"null");}catch(e){}
var g=function(b){return b?"granted":"denied";};
var A=!!(s&&s.analytics),M=!!(s&&s.marketing);
gtag("consent","default",{analytics_storage:g(A),ad_storage:g(M),ad_user_data:g(M),ad_personalization:g(M),functionality_storage:"granted",security_storage:"granted",personalization_storage:"denied",wait_for_update:500});
gtag("set","ads_data_redaction",true);
var L={};
function js(k,src){if(L[k])return;L[k]=1;var e=d.createElement("script");e.async=true;e.src=src;d.head.appendChild(e);}
w.sonaxTags=function(a,m){
  var go=C.mode==="advanced"||a||m;
  if(C.gtm&&go&&!L.gtm){w.dataLayer.push({"gtm.start":Date.now(),event:"gtm.js"});js("gtm","https://www.googletagmanager.com/gtm.js?id="+C.gtm);}
  var gid=C.ga4||C.ads;
  if(gid&&go&&!L.gtag){js("gtag","https://www.googletagmanager.com/gtag/js?id="+gid);gtag("js",new Date());if(C.ga4)gtag("config",C.ga4);if(C.ads)gtag("config",C.ads,{allow_enhanced_conversions:true});w.sonaxGtag=true;}
  if(C.pixel&&m&&!L.fb){
    if(!w.fbq){var n=w.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments);};if(!w._fbq)w._fbq=n;n.push=n;n.loaded=true;n.version="2.0";n.queue=[];}
    js("fb","https://connect.facebook.net/en_US/fbevents.js");w.fbq("init",C.pixel);w.fbq("track","PageView");
  }
  if(C.pixel&&L.fb&&w.fbq)w.fbq("consent",m?"grant":"revoke");
  if(C.clarity&&a&&!L.clarity){w.clarity=w.clarity||function(){(w.clarity.q=w.clarity.q||[]).push(arguments);};js("clarity","https://www.clarity.ms/tag/"+C.clarity);}
  if(C.clarity&&L.clarity&&w.clarity)w.clarity("consent",a);
};
w.sonaxTags(A,M);
})();`;
}
