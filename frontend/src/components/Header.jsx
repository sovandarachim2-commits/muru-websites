import { useEffect, useRef, useState } from "react"
import { nav, products, settings } from "../data/site"
import { LanguageSwitch, useI18n } from "../data/i18n"
import {
  IconClose,
  IconMenu,
  IconSearch,
} from "./Icons"

const sectionOrder = ["categories", "about", "contact"]

export default function Header({ activePage }) {
  const [active, setActive] = useState("top")
  const [query, setQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const searchRef = useRef(null)
  const { lang, setLang, tx } = useI18n()
  const currentActive = activePage ?? active

  useEffect(() => {
    if (activePage) return

    const onScroll = () => {
      const marker = window.scrollY + 120
      let current = "top"
      for (const id of sectionOrder) {
        const section = document.getElementById(id)
        if (section && section.offsetTop <= marker) current = id
      }
      setActive(current)
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [activePage])

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!searchRef.current?.contains(event.target)) setSearchOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [])

  const needle = query.trim().toLowerCase()
  const matches =
    needle === ""
      ? []
      : products.filter((product) =>
          `${product.title} ${product.category}`.toLowerCase().includes(needle),
        )

  function goToProduct(id) {
    const product = products.find((item) => item.id === id)
    setSearchOpen(false)
    setQuery("")
    setMenuOpen(false)
    if (product) window.location.assign(`/products/${product.slug}`)
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <header id="top" className="sticky top-0 z-50 border-b border-[#EAE4E1] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:h-[76px] sm:gap-4 sm:px-6">
        <button
          type="button"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink lg:hidden"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? tx("Close menu") : tx("Open menu")}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
        </button>

        <a href="/" className="shrink-0 text-2xl font-extrabold text-muru">
          {settings.logo ? <img src={settings.logo} alt={settings.brand} className="h-10 w-auto max-w-[140px] object-contain sm:h-12 sm:max-w-[180px]" /> : settings.brand}
        </a>

        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full bg-[#fff7f9] p-1 lg:flex"
          aria-label={tx("Primary")}
        >
          {nav.map((item) => {
            const isActive = currentActive === item.id
            return (
              <a
                key={item.id}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-full px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition ${
                  isActive
                    ? "bg-white text-muru shadow-[0_2px_10px_rgba(242,84,138,0.16)]"
                    : "text-ink/65 hover:bg-white/70 hover:text-ink"
                }`}
              >
                {tx(item.label)}
              </a>
            )
          })}
        </nav>

        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
          <LanguageSwitch lang={lang} setLang={setLang} label={tx("Language")} />
          <div ref={searchRef} className="relative w-full min-w-0 max-w-52">
            <label htmlFor="product-search" className="sr-only">
              {tx("Search products")}
            </label>
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="product-search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setSearchOpen(true)
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder={tx("Search products...")}
              className="h-10 w-full rounded-full border border-petal bg-white pr-3 pl-9 text-sm text-ink outline-none placeholder:text-muted focus:border-muru"
            />
            {searchOpen && needle !== "" && (
              <ul className="absolute top-12 right-0 z-50 w-[min(16rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-petal bg-white py-2 shadow-xl">
                {matches.length === 0 && (
                  <li className="px-4 py-3 text-sm text-muted">{tx("No matching products.")}</li>
                )}
                {matches.map((product) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      onClick={() => goToProduct(product.id)}
                      className="block w-full px-4 py-2 text-left hover:bg-blush"
                    >
                      <span className="block text-sm font-semibold text-ink">{tx(product.title)}</span>
                      <span className="text-xs text-muru">{tx(product.category)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-petal px-4 py-3 lg:hidden" aria-label={tx("Mobile")}>
          <ul className="space-y-1 rounded-3xl bg-[#fff1f5] p-2">
            {nav.map((item) => {
              const isActive = currentActive === item.id
              return (
                <li key={item.id}>
                  <a
                    href={item.href}
                    onClick={closeMenu}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive ? "bg-white text-muru shadow-sm" : "text-ink/75 hover:bg-white/80"
                    }`}
                  >
                    {tx(item.label)}
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-muru" : "bg-transparent"}`}
                    />
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
      )}
    </header>
  )
}
