import { useId } from 'react'

const inputClass = (error) =>
  `w-full rounded-2xl border bg-field px-4 text-[16px] text-fg outline-none transition-colors placeholder:text-mist/60 focus:border-cyan ${error ? 'border-bad' : 'border-line'}`

/** Label, control, help text and error, wired together for screen readers. */
export function Field({ label, optional, help, error, hideLabel, children }) {
  const id = useId()
  const helpId = `${id}-help`
  const errorId = `${id}-error`
  const describedBy = [help && helpId, error && errorId].filter(Boolean).join(' ') || undefined
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'text-[15px] font-semibold'}>
        {label}
        {optional && <span className="font-normal text-mist"> (optional)</span>}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {help && <span id={helpId} className="text-sm text-mist">{help}</span>}
      {error && <span id={errorId} className="text-sm font-semibold text-bad">{error}</span>}
    </div>
  )
}

export function TextInput({ label, optional, help, error, ...props }) {
  return (
    <Field label={label} optional={optional} help={help} error={error}>
      {(a11y) => <input {...a11y} {...props} className={`${inputClass(error)} min-h-[52px]`} />}
    </Field>
  )
}

export function TextArea({ label, optional, help, error, hideLabel, rows = 5, ...props }) {
  return (
    <Field label={label} optional={optional} help={help} error={error} hideLabel={hideLabel}>
      {(a11y) => <textarea {...a11y} rows={rows} {...props} className={`${inputClass(error)} resize-y py-3 leading-relaxed`} />}
    </Field>
  )
}

export function Select({ label, optional, help, error, options, placeholder, ...props }) {
  return (
    <Field label={label} optional={optional} help={help} error={error}>
      {(a11y) => (
        <select {...a11y} {...props} className={`${inputClass(error)} min-h-[52px]`}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
    </Field>
  )
}

/** A row of large toggle buttons that behaves like a set of radio buttons. */
export function ChoiceGroup({ legend, options, value, onChange, error, accent = '#FFE52E' }) {
  return (
    <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
      <legend className="mb-3 p-0 text-[15px] font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup">
        {options.map((o) => {
          const on = o.value === value
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.value)}
              className={`press min-h-12 rounded-full px-[18px] text-[15px] ${on ? 'font-bold text-midnight' : 'border border-line text-fg hover:border-cyan'}`}
              style={on ? { background: accent } : undefined}
            >
              {o.label}
            </button>
          )
        })}
      </div>
      {error && <span className="text-sm font-semibold text-bad">{error}</span>}
    </fieldset>
  )
}

/** Hidden field that only bots fill in. Kept out of the tab order and away from screen readers. */
export function Honeypot({ value, onChange }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  )
}

export function SubmitButton({ pending, children, pendingText = 'Sending…' }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="shine press min-h-14 rounded-full bg-action px-8 text-[17px] font-bold text-white disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? pendingText : children}
    </button>
  )
}

/** Shared client-side checks, matching the server's rules. */
export const validators = {
  required: (v, label) => (!v || !String(v).trim() ? `${label} is required` : null),
  phone: (v) => (!v?.trim() ? 'Your phone number is required' : /^\+?[0-9\s-]{7,20}$/.test(v.trim()) ? null : 'Enter a valid phone number'),
  email: (v) => (!v?.trim() ? null : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : 'Enter a valid email address'),
}

/** Map server field errors ([{ field, message }]) onto the form. */
export const fieldErrorsFrom = (err) =>
  Object.fromEntries((err?.details || []).map((d) => [d.field, d.message]))
