import type { Metadata, Viewport } from 'next'
import { DM_Sans } from 'next/font/google'
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={dmSans.className}>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: RUPIAH_SCRIPT }} />
      </body>
    </html>
  )
}
