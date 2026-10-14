import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import {
  fieldErrorsFrom, Honeypot, SubmitButton, TextArea, TextInput, validators,
} from '../components/form/Fields.jsx'
import { apiPostForm } from '../lib/api.js'
import { telHref, usePmcPackages, useSettings, whatsappHref } from '../hooks/useSiteData.js'
import { usePageMeta } from '../hooks/usePageMeta.js'

// Must match EQUIPMENT in server/src/models/ServiceRequest.js. Colour: which company looks after it.
const EQUIPMENT = [
  { value: 'generator', label: 'Diesel generator', color: '#FFE52E' },
  { value: 'solar', label: 'Solar power system', color: '#FFE52E' },
  { value: 'stabilizer', label: 'Servo stabilizer', color: '#FFE52E' },
  { value: 'electrical', label: 'Electrical installation', color: '#01AFEE' },
  { value: 'surveillance', label: 'Surveillance system', color: '#01AFEE' },
  { value: 'automation', label: 'Home or power automation', color: '#01AFEE' },
  { value: 'ict', label: 'ICT or network', color: '#01AFEE' },
  { value: 'other', label: 'Something else', color: '#B9C0D9' },
]

const HOW = [
  { title: 'You report it', text: 'With photos if you can. You get a reference number.', color: '#FF8A80' },
  { title: 'We call you', text: 'Our support team confirms the details and books a visit.', color: '#FFE52E' },
  { title: 'An engineer fixes it', text: 'With the right parts, first time where possible.', color: '#01AFEE' },
]

const TIPS = ['The make and model, if you know it', 'When it started and what you noticed', 'A photo of any warning light or error code']

const Tick = ({ className = '' }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`mt-0.5 shrink-0 ${className}`}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
)

const Pulse = () => (
  <span className="relative size-2.5 shrink-0" aria-hidden="true"><span className="ping bg-alert" /><span className="absolute inset-0 rounded-full bg-alert" /></span>
)

const MAX_PHOTOS = 4
const MAX_BYTES = 8 * 1024 * 1024
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const EMPTY = { issue: '', name: '', phone: '', email: '', address: '', website: '' }

/** Photo picker with previews. Checks type, size and count before anything is uploaded. */
function PhotoPicker({ photos, setPhotos, error, setError }) {
  const inputRef = useRef(null)
  const [previews, setPreviews] = useState([])

  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f))
    setPreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [photos])

  const add = (e) => {
    const picked = Array.from(e.target.files || [])
    e.target.value = ''
    const bad = picked.find((f) => !PHOTO_TYPES.includes(f.type) && !/\.(heic|heif)$/i.test(f.name))
    if (bad) return setError(`"${bad.name}" isn't a photo. Use JPG, PNG, WebP or HEIC.`)
    const big = picked.find((f) => f.size > MAX_BYTES)
    if (big) return setError(`"${big.name}" is larger than 8 MB.`)
    const next = [...photos, ...picked].slice(0, MAX_PHOTOS)
    if (photos.length + picked.length > MAX_PHOTOS) setError(`You can attach up to ${MAX_PHOTOS} photos.`)
    else setError(null)
    return setPhotos(next)
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-base font-bold">4. Add photos <span className="text-[15px] font-medium text-mist">(optional, up to 4)</span></span>
      <div className="flex flex-wrap gap-3">
        {previews.map((src, i) => (
          <div key={src} className="pop-in relative size-24 overflow-hidden rounded-2xl bg-card2">
            <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-full bg-midnight/80 text-white"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="press flex size-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-line text-sm text-mist hover:border-cyan hover:text-fg"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
            Add photo
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" tabIndex={-1} aria-hidden="true" onChange={add} />
      <span className="text-[13px] text-mist">JPG, PNG, WebP or HEIC, up to 8 MB each. Photos help our engineer bring the right parts.</span>
      {error && <span role="alert" className="text-sm font-semibold text-bad">{error}</span>}
    </div>
  )
}


const card = 'rounded-[22px] border border-line bg-card p-5 sm:rounded-[28px] sm:p-8'
const legend = 'mb-3 p-0 text-base font-bold'

function EquipmentPicker({ value, onChange, error }) {
  return (
    <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
      <legend className={legend}>1. What needs attention?</legend>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {EQUIPMENT.map((e) => {
          const on = e.value === value
          return (
            <button
              key={e.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(e.value)}
              className={`press flex min-h-[100px] flex-col items-start gap-2.5 rounded-[18px] p-3.5 text-left ${on ? 'text-midnight' : 'bg-field text-fg'}`}
              style={{ background: on ? e.color : undefined, border: on ? `2px solid ${e.color}` : '1px solid var(--line)' }}
            >
              <span className="flex size-[34px] items-center justify-center rounded-[10px]" style={{ background: on ? 'rgba(13,19,48,.15)' : 'var(--card2)' }} aria-hidden="true">
                <span className="size-3 rounded-full" style={{ background: on ? '#0D1330' : e.color }} />
              </span>
              <span className="text-sm font-bold leading-snug">{e.label}</span>
            </button>
          )
        })}
      </div>
      {error && <span className="text-sm font-semibold text-bad">{error}</span>}
    </fieldset>
  )
}

function UrgencyPicker({ value, onChange }) {
  const options = [
    { value: 'false', title: 'It can wait a day or two', text: "We'll schedule a visit", color: '#3DDC84' },
    { value: 'true', title: "Urgent: it's down now", text: 'Flagged to the team first', color: '#FF6B6B' },
  ]
  const onKey = (e) => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return
    e.preventDefault()
    const next = value === 'true' ? 'false' : 'true'
    onChange(next)
    document.getElementById(`urgent-${next}`)?.focus()
  }
  return (
    <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
      <legend className={legend}>2. How urgent is it?</legend>
      <div className="grid gap-3.5 sm:grid-cols-2" role="radiogroup" aria-label="How urgent is it?" onKeyDown={onKey}>
        {options.map((o) => {
          const on = o.value === value
          return (
            <button
              key={o.value}
              id={`urgent-${o.value}`}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              onClick={() => onChange(o.value)}
              className="press flex items-center gap-3 rounded-[18px] bg-field p-4 text-left text-fg"
              style={{ border: on ? `2px solid ${o.color}` : '1px solid var(--line)' }}
            >
              {o.value === 'true' ? <Pulse /> : <span className="size-3 shrink-0 rounded-full bg-[#3DDC84]" aria-hidden="true" />}
              <span className="flex flex-col"><strong>{o.title}</strong><span className="text-sm text-mist">{o.text}</span></span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function FaultForm() {
  const [params] = useSearchParams()
  const preset = EQUIPMENT.some((e) => e.value === params.get('equipment')) ? params.get('equipment') : ''
  const [equipment, setEquipment] = useState(preset)
  const [urgent, setUrgent] = useState('false')
  const [form, setForm] = useState(EMPTY)
  const [photos, setPhotos] = useState([])
  const [photoError, setPhotoError] = useState(null)
  const [errors, setErrors] = useState({})
  const [startedAt] = useState(() => Date.now())
  const { data: settings } = useSettings()
  const emergency = telHref(settings?.emergencyPhone)
  const doneRef = useRef(null)

  useEffect(() => {
    if (preset) setEquipment(preset)
  }, [preset])

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    if (errors[key]) setErrors((x) => ({ ...x, [key]: null }))
  }

  const mutation = useMutation({
    mutationFn: (fd) => apiPostForm('/service-requests', fd),
    onError: (err) => setErrors(fieldErrorsFrom(err)),
  })

  useEffect(() => {
    if (mutation.isSuccess) doneRef.current?.focus()
  }, [mutation.isSuccess])

  const submit = (e) => {
    e.preventDefault()
    const found = Object.fromEntries(Object.entries({
      equipment: equipment ? null : 'Choose the equipment',
      issue: validators.required(form.issue, 'A description of the problem'),
      name: validators.required(form.name, 'Your name'),
      phone: validators.phone(form.phone),
      email: validators.email(form.email),
      address: validators.required(form.address, 'The address or location'),
    }).filter(([, v]) => v))
    setErrors(found)
    if (Object.keys(found).length) {
      setTimeout(() => document.querySelector('#report [aria-invalid="true"]')?.focus(), 0)
      return
    }
    const fd = new FormData()
    Object.entries({ ...form, equipment, urgent, startedAt }).forEach(([k, v]) => fd.append(k, v))
    photos.forEach((p) => fd.append('photos', p))
    mutation.mutate(fd)
  }

  const reset = () => {
    setForm(EMPTY)
    setPhotos([])
    setEquipment('')
    setUrgent('false')
    setErrors({})
    mutation.reset()
  }

  if (mutation.isSuccess) {
    return (
      <div ref={doneRef} tabIndex={-1} role="status" className={`${card} flex flex-col items-start gap-[18px] outline-none`}>
        <div className="ring-in flex size-[76px] items-center justify-center rounded-full bg-[#157347]" aria-hidden="true">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path className="check-draw" d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </div>
        <h2 className="m-0 font-display text-[22px] font-extrabold sm:text-[28px]">Fault report sent</h2>
        <p className="m-0 text-[17px]">Your reference is <strong className="rounded-lg bg-card2 px-2.5 py-1 font-display text-[15px] text-at-power">{mutation.data.reference}</strong></p>
        <p className="m-0 max-w-[52ch] leading-relaxed text-mist">
          {urgent === 'true'
            ? <>Marked urgent: our support team will call you on {form.phone} as soon as possible.{emergency && <> If it is an emergency, call the 24/7 line now on <a href={emergency} className="font-bold text-fg underline">{settings.emergencyPhone}</a>.</>}</>
            : <>Our support team will call you on {form.phone} to arrange a technician.{form.email && ' A copy has been sent to your email.'}</>}
        </p>
        <div className="flex flex-wrap gap-2.5">
          <button type="button" onClick={reset} className="press rounded-full border border-line px-5 py-3 font-bold text-fg">Report another fault</button>
          <a href="#maintenance" className="press rounded-full bg-fg px-5 py-3.5 font-extrabold text-bg hover:text-bg">See maintenance plans</a>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className={`${card} relative flex flex-col gap-[26px]`} aria-labelledby="fault-heading">
      <div className="flex flex-col gap-2">
        <h2 id="fault-heading" className="m-0 font-display text-[22px] font-extrabold sm:text-[28px]">Report a fault</h2>
        <span className="text-mist">You'll get a reference number straight away.</span>
      </div>
      <EquipmentPicker value={equipment} onChange={(v) => { setEquipment(v); setErrors((x) => ({ ...x, equipment: null })) }} error={errors.equipment} />
      <UrgencyPicker value={urgent} onChange={setUrgent} />
      <TextArea label="3. What's happening?" name="issue" value={form.issue} onChange={set('issue')} error={errors.issue} maxLength={3000} rows={4} placeholder="For example: generator starts then stops after a few seconds, warning light on" />
      <PhotoPicker photos={photos} setPhotos={setPhotos} error={photoError} setError={setPhotoError} />
      <fieldset className="m-0 flex flex-col gap-3.5 border-0 p-0">
        <legend className={legend}>5. Your details</legend>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <TextInput label="Your name" name="name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} maxLength={100} />
          <TextInput label="Phone number" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} error={errors.phone} />
          <TextInput label="Email" optional name="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} help="We'll send a copy of your report here." />
          <TextInput label="Address or location" name="address" autoComplete="street-address" value={form.address} onChange={set('address')} error={errors.address} maxLength={300} />
        </div>
      </fieldset>
      <Honeypot value={form.website} onChange={(v) => setForm((f) => ({ ...f, website: v }))} />
      {mutation.isError && !Object.keys(fieldErrorsFrom(mutation.error)).length && (
        <p role="alert" className="m-0 rounded-2xl bg-[rgba(255,138,128,.12)] p-4 font-semibold text-bad">{mutation.error.message}</p>
      )}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:flex-wrap sm:items-center">
        <SubmitButton pending={mutation.isPending} pendingText={photos.length ? 'Uploading photos…' : 'Sending…'}>Send fault report</SubmitButton>
        <span className="text-sm text-mist">We only use your details and photos for this report. <Link to="/privacy" className="text-mist underline hover:text-fg">Privacy policy</Link></span>
      </div>
    </form>
  )
}

function Packages() {
  const { data: packages } = usePmcPackages()
  return (
    <section id="maintenance" className="scroll-mt-24 py-12 sm:py-[88px]" aria-labelledby="pmc-heading">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-[34px] px-4 sm:px-7">
        <div className="reveal flex flex-wrap items-end justify-between gap-[18px]">
          <div className="flex max-w-[640px] flex-col gap-3">
            <span className="eyebrow text-at-innovation">Preventative maintenance contracts</span>
            <h2 id="pmc-heading" className="h-section m-0">Fewer breakdowns, planned visits, one number to call</h2>
          </div>
          <p className="m-0 max-w-[42ch] leading-relaxed text-mist">Not sure which fits? Tell us what equipment you have and we'll recommend a plan.</p>
        </div>
        {packages?.length ? (
          <div className="grid gap-5 lg:grid-cols-3">
            {packages.map((p, i) => (
              <article
                key={p.id}
                className={`reveal lift relative flex flex-col gap-4 rounded-[22px] bg-card p-5 sm:rounded-[28px] sm:p-7 ${p.highlighted ? 'mt-3 border-2 border-spark lg:mt-0' : 'border border-line'}`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                {p.highlighted && <span className="absolute -top-[13px] left-6 rounded-full bg-spark px-3 py-1.5 text-xs font-extrabold text-midnight">Most popular</span>}
                <h3 className="m-0 font-display text-xl font-bold">{p.name}</h3>
                {p.summary && <p className="m-0 leading-normal text-mist">{p.summary}</p>}
                {p.priceLabel && <p className="m-0 font-display text-[22px] font-bold">{p.priceLabel}</p>}
                {p.features?.length > 0 && (
                  <ul className="m-0 flex list-none flex-col gap-2.5 border-t border-line p-0 pt-4">
                    {p.features.map((f) => <li key={f} className="flex gap-2.5 text-[15px]"><Tick className="text-at-innovation" />{f}</li>)}
                  </ul>
                )}
                <Link
                  to={`/contact?type=pmc&package=${p.id}`}
                  className={`press mt-auto rounded-full py-[15px] text-center font-extrabold ${p.highlighted ? 'bg-action text-white hover:text-white' : 'bg-card2 text-fg hover:text-fg'}`}
                >
                  Ask about this package
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className={`${card} flex flex-col items-start gap-4`}>
            <p className="m-0 text-mist">Tell us what equipment you have and we'll recommend a maintenance plan.</p>
            <Link to="/contact?type=pmc" className="press rounded-full bg-fg px-6 py-3 font-bold text-bg hover:text-bg">Ask about a maintenance contract</Link>
          </div>
        )}
      </div>
    </section>
  )
}

function ActionCard({ href, to, title, text, iconBg, icon, delay }) {
  const inner = (
    <>
      <span className="flex size-[50px] shrink-0 items-center justify-center rounded-[15px] text-midnight" style={{ background: iconBg }} aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
      </span>
      <span className="flex flex-col gap-0.5"><strong className="text-[17px]">{title}</strong><span className="text-sm text-mist">{text}</span></span>
    </>
  )
  const cls = 'fade-up lift flex items-center gap-4 rounded-[22px] border border-line bg-card p-5 text-fg hover:text-fg sm:rounded-3xl sm:p-[22px]'
  return to
    ? <Link to={to} className={cls} style={{ animationDelay: delay }}>{inner}</Link>
    : <a href={href} className={cls} style={{ animationDelay: delay }}>{inner}</a>
}

export default function Support() {
  const { data: settings } = useSettings()
  const emergency = telHref(settings?.emergencyPhone)
  const phone = telHref(settings?.phone)
  const wa = whatsappHref(settings?.whatsappNumber, 'Hello Daystol, I need help with a fault.')
  usePageMeta('Support and maintenance', 'Report a fault with your generator, solar power system, stabilizer, electrical or automation system, or ask about a maintenance contract.')

  return (
    <>
      <section className="relative overflow-hidden pb-12 pt-9 sm:pb-16 sm:pt-11">
        <div className="absolute inset-x-0 top-0 flex h-1.5" aria-hidden="true"><span className="flex-1 bg-cyan" /><span className="flex-1 bg-spark" /></div>
        <svg aria-hidden="true" viewBox="0 0 1440 500" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full opacity-40">
          <path className="flowline" d="M-40 440 C 360 420, 520 200, 860 230 S 1260 90, 1500 110" fill="none" stroke="#01AFEE" strokeWidth="2" />
          <path className="flowline" d="M-40 480 C 400 480, 640 320, 940 330 S 1280 240, 1500 240" fill="none" stroke="#FFE52E" strokeWidth="1.5" style={{ animationDelay: '-1.4s' }} />
        </svg>
        <div className="relative mx-auto flex max-w-[1320px] flex-col gap-[34px] px-4 sm:px-7">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
            <div className="flex flex-col gap-[18px]">
              <nav aria-label="Breadcrumb" className="text-sm text-mist">
                <ol className="m-0 flex list-none gap-2 p-0">
                  <li><Link to="/" className="text-mist hover:text-fg">Home</Link></li>
                  <li aria-hidden="true">/</li>
                  <li aria-current="page" className="text-fg">Support and maintenance</li>
                </ol>
              </nav>
              <h1 className="m-0 font-display text-[27px] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[clamp(30px,3.8vw,52px)]">
                <span className="rise-line"><span style={{ animationDelay: '.1s' }}>Something stopped working?</span></span>
                <span className="rise-line"><span className="text-at-innovation" style={{ animationDelay: '.25s' }}>We'll get it running again.</span></span>
              </h1>
              <p className="fade-up m-0 max-w-[54ch] text-base leading-relaxed text-mist sm:text-[17px]" style={{ animationDelay: '.4s' }}>
                Report a fault with your generator, solar system, stabilizer, electrical or automation system, and our support team will call you to arrange a technician. Planned maintenance keeps it from happening again.
              </p>
            </div>

            {(emergency || wa) && (
              <div className="fade-up relative flex flex-col gap-3 overflow-hidden rounded-[22px] border border-[#2A335E] bg-midnight p-5 text-[#F2F4FA] sm:rounded-[28px] sm:p-7" style={{ animationDelay: '.3s' }}>
                <span className="flex items-center gap-2.5 font-bold text-[#FF8A80]"><Pulse />{emergency ? '24/7 emergency line' : 'Need help fast?'}</span>
                {emergency && <span className="font-display text-[28px] font-extrabold">{settings.emergencyPhone}</span>}
                <span className="leading-normal text-[#B9C0D9]">For outages that can't wait, call us now. For everything else, the form below is the fastest way to reach the right engineer.</span>
                <span className="flex flex-wrap gap-2.5 pt-1">
                  {emergency && <a href={emergency} className="press rounded-full bg-spark px-5 py-[13px] font-extrabold text-midnight hover:text-midnight">Call now</a>}
                  {wa && (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="press flex items-center gap-2 rounded-full border border-[#2A335E] px-[18px] py-3 font-bold text-white hover:text-white">
                      <span className="size-[9px] rounded-full bg-whatsapp" aria-hidden="true" />WhatsApp
                    </a>
                  )}
                </span>
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <ActionCard href="#report" title="Report a fault" text="With photos, in about two minutes" iconBg="#FF6B6B" delay=".5s" icon="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            <ActionCard href="#maintenance" title="Maintenance contracts" text="Planned visits, fewer outages" iconBg="#FFE52E" delay=".6s" icon="M3 4h18v17H3zM8 2v4M16 2v4M3 10h18M9 15l2 2 4-4" />
            {phone ? (
              <ActionCard href={phone} title="Talk to support" text={settings.officeHours ? `Office hours: ${settings.officeHours}` : `Call ${settings.phone}`} iconBg="#01AFEE" delay=".7s" icon="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
            ) : (
              <ActionCard to="/contact" title="Talk to support" text="Send us a message" iconBg="#01AFEE" delay=".7s" icon="M4 4h16v12H5.2L4 17.2zM8 9h8M8 12h5" />
            )}
          </div>
        </div>
      </section>

      <section id="report" className="scroll-mt-24 border-y border-line bg-bg2 py-12 sm:py-[72px]">
        <div className="mx-auto flex max-w-[1320px] flex-col items-start gap-7 px-4 sm:px-7 lg:flex-row">
          <div className="w-full min-w-0 flex-1"><FaultForm /></div>
          <aside className="flex w-full flex-col gap-4 lg:sticky lg:top-24 lg:w-[340px] lg:shrink-0">
            <div className="flex flex-col gap-4 rounded-[22px] border border-line bg-card p-5 sm:rounded-3xl sm:p-6">
              <strong className="font-display text-[17px]">What happens next</strong>
              <ol className="m-0 flex list-none flex-col gap-4 p-0">
                {HOW.map((h, i) => (
                  <li key={h.title} className="flex items-start gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full font-display text-[13px] font-extrabold text-midnight" style={{ background: h.color }}>{i + 1}</span>
                    <span className="flex flex-col gap-0.5"><strong className="text-[15px]">{h.title}</strong><span className="text-sm leading-normal text-mist">{h.text}</span></span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex flex-col gap-3 rounded-[22px] border border-line bg-card p-5 sm:rounded-3xl sm:p-6">
              <strong>Helpful to have ready</strong>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {TIPS.map((t) => <li key={t} className="flex gap-2.5 text-sm leading-normal text-mist"><Tick className="text-at-innovation" />{t}</li>)}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <Packages />
    </>
  )
}
