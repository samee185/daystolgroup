import { useMemo } from 'react'
import DOMPurify from 'dompurify'

/**
 * Shows formatted text written in the admin's rich-text editor.
 * It is sanitised first, so nothing pasted into the admin can run scripts on the website.
 */
export default function RichText({ html, className = '' }) {
  const clean = useMemo(
    () => DOMPurify.sanitize(html || '', { USE_PROFILES: { html: true }, FORBID_TAGS: ['style', 'form', 'input'], FORBID_ATTR: ['style'] }),
    [html],
  )
  if (!clean.trim()) return null
  return (
    <div
      className={`max-w-[68ch] text-[17px] leading-relaxed text-mist [overflow-wrap:anywhere] [&_img]:h-auto [&_img]:max-w-full [&_a]:text-at-innovation [&_a]:underline [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-fg [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-fg [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-4 [&_p:first-child]:mt-0 [&_img]:my-5 [&_img]:rounded-2xl [&_strong]:text-fg [&_ul]:list-disc [&_ul]:pl-6 ${className}`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
