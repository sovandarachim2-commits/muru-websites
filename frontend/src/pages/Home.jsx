import { useRef, useState } from "react"
import ProductArt from "../components/ProductArt"
import {
  IconArrow,
  IconChevron,
  IconDiamond,
  IconFlask,
  IconGift,
  IconHeadset,
  IconHeart,
  IconLeaf,
  IconShield,
  IconStar,
} from "../components/Icons"
import { btnClass, categories, formatPrice, perks, products, reviews, settings, social } from "../data/site"
import { settingText, useI18n } from "../data/i18n"

const icons = {
  leaf: IconLeaf,
  diamond: IconDiamond,
  shield: IconShield,
  headset: IconHeadset,
  flask: IconFlask,
  heart: IconHeart,
}

const bestSellers = products.filter((product) => product.bestSeller).slice(0, 6)

export default function Home() {
  const sellersRef = useRef(null)
  const reviewsRef = useRef(null)

  return (
    <main>
      {(settings.heroImage || settings.heroTitle) && <Hero />}
      <Collection />
      {settings.showPromotion && <Promotion />}
      {products.some((product) => product.bestSeller) && <BestSellers rowRef={sellersRef} />}
      {products.length > 0 && <ProductPreview />}
      {(settings.storyTitle || settings.storyImage) && <BrandStory />}
      {settings.showReviews && <Reviews rowRef={reviewsRef} />}
      <Questions />
    </main>
  )
}

function scrollRow(ref, direction) {
  const row = ref.current
  if (!row) return
  const card = row.querySelector("[data-card]")
  const width = card ? card.getBoundingClientRect().width + 20 : 280
  row.scrollBy({ left: direction * width, behavior: "smooth" })
}

function ArrowPair({ onPrev, onNext }) {
  const { tx } = useI18n()
  return (
    <div className="flex gap-2">
      <button
        type="button"
        aria-label={tx("Previous")}
        onClick={onPrev}
        className="grid h-10 w-10 place-items-center rounded-full border border-petal bg-white text-ink transition hover:border-muru hover:text-muru"
      >
        <IconChevron className="h-4 w-4 rotate-180" />
      </button>
      <button
        type="button"
        aria-label={tx("Next")}
        onClick={onNext}
        className="grid h-10 w-10 place-items-center rounded-full border border-petal bg-white text-ink transition hover:border-muru hover:text-muru"
      >
        <IconChevron className="h-4 w-4" />
      </button>
    </div>
  )
}

function Hero() {
  return (
    <>
      <MobileHero />
      <DesktopHero />
    </>
  )
}

function MobileHero() {
  const { lang, tx } = useI18n()
  function line(slide, field) {
    const key = slide[`${field}Key`]
    return key ? settingText(lang, key) : tx(slide[field])
  }
  const rowRef = useRef(null)
  const [active, setActive] = useState(0)
  const slides = [
    {
      eyebrowKey: "heroEyebrow",
      titleKey: "heroTitle",
      accentKey: "heroAccent",
      textKey: "heroDescription",
      buttonKey: "heroButton",
      eyebrow: settings.heroEyebrow,
      title: settings.heroTitle,
      accent: settings.heroAccent,
      text: settings.heroDescription,
      button: settings.heroButton,
      href: "#products",
      image: settings.heroImage || "/images/hero.jpg",
      alt: "Pink MURU bottles arranged together",
    },
    ...(settings.showPromotion
      ? [
          {
            eyebrow: "PROMOTION",
            titleKey: "promotionTitle",
            textKey: "promotionDescription",
            title: settings.promotionTitle,
            accent: "",
            text: settings.promotionDescription,
            button: "View the Edit",
            href: "/products",
            image: settings.promotionImage || "/images/cluster.jpg",
            alt: "Woman holding a pink bottle among cherry blossoms",
          },
        ]
      : []),
    {
      eyebrow: "BEST SELLERS",
      title: "Our Most Loved",
      accent: "Products",
      text: "The MURU favorites made for a simple daily routine.",
      button: "Best Sellers",
      href: "#bestsellers",
      image: "/images/banner.jpg",
      alt: "Woman with dewy skin framed by pink cherry blossoms",
    },
  ]

  function showSlide(index) {
    const row = rowRef.current
    const slide = row?.querySelectorAll("[data-slide]")[index]
    if (!row || !slide) return
    const first = row.querySelector("[data-slide]")
    row.scrollTo({ left: slide.offsetLeft - first.offsetLeft, behavior: "smooth" })
  }

  function syncSlide(event) {
    const row = event.currentTarget
    const cards = [...row.querySelectorAll("[data-slide]")]
    const middle = row.scrollLeft + row.clientWidth / 2
    const next = cards.findIndex((card) => middle >= card.offsetLeft && middle < card.offsetLeft + card.offsetWidth)
    if (next >= 0) setActive((current) => (current === next ? current : next))
  }

  return (
    <section className="pt-5 lg:hidden" aria-roledescription="carousel" aria-label={tx("Featured banners")}>
      <div
        ref={rowRef}
        onScroll={syncSlide}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4"
      >
        {slides.map((slide) => (
          <article
            key={slide.eyebrow}
            data-slide
            className="grid w-[88%] shrink-0 snap-center grid-cols-[1.2fr_0.8fr] overflow-hidden rounded-[28px] bg-[#fff4ee] sm:w-[78%]"
          >
            <div className="flex flex-col justify-center px-4 py-5">
              <p className="text-[0.65rem] font-bold tracking-[0.18em] text-muru">{line(slide, "eyebrow")}</p>
              <h1 className="mt-2 font-display text-[1.65rem] leading-[1.08] text-ink">
                {line(slide, "title")}
                {slide.accent && <span className="mt-1 block text-muru">{line(slide, "accent")}</span>}
              </h1>
              <p className="mt-2 line-clamp-3 text-xs leading-5 text-ink/70">{line(slide, "text")}</p>
              <a href={slide.href} className={`${btnClass} mt-4 w-fit whitespace-nowrap px-3.5 py-2 text-[11px]`}>
                {line(slide, "button")}
                <IconArrow className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="relative min-h-60">
              <img src={slide.image} alt={slide.alt} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#fff4ee] to-transparent" />
            </div>
          </article>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-1.5">
        {slides.map((slide, index) => (
          <button
            key={slide.eyebrow}
            type="button"
            aria-label={tx(slide.eyebrow)}
            aria-current={index === active ? "true" : undefined}
            onClick={() => showSlide(index)}
            className={`h-1.5 rounded-full transition ${index === active ? "w-5 bg-muru" : "w-1.5 bg-muru/30"}`}
          />
        ))}
      </div>
    </section>
  )
}

function DesktopHero() {
  const { lang, tx } = useI18n()
  return (
    <section className="hidden px-4 pt-5 sm:px-6 lg:block">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[28px] sm:rounded-[32px] lg:min-h-[720px]">
        <img
          src={settings.heroImage || "/images/hero.jpg"}
          alt="Woman with dewy skin framed by pink cherry blossoms"
          className="absolute inset-0 h-full w-full object-cover object-[68%_18%]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,#fff7f9_0%,rgba(255,247,249,0.94)_36%,rgba(255,247,249,0.4)_70%,rgba(255,247,249,0.16)_100%)]" />
        <p className="pointer-events-none absolute top-6 right-6 z-10 hidden font-script text-4xl text-muru drop-shadow-sm md:block lg:top-8 lg:right-8 lg:text-5xl">
          {tx("Glow Your Way")}
        </p>
        <div className="relative z-10 flex max-w-xl flex-col justify-center px-5 py-14 sm:px-10 sm:py-16 lg:min-h-[560px] lg:px-14 lg:pb-44">
          <p className="text-xs font-bold tracking-[0.22em] text-muru">{settingText(lang, "heroEyebrow")}</p>
          <h1 className="mt-4 font-display text-4xl leading-[1.05] text-ink sm:text-5xl lg:text-6xl">
            {settingText(lang, "heroTitle")}
            <span className="mt-1 block text-muru">{settingText(lang, "heroAccent")}</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-ink/70 sm:text-base">
            {settingText(lang, "heroDescription")}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#products" className={btnClass}>
              {settingText(lang, "heroButton")}
              <IconArrow className="h-4 w-4" />
            </a>
            <a
              href="#bestsellers"
              className="inline-flex items-center rounded-full bg-[#fff7f9] px-6 py-3 text-sm font-semibold text-ink transition hover:bg-white"
            >
              {tx("Best Sellers")}
            </a>
          </div>
        </div>
        <PerkList className="relative z-20 mx-4 mb-4 grid gap-3 sm:grid-cols-2 lg:absolute lg:inset-x-8 lg:bottom-8 lg:mx-0 lg:mb-0 lg:grid-cols-4" />
      </div>
    </section>
  )
}

function PerkList({ className }) {
  const { tx } = useI18n()
  return (
    <ul className={className}>
      {perks.map((perk) => {
        const Icon = icons[perk.icon]
        return (
          <li key={perk.title} className="flex items-start gap-3 rounded-2xl bg-[#fff7f9]/95 px-4 py-5 backdrop-blur-sm">
            <Icon className="mt-0.5 h-9 w-9 shrink-0 text-muru" />
            <div>
              <h2 className="text-sm font-bold text-ink">{tx(perk.title)}</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted">{tx(perk.text)}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function ProductCard({ product, className = "" }) {
  const { tx } = useI18n()
  return (
    <a
      href={`/products/${product.slug}`}
      data-card
      className={`rounded-3xl bg-[#fff7f9] p-2 transition hover:-translate-y-1 sm:p-3 ${className}`}
    >
      <div className="aspect-square overflow-hidden rounded-2xl bg-[#fff7f9]">
        <ProductArt variant={product.variant} tone={product.tone} image={product.image} alt={tx(product.title)} />
      </div>
      <h3 className="mt-3 px-1 text-sm font-semibold leading-snug text-ink sm:mt-4 sm:text-base">{tx(product.title)}</h3>
      {formatPrice(product.price) && <p className="mt-1 px-1 pb-2 text-sm font-semibold text-muru">{formatPrice(product.price)}</p>}
    </a>
  )
}

function ProductPreview() {
  const { tx } = useI18n()
  return (
    <section id="products" className="scroll-mt-24 mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-muru">{tx("PRODUCTS")}</p>
          <h2 className="mt-2 font-display text-4xl text-ink sm:text-5xl">{tx("The MURU Collection")}</h2>
        </div>
        <a href="/products" className="text-sm font-semibold text-muru hover:text-muru-deep">
          {tx("View all products")}
        </a>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {products.slice(0, 8).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}

function Collection() {
  const { tx } = useI18n()
  const rowRef = useRef(null)

  return (
    <section id="categories" className="scroll-mt-24 mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="flex flex-col items-center text-center mb-10">
        <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
          {tx("Browse By Categories")}
        </h2>
        <p className="mt-3 text-sm text-muted">
          {tx("Explore handpicked collections for every part of your beauty routine.")}
        </p>
      </div>

      <div className="relative group">
        <div ref={rowRef} className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-8 sm:gap-8 justify-start xl:justify-center px-4">
          {categories.map((category) => (
            <a
              key={category.title}
              href={`/products?category=${encodeURIComponent(category.title)}`}
              className="group/card flex w-24 sm:w-32 shrink-0 snap-start flex-col items-center transition-opacity hover:opacity-90"
            >
              <div className={`mb-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-full bg-[#f4f4f4] transition-all duration-300 group-hover/card:scale-105 group-hover/card:shadow-md border border-transparent group-hover/card:border-petal/50 ${category.image ? "" : "p-4"}`}>
                {category.image ? (
                  <img src={category.image} alt={tx(category.title)} className="block h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full">
                    <ProductArt variant={category.variant} tone={category.tone} alt={tx(category.title)} />
                  </div>
                )}
              </div>
              <h3 className="text-center text-sm font-semibold text-ink transition-colors group-hover/card:text-muru">
                {tx(category.title)}
              </h3>
            </a>
          ))}
        </div>

        <div className="pointer-events-none absolute top-1/2 left-0 right-0 -mt-10 hidden justify-between px-0 opacity-0 transition-opacity group-hover:opacity-100 sm:flex md:-mx-4 xl:hidden">
          <button
            type="button"
            aria-label={tx("Previous")}
            onClick={() => scrollRow(rowRef, -1)}
            className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full border border-petal bg-white text-ink shadow-sm transition hover:border-muru hover:text-muru"
          >
            <IconChevron className="h-4 w-4 rotate-180" />
          </button>
          <button
            type="button"
            aria-label={tx("Next")}
            onClick={() => scrollRow(rowRef, 1)}
            className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full border border-petal bg-white text-ink shadow-sm transition hover:border-muru hover:text-muru"
          >
            <IconChevron className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  )
}

function BrandStory() {
  return (
    <section id="about" className="scroll-mt-24">
      <Story />
      <Ingredients />
    </section>
  )
}

function Story() {
  const { lang, tx } = useI18n()
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="grid overflow-hidden rounded-[32px] bg-[#ffe4ef] lg:h-[440px] lg:grid-cols-[1fr_1.05fr_0.9fr]">
        <img
          src={settings.storyImage || "/images/banner.jpg"}
          alt="Woman holding a pink bottle among cherry blossoms"
          className="h-72 w-full object-cover lg:h-full lg:min-h-0"
        />
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <p className="text-xs font-bold tracking-[0.2em] text-muru">{tx("BEAUTY BEYOND SKIN")}</p>
          <h2 className="mt-3 font-display text-4xl leading-tight text-ink">
            {settingText(lang, "storyTitle")}
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            {settingText(lang, "storyDescription")}
          </p>
          <a href="#ingredients" className={`${btnClass} mt-6`}>
            {tx("Discover Our Story")}
            <IconArrow className="h-4 w-4" />
          </a>
        </div>
        <img
          src="/images/cluster.jpg"
          alt="A set of pink MURU skincare containers"
          className="h-72 w-full object-cover lg:h-full lg:min-h-0"
        />
      </div>
    </div>
  )
}

function Promotion() {
  const { lang, tx } = useI18n()
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#ffe4ef] text-muru">
            <IconGift className="h-5 w-5" />
          </span>
          <h2 className="text-xl font-bold text-ink sm:text-2xl">{tx("Promotions")}</h2>
        </div>
        <a href="/products" className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-muru">
          {tx("View All")}
          <IconChevron className="h-4 w-4" />
        </a>
      </div>
      <a href="/products" className="block overflow-hidden rounded-[28px]">
        <img
          src={settings.promotionImage || "/images/cluster.jpg"}
          alt={settingText(lang, "promotionTitle")}
          className="aspect-[16/10] w-full object-cover sm:aspect-[2.2/1]"
        />
      </a>
    </section>
  )
}

function BestSellers({ rowRef }) {
  const { tx } = useI18n()
  return (
    <section id="bestsellers" className="scroll-mt-24 mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.2em] text-muru">{tx("BEST SELLERS")}</p>
          <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl lg:text-5xl">{tx("Our Most Loved Products")}</h2>
        </div>
        <div className="hidden sm:block">
          <ArrowPair onPrev={() => scrollRow(rowRef, -1)} onNext={() => scrollRow(rowRef, 1)} />
        </div>
      </div>
      <div ref={rowRef} className="no-scrollbar grid grid-cols-2 gap-3 pb-2 sm:flex sm:snap-x sm:snap-mandatory sm:gap-5 sm:overflow-x-auto">
        {bestSellers.map((product) => (
          <ProductCard key={product.id} product={product} className="sm:w-[220px] sm:shrink-0 sm:snap-start" />
        ))}
      </div>
    </section>
  )
}

const ingredientPoints = [
  { icon: "flask", title: "ingredientPoint1Title", text: "ingredientPoint1Text" },
  { icon: "shield", title: "ingredientPoint2Title", text: "ingredientPoint2Text" },
  { icon: "heart", title: "ingredientPoint3Title", text: "ingredientPoint3Text" },
]

function Ingredients() {
  const { lang } = useI18n()
  return (
    <section id="ingredients" className="scroll-mt-24 mx-auto grid max-w-7xl items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-2">
      <img
        src={settings.ingredientImage || "/images/ingredient.jpg"}
        alt={settingText(lang, "ingredientTitle")}
        className="h-[420px] w-full rounded-[32px] object-cover"
      />
      <div>
        <p className="text-xs font-bold tracking-[0.2em] text-muru">{settingText(lang, "ingredientEyebrow")}</p>
        <h2 className="mt-3 font-display text-4xl text-ink sm:text-5xl">{settingText(lang, "ingredientTitle")}</h2>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">
          {settingText(lang, "ingredientDescription")}
        </p>
        <a href="#contact" className={`${btnClass} mt-6`}>
          {settingText(lang, "ingredientButton")}
          <IconArrow className="h-4 w-4" />
        </a>
        <ul className="mt-8 space-y-5">
          {ingredientPoints.map((item) => {
            const Icon = icons[item.icon]
            return (
              <li key={item.title} className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blush text-muru">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-ink">{settingText(lang, item.title)}</h3>
                  <p className="text-sm text-muted">{settingText(lang, item.text)}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

function Reviews({ rowRef }) {
  const { tx } = useI18n()
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.2em] text-muru">{tx("CUSTOMER REVIEWS")}</p>
          <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl lg:text-5xl">{tx("What Our Customers Say")}</h2>
        </div>
        <ArrowPair onPrev={() => scrollRow(rowRef, -1)} onNext={() => scrollRow(rowRef, 1)} />
      </div>
      <div ref={rowRef} className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2">
        {reviews.map((review, index) => (
          <article
            key={review.name}
            data-card
            className="w-[min(85vw,340px)] shrink-0 snap-start rounded-3xl border border-petal bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span
                className={`grid h-12 w-12 place-items-center rounded-full text-sm font-bold text-white ${
                  index === 1 ? "bg-[#f48fb1]" : index === 2 ? "bg-[#e45488]" : "bg-muru"
                }`}
              >
                {review.initials}
              </span>
              <div>
                <div className="flex text-[#f5b400]">
                  {Array.from({ length: 5 }, (_, star) => (
                    <IconStar key={star} className="h-4 w-4" />
                  ))}
                </div>
                <p className="text-sm font-bold text-ink">{review.name}</p>
                <p className="text-xs text-muted">{tx(review.place)}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink/80">"{tx(review.quote)}"</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function Questions() {
  const { lang, tx } = useI18n()
  const telegramContact = social.telegramContact || social.telegram
  return (
    <section
      id="contact"
      className="scroll-mt-24 relative overflow-hidden bg-[radial-gradient(circle_at_0%_100%,#ffd0e4,transparent_34%),radial-gradient(circle_at_100%_0%,#ffd6e8,transparent_30%),linear-gradient(90deg,#fff7fa,#ffe9f2)] px-4 py-16 text-center"
    >
      <h2 className="font-display text-3xl text-ink sm:text-4xl lg:text-5xl">{settingText(lang, "contactTitle")}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
        {settingText(lang, "contactDescription")}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <a href="#footer" className={btnClass}>
          {tx("Contact Us")}
        </a>
        {social.facebook && <a
          href={social.facebook}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[#1877f2] px-5 py-3 text-sm font-semibold text-white"
        >
          {tx("Message on Facebook")}
        </a>}
        {telegramContact && <a
          href={telegramContact}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[#2aa8e0] px-5 py-3 text-sm font-semibold text-white"
        >
          {tx("Chat on Telegram")}
        </a>}
      </div>
    </section>
  )
}
