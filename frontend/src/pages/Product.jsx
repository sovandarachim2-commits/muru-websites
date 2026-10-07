import { useMemo, useRef, useState } from "react"
import ProductArt from "../components/ProductArt"
import PhotoPreview from "../components/PhotoPreview"
import { IconArrow, IconChevron, IconFacebook, IconTelegram } from "../components/Icons"
import { btnClass, categories, formatPrice, products, reviews, settings, social } from "../data/site"
import { settingText, useI18n } from "../data/i18n"

const categoryOptions = ["All Products", ...categories.filter((item) => !["All Products", "New Arrivals"].includes(item.title)).map((item) => item.title), "New Arrivals"]

export default function Product() {
  const detailSlug = window.location.pathname.match(/^\/products\/([^/]+)/)?.[1]
  const selectedProduct = products.find((product) => product.slug === detailSlug)

  if (detailSlug) {
    return <ProductDetail product={selectedProduct} />
  }

  return <ProductCatalog />
}

function ProductCatalog() {
  const { lang, tx } = useI18n()
  const [category, setCategory] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get("category")
    return categoryOptions.includes(requested) ? requested : "All Products"
  })
  const [sort, setSort] = useState("Newest")
  const [view, setView] = useState("grid")

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
      return (
        category === "All Products" ||
        product.category === category ||
        (category === "New Arrivals" && product.isNew)
      )
    })

    return sort === "A-Z" ? [...result].sort((a, b) => a.title.localeCompare(b.title)) : result
  }, [category, sort])

  return (
    <main className="bg-cream">
      <section className="mx-auto max-w-7xl px-4 pt-8 pb-5 sm:px-6 sm:pt-12">
        <p className="text-xs font-bold tracking-[0.22em] text-muru">{tx("OUR PRODUCTS")}</p>
        <h1 className="mt-2 font-display text-4xl leading-tight text-ink sm:text-5xl">{settingText(lang, "catalogTitle")}</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted">{settingText(lang, "catalogDescription")}</p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
        <div className="flex flex-wrap gap-2">
          {categoryOptions.map((option) => {
            const selected = category === option
            return (
              <button
                key={option}
                type="button"
                onClick={() => setCategory(option)}
                className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                  selected ? "bg-muru text-white" : "bg-white text-ink/70 ring-1 ring-petal hover:text-ink"
                }`}
              >
                {option === "All Products" ? tx("All") : tx(option)}
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted">{lang === "km" ? `${filteredProducts.length} ផលិតផល` : `${filteredProducts.length} products`}</p>
          <div className="flex items-center gap-2">
            <FilterSelect label="Sort" value={sort} onChange={setSort} options={["Newest", "A-Z"]} />
            <div className="flex rounded-full bg-white p-1 ring-1 ring-petal">
              {[
                ["grid", "Grid", IconGrid],
                ["list", "List", IconList],
              ].map(([mode, label, Icon]) => (
                <button
                  key={mode}
                  type="button"
                  aria-label={tx(label)}
                  aria-pressed={view === mode}
                  onClick={() => setView(mode)}
                  className={`grid h-8 w-8 place-items-center rounded-full ${
                    view === mode ? "bg-blush text-muru" : "text-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        {filteredProducts.length === 0 ? (
          <p className="rounded-3xl bg-white px-6 py-16 text-center text-sm text-muted">
            {tx("No products in this category.")}
          </p>
        ) : (
          <div className={view === "grid" ? "grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4" : "grid gap-3"}>
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} list={view === "list"} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function IconGrid(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function IconList(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" {...props}>
      <path d="M9 7h11M9 12h11M9 17h11" strokeLinecap="round" />
      <circle cx="5" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="5" cy="17" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FilterSelect({ label, value, onChange, options }) {
  const { tx } = useI18n()
  return (
    <label className="relative block w-[6.75rem] shrink-0">
      <span className="sr-only">{tx(label)}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full appearance-none rounded-full bg-white px-3 pr-8 text-sm text-ink ring-1 ring-petal outline-none focus:ring-muru"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {tx(option)}
          </option>
        ))}
      </select>
      <IconChevron className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 translate-y-[-50%] rotate-90 text-muted" />
    </label>
  )
}

function ProductCard({ product, list, soft = false }) {
  const { tx } = useI18n()
  return (
    <a
      id={`product-${product.id}`}
      href={`/products/${product.slug}`}
      className={`group ${
        list
          ? "grid grid-cols-[112px_1fr] items-center gap-4 rounded-2xl bg-white p-3"
          : soft
            ? "block rounded-3xl bg-[#fff7f9] p-2.5 sm:p-3"
            : "block rounded-3xl bg-white p-2.5"
      }`}
    >
      <div className="aspect-square overflow-hidden rounded-2xl bg-blush">
        <ProductArt variant={product.variant} tone={product.tone} image={product.image} alt={tx(product.title)} />
      </div>
      <div className={list ? "" : "px-1 pt-3 pb-1"}>
        <p className="text-xs font-medium text-muru">{tx(product.category)}</p>
        <h2 className="mt-1 text-sm font-semibold leading-snug text-ink sm:text-base">{tx(product.title)}</h2>
        {formatPrice(product.price) && <p className="mt-1 text-sm font-semibold text-muru">{formatPrice(product.price)}</p>}
      </div>
    </a>
  )
}

function ContactCta() {
  const { tx } = useI18n()
  const telegramContact = social.telegramContact || social.telegram
  return (
    <section id="contact" className="scroll-mt-24 bg-[#fff0f5] px-4 py-12 text-center sm:px-6 sm:py-16">
      <p className="text-xs font-bold tracking-[0.22em] text-muru">{tx("CONTACT")}</p>
      <h2 className="mx-auto mt-3 max-w-2xl font-display text-3xl leading-tight text-ink sm:text-4xl lg:text-5xl">
        {tx("Need Help Choosing the Right Product?")}
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted">
        {tx("Our team is here to help you find the MURU products that fit your beauty routine.")}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a href="/#contact" className={btnClass}>
          {tx("Contact Us")}
        </a>
        {telegramContact && <a
          href={telegramContact}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-petal bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-muru hover:text-muru"
        >
          <IconTelegram className="h-4 w-4" />
          Telegram
        </a>}
        {social.facebook && <a
          href={social.facebook}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-petal bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-muru hover:text-muru"
        >
          <IconFacebook className="h-4 w-4" />
          Facebook
        </a>}
      </div>
    </section>
  )
}

function productImages(product) {
  const images = []
  if (Array.isArray(product.images)) images.push(...product.images.filter(Boolean))
  if (product.image && !images.includes(product.image)) images.unshift(product.image)
  return images
}

function ProductDetail({ product }) {
  const { tx } = useI18n()
  if (!product) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <p className="text-xs font-bold tracking-[0.22em] text-muru">{tx("PRODUCT")}</p>
        <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">{tx("Product Not Found")}</h1>
        <p className="mt-3 text-sm text-muted">{tx("This product is not in the MURU collection.")}</p>
        <a href="/products" className={`${btnClass} mt-8`}>
          <IconArrow className="h-4 w-4 rotate-180" />
          {tx("Back to Products")}
        </a>
      </main>
    )
  }

  return <DetailView product={product} />
}

function DetailView({ product }) {
  const { tx } = useI18n()
  const images = productImages(product)
  const [activeImage, setActiveImage] = useState(0)
  const gesture = useRef(null)
  const suppressPhotoClick = useRef(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [tab, setTab] = useState("Description")
  const photo = images[activeImage] || ""
  const details = [
    ["Size", product.size],
    ["Skin type", product.skinType],
    ["Ingredients", product.ingredients],
    ["How to use", product.howToUse],
  ].filter(([, value]) => value)
  const tags = [product.category, product.bestSeller && "Best Seller", product.isNew && "New"].filter(Boolean)
  const sameCategory = products.filter((item) => item.category === product.category && item.id !== product.id)
  const related = (sameCategory.length > 0 ? sameCategory : products.filter((item) => item.id !== product.id)).slice(0, 4)

  function showImage(next) {
    if (images.length < 2) return
    setActiveImage((next + images.length) % images.length)
  }

  function startSwipe(event) {
    suppressPhotoClick.current = false
    if (event.touches.length !== 1) { gesture.current = null; return }
    const touch = event.touches[0]
    gesture.current = { x: touch.clientX, y: touch.clientY, width: event.currentTarget.clientWidth, horizontal: false }
  }

  function moveSwipe(event) {
    const start = gesture.current
    if (!start || event.touches.length !== 1 || images.length < 2) return
    const dx = event.touches[0].clientX - start.x
    const dy = event.touches[0].clientY - start.y
    if (!start.horizontal) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return
      if (Math.abs(dy) >= Math.abs(dx)) { gesture.current = null; return }
      start.horizontal = true
    }
    suppressPhotoClick.current = true
    setDragging(true)
    const atEdge = (activeImage === 0 && dx > 0) || (activeImage === images.length - 1 && dx < 0)
    setDragOffset(Math.max(-start.width, Math.min(start.width, atEdge ? dx * 0.2 : dx)))
  }

  function endSwipe(event) {
    const start = gesture.current
    gesture.current = null
    setDragging(false)
    setDragOffset(0)
    if (!start || !event.changedTouches.length) return
    const touch = event.changedTouches[0]
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    if (Math.abs(dx) < Math.min(70, start.width * 0.18) || Math.abs(dx) <= Math.abs(dy)) return
    suppressPhotoClick.current = true
    setActiveImage(Math.max(0, Math.min(images.length - 1, activeImage + (dx < 0 ? 1 : -1))))
  }

  return (
    <main className="bg-white">
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex items-center gap-3">
          <a
            href="/products"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-petal bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:text-muru"
          >
            <IconArrow className="h-4 w-4 rotate-180" />
            {tx("Back")}
          </a>
          <nav aria-label={tx("Breadcrumb")} className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted">
            <a href="/products" className="hover:text-muru">{tx("Products")}</a>
            <span aria-hidden="true">/</span>
            <a href={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-muru">
              {tx(product.category)}
            </a>
          </nav>
        </div>

        <div className="mt-6 grid items-start gap-8 lg:grid-cols-2 lg:gap-14">
          <div>
            <div className="relative overflow-hidden rounded-2xl bg-[#f4f4f4]">
              <div className="touch-pan-y" onTouchStart={startSwipe} onTouchMove={moveSwipe} onTouchEnd={endSwipe} onTouchCancel={() => { gesture.current = null; setDragging(false); setDragOffset(0) }} onClickCapture={(event) => { if (suppressPhotoClick.current) { event.preventDefault(); event.stopPropagation(); suppressPhotoClick.current = false } }}>
                <div className={`flex will-change-transform motion-reduce:transition-none ${dragging ? "transition-none" : "transition-transform duration-300 ease-out"}`} style={{ transform: `translate3d(calc(${-activeImage * 100}% + ${dragOffset}px), 0, 0)` }}>
                  {(images.length ? images : [photo]).map((image, index) => <div key={image || "placeholder"} aria-hidden={index !== activeImage} inert={index !== activeImage} className="w-full shrink-0">
                    <PhotoPreview src={image} alt={tx(product.title)} className="block aspect-[4/5] w-full select-none sm:aspect-square [&_img]:pointer-events-none">
                      <ProductArt variant={product.variant} tone={product.tone} image={image} alt={tx(product.title)} />
                    </PhotoPreview>
                  </div>)}
                </div>
              </div>
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label={tx("Previous image")}
                    onClick={() => showImage(activeImage - 1)}
                    className="absolute top-1/2 left-3 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-md bg-white text-ink shadow-sm hover:text-muru sm:grid"
                  >
                    <IconChevron className="h-4 w-4 rotate-180" />
                  </button>
                  <button
                    type="button"
                    aria-label={tx("Next image")}
                    onClick={() => showImage(activeImage + 1)}
                    className="absolute top-1/2 right-3 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-md bg-white text-ink shadow-sm hover:text-muru sm:grid"
                  >
                    <IconChevron className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-3">
                {images.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    aria-label={`Show image ${index + 1}`}
                    aria-pressed={index === activeImage}
                    onClick={() => setActiveImage(index)}
                    className={`aspect-square overflow-hidden rounded-xl bg-[#f4f4f4] ${
                      index === activeImage ? "ring-2 ring-muru" : "ring-1 ring-transparent"
                    }`}
                  >
                    <img src={image} alt="" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-sm text-muted">{tx(product.category)}</p>
            <h1 className="mt-2 font-display text-3xl leading-tight text-ink sm:text-4xl">{tx(product.title)}</h1>
            {formatPrice(product.price) && <p className="mt-3 text-2xl font-semibold text-muru">{formatPrice(product.price)}</p>}
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted">{tx(product.benefit)}</p>

            {details.length > 0 && (
              <dl className="mt-6 space-y-3">
                {details.map(([label, value]) => (
                  <div key={label} className="text-sm text-ink">
                    <dt className="inline font-semibold">{tx(label)}</dt>
                    <dd className="inline text-muted"> : {tx(value)}</dd>
                  </div>
                ))}
              </dl>
            )}

            <a href="#contact" className={`${btnClass} mt-8`}>
              {tx("Inquire About Product")}
              <IconArrow className="h-4 w-4" />
            </a>

            <dl className="mt-8 space-y-3 border-t border-petal pt-6 text-sm">
              <div>
                <dt className="inline font-semibold text-ink">{tx("Tags")}</dt>
                <dd className="inline text-muted"> : {tags.map((tag) => tx(tag)).join(", ")}</dd>
              </div>
              {(social.facebook || social.telegram) && <div className="flex items-center gap-3">
                <dt className="font-semibold text-ink">{tx("Share")}</dt>
                <dd className="flex items-center gap-2">
                  {social.facebook && <a href={social.facebook} target="_blank" rel="noreferrer" aria-label={tx("Share on Facebook")} className="grid h-8 w-8 place-items-center rounded-full bg-[#f4f4f4] text-ink hover:bg-muru hover:text-white">
                    <IconFacebook className="h-3.5 w-3.5" />
                  </a>}
                  {social.telegram && <a href={social.telegram} target="_blank" rel="noreferrer" aria-label={tx("Share on Telegram")} className="grid h-8 w-8 place-items-center rounded-full bg-[#f4f4f4] text-ink hover:bg-muru hover:text-white">
                    <IconTelegram className="h-3.5 w-3.5" />
                  </a>}
                </dd>
              </div>}
            </dl>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="flex gap-6 overflow-x-auto border-b border-petal" role="tablist" aria-label={tx("Product information")}>
          {["Description", "Additional Information", "Reviews"].map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={tab === name}
              onClick={() => setTab(name)}
              className={`shrink-0 border-b-2 px-1 py-3 text-sm font-medium ${
                tab === name ? "border-muru text-ink" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {tx(name)}
            </button>
          ))}
        </div>
        <div className="py-8" role="tabpanel">
          {tab === "Description" && (
            <p className="max-w-3xl text-sm leading-7 text-muted">{tx(product.story || product.benefit)}</p>
          )}
          {tab === "Additional Information" && (
            details.length > 0 ? (
              <dl className="max-w-xl divide-y divide-petal">
                {details.map(([label, value]) => (
                  <div key={label} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr]">
                    <dt className="text-sm font-semibold text-ink">{tx(label)}</dt>
                    <dd className="text-sm text-muted">{tx(value)}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="max-w-xl text-sm leading-7 text-muted">
                {tx("Ask our team for the size, ingredients, and how to use this product.")}
              </p>
            )
          )}
          {tab === "Reviews" && (
            <ul className="grid gap-4 sm:grid-cols-3">
              {reviews.map((review) => (
                <li key={review.name} className="rounded-2xl bg-[#fafafa] p-5">
                  <p className="text-sm font-semibold text-ink">{review.name}</p>
                  <p className="mt-1 text-xs text-muted">{tx(review.place)}</p>
                  <p className="mt-3 text-sm leading-6 text-muted">"{tx(review.quote)}"</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h2 className="font-display text-3xl text-ink">{tx("Related Products")}</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {related.map((item) => (
            <ProductCard key={item.id} product={item} soft />
          ))}
        </div>
      </section>

      <ContactCta />
    </main>
  )
}
