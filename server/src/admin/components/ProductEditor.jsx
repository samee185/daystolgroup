import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Badge, Icon, LoadError, ROOT, Switch, callAction, naira, recordUrl, resourceUrl, stockInfo, timeAgo, useLoad, useToast,
} from './ui.jsx'

const TABS = [
  { id: 'details', label: 'Details' },
  { id: 'photos', label: 'Photos' },
  { id: 'price', label: 'Price and sale' },
  { id: 'stock', label: 'Stock' },
  { id: 'publish', label: 'Publish' },
]

// Which tab each field lives on, so errors from the server can point at the right place
const FIELD_TAB = {
  name: 'details', category: 'details', brand: 'details', sku: 'details', shortDescription: 'details', description: 'details', specifications: 'details',
  photos: 'photos', imageKeys: 'photos',
  quoteOnly: 'price', price: 'price', 'sale.price': 'price', 'sale.startsAt': 'price', 'sale.endsAt': 'price',
  stockQty: 'stock', lowStockThreshold: 'stock', availableOnOrder: 'stock',
  published: 'publish', featured: 'publish', slug: 'publish',
}

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const MAX_BYTES = 8 * 1024 * 1024
const MAX_PHOTOS = 12
const REASON = { sale: 'sold online', cancellation: 'order cancelled', adjustment: 'edited' }

const digits = (v) => String(v ?? '').replace(/[^0-9]/g, '')
const toNum = (v) => (v === '' || v === null || v === undefined ? null : Number(v))
const slugify = (v) => String(v || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

/** The same rules the server checks, so mistakes show up while typing. */
function checkForm(f) {
  const e = {}
  if (!f.name.trim()) e.name = 'Enter the product name.'
  if (!f.category) e.category = 'Choose a category.'
  if (!f.shortDescription.trim()) e.shortDescription = 'Write a short description.'
  const price = toNum(f.price)
  const sale = toNum(f.sale.price)
  if (!f.quoteOnly) {
    if (!price) e.price = 'Enter a price, or turn on "Quote only".'
    if (sale !== null) {
      if (!sale) e['sale.price'] = 'Enter the sale price in whole naira.'
      else if (price && sale >= price) e['sale.price'] = 'The sale price must be lower than the normal price.'
    }
  }
  if ((f.sale.startsAt || f.sale.endsAt) && sale === null && !f.quoteOnly) e['sale.price'] = 'Enter a sale price, or clear the sale dates.'
  if (f.sale.startsAt && f.sale.endsAt && f.sale.endsAt < f.sale.startsAt) e['sale.endsAt'] = 'The sale must end after it starts.'
  return e
}

function Field({ label, htmlFor, help, error, optional, children, counter }) {
  return (
    <div className="dz-field">
      <label htmlFor={htmlFor} className="dz-label">
        {label}{optional && <span className="dz-muted dz-light"> (optional)</span>}
        {counter && <span className="dz-muted dz-light"> ({counter})</span>}
      </label>
      {children}
      {error ? <span className="dz-err" role="alert">{error}</span> : help ? <span className="dz-help">{help}</span> : null}
    </div>
  )
}

/** Small rich-text box for the full description: bold, italic, headings, lists and links. */
function RichEditor({ value, onChange, id }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value || ''
    // Only sync from outside when the product loads, not while typing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])
  const cmd = (name, arg) => {
    ref.current?.focus()
    document.execCommand(name, false, arg)
    onChange(ref.current?.innerHTML || '')
  }
  const link = () => {
    const url = window.prompt('Link address (https://…)')
    if (url && /^https?:\/\//i.test(url)) cmd('createLink', url)
  }
  const tools = [
    { label: 'B', title: 'Bold', run: () => cmd('bold'), cls: 'dz-b' },
    { label: 'I', title: 'Italic', run: () => cmd('italic'), cls: 'dz-i' },
    { label: 'H2', title: 'Heading', run: () => cmd('formatBlock', 'h2') },
    { label: 'H3', title: 'Small heading', run: () => cmd('formatBlock', 'h3') },
    { label: '¶', title: 'Paragraph', run: () => cmd('formatBlock', 'p') },
    { label: '• List', title: 'Bullet list', run: () => cmd('insertUnorderedList') },
    { label: '1. List', title: 'Numbered list', run: () => cmd('insertOrderedList') },
    { label: 'Link', title: 'Add a link', run: link },
    { label: 'Clear', title: 'Clear formatting', run: () => cmd('removeFormat') },
  ]
  return (
    <div className="dz-rich">
      <div className="dz-rich-tools" role="toolbar" aria-label="Formatting">
        {tools.map((t) => <button key={t.title} type="button" title={t.title} aria-label={t.title} className={t.cls} onMouseDown={(e) => e.preventDefault()} onClick={t.run}>{t.label}</button>)}
      </div>
      <div
        id="dz-description"
        ref={ref}
        className="dz-rich-area"
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label="Full description"
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        suppressContentEditableWarning
      />
    </div>
  )
}

/** The website's product card, updated as staff type. */
function Preview({ form, photos, categoryName }) {
  const price = toNum(form.price)
  const sale = toNum(form.sale.price)
  const saleOn = !form.quoteOnly && sale && price && sale < price
  const stock = stockInfo(Number(form.stockQty) || 0, Number(form.lowStockThreshold) || 0, form.availableOnOrder)
  const STOCK_INK = { ok: '#157347', warn: '#8A6A00', info: '#4A5375', bad: '#B3261E' }
  const first = photos[0]
  return (
    <aside className="dz-preview" aria-label="Live preview">
      <span className="dz-muted dz-small dz-strong">Live preview on the website</span>
      <div className="dz-pcard">
        <div className="dz-pcard-photo">
          <span className="dz-pcard-glow" aria-hidden="true" />
          {first ? <img src={first.src} alt="" /> : <span className="dz-pcard-nophoto">Photo coming soon</span>}
          {saleOn && <span className="dz-pcard-sale">SALE</span>}
          <span className="dz-pcard-stock" style={{ color: form.quoteOnly ? '#4A5375' : STOCK_INK[stock.tone] }}><span />{form.quoteOnly ? 'By quote' : stock.text}</span>
          <span className="dz-pcard-count">{photos.length} {photos.length === 1 ? 'photo' : 'photos'}</span>
        </div>
        <div className="dz-pcard-body">
          <span className="dz-muted dz-small dz-strong">{categoryName || 'Category'}</span>
          <strong className="dz-pcard-name">{form.name || 'Product name'}</strong>
          <span className="dz-muted dz-small dz-clamp">{form.shortDescription || 'Short description'}</span>
          <div className="dz-pcard-foot">
            <span className="dz-stack">
              {saleOn && <span className="dz-muted dz-small dz-strike">{naira(price)}</span>}
              <span className="dz-display dz-pcard-price">{form.quoteOnly ? 'Request a quote' : naira(saleOn ? sale : price) || '₦0'}</span>
            </span>
            <span className="dz-pcard-add" aria-hidden="true">+</span>
          </div>
        </div>
      </div>
      {!form.published && <span className="dz-note dz-warn dz-pop">Hidden: customers can't see this product until "Show on the website" is on.</span>}
      {form.published && form.featured && <span className="dz-note dz-info dz-pop">Featured: shown first in the shop and on the home page.</span>}
    </aside>
  )
}

/** Product editor with tabs, a live preview, photo ordering and sale checks. Used for new and existing products. */
export default function ProductEditor({ record }) {
  const id = record?.id || null
  const isNew = !id
  const [toast, notify] = useToast()
  const [tab, setTab] = useState('details')
  const [form, setForm] = useState(null)
  const [photos, setPhotos] = useState([]) // { key, src } for saved photos, { file, src } for new ones
  const [serverErrors, setServerErrors] = useState({})
  const [photoError, setPhotoError] = useState('')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const fileInput = useRef(null)

  const { data, error, loading, reload, setData } = useLoad(
    () => (isNew
      ? callAction({ resource: 'Product', action: 'newProductForm', method: 'get' })
      : callAction({ resource: 'Product', record: id, action: 'productForm', method: 'get' })),
    [id],
  )

  // Load the product into the form
  useEffect(() => {
    if (!data?.product) return
    setForm(data.product)
    setPhotos(data.product.photos || [])
    setDirty(false)
  }, [data])

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('created') === '1') notify('Product created.')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirty) return undefined
    const warn = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  // Free the previews of new photos when the page closes
  const photosRef = useRef(photos)
  photosRef.current = photos
  useEffect(() => () => photosRef.current.forEach((p) => p.file && URL.revokeObjectURL(p.src)), [])

  const localErrors = useMemo(() => (form ? checkForm(form) : {}), [form])
  const errors = { ...(showErrors ? localErrors : pick(localErrors, ['sale.price', 'sale.endsAt'])), ...serverErrors }
  const tabErrors = new Set(Object.keys(errors).map((k) => FIELD_TAB[k] || 'details'))
  const categoryName = data?.categories?.find((c) => c.id === form?.category)?.name

  if (error) return <div className="dz dz-page"><LoadError error={error} onRetry={reload} /></div>
  if (loading || !form) {
    return <div className="dz dz-page" aria-busy="true"><div className="dz-skel" style={{ height: 56, width: 300 }} /><div className="dz-edit"><div className="dz-skel" style={{ height: 480 }} /><div className="dz-skel" style={{ height: 380 }} /></div></div>
  }

  const canEdit = data.canEdit
  const update = (changes) => {
    setForm((f) => ({ ...f, ...changes }))
    setDirty(true)
    setServerErrors((e) => {
      const next = { ...e }
      Object.keys(changes).forEach((k) => { delete next[k] })
      if (changes.sale) ['sale.price', 'sale.startsAt', 'sale.endsAt'].forEach((k) => delete next[k])
      return next
    })
  }
  const set = (key) => (e) => update({ [key]: e.target.value })
  const setSale = (key, value) => update({ sale: { ...form.sale, [key]: value } })

  // ----- Photos -----
  const addPhotos = (e) => {
    const picked = Array.from(e.target.files || [])
    e.target.value = ''
    const bad = picked.find((f) => !PHOTO_TYPES.includes(f.type))
    if (bad) return setPhotoError(`"${bad.name}" isn't a JPG, PNG, WebP or AVIF photo.`)
    const big = picked.find((f) => f.size > MAX_BYTES)
    if (big) return setPhotoError(`"${big.name}" is larger than 8 MB.`)
    const room = MAX_PHOTOS - photos.length
    setPhotoError(picked.length > room ? `You can have up to ${MAX_PHOTOS} photos. The extra ones were left out.` : '')
    setPhotos((list) => [...list, ...picked.slice(0, room).map((file) => ({ file, src: URL.createObjectURL(file) }))])
    setDirty(true)
    return undefined
  }
  const movePhoto = (from, to) => {
    setPhotos((list) => {
      const next = [...list]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
    setDirty(true)
  }
  const removePhoto = (i) => {
    setPhotos((list) => {
      const gone = list[i]
      if (gone?.file) URL.revokeObjectURL(gone.src)
      return list.filter((_, j) => j !== i)
    })
    setDirty(true)
  }

  // ----- Save -----
  const save = async () => {
    setShowErrors(true)
    const problems = checkForm(form)
    if (Object.keys(problems).length) {
      setTab(FIELD_TAB[Object.keys(problems)[0]] || 'details')
      notify('Fix the fields marked in red, then save again.', 'bad')
      return
    }
    setSaving(true)
    try {
      const files = photos.filter((p) => p.file).map((p) => p.file)
      let n = 0
      const photoOrder = photos.map((p) => (p.file ? `new:${n++}` : p.key))
      const payload = { ...form, photoOrder }
      const res = isNew
        ? await callAction({ resource: 'Product', action: 'createProduct', data: payload, files })
        : await callAction({ resource: 'Product', record: id, action: 'updateProduct', data: payload, files })

      if (res.errors) {
        setServerErrors(res.errors)
        setTab(FIELD_TAB[Object.keys(res.errors)[0]] || 'details')
        notify('Fix the fields marked in red, then save again.', 'bad')
        return
      }
      if (res.error) throw new Error(res.error)
      setDirty(false)
      if (isNew) {
        window.location.href = `${recordUrl('Product', res.product.id, 'edit')}?created=1`
        return
      }
      photos.forEach((p) => p.file && URL.revokeObjectURL(p.src))
      setData((d) => ({ ...d, product: res.product, history: res.history || d.history }))
      setServerErrors({})
      setShowErrors(false)
      notify(res.notice || 'Saved.')
    } catch (err) {
      notify(err.message, 'bad')
    } finally {
      setSaving(false)
    }
  }

  const price = toNum(form.price)
  const sale = toNum(form.sale.price)
  const saleOk = !form.quoteOnly && sale && price && sale < price && !errors['sale.price']
  const stock = stockInfo(Number(form.stockQty) || 0, Number(form.lowStockThreshold) || 0, form.availableOnOrder)
  const blocked = Boolean(errors['sale.price'] || errors['sale.endsAt'])
  const descLeft = 300 - form.shortDescription.length

  return (
    <div className="dz dz-page">
      {toast}
      <nav aria-label="Breadcrumb" className="dz-crumbs">
        <a href={ROOT}>Dashboard</a><span aria-hidden="true">/</span>
        <a href={resourceUrl('Product')}>Products</a><span aria-hidden="true">/</span>
        <span aria-current="page">{isNew ? 'New product' : form.name || 'Edit product'}</span>
      </nav>
      <div className="dz-page-head">
        <h1 className="dz-display dz-h1">{isNew ? 'New product' : 'Edit product'}{dirty && <span className="dz-unsaved">Unsaved changes</span>}</h1>
        <span className="dz-row dz-gap-8">
          <a href={resourceUrl('Product')} className="dz-btn dz-btn-ghost">{dirty ? 'Discard' : 'Back to products'}</a>
          {canEdit && (
            <button type="button" className="dz-btn dz-btn-primary" onClick={save} disabled={saving || blocked}>
              {saving ? (photos.some((p) => p.file) ? 'Uploading photos…' : 'Saving…') : isNew ? 'Create product' : 'Save changes'}
            </button>
          )}
        </span>
      </div>
      {!canEdit && <div className="dz-banner dz-info">You can view this product. Only admin and sales staff can change it.</div>}

      <div className="dz-edit">
        <section className="dz-card dz-stack dz-gap-20">
          <div className="dz-tabs" role="tablist" aria-label="Product sections">
            {TABS.map((t) => (
              <button key={t.id} type="button" role="tab" id={`dz-tab-${t.id}`} aria-selected={tab === t.id} aria-controls="dz-tabpanel" onClick={() => setTab(t.id)} className="dz-tab">
                {t.label}
                {tabErrors.has(t.id) && <span className="dz-tab-err" aria-label="has an error" />}
              </button>
            ))}
          </div>

          <fieldset key={tab} id="dz-tabpanel" role="tabpanel" aria-labelledby={`dz-tab-${tab}`} className="dz-panel dz-pop" disabled={!canEdit}>
            {tab === 'details' && (
              <>
                <Field label="Product name" htmlFor="pf-name" error={errors.name}>
                  <input id="pf-name" className={`dz-input ${errors.name ? 'dz-invalid' : ''}`} value={form.name} onChange={set('name')} maxLength={200} />
                </Field>
                <div className="dz-grid3">
                  <Field label="Category" htmlFor="pf-cat" error={errors.category} help={data.categories.length ? '' : 'Add a category under Shop → Categories first.'}>
                    <select id="pf-cat" className={`dz-input ${errors.category ? 'dz-invalid' : ''}`} value={form.category} onChange={set('category')}>
                      <option value="">Choose a category</option>
                      {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Brand" htmlFor="pf-brand" optional><input id="pf-brand" className="dz-input" value={form.brand} onChange={set('brand')} maxLength={120} /></Field>
                  <Field label="Model / SKU" htmlFor="pf-sku" optional><input id="pf-sku" className="dz-input" value={form.sku} onChange={set('sku')} maxLength={120} /></Field>
                </div>
                <Field label="Short description" htmlFor="pf-short" counter={`${descLeft} characters left`} error={errors.shortDescription} help="Shown on product cards and in Google results.">
                  <textarea id="pf-short" className={`dz-input ${errors.shortDescription ? 'dz-invalid' : ''}`} rows={3} value={form.shortDescription} onChange={(e) => update({ shortDescription: e.target.value.slice(0, 300) })} />
                </Field>
                <div className="dz-field">
                  <span className="dz-label">Full description <span className="dz-muted dz-light">(optional)</span></span>
                  <RichEditor id={form.id || 'new'} value={form.description} onChange={(html) => update({ description: html })} />
                </div>
                <div className="dz-field">
                  <span className="dz-label">Specifications</span>
                  <span className="dz-help">The first two show on product cards, the first three at the top of the product page.</span>
                  {form.specifications.map((s, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <div key={i} className="dz-spec">
                      <input className="dz-input" aria-label={`Specification ${i + 1} name`} placeholder="e.g. Power output" value={s.label} onChange={(e) => update({ specifications: form.specifications.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                      <input className="dz-input" aria-label={`Specification ${i + 1} value`} placeholder="e.g. 20 kVA" value={s.value} onChange={(e) => update({ specifications: form.specifications.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
                      <button type="button" className="dz-icon-btn" aria-label={`Move specification ${i + 1} up`} disabled={i === 0} onClick={() => update({ specifications: swap(form.specifications, i, i - 1) })}>↑</button>
                      <button type="button" className="dz-icon-btn" aria-label={`Remove specification ${i + 1}`} onClick={() => update({ specifications: form.specifications.filter((_, j) => j !== i) })}><Icon name="x" size={16} /></button>
                    </div>
                  ))}
                  {form.specifications.length < 30 && (
                    <button type="button" className="dz-btn dz-btn-ghost dz-self-start" onClick={() => update({ specifications: [...form.specifications, { label: '', value: '' }] })}><Icon name="plus" size={16} stroke={2.6} />Add specification</button>
                  )}
                </div>
              </>
            )}

            {tab === 'photos' && (
              <>
                <span className="dz-help">The first photo is the main one. Use the arrows to change the order. JPG, PNG or WebP, up to 8 MB each, at most {MAX_PHOTOS}.</span>
                {!data.cloudinaryReady && <div className="dz-banner dz-warn">Photo uploads need CLOUDINARY_URL in server/.env.</div>}
                <ul className="dz-photos">
                  {photos.map((p, i) => (
                    <li key={p.key || p.src} className={`dz-photo dz-pop ${i === 0 ? 'dz-photo-main' : ''}`}>
                      {p.src ? <img src={p.src} alt={`Photo ${i + 1}`} /> : <span className="dz-photo-missing"><Icon name="image" /></span>}
                      <span className="dz-photo-tag">{i === 0 ? 'Main' : i + 1}{p.file && ' · new'}</span>
                      <button type="button" className="dz-photo-remove" onClick={() => removePhoto(i)} aria-label={`Remove photo ${i + 1}`}><Icon name="x" size={14} stroke={2.6} /></button>
                      <span className="dz-photo-move">
                        <button type="button" onClick={() => movePhoto(i, i - 1)} disabled={i === 0} aria-label={`Move photo ${i + 1} earlier`}><Icon name="arrowL" size={16} /></button>
                        <button type="button" onClick={() => movePhoto(i, i + 1)} disabled={i === photos.length - 1} aria-label={`Move photo ${i + 1} later`}><Icon name="arrowR" size={16} /></button>
                      </span>
                    </li>
                  ))}
                  {photos.length < MAX_PHOTOS && (
                    <li>
                      <button type="button" className="dz-photo-add" onClick={() => fileInput.current?.click()} disabled={!data.cloudinaryReady}>
                        <span className="dz-photo-plus">+</span>Add photos
                      </button>
                    </li>
                  )}
                </ul>
                <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="dz-sr" tabIndex={-1} aria-hidden="true" onChange={addPhotos} />
                {(photoError || errors.photos) && <span className="dz-err" role="alert">{photoError || errors.photos}</span>}
                {photos.some((p) => p.file) && <span className="dz-help">New photos upload when you save.</span>}
              </>
            )}

            {tab === 'price' && (
              <>
                <label className="dz-switch-row">
                  <Switch on={form.quoteOnly} onChange={(v) => update({ quoteOnly: v })} label="Quote only" color="#01AFEE" />
                  <span className="dz-stack"><strong>Quote only</strong><span className="dz-help">Shows "Request a quote" instead of a price. Use for large or custom items.</span></span>
                </label>
                {!form.quoteOnly && (
                  <div className="dz-grid2">
                    <Field label="Price (₦, VAT inclusive)" htmlFor="pf-price" error={errors.price} help="Whole naira, no kobo.">
                      <input id="pf-price" className={`dz-input ${errors.price ? 'dz-invalid' : ''}`} inputMode="numeric" value={form.price ?? ''} onChange={(e) => update({ price: digits(e.target.value) })} />
                    </Field>
                    <Field
                      label="Sale price (₦)"
                      htmlFor="pf-sale"
                      optional
                      error={errors['sale.price']}
                      help={saleOk ? `Customers save ${naira(price - sale)} (${Math.round(((price - sale) / price) * 100)}%).` : 'Leave blank for no sale.'}
                    >
                      <input id="pf-sale" className={`dz-input ${errors['sale.price'] ? 'dz-invalid' : ''}`} inputMode="numeric" value={form.sale.price ?? ''} onChange={(e) => setSale('price', digits(e.target.value))} aria-invalid={Boolean(errors['sale.price'])} />
                    </Field>
                    <Field label="Sale starts" htmlFor="pf-start" help="Leave blank to start now." error={errors['sale.startsAt']}>
                      <input id="pf-start" type="date" className="dz-input" value={form.sale.startsAt} onChange={(e) => setSale('startsAt', e.target.value)} />
                    </Field>
                    <Field label="Sale ends" htmlFor="pf-end" help="Leave blank for no end date." error={errors['sale.endsAt']}>
                      <input id="pf-end" type="date" className={`dz-input ${errors['sale.endsAt'] ? 'dz-invalid' : ''}`} value={form.sale.endsAt} onChange={(e) => setSale('endsAt', e.target.value)} />
                    </Field>
                  </div>
                )}
                {!form.quoteOnly && (form.sale.price || form.sale.startsAt || form.sale.endsAt) && (
                  <button type="button" className="dz-btn dz-btn-ghost dz-self-start" onClick={() => update({ sale: { price: null, startsAt: '', endsAt: '' } })}>End the sale</button>
                )}
              </>
            )}

            {tab === 'stock' && (
              <>
                <div className="dz-row dz-wrap dz-gap-16 dz-align-end">
                  <div className="dz-field">
                    <span className="dz-label">Units in stock</span>
                    <div className="dz-stepper" role="group" aria-label="Units in stock">
                      <button type="button" onClick={() => update({ stockQty: Math.max(0, (Number(form.stockQty) || 0) - 1) })} aria-label="One less">−</button>
                      <input className="dz-display" inputMode="numeric" aria-label="Units in stock" value={form.stockQty} onChange={(e) => update({ stockQty: Number(digits(e.target.value) || 0) })} />
                      <button type="button" onClick={() => update({ stockQty: (Number(form.stockQty) || 0) + 1 })} aria-label="One more">+</button>
                    </div>
                  </div>
                  <span className="dz-pb-10"><Badge tone={stock.tone}>{stock.text}</Badge></span>
                </div>
                <span className="dz-help">Paid orders reduce stock automatically. Changes you make here are recorded in Stock history.</span>
                <div className="dz-grid2">
                  <Field label="Low-stock alert at" htmlFor="pf-low" help='At or below this, the site shows "Only X left" and the dashboard flags it.'>
                    <input id="pf-low" className="dz-input" inputMode="numeric" value={form.lowStockThreshold} onChange={(e) => update({ lowStockThreshold: Number(digits(e.target.value) || 0) })} />
                  </Field>
                  <label className="dz-switch-row dz-align-center">
                    <Switch on={form.availableOnOrder} onChange={(v) => update({ availableOnOrder: v })} label="Available on order when sold out" color="#01AFEE" />
                    <span className="dz-stack"><strong>Available on order when sold out</strong><span className="dz-help">Shows "Available on order" instead of "Out of stock".</span></span>
                  </label>
                </div>
                {!isNew && (
                  <div className="dz-history">
                    <strong>Recent stock changes</strong>
                    {data.history.length === 0 ? <span className="dz-muted dz-small">No changes recorded yet.</span> : data.history.map((h) => (
                      <div key={`${h.at}-${h.change}`} className="dz-kv">
                        <span><strong className={h.change < 0 ? 'dz-text-bad' : 'dz-text-ok'}>{h.change > 0 ? `+${h.change}` : `−${Math.abs(h.change)}`}</strong> {REASON[h.reason] || h.reason}{h.order ? ` (${h.order})` : ''}{h.by ? ` by ${h.by}` : ''}</span>
                        <span className="dz-muted dz-small">{timeAgo(h.at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === 'publish' && (
              <>
                <label className="dz-switch-row">
                  <Switch on={form.published} onChange={(v) => update({ published: v })} label="Show on the website" />
                  <span className="dz-stack"><strong>Show on the website</strong><span className="dz-help">Turn off to hide the product without deleting it.</span></span>
                </label>
                <label className="dz-switch-row">
                  <Switch on={form.featured} onChange={(v) => update({ featured: v })} label="Feature on the home page" color="#FFE52E" />
                  <span className="dz-stack"><strong>Feature on the home page</strong><span className="dz-help">Featured products show first in the shop and on the home page.</span></span>
                </label>
                <Field label="Web address" htmlFor="pf-slug" error={errors.slug} help={isNew ? 'Made from the name when you save. Change it only if you need to.' : 'Changing it breaks links people have already shared.'}>
                  <div className="dz-prefix">
                    <span>daystolgroup.com/shop/</span>
                    <input id="pf-slug" value={form.slug} placeholder={slugify(form.name) || 'made-from-the-name'} onChange={(e) => update({ slug: slugify(e.target.value) })} />
                  </div>
                </Field>
                {!isNew && form.published && form.slug && (
                  <a href={`/shop/${form.slug}`} target="_blank" rel="noopener noreferrer" className="dz-link">View on the website ↗</a>
                )}
              </>
            )}
          </fieldset>
        </section>

        <Preview form={form} photos={photos} categoryName={categoryName} />
      </div>
    </div>
  )
}

function swap(list, a, b) {
  const next = [...list]
  ;[next[a], next[b]] = [next[b], next[a]]
  return next
}

function pick(obj, keys) {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => keys.includes(k)))
}
