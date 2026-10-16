import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import {
  fieldErrorsFrom, Honeypot, Select, SubmitButton, TextArea, TextInput, validators,
} from '../components/form/Fields.jsx'
import { apiPost } from '../lib/api.js'
import {
  telHref, usePmcPackages, useProduct, useProject, useServices, useSettings, whatsappHref,
} from '../hooks/useSiteData.js'
import { usePageMeta } from '../hooks/usePageMeta.js'
import { useTheme } from '../lib/theme.js'

const ICON = {
  chat: 'M4 5h16v11H8l-4 4z',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  chip: 'M6 6h12v12H6zM10 10h4v4h-4zM9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4',
  home: 'M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6',
  cal: 'M4 5h16v16H4zM4 10h16M9 3v4M15 3v4M9 15l2 2 4-4',
  helmet: 'M3 18h18v3H3zM5 18v-3a7 7 0 0 1 14 0v3M12 8V5M9.5 8.5L8 6M14.5 8.5L16 6',
}

// Each type goes to the Daystol company that handles it
const TYPES = [
  { value: 'general', label: 'General enquiry', who: 'Daystol Group', color: null, icon: ICON.chat, hint: 'Tell us what you need' },
  { value: 'quote', label: 'Request a quote', who: 'Power Services', color: '#FFE52E', ink: '#0D1330', icon: ICON.bolt, hint: 'What do you want to power, and where?' },
  { value: 'consultation', label: 'Consultation', who: 'Innovation Systems', color: '#01AFEE', ink: '#0D1330', icon: ICON.chip, hint: 'What would you like to automate, secure or build?' },
  { value: 'property', label: 'Property enquiry', who: 'Properties', color: '#EB268F', ink: '#FFFFFF', icon: ICON.home, hint: 'Location, budget and anything else we should know' },
  { value: 'contract', label: 'Contract enquiry', who: 'Development Concept', color: '#FF7A1A', ink: '#0D1330', icon: ICON.helmet, hint: 'What do you need built, where, and by when?' },
  { value: 'pmc', label: 'Maintenance contract', who: 'Support team', color: '#FFE52E', ink: '#0D1330', icon: ICON.cal, hint: 'What equipment do you have, and where is it?' },
]

const PROPERTY_INTERESTS = [
  'Buying property', 'Selling property', 'Renting or leasing', 'Short-let apartment',
  'Facility management', 'Property development', 'Real-estate consultancy',
].map((v) => ({ value: v, label: v }))

const CONTACT_METHODS = [
  { value: 'call', label: 'Phone call' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
]

const COMPANIES = [
  { name: 'Daystol Power Services', text: 'Generators, solar and stabilizers; electrical installations; power solution management and mechanical engineering.', color: '#FFE52E', ink: '#0D1330', cta: 'Request a quote', type: 'quote' },
  { name: 'Daystol Innovation Systems', text: 'Electrical design, power and home automation, surveillance, ICT, software and web solutions.', color: '#01AFEE', ink: '#0D1330', cta: 'Book a consultation', type: 'consultation' },
  { name: 'Daystol Properties', text: 'Property development, sales and leasing, facility management, short-lets and real-estate consultancy.', color: '#EB268F', ink: '#FFFFFF', cta: 'Make a property enquiry', type: 'property' },
  { name: 'Daystol Development Concept', text: 'General contracts: buildings, infrastructure, roads and bridges, boreholes and water supply, schools and networks.', color: '#FF7A1A', ink: '#0D1330', cta: 'Make a contract enquiry', type: 'contract' },
]

const EMPTY = { name: '', phone: '', email: '', organisation: '', topic: '', message: '', preferredContact: 'call', website: '' }

const card = 'rounded-[22px] border border-line bg-card p-5 sm:rounded-[28px] sm:p-[30px]'

const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
)

/** Keep a topic chosen on another page selectable, even when it isn't one of the usual options. */
const withTopic = (options, topic) => (topic && !options.some((o) => o.value === topic) ? [{ value: topic, label: topic }, ...options] : options)

/** The enquiry types as large radio cards. */
function TypePicker({ value, onChange }) {
  const { isDark } = useTheme()
  const onKey = (e) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
    if (!step) return
    e.preventDefault()
    const i = TYPES.findIndex((t) => t.value === value)
    const next = TYPES[(i + step + TYPES.length) % TYPES.length].value
    onChange(next)
    document.getElementById(`type-${next}`)?.focus()
  }
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-3.5 p-0 text-base font-bold">What can we help with?</legend>
      <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="What can we help with?" onKeyDown={onKey}>
        {TYPES.map((t) => {
          const on = t.value === value
          // "General" uses the page's own text colour as its fill
          const fill = t.color || (isDark ? '#F2F4FA' : '#0D1330')
          const ink = t.ink || (isDark ? '#0D1330' : '#FFFFFF')
          return (
            <button
              key={t.value}
              id={`type-${t.value}`}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              onClick={() => onChange(t.value)}
              className={`press flex items-center gap-2.5 rounded-[18px] p-3.5 text-left sm:min-h-[118px] sm:flex-col sm:items-start ${on ? '' : 'bg-field text-fg'}`}
              style={on ? { background: fill, color: ink, border: `2px solid ${fill}` } : { border: '1px solid var(--line)' }}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[11px]" style={{ background: on ? 'rgba(13,19,48,.15)' : 'var(--card2)', color: on ? ink : fill }}>
                <Icon d={t.icon} />
              </span>
              <span className="flex flex-col gap-0.5">
                <strong className="text-[15px] leading-snug">{t.label}</strong>
                <span className="text-xs opacity-80">{t.who}</span>
              </span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function ReplyPicker({ value, onChange }) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-2.5 p-0 text-[15px] font-semibold">How should we reply?</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="How should we reply?">
        {CONTACT_METHODS.map((m) => {
          const on = m.value === value
          return (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(m.value)}
              className={`press min-h-[46px] rounded-full px-[18px] font-bold ${on ? 'border-2 border-magenta bg-magenta text-white' : 'border border-line text-fg hover:border-cyan'}`}
            >
              {m.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function ContactDetails() {
  const { data: s } = useSettings()
  const wa = whatsappHref(s?.whatsappNumber)
  const rows = [
    s?.phone && { label: 'Phone', value: s.phone, href: telHref(s.phone), color: '#01AFEE', icon: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2' },
    s?.emergencyPhone && { label: '24/7 emergency line', value: s.emergencyPhone, href: telHref(s.emergencyPhone), color: '#FF6B6B', icon: 'M12 3l9 16H3zM12 10v4M12 17.5v.5' },
    s?.email && { label: 'Email', value: s.email, href: `mailto:${s.email}`, color: '#EB268F', icon: 'M4 6h16v12H4zM4 7l8 6 8-6' },
    s?.officeHours && { label: 'Office hours', value: s.officeHours, color: '#FFE52E', icon: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0' },
  ].filter(Boolean)

  const row = (r) => (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card2" style={{ color: r.color }}><Icon d={r.icon} /></span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[13px] text-mist">{r.label}</span>
        <strong className="whitespace-pre-line text-[15px] [overflow-wrap:anywhere]">{r.value}</strong>
      </span>
    </>
  )

  return (
    <aside className="flex w-full flex-col gap-4 lg:sticky lg:top-24 lg:w-[360px] lg:shrink-0">
      <div className="flex flex-col gap-1 rounded-[22px] border border-line bg-card p-5 sm:rounded-[26px] sm:p-6">
        <strong className="mb-2 font-display text-lg">Talk to us directly</strong>
        {rows.length === 0 && <p className="m-0 text-mist">Our contact details will appear here shortly.</p>}
        <ul className="m-0 flex list-none flex-col p-0">
          {rows.map((r) => (
            <li key={r.label} className="border-b border-line last:border-0">
              {r.href
                ? <a href={r.href} className="flex items-center gap-3.5 py-3 text-fg hover:text-cyan">{row(r)}</a>
                : <span className="flex items-center gap-3.5 py-3">{row(r)}</span>}
            </li>
          ))}
        </ul>
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="press mt-3.5 rounded-full bg-whatsapp py-[15px] text-center font-extrabold text-white hover:text-white">
            Chat on WhatsApp
          </a>
        )}
      </div>

      {s?.address && (
        <div className="relative h-[220px] overflow-hidden rounded-[22px] border border-line sm:rounded-[26px]">
          <div className="ph absolute inset-0" aria-hidden="true" />
          <svg aria-hidden="true" viewBox="0 0 360 220" preserveAspectRatio="none" className="absolute inset-0 h-full w-full opacity-60">
            <path d="M-10 150 C 80 130, 140 170, 220 120 S 330 60, 380 80" fill="none" stroke="var(--line)" strokeWidth="10" />
            <path d="M120 -10 C 140 60, 110 130, 160 230" fill="none" stroke="var(--line)" strokeWidth="8" />
          </svg>
          <span className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
            <span className="pop-in relative block size-[18px]" style={{ animationDelay: '.6s' }}>
              <span className="ping bg-magenta" />
              <span className="absolute inset-0 rounded-full border-[3px] border-white bg-magenta" />
            </span>
          </span>
          {s.mapUrl ? (
            <a href={s.mapUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-x-3.5 bottom-3.5 flex items-center justify-between gap-2.5 rounded-2xl bg-glass px-3.5 py-3 text-sm font-bold text-fg backdrop-blur hover:text-fg">
              <span className="whitespace-pre-line">{s.address}</span>
              <span className="flex shrink-0 items-center gap-1 text-at-innovation">Directions <span className="nudge" aria-hidden="true">→</span></span>
            </a>
          ) : (
            <span className="absolute inset-x-3.5 bottom-3.5 whitespace-pre-line rounded-2xl bg-glass px-3.5 py-3 text-sm font-bold backdrop-blur">{s.address}</span>
          )}
        </div>
      )}

      <p className="m-0 text-sm text-mist">
        Equipment down? <Link to="/support" className="font-bold text-fg underline">Report a fault</Link> so it goes straight to our support team.
      </p>
    </aside>
  )
}

export default function Contact() {
  const [params] = useSearchParams()
  const initialType = TYPES.some((t) => t.value === params.get('type')) ? params.get('type') : 'general'
  const productSlug = params.get('product') || ''
  const packageId = params.get('package') || ''
  const projectSlug = params.get('project') || ''
  // A topic chosen on another page, e.g. "Ask about this" on a service card
  const linkedTopic = (params.get('topic') || '').slice(0, 160)

  const [type, setType] = useState(initialType)
  const [form, setForm] = useState(() => ({ ...EMPTY, topic: linkedTopic }))
  const [errors, setErrors] = useState({})
  const [startedAt] = useState(() => Date.now())

  usePageMeta('Contact us', 'Contact Daystol Group for quotes, consultations, property enquiries, construction contracts and maintenance contracts.')

  const { data: product } = useProduct(type === 'quote' ? productSlug : '')
  const { data: project } = useProject(projectSlug)
  const { data: innovationServices } = useServices('innovation')
  const { data: packages } = usePmcPackages()

  // The subject the visitor arrived with: a topic in the link, or "Similar to: <project>"
  const startTopic = linkedTopic || (project ? `Similar to: ${project.title}`.slice(0, 160) : '')
  const arrivedTopic = type === initialType ? startTopic : ''

  // Pre-fill the subject when arriving from a product, a project or a maintenance package
  useEffect(() => {
    if (product && type === 'quote') setForm((f) => (f.topic ? f : { ...f, topic: product.name }))
  }, [product, type])
  useEffect(() => {
    if (project && type === initialType) setForm((f) => (f.topic ? f : { ...f, topic: `Similar to: ${project.title}`.slice(0, 160) }))
  }, [project, type, initialType])
  useEffect(() => {
    const pkg = packages?.find((p) => p.id === packageId)
    if (pkg && type === 'pmc') setForm((f) => (f.topic ? f : { ...f, topic: pkg.name }))
  }, [packages, packageId, type])

  // The arrived subject stays selectable in the drop-downs
  const consultationOptions = useMemo(
    () => withTopic([...(innovationServices || []).map((s) => ({ value: s.title, label: s.title })), { value: 'Something else', label: 'Something else' }], arrivedTopic),
    [innovationServices, arrivedTopic],
  )
  const propertyOptions = useMemo(() => withTopic(PROPERTY_INTERESTS, arrivedTopic), [arrivedTopic])
  const packageOptions = useMemo(
    () => [...(packages || []).map((p) => ({ value: p.name, label: p.priceLabel ? `${p.name} (${p.priceLabel})` : p.name })), { value: 'Not sure yet', label: 'Not sure yet' }],
    [packages],
  )

  const set = (key) => (e) => {
    const value = e?.target ? e.target.value : e
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((x) => ({ ...x, [key]: null }))
  }

  // Switching back to the type the visitor arrived with brings their subject back
  const changeType = (t) => {
    setType(t)
    setForm((f) => ({ ...f, topic: t === initialType ? startTopic : '' }))
    setErrors({})
  }

  const mutation = useMutation({
    mutationFn: (body) => apiPost('/enquiries', body),
    onError: (err) => setErrors(fieldErrorsFrom(err)),
  })

  useEffect(() => {
    if (mutation.isSuccess) document.getElementById('contact-done')?.focus()
  }, [mutation.isSuccess])

  const validate = () => {
    const e = {
      name: validators.required(form.name, 'Your name'),
      phone: validators.phone(form.phone),
      email: form.preferredContact === 'email' && !form.email.trim() ? 'Add your email address so we can reply by email' : validators.email(form.email),
      message: validators.required(form.message, 'Your message'),
      topic: type === 'consultation' && !form.topic ? 'Choose a service'
        : type === 'property' && !form.topic ? 'Choose what you are interested in' : null,
    }
    const clean = Object.fromEntries(Object.entries(e).filter(([, v]) => v))
    setErrors(clean)
    return Object.keys(clean).length === 0
  }

  const submit = (e) => {
    e.preventDefault()
    if (!validate()) {
      setTimeout(() => document.querySelector('[aria-invalid="true"]')?.focus(), 0)
      return
    }
    mutation.mutate({ ...form, type, startedAt })
  }

  const reset = () => {
    setForm(EMPTY)
    setErrors({})
    mutation.reset()
  }

  const pickCompany = (t) => {
    changeType(t)
    mutation.reset()
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const current = TYPES.find((t) => t.value === type)

  return (
    <>
      <section className="relative overflow-hidden pb-10 pt-9 sm:pt-11">
        <div className="absolute inset-x-0 top-0 flex h-1.5" aria-hidden="true"><span className="flex-1 bg-spark" /><span className="flex-1 bg-cyan" /><span className="flex-1 bg-magenta" /><span className="flex-1 bg-orange" /></div>
        <div className="mx-auto flex max-w-[1320px] flex-col gap-[18px] px-4 sm:px-7">
          <nav aria-label="Breadcrumb" className="text-sm text-mist">
            <ol className="m-0 flex list-none gap-2 p-0">
              <li><Link to="/" className="text-mist hover:text-fg">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-fg">Contact</li>
            </ol>
          </nav>
          <h1 className="m-0 max-w-[18ch] font-display text-[27px] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[clamp(30px,3.8vw,52px)]">
            <span className="rise-line"><span style={{ animationDelay: '.1s' }}>Talk to the right</span></span>
            <span className="rise-line"><span className="text-at-property" style={{ animationDelay: '.25s' }}>Daystol team.</span></span>
          </h1>
          <p className="fade-up m-0 max-w-[58ch] text-base leading-relaxed text-mist sm:text-[17px]" style={{ animationDelay: '.4s' }}>
            Pick what you need below and we'll send it straight to the company that handles it: power, systems, property or construction.
          </p>
        </div>
      </section>

      <section id="contact-form" className="scroll-mt-24 pb-12 pt-2 sm:pb-20">
        <div className="mx-auto flex max-w-[1320px] flex-col items-start gap-7 px-4 sm:px-7 lg:flex-row">
          <div className="w-full min-w-0 flex-1">
            {mutation.isSuccess ? (
              <div id="contact-done" tabIndex={-1} role="status" className={`${card} flex flex-col items-start gap-4 outline-none sm:p-9`}>
                <div className="ring-in flex size-[76px] items-center justify-center rounded-full bg-[#157347]" aria-hidden="true">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path className="check-draw" d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                </div>
                <h2 className="m-0 font-display text-[22px] font-extrabold sm:text-[28px]">Message sent</h2>
                <p className="m-0 text-[17px]">Your reference is <strong className="rounded-lg bg-card2 px-2.5 py-1 font-display text-[15px] text-at-property">{mutation.data.reference}</strong></p>
                <p className="m-0 leading-relaxed text-mist">
                  We'll get back to you by {form.preferredContact === 'whatsapp' ? 'WhatsApp' : form.preferredContact === 'email' ? 'email' : 'phone'} as soon as possible.
                  {form.email && ' A copy is on its way to your email.'}
                </p>
                <button type="button" onClick={reset} className="press rounded-full border border-line px-5 py-3 font-bold text-fg">Send another message</button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className={`${card} relative flex flex-col gap-6`}>
                <TypePicker value={type} onChange={changeType} />

                <div key={type} className="fade-up flex flex-col gap-[18px]" style={{ animationDuration: '.4s' }}>
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <TextInput label="Your name" name="name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} maxLength={100} />
                    <TextInput label="Phone number" name="phone" type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={set('phone')} error={errors.phone} />
                    <TextInput label="Email" optional={form.preferredContact !== 'email'} name="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
                    <TextInput label="Company or organisation" optional name="organisation" autoComplete="organization" value={form.organisation} onChange={set('organisation')} maxLength={120} />
                  </div>

                  {type === 'quote' && (
                    <TextInput label="Product or service" optional name="topic" value={form.topic} onChange={set('topic')} help="For example: 60 kVA diesel generator, or a 5 kW solar power system" maxLength={160} />
                  )}
                  {type === 'consultation' && (
                    <Select label="Which service?" name="topic" value={form.topic} onChange={set('topic')} options={consultationOptions} placeholder="Choose a service" error={errors.topic} />
                  )}
                  {type === 'property' && (
                    <Select label="What are you interested in?" name="topic" value={form.topic} onChange={set('topic')} options={propertyOptions} placeholder="Choose one" error={errors.topic} />
                  )}
                  {type === 'contract' && (
                    <TextInput label="Type of project" optional name="topic" value={form.topic} onChange={set('topic')} help="For example: a two-storey office building, a borehole, or a road" maxLength={160} />
                  )}
                  {type === 'pmc' && (
                    <Select label="Maintenance package" optional name="topic" value={form.topic} onChange={set('topic')} options={packageOptions} placeholder="Choose a package" help={<>Compare the packages on the <Link to="/support#maintenance" className="underline">Support and maintenance</Link> page.</>} />
                  )}
                  {type === 'general' && form.topic && (
                    <TextInput label="About" optional name="topic" value={form.topic} onChange={set('topic')} maxLength={160} />
                  )}

                  <TextArea label="Your message" name="message" value={form.message} onChange={set('message')} error={errors.message} maxLength={3000} placeholder={current.hint} />
                  <ReplyPicker value={form.preferredContact} onChange={set('preferredContact')} />
                </div>

                <Honeypot value={form.website} onChange={set('website')} />

                {mutation.isError && !Object.keys(fieldErrorsFrom(mutation.error)).length && (
                  <p role="alert" className="m-0 rounded-2xl bg-[rgba(255,138,128,.12)] p-4 font-semibold text-bad">{mutation.error.message}</p>
                )}

                <div className="flex flex-col gap-3.5 sm:flex-row sm:flex-wrap sm:items-center">
                  <SubmitButton pending={mutation.isPending}>Send message</SubmitButton>
                  <span className="text-sm text-mist">We only use your details to reply. <Link to="/privacy" className="text-mist underline hover:text-fg">Privacy policy</Link></span>
                </div>
              </form>
            )}
          </div>

          <ContactDetails />
        </div>
      </section>

      <section className="border-t border-line bg-bg2 py-12 sm:pb-[88px] sm:pt-[72px]">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-7 px-4 sm:px-7">
          <h2 className="reveal m-0 font-display text-[22px] font-extrabold leading-[1.15] tracking-[-0.02em] sm:text-[clamp(24px,2.6vw,34px)]">Not sure who to ask? Here's who does what.</h2>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {COMPANIES.map((c, i) => (
              <div key={c.name} className="reveal lift flex flex-col overflow-hidden rounded-[22px] border border-line bg-card sm:rounded-[26px]" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="h-1.5" style={{ background: c.color }} aria-hidden="true" />
                <div className="flex flex-1 flex-col gap-3 p-6">
                  <strong className="font-display text-lg">{c.name}</strong>
                  <span className="text-[15px] leading-relaxed text-mist">{c.text}</span>
                  <button type="button" onClick={() => pickCompany(c.type)} className="press mt-auto self-start rounded-full px-[18px] py-3 font-extrabold" style={{ background: c.color, color: c.ink }}>{c.cta}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
