import type { Metadata, Viewport } from 'next'
import { DM_Sans } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'Kas Manager',
  description: 'Aplikasi manajemen keuangan organisasi',
}

// Vanilla, non-React thousand-separator formatter for `input[data-rupiah]`.
// Runs natively even on browsers where the React bundle fails to hydrate
// (e.g. Safari 14), so the no-JS fallback form pages still format money nicely.
// Kept to ES2017 (no .at()/Object.hasOwn/heavy optional chaining) for Safari 14.
const RUPIAH_SCRIPT = `(function(){
  function f(el){var d=el.value.replace(/\\D/g,'');el.value=d?d.replace(/\\B(?=(\\d{3})+(?!\\d))/g,'.'):'';}
  document.addEventListener('input',function(e){var t=e.target;if(t&&t.getAttribute&&t.getAttribute('data-rupiah')!==null)f(t);},true);
  document.addEventListener('DOMContentLoaded',function(){var l=document.querySelectorAll('input[data-rupiah]');for(var i=0;i<l.length;i++)f(l[i]);});
})();`

// Keyboard navigation: handle iOS keyboard "next" button to move focus between form fields.
// Works on iOS 14+ and all modern browsers. Finds all focusable form inputs and enables
// moving to the next field when Enter is pressed (or the keyboard "next" button is tapped).
const KEYBOARD_NAV_SCRIPT = `(function(){
  document.addEventListener('keydown',function(e){
    if(e.key!=='Enter')return;
    var t=e.target;
    if(!t||t.nodeName!=='INPUT'||t.type==='submit')return;
    var form=t.form;
    if(!form)return;
    var inputs=Array.prototype.slice.call(form.querySelectorAll('input:not([type=hidden]),select,textarea'));
    var focusable=inputs.filter(function(el){return!el.disabled&&el.offsetParent!==null;});
    var idx=focusable.indexOf(t);
    if(idx>=0&&idx<focusable.length-1){
      e.preventDefault();
      focusable[idx+1].focus();
    }
  });
})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={dmSans.className}>
      <body>
        {children}
        <Script id="rupiah-formatter" strategy="beforeInteractive">
          {RUPIAH_SCRIPT}
        </Script>
        <Script id="keyboard-nav" strategy="beforeInteractive">
          {KEYBOARD_NAV_SCRIPT}
        </Script>
      </body>
    </html>
  )
}
