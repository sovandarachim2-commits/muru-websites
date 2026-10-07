import { useEffect, useRef, useState } from "react"
import ProductArt from "../../components/ProductArt"
import PhotoPreview from "../../components/PhotoPreview"
import { IconArrow, IconClose } from "../../components/Icons"
import { cmsRequest } from "../../data/cms"
import { settings as siteDefaults } from "../../data/site"
import { translate, useI18n } from "../../data/i18n"

export function ErrorCard({ message, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    dialog.showModal()
    return () => { if (dialog.open) dialog.close() }
  }, [])
  if (!message) return null
  return (
    <dialog
      ref={ref}
      role="alertdialog"
      aria-labelledby="admin-error-title"
      aria-describedby="admin-error-message"
      className="m-auto w-[min(420px,calc(100%_-_32px))] rounded-2xl border border-[#f3d0d4] bg-white p-6 text-[#24252a] shadow-xl backdrop:bg-[#18181b66]"
      onCancel={(event) => { event.preventDefault(); onClose() }}
    >
      <p className="text-xs font-bold tracking-[0.16em] text-[#b72d3c]">ERROR</p>
      <h2 id="admin-error-title" className="mt-2 text-xl font-semibold">Something went wrong</h2>
      <p id="admin-error-message" className="mt-3 text-sm leading-6 text-[#50525b]">{message}</p>
      <button type="button" className="mt-6 inline-flex min-h-[42px] items-center justify-center rounded-md bg-[#d52c63] px-5 text-sm font-semibold text-white" onClick={onClose}>OK</button>
    </dialog>
  )
}

export function newId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID()
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function categoryRecord(item = {}) {
  const title = typeof item.title === "string" ? item.title : ""
  return {
    key: item.key || newId(),
    originalTitle: typeof item.originalTitle === "string" ? item.originalTitle : title,
    title,
    text: typeof item.text === "string" ? item.text : "",
    image: typeof item.image === "string" ? item.image : "",
    variant: typeof item.variant === "string" && item.variant ? item.variant : "pump",
    tone: typeof item.tone === "string" && item.tone ? item.tone : "pink",
  }
}

const primary = "min-h-[42px] rounded-md bg-[#d52c63] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
const fields = "grid min-w-0 gap-4 [&_label]:grid [&_label]:min-w-0 [&_label]:gap-2 [&_label]:text-[13px]"

const imageHints = {
  products: "Recommended size: 1000 × 1000 px (square). JPG, PNG, or WebP. Larger photos are compressed automatically.",
  categories: "Recommended size: 800 × 800 px (square). JPG, PNG, or WebP. Larger photos are compressed automatically.",
  website: "Recommended size: 1600 × 900 px. JPG, PNG, or WebP. Larger photos are compressed automatically.",
  profiles: "Recommended size: 400 × 400 px (square). JPG, PNG, or WebP. Larger photos are compressed automatically.",
}

const maxUploadBytes = 2 * 1024 * 1024

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error("The image could not be read."))
    reader.readAsDataURL(file)
  })
}

function canvasBlob(canvas, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality))
}

export async function prepareImageUpload(file) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Choose a JPG, PNG or WebP image.")
  if (file.size <= maxUploadBytes) return readFile(file)
  if (file.size > 25 * 1024 * 1024) throw new Error("Choose an image under 25 MB.")
  const bitmap = await createImageBitmap(file)
  try {
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d", { alpha: false })
    if (!context) throw new Error("The image could not be read.")
    let width = bitmap.width
    let height = bitmap.height
    const fitted = Math.min(1, 2560 / Math.max(width, height))
    width = Math.max(1, Math.round(width * fitted))
    height = Math.max(1, Math.round(height * fitted))
    let quality = 0.85
    let blob = null
    for (let attempt = 0; attempt < 8; attempt += 1) {
      canvas.width = width
      canvas.height = height
      context.fillStyle = "#ffffff"
      context.fillRect(0, 0, width, height)
      context.drawImage(bitmap, 0, 0, width, height)
      blob = await canvasBlob(canvas, quality)
      if (blob && blob.size <= maxUploadBytes) return readFile(blob)
      if (quality > 0.5) quality = Math.round((quality - 0.1) * 10) / 10
      else {
        width = Math.max(1, Math.round(width * 0.85))
        height = Math.max(1, Math.round(height * 0.85))
      }
    }
    throw new Error("The image is still too large after compression.")
  } finally {
    bitmap.close()
  }
}

export function ImageField({ value = "", onChange, onUpload, onBlur, folder = "products", hint }) {
  const { tx } = useI18n()
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)
  async function upload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      setError("")
      const data = await prepareImageUpload(file)
      const result = await cmsRequest("upload", { image: data, folder }, 60000)
      if (onUpload) onUpload(result.url)
      else onChange(result.url)
    } catch (failure) { setError(failure.message || "The image could not be uploaded.") }
    finally { setUploading(false); event.target.value = "" }
  }
  return <div className={`${fields} mt-4`}>
    <label>{tx("Photo")}<input type="file" disabled={uploading} accept="image/jpeg,image/png,image/webp" onChange={upload} className="w-full min-w-0 max-w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-[#f1f2f5] file:px-3 file:py-2" /></label>
    <p className="text-[12px] leading-5 text-[#777a83]">{tx(hint || imageHints[folder] || imageHints.products)}</p>
    {uploading && <p role="status" className="text-sm">{tx("Uploading...")}</p>}
    <label>{tx("Image URL")}<input className="min-w-0 max-w-full" value={value.startsWith("data:") ? "" : value} placeholder={value.startsWith("data:") ? "Uploaded photo selected" : "https://..."} onChange={(event) => onChange(event.target.value)} onBlur={(event) => onBlur?.(event.target.value)} /></label>
    {value && <button type="button" className="justify-self-start text-[13px] text-[#c5295b]" onClick={() => onChange("")}>{tx("Remove photo")}</button>}
    {error && <ErrorCard message={tx(error)} onClose={() => setError("")} />}
  </div>
}

export function CategoryManager({ categories, products, onSave }) {
  const catalog = Array.isArray(products) ? products : []
  const [items, setItems] = useState(() => (Array.isArray(categories) ? categories : []).map((item) => categoryRecord(item)))
  const [editor, setEditor] = useState(null)
  const [query, setQuery] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [removing, setRemoving] = useState(null)
  async function persist(next, nextProducts = catalog) {
    const names = next.map((item) => item.title.trim().toLowerCase())
    if (!names.length || new Set(names).size !== names.length || names.some((name) => !name || ["all products", "new arrivals"].includes(name))) {
      setError(names.length ? "Use unique category names. All Products and New Arrivals are reserved." : "Keep at least one category.")
      return false
    }
    setBusy(true)
    setError("")
    try {
      await onSave(next.map(({ title, text, image, variant, tone }) => ({ title: title.trim(), text, image, variant, tone })), nextProducts.map((product) => ({ ...product, category: next.find((item) => item.originalTitle === product.category || item.title.trim() === product.category)?.title.trim() || product.category })))
      setItems(next.map((item) => ({ ...item, title: item.title.trim(), originalTitle: item.title.trim() })))
      return true
    } catch (failure) { setError(failure.message); return false }
    finally { setBusy(false) }
  }
  async function removeCategory() {
    const fallback = items.find((entry) => entry.key !== removing.key)
    if (!fallback) { setError("Keep at least one category."); setRemoving(null); return }
    const next = items.filter((entry) => entry.key !== removing.key)
    const nextProducts = catalog.map((product) => product.category === removing.originalTitle ? { ...product, category: fallback.title.trim() } : product)
    if (await persist(next, nextProducts)) setRemoving(null)
  }
  async function save(event) {
    event.preventDefault()
    const next = items.some((item) => item.key === editor.key) ? items.map((item) => item.key === editor.key ? editor : item) : [...items, editor]
    if (await persist(next)) setEditor(null)
  }
  function move(index, offset) {
    const next = [...items]
    ;[next[index], next[index + offset]] = [next[index + offset], next[index]]
    persist(next)
  }
  function edit(item) { setError(""); setEditor({ ...item }) }
  const visible = items.filter((item) => `${item.title} ${item.text}`.toLowerCase().includes(query.toLowerCase()))
  const moved = removing ? catalog.filter((product) => product.category === removing.originalTitle).length : 0
  const fallbackTitle = removing ? items.find((entry) => entry.key !== removing.key)?.title : ""
  return <section className="max-w-[1100px]">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Product categories <span className="ml-2 text-sm font-normal text-[#777a83]">{items.length}</span></h2><button type="button" className={primary} disabled={busy || Boolean(editor)} onClick={() => edit(categoryRecord())}>+ Add category</button></div>
    <div className="mb-4 max-w-[360px]"><input aria-label="Search categories" placeholder="Search categories" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
    {error && <ErrorCard message={error} onClose={() => setError("")} />}
    <div className="overflow-hidden rounded-md border border-[#e5e7eb] bg-white">
      <div className="hidden grid-cols-[36px_minmax(0,1fr)_90px_180px] gap-4 border-b border-[#e5e7eb] bg-[#fafbfc] px-4 py-3 text-xs font-medium text-[#777a83] sm:grid"><span>No</span><span>Category</span><span>Products</span><span className="text-right">Actions</span></div>
      <ul className="divide-y divide-[#edf0f2]">{visible.map((item, rowIndex) => {
        const index = items.findIndex((entry) => entry.key === item.key)
        const count = catalog.filter((product) => product && product.category === item.originalTitle).length
        return <li key={item.key} className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[36px_minmax(0,1fr)_90px_180px] sm:gap-4">
          <span className="text-xs text-[#777a83]">{rowIndex + 1}</span>
          <div className="flex min-w-0 items-center gap-3"><div className="h-14 w-12 shrink-0 overflow-hidden rounded bg-[#fff5f8]"><ProductArt variant={item.variant} tone={item.tone} image={item.image} alt={item.title || "Category"} /></div><div className="min-w-0"><strong className="block break-words text-sm font-semibold">{item.title}</strong><p className="mt-1 truncate text-xs text-[#777a83]">{item.text || "-"}</p><span className="mt-1 block text-xs text-[#777a83] sm:hidden">{count} products</span></div></div>
          <span className="hidden text-sm text-[#50525b] sm:block">{count}</span>
          <div className="flex items-center justify-end gap-1">
            <button type="button" disabled={busy || Boolean(editor) || index === 0 || Boolean(query)} title="Move up" aria-label={`Move ${item.title} up`} className="grid size-8 shrink-0 place-items-center rounded hover:bg-[#f1f2f5]" onClick={() => move(index, -1)}><IconArrow className="size-4 -rotate-90" /></button>
            <button type="button" disabled={busy || Boolean(editor) || index === items.length - 1 || Boolean(query)} title="Move down" aria-label={`Move ${item.title} down`} className="grid size-8 shrink-0 place-items-center rounded hover:bg-[#f1f2f5]" onClick={() => move(index, 1)}><IconArrow className="size-4 rotate-90" /></button>
            <button type="button" disabled={busy || Boolean(editor)} className="px-2 py-2 text-xs font-medium text-[#50525b]" onClick={() => edit(item)}>Edit</button>
            <button type="button" disabled={busy || Boolean(editor)} className="px-2 py-2 text-xs text-[#bf4351]" onClick={() => { setError(""); setRemoving(item) }}>Delete</button>
          </div>
        </li>
      })}</ul>
      {!visible.length && <p className="px-4 py-10 text-center text-sm text-[#777a83]">{items.length ? "No matching categories." : "No categories yet."}</p>}
    </div>
    {removing && <AdminFormDialog title="Delete category?" busy={busy} onClose={() => { if (!busy) setRemoving(null) }}>
      <p className="text-sm leading-6">{removing.title} will be removed.{moved ? ` ${moved} product${moved === 1 ? "" : "s"} will move to ${fallbackTitle || "another category"}.` : ""}</p>
      <div className="mt-5 flex justify-end gap-3"><button type="button" disabled={busy} className="rounded-md border border-[#dcdfe4] px-4 py-2 text-sm" onClick={() => setRemoving(null)}>Cancel</button><button type="button" className="rounded-md bg-[#c73542] px-4 py-2 text-sm font-semibold text-white" disabled={busy} onClick={removeCategory}>{busy ? "Deleting..." : "Delete category"}</button></div>
    </AdminFormDialog>}
    {editor && <AdminFormDialog title={editor.originalTitle ? "Edit category" : "New category"} busy={busy} onClose={() => { setEditor(null); setError("") }}><form onSubmit={save}>
      <fieldset disabled={busy} className="grid items-start gap-5 min-[601px]:grid-cols-[140px_minmax(0,1fr)]">
        <PhotoPreview src={editor.image} alt={editor.title || "Category preview"} className="mx-auto h-40 w-[140px] overflow-hidden rounded-md bg-[#fff5f8]"><ProductArt variant={editor.variant} tone={editor.tone} image={editor.image} alt={editor.title || "Category preview"} /></PhotoPreview>
        <div className={fields}><label>Name<input autoFocus required maxLength={80} value={editor.title} onChange={(event) => setEditor({ ...editor, title: event.target.value })} /></label><label>Description<input maxLength={600} value={editor.text} onChange={(event) => setEditor({ ...editor, text: event.target.value })} /></label><ImageField folder="categories" value={editor.image} onChange={(image) => setEditor((current) => current ? { ...current, image } : current)} /></div>
      </fieldset>
      <div className="mt-5 flex justify-end gap-3"><button type="button" disabled={busy} className="rounded-md border border-[#dcdfe4] px-4 py-2 text-sm" onClick={() => { setEditor(null); setError("") }}>Cancel</button><button className={primary} disabled={busy}>{busy ? "Saving..." : "Save category"}</button></div>
    </form></AdminFormDialog>}
  </section>
}

export function AdminFormDialog({ title, busy, onClose, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    const previous = document.activeElement
    dialog.showModal()
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      dialog.close()
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [])
  return <dialog ref={ref} aria-label={title} className="m-auto max-h-[calc(100svh_-_32px)] w-[min(680px,calc(100%_-_32px))] overflow-auto rounded-lg border border-[#e5e7eb] bg-white p-5 text-[#24252a] shadow-xl backdrop:bg-[#18181b70] sm:p-6" onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}>
    <div className="mb-6 flex items-center justify-between gap-4"><h2 className="text-xl font-semibold">{title}</h2><button type="button" disabled={busy} aria-label="Close dialog" title="Close" className="grid size-9 shrink-0 place-items-center rounded hover:bg-[#f1f2f5]" onClick={onClose}><IconClose className="size-5" /></button></div>
    {children}
  </dialog>
}

const sections = [
  { title: "Brand & appearance", fields: [["brand", "Brand name"], ["tagline", "Footer tagline"]] },
  { title: "Homepage hero", fields: [["heroEyebrow", "Label"], ["heroTitle", "Headline"], ["heroAccent", "Highlighted headline"], ["heroDescription", "Description", "textarea"], ["heroButton", "Button text"]], image: "heroImage", fallback: "/images/hero.jpg", previewClass: "aspect-video w-full rounded-[28px] object-cover object-[68%_18%]", imageHint: "Same 16:9 crop as the homepage hero. Recommended size: 1600 × 900 px. JPG, PNG, or WebP. Larger photos are compressed automatically." },
  { title: "Product catalog", fields: [["catalogTitle", "Heading"], ["catalogDescription", "Description", "textarea"]] },
  { title: "Brand story", fields: [["storyTitle", "Heading"], ["storyDescription", "Description", "textarea"]], image: "storyImage", fallback: "/images/banner.jpg", previewClass: "aspect-[3/4] w-full rounded-[32px] object-cover", imageHint: "Same 3:4 crop as the homepage story photos. Recommended size: 900 × 1200 px. JPG, PNG, or WebP. Larger photos are compressed automatically." },
  { title: "Ingredient story", fields: [["ingredientEyebrow", "Label"], ["ingredientTitle", "Heading"], ["ingredientDescription", "Description", "textarea"], ["ingredientButton", "Button text"], ["ingredientPoint1Title", "Point 1 heading"], ["ingredientPoint1Text", "Point 1 text"], ["ingredientPoint2Title", "Point 2 heading"], ["ingredientPoint2Text", "Point 2 text"], ["ingredientPoint3Title", "Point 3 heading"], ["ingredientPoint3Text", "Point 3 text"]], image: "ingredientImage", fallback: "/images/ingredient.jpg", previewClass: "aspect-[4/3] w-full rounded-[32px] object-cover", imageHint: "Same 4:3 crop as the homepage ingredient photo. Recommended size: 1200 × 900 px. JPG, PNG, or WebP. Larger photos are compressed automatically." },
  { title: "Promotion", fields: [["promotionTitle", "Heading"], ["promotionDescription", "Description", "textarea"]], gallery: true, imageHint: "Each photo is shown full size on the homepage, in the order below. Add up to 12. Recommended size: 1600 × 900 px. JPG, PNG, or WebP. Larger photos are compressed automatically." },
  { title: "Contact section", fields: [["contactTitle", "Heading"], ["contactDescription", "Description", "textarea"]] },
]

const textKeys = sections.flatMap((item) => item.fields.map(([key]) => key))

function PromotionImages({ images, onChange, hint, draftRef }) {
  const { tx } = useI18n()
  const [draft, setDraft] = useState("")
  if (draftRef) draftRef.current = draft
  function add(image) {
    const next = typeof image === "string" ? image.trim() : ""
    if (!next || images.includes(next) || images.length >= 12) return
    onChange([...images, next])
    setDraft("")
  }
  function move(index, direction) {
    const destination = index + direction
    if (destination < 0 || destination >= images.length) return
    const next = [...images]
    ;[next[index], next[destination]] = [next[destination], next[index]]
    onChange(next)
  }
  function commitDraft(image) {
    try {
      if (new URL(image).protocol === "https:") add(image)
    } catch { /* keep the address until it is a full HTTPS URL */ }
  }
  return <div className="grid gap-4">
    {images.map((image, index) => <div key={`${index}-${image.slice(0, 80)}`} className="overflow-hidden rounded-[28px] border border-[#e5e7eb] bg-white">
      <img src={image} alt="" className="block h-auto w-full" />
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="text-[13px] font-medium">{tx("Photo")} {index + 1}</span>
        <div className="flex items-center gap-1">
          <button type="button" disabled={index === 0} title={tx("Move earlier")} aria-label={tx("Move earlier")} className="grid size-8 place-items-center rounded hover:bg-[#f1f2f5] disabled:opacity-30" onClick={() => move(index, -1)}><IconArrow className="size-4 -rotate-90" /></button>
          <button type="button" disabled={index === images.length - 1} title={tx("Move later")} aria-label={tx("Move later")} className="grid size-8 place-items-center rounded hover:bg-[#f1f2f5] disabled:opacity-30" onClick={() => move(index, 1)}><IconArrow className="size-4 rotate-90" /></button>
          <button type="button" className="px-2 py-1 text-[13px] text-[#c5295b]" onClick={() => onChange(images.filter((_, item) => item !== index))}>{tx("Remove")}</button>
        </div>
      </div>
    </div>)}
    {images.length < 12 ? <>
      <h3 className="text-[14px] font-semibold">{tx("Add image")}</h3>
      <ImageField folder="website" hint={hint} value={draft} onChange={setDraft} onBlur={commitDraft} onUpload={add} />
      {draft.startsWith("https://") && <button type="button" className="justify-self-start text-[13px] font-semibold text-[#c5295b]" onClick={() => commitDraft(draft)}>{tx("Add image")}</button>}
    </> : <p className="text-[13px] text-[#777a83]">{tx("You can add up to 12 photos.")}</p>}
  </div>
}

function khmerValue(values, key) {
  if (values.km && Object.prototype.hasOwnProperty.call(values.km, key)) return values.km[key]
  const auto = translate("km", values[key] || "")
  return auto === (values[key] || "") ? "" : auto
}

export function WebsiteEditor({ initial, onSave, canEditWebsite = true, contactForm }) {
  const { tx } = useI18n()
  const [values, setValues] = useState(() => {
    const seeded = { ...initial, km: { ...(initial.km || {}) } }
    for (const key of ["ingredientEyebrow", "ingredientTitle", "ingredientDescription", "ingredientButton", "ingredientPoint1Title", "ingredientPoint1Text", "ingredientPoint2Title", "ingredientPoint2Text", "ingredientPoint3Title", "ingredientPoint3Text"]) {
      if (typeof seeded[key] !== "string") seeded[key] = siteDefaults[key]
    }
    if (!Array.isArray(seeded.promotionImages)) seeded.promotionImages = seeded.promotionImage ? [seeded.promotionImage] : []
    else seeded.promotionImages = seeded.promotionImages.filter((item) => typeof item === "string" && item)
    return seeded
  })
  const [section, setSection] = useState(canEditWebsite ? 0 : sections.length)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const promotionDraft = useRef("")
  const menu = [...(canEditWebsite ? sections.map((item, index) => ({ ...item, index })) : []), ...(contactForm ? [{ title: "Contact & social links", index: sections.length }] : [])]
  const current = sections[section]
  function update(key, value) { setValues({ ...values, [key]: value }) }
  function setPromotionImages(promotionImages) {
    setValues((current) => ({ ...current, promotionImages, promotionImage: promotionImages[0] || "" }))
  }
  function updateKhmer(key, value) { setValues({ ...values, km: { ...values.km, [key]: value } }) }
  async function save(event) {
    event.preventDefault()
    setBusy(true)
    setError("")
    const km = Object.fromEntries(textKeys.map((key) => [key, khmerValue(values, key)]))
    const promotionImages = Array.isArray(values.promotionImages) ? [...values.promotionImages] : []
    const pending = promotionDraft.current.trim()
    try {
      if (pending && new URL(pending).protocol === "https:" && !promotionImages.includes(pending) && promotionImages.length < 12) promotionImages.push(pending)
    } catch { /* an unfinished address stays out of the saved list */ }
    const next = { ...values, km, promotionImages, promotionImage: promotionImages[0] || "" }
    setValues(next)
    try { await onSave(next) } catch (failure) { setError(failure.message) }
    finally { setBusy(false) }
  }
  function englishField(key, label, type) {
    return <label>{tx(label)} ({tx("English")}){type === "textarea" ? <textarea lang="en" rows={4} maxLength={2000} value={values[key]} onChange={(event) => update(key, event.target.value)} /> : <input lang="en" required maxLength={key === "brand" ? 24 : 160} value={values[key]} onChange={(event) => update(key, event.target.value)} />}</label>
  }
  return <div className="grid gap-8 min-[761px]:grid-cols-[190px_minmax(0,1fr)]"><div role="tablist" aria-label={tx("Website sections")} className="flex gap-2 overflow-auto min-[761px]:flex-col">{menu.map((item) => <button key={item.title} role="tab" aria-selected={item.index === section} className={`shrink-0 rounded-md p-3 text-left text-[13px] ${item.index === section ? "bg-[#fff0f5] font-semibold text-[#b52958]" : ""}`} onClick={() => setSection(item.index)}>{tx(item.title)}</button>)}</div>
    {section === sections.length ? contactForm : <form onSubmit={save} className="max-w-[920px]"><h2 className="mb-6 text-lg font-semibold">{tx(current.title)}</h2><fieldset disabled={busy} className={fields}>
      {current.gallery && <PromotionImages images={values.promotionImages} hint={current.imageHint} draftRef={promotionDraft} onChange={setPromotionImages} />}
      {current.image && <><PhotoPreview src={values[current.image] || current.fallback} alt={current.title} className="block w-full"><img className={current.previewClass} src={values[current.image] || current.fallback} alt={current.title} /></PhotoPreview><ImageField folder="website" hint={current.imageHint} value={values[current.image]} onChange={(image) => update(current.image, image)} /></>}
      {current.image === "storyImage" && <><h3 className="text-[14px] font-semibold">{tx("Second image")}</h3><PhotoPreview src={values.storySecondImage || "/images/cluster.jpg"} alt={tx("Second image")} className="block w-full"><img className={current.previewClass} src={values.storySecondImage || "/images/cluster.jpg"} alt={tx("Second image")} /></PhotoPreview><ImageField folder="website" hint={current.imageHint} value={values.storySecondImage || ""} onChange={(image) => update("storySecondImage", image)} /></>}
      {current.fields.map(([key, label, type]) => <div key={key} className="grid gap-3 min-[601px]:grid-cols-2">{englishField(key, label, type)}<label>{tx(label)} ({tx("Khmer")}){type === "textarea" ? <textarea lang="km" rows={4} maxLength={2000} value={khmerValue(values, key)} onChange={(event) => updateKhmer(key, event.target.value)} /> : <input lang="km" maxLength={2000} value={khmerValue(values, key)} onChange={(event) => updateKhmer(key, event.target.value)} />}</label></div>)}
      {section === 0 && <><label>{tx("Accent color")}<input type="color" className="h-10 w-16" value={values.accentColor} onChange={(event) => update("accentColor", event.target.value)} /></label><label>{tx("Body font")}<select value={values.bodyFont} onChange={(event) => update("bodyFont", event.target.value)}>{["DM Sans", "Manrope", "system-ui"].map((font) => <option key={font}>{font}</option>)}</select></label><div className="flex flex-wrap gap-4 [&_label]:flex [&_label]:items-center">{[["showPromotion", "Show promotion"], ["showReviews", "Show customer reviews"]].map(([key, label]) => <label key={key}><input type="checkbox" checked={values[key]} onChange={(event) => update(key, event.target.checked)} />{tx(label)}</label>)}</div></>}
    </fieldset>{error && <ErrorCard message={tx(error)} onClose={() => setError("")} />}<button disabled={busy} className={`${primary} mt-5`}>{tx(busy ? "Saving..." : "Save website")}</button></form>}
  </div>
}

export function AccountSettings() {
  const { tx } = useI18n()
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const [visible, setVisible] = useState(false)
  async function save(event) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setError("")
    setMessage("")
    if (data.get("password") !== data.get("confirm")) { setError("New passwords do not match."); return }
    setBusy(true)
    try { await cmsRequest("password", { currentPassword: data.get("currentPassword"), password: data.get("password") }); form.reset(); setVisible(false); setMessage("Password updated.") }
    catch (failure) { setError(failure.message) }
    finally { setBusy(false) }
  }
  return <form onSubmit={save} className="mt-8 border-t border-[#e5e7eb] pt-6">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold">{tx("Change password")}</h2>
      <button type="button" className="text-[13px] font-medium text-[#777a83]" onClick={() => setVisible((current) => !current)}>{visible ? tx("Hide password") : tx("Show password")}</button>
    </div>
    <fieldset disabled={busy} className={fields}>
      <label>{tx("Current password")}<input name="currentPassword" type={visible ? "text" : "password"} autoComplete="current-password" required /></label>
      <label>{tx("New password")}<input name="password" type={visible ? "text" : "password"} minLength={8} maxLength={256} autoComplete="new-password" required /></label>
      <label>{tx("Confirm password")}<input name="confirm" type={visible ? "text" : "password"} minLength={8} maxLength={256} autoComplete="new-password" required /></label>
    </fieldset>
    <p className="mt-2 text-[12px] text-[#777a83]">{tx("At least 8 characters.")}</p>
    {error && <ErrorCard message={tx(error)} onClose={() => setError("")} />}
    {message && <p role="status" className="mt-4 text-green-700">{tx(message)}</p>}
    <button disabled={busy} className={`${primary} mt-4`}>{busy ? tx("Saving...") : tx("Update password")}</button>
  </form>
}

export function ProfileSettings({ session, onSaved }) {
  const { tx } = useI18n()
  const fileRef = useRef(null)
  const [values, setValues] = useState({ name: session.name || "", username: session.username || "", image: session.image || "" })
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const initial = (session.name || session.email || "A").charAt(0).toUpperCase()
  async function upload(event) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    try {
      setUploading(true)
      setError("")
      const data = await prepareImageUpload(file)
      const result = await cmsRequest("upload", { image: data, folder: "profiles" }, 60000)
      setValues((current) => ({ ...current, image: result.url }))
    } catch (failure) { setError(failure.message || "The image could not be uploaded.") }
    finally { setUploading(false) }
  }
  async function save(event) {
    event.preventDefault()
    setBusy(true)
    setError("")
    setMessage("")
    try {
      await cmsRequest("profile", values)
      await onSaved()
      setMessage(tx("Profile updated."))
    } catch (failure) { setError(failure.message) }
    finally { setBusy(false) }
  }
  return <section>
    <div className="flex items-center gap-4">
      <button type="button" className="relative shrink-0 rounded-full" aria-label={tx("Change photo")} disabled={uploading} onClick={() => fileRef.current?.click()}>
        {values.image ? <PhotoPreview src={values.image} alt="" className="size-16"><img src={values.image} alt="" className="size-16 rounded-full object-cover" /></PhotoPreview> : <span className="grid size-16 place-items-center rounded-full bg-[#fff0f5] text-xl font-semibold text-[#b52958]">{initial}</span>}
      </button>
      <div className="min-w-0">
        <h2 className="break-words text-lg font-semibold">{values.name || tx("Admin")}</h2>
        <p className="mt-0.5 break-words text-sm text-[#777a83]">{session.email}</p>
        <p className="mt-2 inline-flex rounded-full bg-[#fff0f5] px-2.5 py-0.5 text-[11px] font-semibold text-[#b52958]">{session.role === "owner" ? tx("Owner") : tx("Team member")}</p>
      </div>
    </div>
    <form onSubmit={save} className="mt-6">
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={upload} />
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="inline-flex min-h-9 items-center rounded-md border border-[#dcdfe4] bg-white px-3 text-[13px] font-medium" disabled={uploading || busy} onClick={() => fileRef.current?.click()}>{uploading ? tx("Uploading...") : tx("Change photo")}</button>
        {values.image && <button type="button" className="text-[13px] font-medium text-[#c5295b]" disabled={uploading || busy} onClick={() => setValues((current) => ({ ...current, image: "" }))}>{tx("Remove photo")}</button>}
      </div>
      <p className="mt-2 text-[12px] leading-5 text-[#777a83]">{tx(imageHints.profiles)}</p>
      <fieldset disabled={busy || uploading} className={`${fields} mt-5`}>
        <label>{tx("Display name")}<input maxLength={80} value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} /></label>
        <label>{tx("Username")}<input required minLength={3} maxLength={40} pattern="[a-zA-Z0-9][a-zA-Z0-9._-]{2,39}" value={values.username} onChange={(event) => setValues((current) => ({ ...current, username: event.target.value }))} /></label>
        <label>{tx("Email")}<input value={session.email || ""} disabled readOnly /></label>
      </fieldset>
      {error && <ErrorCard message={tx(error)} onClose={() => setError("")} />}
      {message && <p role="status" className="mt-4 text-green-700">{message}</p>}
      <button disabled={busy || uploading} className={`${primary} mt-5`}>{busy ? tx("Saving...") : tx("Save profile")}</button>
    </form>
  </section>
}
