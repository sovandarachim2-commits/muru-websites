import { useEffect, useRef, useState } from "react"
import { defaultCmsState, normalizeSocial } from "../../data/site"
import { cmsRequest, setCsrf } from "../../data/cms"
import { AccountSettings, CategoryManager, ErrorCard, ImageField, ProfileSettings, WebsiteEditor, newId } from "./AdminControls"
import ProductArt from "../../components/ProductArt"
import PhotoPreview from "../../components/PhotoPreview"
import UserManagement from "./UserManagement"
import ProductOptions, { optionDefaults, optionLabel } from "./ProductOptions"
import Branding from "./Branding"
import { IconArrow, IconClose, IconEye, IconEyeOff, IconImage, IconMenu, IconSearch } from "../../components/Icons"
import { LanguageSwitch, useI18n } from "../../data/i18n"

const emptyProduct = { title: "", slug: "", category: "Skincare", type: "", benefit: "", price: "", variant: "pump", tone: "pink", image: "", images: [], size: "", skinType: "", ingredients: "", howToUse: "", story: "", status: "draft", isNew: false, bestSeller: false }

const contactFields = [
  ["phone", "Phone", "tel", "+855 12 345 678"],
  ["email", "Email", "email", "info@muru.com"],
  ["address", "Address", "text", "Phnom Penh, Cambodia"],
  ["telegramContact", "Telegram contact", "url", "https://t.me/your_username"],
]
const socialFields = [
  ["facebook", "Facebook", "url", "https://facebook.com/"],
  ["instagram", "Instagram", "url", "https://instagram.com/"],
  ["tiktok", "TikTok", "url", "https://www.tiktok.com/"],
  ["telegram", "Telegram", "url", "https://t.me/"],
]

function ContactLinksForm({ links, setLinks, onSubmit }) {
  const { tx } = useI18n()
  function field(key, label, type, placeholder) {
    return (
      <label key={key}>
        {tx(label)}
        <input type={type} inputMode={key === "phone" ? "tel" : undefined} placeholder={placeholder} value={links[key] || ""} onChange={(event) => setLinks({ ...links, [key]: event.target.value })} />
      </label>
    )
  }
  return (
    <form className="max-w-[600px] [&_h2]:mb-2 [&_h2]:text-[18px] [&_h2]:font-semibold [&_h3]:mt-8 [&_h3]:mb-4 [&_h3]:text-[15px] [&_h3]:font-semibold [&_label]:grid [&_label]:gap-2 [&_label]:text-[13px] [&_label]:font-medium [&_label]:text-[#50525b] [&_label]:mb-5 [&>button]:mt-5" onSubmit={onSubmit}>
      <h2>{tx("Contact & social links")}</h2>
      <p className="mb-6 text-[13px] text-[#777a83]">{tx("Same details shown in the website footer.")}</p>
      <h3>{tx("Contact")}</h3>
      {contactFields.map((item) => field(...item))}
      <h3>{tx("Social links")}</h3>
      {socialFields.map((item) => field(...item))}
      <button className="inline-flex min-h-[42px] items-center justify-center rounded-md px-[18px] py-2.5 text-[14px] font-semibold bg-[#d52c63] text-white hover:bg-[#b92153]">{tx("Save changes")}</button>
    </form>
  )
}

function PasswordField({ label, minLength, autoComplete }) {
  const { tx } = useI18n()
  const [visible, setVisible] = useState(false)
  return (
    <label>
      {label}
      <span className="relative block">
        <input name="password" type={visible ? "text" : "password"} minLength={minLength} maxLength={256} autoComplete={autoComplete} required className="!pr-12" />
        <button type="button" className="absolute top-1/2 right-3 grid h-8 w-8 -translate-y-1/2 place-items-center text-[#777a83]" aria-label={visible ? tx("Hide password") : tx("Show password")} onClick={() => setVisible((current) => !current)}>
          {visible ? <IconEyeOff className="h-5 w-5" /> : <IconEye className="h-5 w-5" />}
        </button>
      </span>
    </label>
  )
}

export default function Admin() {
  const { lang, setLang, tx } = useI18n()
  const [session, setSession] = useState(null)
  const [serverState, setServerState] = useState(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const revision = useRef(0)
  const stateRef = useRef(null)
  const saving = useRef(false)

  async function refresh() {
    try {
      const current = await cmsRequest("session")
      setCsrf(current.csrf)
      if (current.authenticated) {
        const data = await cmsRequest("admin")
        revision.current = data.revision
        stateRef.current = data.state
        setServerState(data.state)
      }
      setSession(current)
      setError("")
    } catch (failure) { setError(failure.message) }
  }

  useEffect(() => {
    let cancelled = false
    cmsRequest("session").then(async (current) => {
      if (cancelled) return
      setCsrf(current.csrf)
      if (current.authenticated) {
        const data = await cmsRequest("admin")
        if (cancelled) return
        revision.current = data.revision
        stateRef.current = data.state
        setServerState(data.state)
      }
      setSession(current)
    }).catch((failure) => { if (!cancelled) setError(failure.message) })
    return () => { cancelled = true }
  }, [])

  async function authenticate(event) {
    event.preventDefault()
    setBusy(true)
    setError("")
    const fields = new FormData(event.currentTarget)
    try {
      await cmsRequest(session.setupRequired ? "setup" : "login", { email: fields.get("email"), ...(session.setupRequired ? { username: fields.get("username") } : {}), password: fields.get("password"), ...(session.setupRequired ? { state: defaultCmsState() } : {}) })
      await refresh()
    } catch (failure) { setError(failure.message) }
    finally { setBusy(false) }
  }

  async function saveContent(changes) {
    const required = { products: "products", productOptions: "products", categories: "categories", settings: "website", social: "settings" }
    if (Object.keys(changes).some((key) => JSON.stringify(changes[key]) !== JSON.stringify(stateRef.current[key]) && !session.permissions.includes(required[key]))) throw new Error("Your role does not have permission to save these changes.")
    if (saving.current) throw new Error("A save is already in progress. Try again when it finishes.")
    saving.current = true
    try {
      const next = { ...stateRef.current, ...changes }
      const data = await cmsRequest("save", { state: next, revision: revision.current })
      revision.current = data.revision
      stateRef.current = data.state || next
      setServerState(stateRef.current)
      return stateRef.current
    } catch (failure) {
      if (failure.status === 401) { setSession({ ...session, authenticated: false }); setError("Your session expired. Sign in again.") }
      throw failure
    } finally { saving.current = false }
  }

  async function logout() {
    try { await cmsRequest("logout", {}); setCsrf(""); setServerState(null); setSession({ ...session, authenticated: false }) }
    catch (failure) {
      if (failure.status === 401) { setCsrf(""); setServerState(null); setSession({ ...session, authenticated: false }) }
      else setError(failure.message)
    }
  }

  if (session?.authenticated && serverState) return <AdminWorkspace serverState={serverState} saveContent={saveContent} logout={logout} refresh={refresh} sessionError={error} clearSessionError={() => setError("")} session={session} />
  return <main className="grid min-h-svh grid-cols-1 bg-white font-sans min-[761px]:grid-cols-2 [&_button]:cursor-pointer [&_button:disabled]:cursor-default [&_button:disabled]:opacity-50"><div className="hidden min-h-svh min-[761px]:block [&_img]:h-svh [&_img]:w-full [&_img]:object-cover"><img src="/images/cluster.jpg" alt="MURU beauty collection" /></div><div className="m-auto w-full max-w-[450px] self-center p-6 min-[481px]:p-10 [&>a:first-child]:block [&>a:first-child]:px-0 [&_h1]:mt-10 [&_h1]:mb-6 [&_h1]:text-[28px] [&_h1]:leading-[1.3] [&_h1]:font-semibold [&_form]:grid [&_form]:gap-[18px] [&_label]:grid [&_label]:gap-2 [&_label]:text-[14px] [&_input]:h-[46px] [&_input]:w-full [&_input]:rounded-md [&_input]:border [&_input]:border-[#dfe1e6] [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-[16px]"><a className="px-3 text-[30px] font-extrabold text-[#d52c63] [&>span]:mt-[3px] [&>span]:block [&>span]:text-[11px] [&>span]:font-semibold [&>span]:text-[#83858d]" href="/">MURU<span>{tx("ADMINISTRATION")}</span></a><div className="mt-8"><LanguageSwitch lang={lang} setLang={setLang} label={tx("Language")} /></div><h1>{session?.setupRequired ? "Create your admin account" : tx("Welcome back.")}</h1>{error && <ErrorCard message={error} onClose={() => setError("")} />}{!session ? <button className="inline-flex min-h-[42px] items-center justify-center rounded-md px-[18px] py-2.5 text-[14px] font-semibold border border-[#dcdfe4] bg-white text-[#454750]" onClick={refresh}>{error ? "Retry connection" : "Connecting..."}</button> : session.setupRequired && !session.setupAllowed ? <p>First-time account setup is available on the local server.</p> : <form onSubmit={authenticate}>{session.setupRequired && <label>Username<input name="username" required minLength={3} maxLength={40} pattern="[a-zA-Z0-9][a-zA-Z0-9._-]{2,39}" autoComplete="username" /></label>}<label>{session.setupRequired ? "Email" : "Email or username"}<input name="email" type={session.setupRequired ? "email" : "text"} autoComplete="username" required /></label><PasswordField label="Password" minLength={session.setupRequired ? 8 : undefined} autoComplete={session.setupRequired ? "new-password" : "current-password"} />{session.setupRequired && <p className="text-[13px] text-[#777a83]">Use at least 8 characters.</p>}<button className="inline-flex min-h-[42px] items-center justify-center rounded-md px-[18px] py-2.5 text-[14px] font-semibold bg-[#d52c63] text-white hover:bg-[#b92153]" disabled={busy}>{busy ? "Please wait..." : session.setupRequired ? "Create account" : "Sign in"}</button></form>}<a className="mt-7 inline-block text-[13px] text-[#777a83]" href="/">Back to website</a></div></main>
}

function adminTabFromLocation(allowed) {
  const name = decodeURIComponent(window.location.hash.replace(/^#/, ""))
  return allowed.includes(name) ? name : "Overview"
}

function rememberAdminTab(name) {
  const hash = `#${encodeURIComponent(name)}`
  if (window.location.hash === hash) return
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`)
}

function AdminWorkspace({ serverState, saveContent, logout, refresh, sessionError, clearSessionError, session }) {
  const { lang, setLang, tx } = useI18n()
  const permissions = session.permissions || []
  const tabs = ["Overview", "Products", ...(permissions.includes("products") ? ["Product Options"] : []), ...(permissions.includes("categories") ? ["Categories"] : []), ...(permissions.some((grant) => ["website", "settings"].includes(grant)) ? ["Website"] : []), ...(permissions.includes("users") ? ["Users"] : []), ...(permissions.includes("roles") ? ["Roles"] : [])]
  if (permissions.includes("website")) tabs.splice(tabs.indexOf("Website") + 1, 0, "Branding")
  const [tab, setTab] = useState(() => adminTabFromLocation(tabs))
  const [items, setItems] = useState(Array.isArray(serverState.products) ? serverState.products : [])
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All categories")
  const [status, setStatus] = useState("All statuses")
  const [editor, setEditor] = useState(null)
  const [imageEditor, setImageEditor] = useState(null)
  const [imageError, setImageError] = useState("")
  const [deleting, setDeleting] = useState(null)
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const [menu, setMenu] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [links, setLinks] = useState(() => normalizeSocial(serverState.social))
  const [saving, setSaving] = useState(false)
  const tabKey = tabs.join("|")
  function openTab(name) {
    setTab(name)
    setMenu(false)
    setError("")
    setNotice("")
    rememberAdminTab(name)
  }
  useEffect(() => {
    function syncTab() {
      setTab(adminTabFromLocation(tabKey.split("|")))
      setMenu(false)
    }
    window.addEventListener("hashchange", syncTab)
    return () => window.removeEventListener("hashchange", syncTab)
  }, [tabKey])
  const categoryList = Array.isArray(serverState.categories) ? serverState.categories : []
  const options = serverState.productOptions || optionDefaults()
  const categories = categoryList.map((item) => item.title)
  const published = items.filter((item) => item.status !== "draft")
  const visible = items.filter((item) =>
    `${item.title} ${item.type}`.toLowerCase().includes(query.toLowerCase()) &&
    (category === "All categories" || category === item.category) &&
    (status === "All statuses" || (item.status || "published") === status)
  )

  async function persist(next, message) {
    setSaving(true)
    try {
      const saved = await saveContent({ products: next })
      setItems(saved?.products || next)
      setNotice(message)
      setError("")
      return true
    } catch (failure) {
      setError(failure.message)
      return false
    } finally { setSaving(false) }
  }

  async function saveProduct(event) {
    event.preventDefault()
    const images = Array.isArray(editor.images) ? editor.images.filter(Boolean) : []
    const product = { ...editor, images, title: editor.title.trim(), type: editor.type.trim(), benefit: editor.benefit.trim(), slug: editor.slug.trim().toLowerCase() }
    delete product.colorChoices
    delete product.packagingChoices
    const price = Number(product.price)
    if (!product.title || !product.benefit || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug) || !Number.isFinite(price) || price < 0) {
      setError("Complete all required fields, enter a price, and use lowercase letters, numbers and hyphens for the URL.")
      return
    }
    product.price = Math.round(price * 100) / 100
    if (items.some((item) => item.slug === product.slug && item.id !== product.id)) {
      setError("That product URL is already in use.")
      return
    }
    const exists = Boolean(product.id)
    product.id ||= newId()
    const next = exists ? items.map((item) => item.id === product.id ? product : item) : [product, ...items]
    if (await persist(next, exists ? "Product updated." : "Product created.")) setEditor(null)
  }

  async function setProductStatus(item, on) {
    const next = items.map((entry) => entry.id === item.id ? { ...entry, status: on ? "published" : "draft" } : entry)
    await persist(next, on ? `${item.title} is on.` : `${item.title} is off.`)
  }

  function openImages(product) {
    if (!permissions.includes("products")) { setError("Your role does not have permission to edit products."); return }
    setImageError("")
    setImageEditor({ ...product, images: Array.isArray(product.images) ? [...product.images] : [] })
  }

  async function saveImages(event) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setImageError("")
    try {
      const next = items.map((item) => item.id === imageEditor.id ? { ...item, image: imageEditor.image, images: imageEditor.images } : item)
      const saved = await saveContent({ products: next })
      setItems(saved?.products || next)
      setImageEditor(null)
      setNotice("Product images saved.")
    } catch (failure) { setImageError(failure.message) } finally { setSaving(false) }
  }

  function openEditor(product = emptyProduct) {
    if (!permissions.includes("products")) { setError("Your role does not have permission to edit products."); return }
    setError("")
    setEditor({ ...emptyProduct, ...product, images: Array.isArray(product.images) ? product.images : [], category: product.id ? product.category : categories[0] || "", status: product.status || "published" })
  }

  async function saveSettings(event) {
    event.preventDefault()
    try {
      const cleaned = normalizeSocial(Object.fromEntries(Object.entries(links).map(([key, value]) => [key, String(value).trim()])))
      if (socialFields.some(([key]) => cleaned[key] !== "" && !cleaned[key].startsWith("https://"))) throw new Error("url")
      if (cleaned.telegramContact && !cleaned.telegramContact.startsWith("https://")) throw new Error("url")
      if (cleaned.email !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned.email)) throw new Error("email")
      await saveContent({ social: cleaned })
      setLinks(cleaned)
      setNotice("Contact and social links saved.")
      setError("")
    } catch (failure) {
      const message = failure.message === "url" ? "Use a complete https:// URL for each social link." : failure.message === "email" ? "Enter a valid email address." : failure.message
      setError(message)
    }
  }

  return (
    <div className="min-h-svh bg-[#f6f7f8] text-[15px] leading-normal text-[#24252a] font-sans [&_*]:tracking-normal [&_button]:cursor-pointer [&_button:disabled]:cursor-default [&_button:disabled]:opacity-50 [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-3 [&_button:focus-visible]:outline-muru [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-3 [&_a:focus-visible]:outline-muru [&_:is(input:not([type=checkbox]):not([type=color]):not([type=file]),select,textarea)]:w-full [&_:is(input:not([type=checkbox]):not([type=color]):not([type=file]),select,textarea)]:min-h-[42px] [&_:is(input:not([type=checkbox]):not([type=color]):not([type=file]),select,textarea)]:rounded-md [&_:is(input:not([type=checkbox]):not([type=color]):not([type=file]),select,textarea)]:border [&_:is(input:not([type=checkbox]):not([type=color]):not([type=file]),select,textarea)]:border-[#dfe1e6] [&_:is(input:not([type=checkbox]):not([type=color]):not([type=file]),select,textarea)]:bg-white [&_:is(input:not([type=checkbox]):not([type=color]):not([type=file]),select,textarea)]:px-3 [&_:is(input:not([type=checkbox]):not([type=color]):not([type=file]),select,textarea)]:py-[9px] [&_:is(input:not([type=checkbox]):not([type=color]):not([type=file]),select,textarea)]:font-sans [&_:is(input:not([type=checkbox]):not([type=color]):not([type=file]),select,textarea)]:text-[14px] [&_:is(input:not([type=checkbox]):not([type=color]):not([type=file]),select,textarea)]:outline-none [&_:is(input:not([type=checkbox]):not([type=color]):not([type=file]),select,textarea)]:focus:border-[#d52c63] [&_:is(input:not([type=checkbox]):not([type=color]):not([type=file]),select,textarea)]:focus:ring-[3px] [&_:is(input:not([type=checkbox]):not([type=color]):not([type=file]),select,textarea)]:focus:ring-[#fff0f5]">
      <aside className={`fixed inset-y-0 left-0 z-[60] w-[232px] flex-col border-r border-[#e5e7eb] bg-white px-5 py-8 min-[761px]:max-[1100px]:w-[200px] max-[760px]:top-[76px] max-[760px]:shadow-[12px_0_24px_#18181b15] [&_nav]:mt-12 [&_nav]:grid [&_nav]:gap-2 [&_nav_button]:flex [&_nav_button]:items-center [&_nav_button]:gap-3 [&_nav_button]:rounded-md [&_nav_button]:p-3 [&_nav_button]:text-left [&_nav_button]:font-medium [&_nav_button>svg]:ml-auto [&_nav_button>svg]:opacity-0 ${menu ? "flex" : "hidden"} min-[761px]:flex`}>
        <a className="px-3 text-[30px] font-extrabold text-[#d52c63] [&>span]:mt-[3px] [&>span]:block [&>span]:text-[11px] [&>span]:font-semibold [&>span]:text-[#83858d]" href="/">MURU<span>{tx("ADMINISTRATION")}</span></a>
        <nav aria-label="Administration">
          {tabs.map((name) => <button key={name} className={tab === name ? "bg-[#fff0f5] text-[#c5295b] [&>svg]:opacity-100! [&>span]:bg-current" : "text-[#686b74] hover:bg-[#f7f8fa]"} onClick={() => openTab(name)}><span className="size-[7px] rounded-[2px] border border-current" />{tx(name)}<IconArrow className="h-4 w-4" /></button>)}
        </nav>
        <div className="mt-auto border-t border-[#e5e7eb] pt-[22px] text-[13px] text-[#85858f] [&_a]:mt-4 [&_a]:flex [&_a]:items-center [&_a]:gap-3 [&_a]:font-semibold [&_a]:text-[#34353d]"><p>{tx("Beauty, thoughtfully managed.")}</p><a href="/" target="_blank" rel="noreferrer">{tx("View website")} <IconArrow className="h-4 w-4" /></a></div>
      </aside>
      <div className="min-w-0 min-[761px]:ml-[200px] min-[1101px]:ml-[232px]">
        <header className="flex min-h-[76px] items-center gap-4 border-b border-[#e5e7eb] bg-white px-4 py-4 text-[13px] text-[#83858d] min-[761px]:px-6 min-[1101px]:px-9 max-[760px]:flex-wrap [&_strong]:font-medium [&_strong]:text-[#383a42] [&>a]:ml-auto [&>a]:flex [&>a]:items-center [&>a]:gap-2 [&>a]:text-[#454750] max-[400px]:[&>span]:text-[12px] max-[400px]:[&>a]:text-[12px]">
          <button className="min-[761px]:hidden! grid size-8 shrink-0 place-items-center" aria-label={tx("Toggle navigation")} onClick={() => setMenu(!menu)}><IconMenu className="h-5 w-5" /></button>
          <span>MURU / <strong>{tx(tab)}</strong></span>
          <a href="/products" target="_blank" rel="noreferrer">{tx("Open catalog")} <IconArrow className="h-4 w-4" /></a>
          <LanguageSwitch lang={lang} setLang={setLang} label={tx("Language")} />
          <button className="flex shrink-0 items-center gap-3 border-l border-[#e5e7eb] pl-4 text-left" aria-label={tx("Open profile")} aria-haspopup="dialog" onClick={() => setProfileOpen(true)}>
              <ProfileAvatar session={session} />
              <span className="grid min-w-0 gap-0.5"><span className="max-w-[150px] truncate text-[14px] font-semibold text-[#383a42] max-[400px]:max-w-[90px]">{session.name || session.username || session.email}</span><span className="text-[12px] text-[#83858d]">{session.role === "owner" ? tx("Admin") : tx("Team member")}</span></span>
              <IconArrow className="h-3.5 w-3.5 rotate-90" />
          </button>
        </header>
        <main className="w-full min-w-0 px-4 py-7 min-[761px]:px-6 min-[1101px]:p-9">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-5 [&_h1]:text-[30px] [&_h1]:leading-[1.2] [&_h1]:font-semibold"><div><p className="mb-2 text-[11px] font-bold text-[#b52958]">{tx("CATALOG MANAGEMENT")}</p><h1>{tab === "Overview" ? tx("Welcome back.") : tx(tab)}</h1></div>{["Overview", "Products"].includes(tab) && <button className="inline-flex min-h-[42px] items-center justify-center rounded-md px-[18px] py-2.5 text-[14px] font-semibold bg-[#d52c63] text-white hover:bg-[#b92153]" onClick={() => openEditor()}>{tx("+ Add product")}</button>}</div>
          {notice && <div className="mb-6 flex items-center justify-between rounded-md bg-[#eaf6ee] px-4 py-3 text-[#24724c]" role="status">{tx(notice)}<button className="grid size-8 shrink-0 place-items-center" aria-label={tx("Dismiss notification")} onClick={() => setNotice("")}><IconClose className="h-4 w-4" /></button></div>}
          {(error || sessionError) && <ErrorCard message={tx(error || sessionError)} onClose={() => { setError(""); clearSessionError() }} />}
          {tab === "Overview" && <>
            <div className="mb-[34px] grid grid-cols-2 gap-3 min-[761px]:grid-cols-4 min-[1101px]:gap-[18px] [&_article]:rounded-md [&_article]:border [&_article]:border-[#e5e7eb] [&_article]:bg-white [&_article]:p-[18px] min-[1101px]:[&_article]:p-[22px] [&_span]:block [&_span]:text-[13px] [&_span]:text-[#71747d] [&_strong]:mt-3 [&_strong]:block [&_strong]:text-[32px] [&_strong]:leading-[1.2] [&_strong]:font-semibold">{[["Total products", items.length], ["On", published.length], ["Off", items.length - published.length], ["Categories", new Set(items.map((item) => item.category)).size]].map(([label, count]) => <article key={label}><span>{label}</span><strong>{count}</strong></article>)}</div>
            <section className="mb-8 [&_h2]:text-[18px] [&_h2]:font-semibold"><div className="mb-[18px] flex items-center justify-between gap-4"><h2>Recently updated</h2><button className="flex items-center gap-2 text-[13px] text-[#c5295b]" onClick={() => openTab("Products")}>All products <IconArrow className="h-4 w-4" /></button></div><ProductTable options={options} items={[...items].sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")).slice(0, 5)} saving={saving} onEdit={openEditor} onDelete={setDeleting} onStatus={setProductStatus} /></section>
            <section className="flex items-center gap-7 pt-2 max-[400px]:gap-4 [&_img]:h-[110px] [&_img]:w-[140px] [&_img]:rounded-md [&_img]:object-cover max-[400px]:[&_img]:h-[100px] max-[400px]:[&_img]:w-[90px] [&_h2]:font-display [&_h2]:text-[25px] [&_h2]:font-medium max-[400px]:[&_h2]:text-[21px] [&_a]:mt-3 [&_a]:flex [&_a]:items-center [&_a]:gap-2 [&_a]:text-[13px] [&_a]:text-[#b52958]"><img src="/images/cluster.jpg" alt="MURU skincare collection" /><div><p className="mb-2 text-[11px] font-bold text-[#b52958]">MURU COLLECTION</p><h2>A little care. Every day.</h2><a href="/products" target="_blank" rel="noreferrer">View the collection <IconArrow className="h-4 w-4" /></a></div></section>
          </>}
          {tab === "Products" && <section className="mb-8 [&_h2]:text-[18px] [&_h2]:font-semibold">
            <div className="mb-5 flex flex-wrap items-center gap-3 [&>span]:ml-auto [&>span]:text-[13px] [&>span]:text-[#777a83] [&>select]:w-auto! [&>select]:max-w-full"><label className="relative min-w-[180px] flex-1 [&_svg]:absolute [&_svg]:top-[13px] [&_svg]:left-3 [&_svg]:text-[#777a83] [&_input]:pl-9!"><IconSearch className="h-4 w-4" /><input aria-label={tx("Search products")} placeholder={tx("Search products")} value={query} onChange={(event) => setQuery(event.target.value)} /></label><select aria-label={tx("Filter category")} value={category} onChange={(event) => setCategory(event.target.value)}><option value="All categories">{tx("All categories")}</option>{categories.map((value) => <option key={value} value={value}>{tx(value)}</option>)}</select><select aria-label={tx("Filter status")} value={status} onChange={(event) => setStatus(event.target.value)}><option value="All statuses">{tx("All statuses")}</option><option value="published">{tx("On")}</option><option value="draft">{tx("Off")}</option></select><span>{visible.length} {tx("products")}</span></div>
            <ProductTable items={visible} options={options} saving={saving} onEdit={openEditor} onImages={openImages} onDelete={setDeleting} onStatus={setProductStatus} />
          </section>}
          {tab === "Categories" && <CategoryManager categories={categoryList} products={items} onSave={async (nextCategories, nextProducts) => { const saved = await saveContent({ categories: nextCategories, products: nextProducts }); setItems(saved?.products || nextProducts); setCategory("All categories"); setNotice("Categories saved.") }} />}
          {tab === "Website" && <WebsiteEditor initial={serverState.settings} canEditWebsite={permissions.includes("website")} contactForm={permissions.includes("settings") ? <ContactLinksForm links={links} setLinks={setLinks} onSubmit={saveSettings} /> : null} onSave={async (settings) => { await saveContent({ settings }); setNotice("Website updated.") }} />}

          {tab === "Product Options" && <ProductOptions initial={serverState.productOptions} products={items} onSave={async (productOptions) => { await saveContent({ productOptions }); setNotice("Product options saved.") }} />}
          {tab === "Users" && <UserManagement key="users" view="users" permissions={permissions} email={session.email} />}
          {tab === "Roles" && <UserManagement key="roles" view="roles" permissions={permissions} email={session.email} />}
          {tab === "Branding" && <Branding initial={serverState.settings} onSave={async (branding) => { await saveContent({ settings: { ...serverState.settings, ...branding } }); setNotice("Branding saved.") }} />}
        </main>
        {profileOpen && <Modal title={tx("Profile")} onClose={() => setProfileOpen(false)}><div className="mx-auto max-w-[560px]"><ProfileSettings session={session} onSaved={refresh} /><AccountSettings /><div className="mt-5 border-t border-[#e5e7eb] pt-4"><button className="text-[13px] font-medium text-[#c5295b]" onClick={logout}>{tx("Sign out")}</button></div></div></Modal>}
      </div>
      {imageEditor && <Modal title={tx("Product images")} onClose={() => { if (!saving) setImageEditor(null) }}><form onSubmit={saveImages}><fieldset disabled={saving} className="min-w-0"><p className="mb-5 break-words text-[14px] text-[#777a83]">{imageEditor.title}</p>{imageError && <p role="alert" className="mb-4 text-red-700">{imageError}</p>}<ProductImageEditor editor={imageEditor} setEditor={setImageEditor} expanded /><div className="sticky -bottom-5 z-10 -mx-5 -mb-5 mt-6 flex justify-end gap-3 border-t border-[#e5e7eb] bg-white px-5 py-4 min-[761px]:-bottom-[26px] min-[761px]:-mx-[26px] min-[761px]:-mb-[26px] min-[761px]:px-[26px]"><button type="button" className="min-h-[42px] rounded-md border border-[#dcdfe4] px-5 py-2 text-[14px] font-medium" onClick={() => setImageEditor(null)}>{tx("Cancel")}</button><button className="min-h-[42px] rounded-md bg-[#d52c63] px-6 py-2 text-[14px] font-semibold text-white hover:bg-[#b92153]">{tx(saving ? "Saving..." : "Save")}</button></div></fieldset></form></Modal>}
      {editor && <Modal title={editor.id ? tx("Edit product") : tx("New product")} onClose={() => setEditor(null)}><form onSubmit={saveProduct} className="grid grid-cols-1 items-start gap-6 min-[761px]:grid-cols-[200px_minmax(0,1fr)]">
        <ProductImageEditor editor={editor} setEditor={setEditor} />
        <div className="grid min-w-0 gap-4 [&_label]:grid [&_label]:gap-2 [&_label]:text-[13px] [&_label]:font-medium [&_label]:text-[#50525b]">
          <div className="grid min-w-0 grid-cols-1 gap-3.5 min-[1024px]:grid-cols-3 [&_label]:min-w-0 [&_input]:min-w-0 [&_select]:min-w-0">
          <label>{tx("Product name")}<span className="text-[#c73542]" aria-hidden="true"> *</span><input required maxLength={160} placeholder={tx("e.g. MURU Foam Blue")} value={editor.title} onChange={(event) => { const title = event.target.value; setEditor({ ...editor, title, ...(!editor.id ? { slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") } : {}) }) }} /></label>
          <label>{tx("Product URL")}<span className="text-[#c73542]" aria-hidden="true"> *</span><input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={160} placeholder={tx("e.g. muru-foam-blue")} value={editor.slug} onChange={(event) => setEditor({ ...editor, slug: event.target.value })} /></label>
          <label>{tx("Category")}<span className="text-[#c73542]" aria-hidden="true"> *</span><select required value={editor.category} onChange={(event) => setEditor({ ...editor, category: event.target.value })}>{categories.map((value) => <option key={value} value={value}>{tx(value)}</option>)}</select></label>
          </div>
          <label>{tx("Description")}<span className="text-[#c73542]" aria-hidden="true"> *</span><textarea required rows={3} maxLength={600} placeholder={tx("e.g. Fresh daily cleanse for soft, balanced skin.")} value={editor.benefit} onChange={(event) => setEditor({ ...editor, benefit: event.target.value })} /></label>
          <div className="grid min-w-0 grid-cols-1 gap-3.5 min-[1024px]:grid-cols-3 [&_label]:min-w-0 [&_input]:min-w-0">
            <label>{tx("Price (USD)")}<span className="text-[#c73542]" aria-hidden="true"> *</span><input required type="number" min="0" step="0.01" max="1000000" placeholder={tx("e.g. 8.50")} value={editor.price} onChange={(event) => setEditor({ ...editor, price: event.target.value })} /></label>
            <label>{tx("Size")}<input maxLength={160} placeholder={tx("e.g. 150ml")} value={editor.size} onChange={(event) => setEditor({ ...editor, size: event.target.value })} /></label>
            <label>{tx("Skin type")}<input maxLength={160} placeholder={tx("e.g. Normal, Oily")} value={editor.skinType} onChange={(event) => setEditor({ ...editor, skinType: event.target.value })} /></label>
          </div>
          {[['ingredients', 'Ingredients', 'e.g. Water, Glycerin...'], ['howToUse', 'How to use', 'e.g. Apply to face...'], ['story', 'Product story', 'e.g. Why we created this...']].map(([key, label, placeholder]) => <label key={key}>{tx(label)}<textarea rows={3} maxLength={4000} placeholder={tx(placeholder)} value={editor[key]} onChange={(event) => setEditor({ ...editor, [key]: event.target.value })} /></label>)}
          <div className="grid grid-cols-1 gap-3.5 min-[401px]:grid-cols-2">{[["packaging", "Packaging", "variant"], ["colors", "Color", "tone"]].map(([group, label, field]) => <label key={field}>{tx(label)}<select required value={editor[field]} onChange={(event) => setEditor({ ...editor, [field]: event.target.value })}><option value="">{tx("Select")}</option>{options[group].map((entry) => <option key={entry.value} value={entry.value}>{optionLabel(options, group, entry.value, lang)}</option>)}</select></label>)}</div>
          <label>{tx("Status")}<select value={editor.status === "draft" ? "draft" : "published"} onChange={(event) => setEditor({ ...editor, status: event.target.value })}><option value="published">{tx("On")}</option><option value="draft">{tx("Off")}</option></select></label>
          <div className="flex flex-wrap gap-[18px] text-[13px] [&_label]:mb-0! [&_label]:flex! [&_label]:items-center [&_label]:gap-2 [&_input]:size-4 [&_input]:accent-[#d52c63]"><label><input type="checkbox" checked={Boolean(editor.isNew)} onChange={(event) => setEditor({ ...editor, isNew: event.target.checked })} />{tx("New arrival")}</label><label><input type="checkbox" checked={Boolean(editor.bestSeller)} onChange={(event) => setEditor({ ...editor, bestSeller: event.target.checked })} />{tx("Best seller")}</label></div>
        </div>
        <div className="sticky -bottom-5 z-10 -mx-5 -mb-5 flex flex-wrap justify-end gap-2.5 border-t border-[#e5e7eb] bg-white px-5 py-4 min-[761px]:col-span-2 min-[761px]:-bottom-[26px] min-[761px]:-mx-[26px] min-[761px]:-mb-[26px] min-[761px]:px-[26px]"><button type="button" className="inline-flex min-h-[42px] items-center justify-center rounded-md px-[18px] py-2.5 text-[14px] font-semibold border border-[#dcdfe4] bg-white text-[#454750]" disabled={saving} onClick={() => setEditor(null)}>{tx("Cancel")}</button><button className="inline-flex min-h-[42px] items-center justify-center rounded-md px-[18px] py-2.5 text-[14px] font-semibold bg-[#d52c63] text-white hover:bg-[#b92153]" disabled={saving}>{saving ? tx("Saving...") : tx("Save product")}</button></div>
      </form></Modal>}
      {deleting && <Modal title={tx("Delete product?")} onClose={() => setDeleting(null)}><p className="mb-[26px]">{deleting.title} {tx("will be removed from the catalog.")}</p><div className="mt-3 flex flex-wrap justify-end gap-2.5"><button className="inline-flex min-h-[42px] items-center justify-center rounded-md px-[18px] py-2.5 text-[14px] font-semibold border border-[#dcdfe4] bg-white text-[#454750]" disabled={saving} onClick={() => setDeleting(null)}>{tx("Cancel")}</button><button className="inline-flex min-h-[42px] items-center justify-center rounded-md px-[18px] py-2.5 text-[14px] font-semibold bg-[#c73542] text-white" disabled={saving} onClick={async () => { if (await persist(items.filter((item) => item.id !== deleting.id), "Product deleted.")) setDeleting(null) }}>{tx("Delete product")}</button></div></Modal>}
    </div>
  )
}

function productEditorImages(editor) {
  const gallery = Array.isArray(editor.images) ? editor.images.filter(Boolean) : []
  return [editor.image, ...gallery].filter((image, index, list) => image && list.indexOf(image) === index)
}

function ProductImageEditor({ editor, setEditor, expanded = false }) {
  const { tx } = useI18n()
  const images = productEditorImages(editor)
  const [selected, setSelected] = useState("")
  const preview = images.includes(selected) ? selected : editor.image
  function moveImage(image, direction) {
    setEditor((current) => {
      if (!current) return current
      const ordered = productEditorImages(current)
      const index = ordered.indexOf(image)
      const destination = index + direction
      if (index < 0 || destination < 0 || destination >= ordered.length) return current
      ;[ordered[index], ordered[destination]] = [ordered[destination], ordered[index]]
      return { ...current, image: ordered[0] || "", images: ordered.slice(1) }
    })
  }
  function setMain(image) {
    setEditor((current) => current ? { ...current, image, images: productEditorImages(current).filter((item) => item !== image) } : current)
  }
  function addImage(image) {
    if (!image) return
    setEditor((current) => {
      if (!current) return current
      const nextImages = productEditorImages(current)
      if (!nextImages.includes(image)) nextImages.push(image)
      return { ...current, image: current.image || image, images: nextImages.filter((item) => item !== (current.image || image)) }
    })
  }
  function removeImage(image) {
    setEditor((current) => {
      if (!current) return current
      const remaining = productEditorImages(current).filter((item) => item !== image)
      return { ...current, image: remaining[0] || "", images: remaining.slice(1) }
    })
  }
  if (expanded) return <div className="grid min-w-0 gap-6 min-[761px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
    <div className="min-w-0">
      <div className="mb-3 flex items-center justify-between"><h3 className="text-[14px] font-semibold">{tx("Preview")}</h3>{preview && preview === editor.image && <span className="rounded bg-[#eaf6ee] px-2 py-1 text-[11px] font-medium text-[#24724c]">{tx("Primary")}</span>}</div>
      <PhotoPreview src={preview} alt={editor.title} className="grid aspect-square max-h-[380px] w-full place-items-center overflow-hidden rounded-md border border-[#e5e7eb] bg-[#f6f7f8] [&_img]:h-full [&_img]:w-full [&_img]:object-contain"><ProductArt variant={editor.variant} tone={editor.tone} image={preview} alt={editor.title} /></PhotoPreview>
    </div>
    <div className="min-w-0">
      <div className="mb-3 flex items-center justify-between"><h3 className="text-[14px] font-semibold">{tx("Images")}</h3><span className="text-[12px] text-[#777a83]">{images.length}</span></div>
      <ol className="max-h-[300px] space-y-2 overflow-y-auto pr-1">{images.map((image, index) => <li key={image} className={`flex min-w-0 items-center gap-3 rounded-md border p-2 ${preview === image ? "border-[#d52c63] bg-[#fff8fb]" : "border-[#e5e7eb] bg-white"}`}>
        <button type="button" aria-label={`${tx("Preview")} ${index + 1}`} onClick={() => setSelected(image)} className="size-14 shrink-0 overflow-hidden rounded bg-[#f6f7f8]"><img src={image} alt="" className="h-full w-full object-contain" /></button>
        <div className="min-w-0 flex-1"><p className="text-[13px] font-medium">{tx("Photo")} {index + 1}</p>{index === 0 ? <span className="text-[11px] font-medium text-[#24724c]">{tx("Primary")}</span> : <button type="button" onClick={() => setMain(image)} className="text-[11px] font-medium text-[#c5295b]">{tx("Set as primary")}</button>}</div>
        <div className="flex shrink-0 gap-0.5">{[[-1, "Move earlier"], [1, "Move later"]].map(([direction, label]) => <button key={direction} type="button" title={tx(label)} aria-label={tx(label)} disabled={direction === -1 ? index === 0 : index === images.length - 1} className="grid size-8 place-items-center rounded hover:bg-[#f0f1f3] disabled:opacity-30" onClick={() => moveImage(image, direction)}><IconArrow className={`size-4 ${direction === -1 ? "-rotate-90" : "rotate-90"}`} /></button>)}<button type="button" title={tx("Remove")} aria-label={`${tx("Remove")} ${index + 1}`} className="grid size-8 place-items-center rounded text-[#bf4351] hover:bg-[#fff0f2]" onClick={() => removeImage(image)}><IconClose className="size-4" /></button></div>
      </li>)}</ol>
      {!images.length && <div className="border-y border-[#e5e7eb] py-8 text-center text-sm text-[#777a83]">{tx("No images")}</div>}
      <div className="mt-5 border-t border-[#e5e7eb] pt-4 [&_label]:text-[13px] [&_input[type=file]]:w-full [&_input[type=file]]:text-[12px]"><h3 className="mb-3 text-[14px] font-semibold">{tx("Add image")}</h3><ImageField value="" onChange={addImage} /></div>
    </div>
  </div>
  return <div className="min-w-0 space-y-4 [&_input]:min-w-0 [&_input]:max-w-full [&_input[type=file]]:w-full [&_input[type=file]]:text-[12px] [&_label]:block [&_label]:text-[13px] [&_label]:text-[#50525b]">
    <PhotoPreview src={editor.image} alt={editor.title || tx("New product")} className="mx-auto block h-40 w-[130px] overflow-hidden rounded-md border border-[#edf0f2] bg-[#fff5f8] min-[761px]:h-[230px] min-[761px]:w-full"><ProductArt variant={editor.variant} tone={editor.tone} image={editor.image} alt={editor.title} /></PhotoPreview>
    {images.length > 0 && <div className="grid grid-cols-3 gap-2">
      {images.map((image, index) => <div key={image} className={`overflow-hidden rounded-md border bg-white ${image === editor.image ? "border-[#d52c63]" : "border-[#edf0f2]"}`}>
        <button type="button" title={tx("Set as main photo")} aria-label={`${tx("Set as main photo")} ${index + 1}`} className="block aspect-square w-full bg-[#fff5f8]" onClick={() => setMain(image)}><img src={image} alt="" className="h-full w-full object-contain" /></button>
        <div className="flex min-h-8 items-center justify-between gap-1 px-1"><span className="text-[11px] text-[#50525b]">{index === 0 ? tx("Primary") : index + 1}</span><div className="flex"><button type="button" disabled={index === 0} title={tx("Move earlier")} aria-label={tx("Move earlier")} className="grid size-7 place-items-center" onClick={() => moveImage(image, -1)}><IconArrow className="size-3 rotate-180" /></button><button type="button" disabled={index === images.length - 1} title={tx("Move later")} aria-label={tx("Move later")} className="grid size-7 place-items-center" onClick={() => moveImage(image, 1)}><IconArrow className="size-3" /></button></div></div>
        <button type="button" className="w-full px-1 py-1 text-[11px] text-[#c5295b]" onClick={() => removeImage(image)}>{tx("Remove")}</button>
      </div>)}
    </div>}
    <ImageField value="" onChange={addImage} hint="Add another product photo. First photo is the main catalog photo." />
  </div>
}

function ProfileAvatar({ session }) {
  if (session.image) return <img src={session.image} alt="" className="size-10 shrink-0 rounded-full object-cover" />
  return <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#fff0f5] text-[16px] font-semibold text-[#b52958]" aria-hidden="true">{(session.name || session.username || session.email || "A").charAt(0).toUpperCase()}</span>
}

function productPrice(price) {
  return Number.isFinite(Number(price)) ? `$${Number(price).toFixed(2)}` : "—"
}

function formatUpdated(value) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date)
}

function ProductTable({ items, options, saving, onEdit, onImages, onDelete, onStatus }) {
  const { tx, lang } = useI18n()
  if (!items.length) return <div className="px-5 py-[60px] text-center text-[#777a83] [&_p]:mt-2"><h2>{tx("No products found")}</h2><p>{tx("There are no products in this view.")}</p></div>
  const columns = ["No.", "Photo", "Product Name", "URL", "Category", "Price", "Size", "Skin Type", "Packaging", "Color", "Status", "New Arrival", "Updated", "Actions"]
  return (
    <div className="w-full overflow-x-auto rounded-md border border-[#e5e7eb] bg-white">
      <table className="w-full min-w-[1100px] table-fixed border-collapse text-left">
        <colgroup>
          <col className="w-[44px]" />
          <col className="w-[64px]" />
          <col className="w-[14%]" />
          <col className="w-[12%]" />
          <col className="w-[8%]" />
          <col className="w-[72px]" />
          <col className="w-[7%]" />
          <col className="w-[8%]" />
          <col className="w-[8%]" />
          <col className="w-[64px]" />
          <col className="w-[88px]" />
          <col className="w-[72px]" />
          <col className="w-[12%]" />
          <col className="w-[144px]" />
        </colgroup>
        <thead>
          <tr className="bg-[#fafbfc] text-[12px] font-medium text-[#777a83]">
            {columns.map((column) => <th key={column} scope="col" className="px-2.5 py-3">{tx(column)}</th>)}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const on = item.status !== "draft"
            return (
              <tr key={item.id} className="border-t border-[#edf0f2] text-[13px]">
                <td className="px-2.5 py-3 text-[#777a83]">{index + 1}</td>
                <td className="px-2.5 py-3"><PhotoPreview src={item.image} alt={item.title} className="block h-12 w-10 rounded bg-[#fff5f8]"><ProductArt variant={item.variant} tone={item.tone} image={item.image} alt={item.title} /></PhotoPreview></td>
                <td className="px-2.5 py-3 font-semibold break-words">{item.title}</td>
                <td className="px-2.5 py-3 break-all text-[#50525b]">{item.slug}</td>
                <td className="px-2.5 py-3 break-words">{item.category}</td>
                <td className="px-2.5 py-3 whitespace-nowrap">{productPrice(item.price)}</td>
                <td className="px-2.5 py-3 break-words">{item.size || "—"}</td>
                <td className="px-2.5 py-3 break-words">{item.skinType || "—"}</td>
                <td className="px-2.5 py-3 break-words">{optionLabel(options, "packaging", item.variant, lang)}</td>
                <td className="px-2.5 py-3 break-words">{optionLabel(options, "colors", item.tone, lang)}</td>
                <td className="px-2.5 py-3">
                  <button type="button" role="switch" aria-checked={on} aria-label={`${item.title} ${tx("Status")} ${tx(on ? "On" : "Off")}`} disabled={saving} className={`inline-flex items-center gap-1.5 rounded-full px-1 py-1 ${on ? "text-[#24724c]" : "text-[#7b6433]"}`} onClick={() => onStatus(item, !on)}>
                    <span className={`relative h-5 w-9 rounded-full ${on ? "bg-[#24724c]" : "bg-[#d5d7dc]"}`}><span className={`absolute top-0.5 size-4 rounded-full bg-white shadow ${on ? "left-4" : "left-0.5"}`} /></span>
                    {tx(on ? "On" : "Off")}
                  </button>
                </td>
                <td className="px-2.5 py-3">{tx(item.isNew ? "Yes" : "No")}</td>
                <td className="px-2.5 py-3">
                  <span className="block font-medium break-words">{item.updatedBy || "—"}</span>
                  {formatUpdated(item.updatedAt) && <span className="mt-1 block text-[12px] text-[#777a83]">{formatUpdated(item.updatedAt)}</span>}
                </td>
                <td className="px-2.5 py-3"><div className="flex items-center gap-3"><button className="font-medium text-[#4f515b]" onClick={() => onEdit(item)}>{tx("Edit")}</button>{onImages && <button type="button" disabled={saving} title={tx("Manage images")} aria-label={`${tx("Manage images")} ${item.title}`} className="grid size-7 shrink-0 place-items-center text-[#4f515b] hover:text-[#c5295b]" onClick={() => onImages(item)}><IconImage className="size-4" /></button>}<button aria-label={`${tx("Delete")} ${item.title}`} className="font-medium text-[#bf4351]" onClick={() => onDelete(item)}>{tx("Delete")}</button></div></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Modal({ title, onClose, children }) {
  const { tx } = useI18n()
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    const previous = document.activeElement
    dialog.showModal()
    return () => { dialog.close(); previous?.focus() }
  }, [])
  return <dialog ref={ref} className="m-auto max-h-[calc(100svh_-_40px)] w-[min(980px,calc(100%_-_32px))] overflow-auto rounded-lg border border-[#e5e7eb] bg-white p-5 text-[#24252a] min-[761px]:p-[26px] backdrop:bg-[#18181b70] font-sans [&_*]:tracking-normal [&_button]:cursor-pointer [&_button:disabled]:cursor-default [&_button:disabled]:opacity-50 [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-3 [&_button:focus-visible]:outline-muru [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-3 [&_a:focus-visible]:outline-muru [&_:is(input:not([type=checkbox]):not([type=color]):not([type=file]),select,textarea)]:w-full [&_:is(input:not([type=checkbox]):not([type=color]):not([type=file]),select,textarea)]:min-h-[42px] [&_:is(input:not([type=checkbox]):not([type=color]):not([type=file]),select,textarea)]:rounded-md [&_:is(input:not([type=checkbox]):not([type=color]):not([type=file]),select,textarea)]:border [&_:is(input:not([type=checkbox]):not([type=color]):not([type=file]),select,textarea)]:border-[#dfe1e6] [&_:is(input:not([type=checkbox]):not([type=color]):not([type=file]),select,textarea)]:bg-white [&_:is(input:not([type=checkbox]):not([type=color]):not([type=file]),select,textarea)]:px-3 [&_:is(input:not([type=checkbox]):not([type=color]):not([type=file]),select,textarea)]:py-[9px] [&_:is(input:not([type=checkbox]):not([type=color]):not([type=file]),select,textarea)]:font-sans [&_:is(input:not([type=checkbox]):not([type=color]):not([type=file]),select,textarea)]:text-[14px] [&_:is(input:not([type=checkbox]):not([type=color]):not([type=file]),select,textarea)]:outline-none [&_:is(input:not([type=checkbox]):not([type=color]):not([type=file]),select,textarea)]:focus:border-[#d52c63] [&_:is(input:not([type=checkbox]):not([type=color]):not([type=file]),select,textarea)]:focus:ring-[3px] [&_:is(input:not([type=checkbox]):not([type=color]):not([type=file]),select,textarea)]:focus:ring-[#fff0f5]" aria-label={title} onCancel={onClose}><div className="mb-6 flex items-center justify-between gap-4 [&_h2]:text-[22px] [&_h2]:font-semibold"><h2>{title}</h2><button className="grid size-8 shrink-0 place-items-center" aria-label={tx("Close dialog")} onClick={onClose}><IconClose className="h-5 w-5" /></button></div>{children}</dialog>
}
