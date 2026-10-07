import { useState } from "react"
import { ImageField } from "./AdminControls"
import { useI18n } from "../../data/i18n"

export default function Branding({ initial, onSave }) {
  const { tx } = useI18n()
  const [values, setValues] = useState({ logo: initial.logo || "", favicon: initial.favicon || "" })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  async function save(event) {
    event.preventDefault()
    setBusy(true)
    setError("")
    try { await onSave(values) } catch (failure) { setError(failure.message) } finally { setBusy(false) }
  }
  return <form onSubmit={save} className="max-w-[760px]">
    <div className="mb-6 flex justify-end"><button disabled={busy} className="min-h-[42px] rounded-md bg-[#d52c63] px-5 py-2 text-sm font-semibold text-white">{tx(busy ? "Saving..." : "Save changes")}</button></div>
    {error && <p role="alert" className="mb-4 text-red-700">{tx(error)}</p>}
    <fieldset disabled={busy} className="grid min-w-0 gap-8 sm:grid-cols-2">{[["logo", "Website logo"], ["favicon", "Browser icon"]].map(([key, title]) => <section key={key} className="min-w-0">
      <h2 className="mb-4 text-[18px] font-semibold">{tx(title)}</h2>
      <div className="flex h-32 items-center justify-center border-y border-[#e5e7eb] bg-white">{values[key] ? <img src={values[key]} alt={tx(title)} className={key === "favicon" ? "size-12 object-contain" : "max-h-20 max-w-full object-contain"} /> : key === "favicon" ? <img src="/favicon.svg" alt={tx(title)} className="size-12" /> : <span className="text-2xl font-extrabold text-[#d52c63]">{initial.brand}</span>}</div>
      <ImageField folder="website" value={values[key]} onChange={(value) => setValues((current) => ({ ...current, [key]: value }))} hint="Transparent PNG or WebP. SVG supported through an HTTPS image URL." />
    </section>)}</fieldset>
  </form>
}
