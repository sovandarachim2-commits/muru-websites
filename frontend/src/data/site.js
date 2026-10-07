import { cmsRequest } from "./cms"

export const defaultSocial = {
  facebook: "",
  instagram: "",
  tiktok: "",
  telegram: "",
  telegramContact: "",
  phone: "+855 12 345 678",
  email: "info@muru.com",
  address: "Phnom Penh, Cambodia",
}

export function normalizeSocial(value) {
  const source = value && typeof value === "object" ? value : {}
  return Object.fromEntries(Object.keys(defaultSocial).map((key) => [key, typeof source[key] === "string" ? source[key] : defaultSocial[key]]))
}

export let social = normalizeSocial()

export const nav = [
  { id: "top", label: "Home", href: "/" },
  { id: "categories", label: "Categories", href: "/#categories" },
  { id: "products", label: "Products", href: "/products" },
  { id: "about", label: "About Us", href: "/#about" },
  { id: "contact", label: "Contact", href: "/#contact" },
]

export const perks = [
  { icon: "leaf", title: "Authentic Products", text: "100% genuine and quality" },
  { icon: "diamond", title: "Quality Ingredients", text: "Safe & effective for your skin" },
  { icon: "shield", title: "Trusted Brand", text: "Loved by thousands of customers" },
  { icon: "headset", title: "Customer Support", text: "We're always here for you" },
]

export let categories = []

export const initialProducts = []

export function formatPrice(price) {
  const amount = Number(price)
  if (!Number.isFinite(amount)) return ""
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
}

export let catalogProducts = initialProducts
export let products = initialProducts

export let settings = {
  logo: "", favicon: "",
  brand: "MURU", tagline: "",
  heroEyebrow: "", heroTitle: "", heroAccent: "", heroDescription: "",
  heroButton: "Explore Products", heroImage: "",
  catalogTitle: "Products", catalogDescription: "",
  storyTitle: "", storyDescription: "", storyImage: "",
  ingredientEyebrow: "OUR INGREDIENT STORY",
  ingredientTitle: "Beauty You Can Trust",
  ingredientDescription: "We carefully select high-quality ingredients to create safe, effective, and gentle products for your skin.",
  ingredientButton: "Learn More",
  ingredientPoint1Title: "Natural Ingredients",
  ingredientPoint1Text: "Gentle and skin-friendly.",
  ingredientPoint2Title: "Safe Formulation",
  ingredientPoint2Text: "Dermatologically tested.",
  ingredientPoint3Title: "Real Results",
  ingredientPoint3Text: "Loved by our customers.",
  ingredientImage: "",
  promotionTitle: "", promotionDescription: "", promotionImage: "",
  contactTitle: "Contact", contactDescription: "",
  accentColor: "#e83e73", bodyFont: "DM Sans", showPromotion: false, showReviews: false,
}

export function defaultCmsState() {
  return { products: [], categories: [], social: { ...social }, settings: { ...settings } }
}

export async function loadCatalog() {
  try {
    const { state } = await cmsRequest("catalog", undefined, 3000)
    if (!state) return
    catalogProducts = state.products
    products = state.products.filter((product) => product.status !== "draft")
    categories = state.categories
    productLinks = [{ label: "New Arrivals", href: "/products?category=New%20Arrivals" }, ...categories.map((category) => ({ label: category.title, href: `/products?category=${encodeURIComponent(category.title)}` }))]
    social = normalizeSocial(state.social)
    settings = { ...settings, ...state.settings }
    const favicon = document.querySelector('link[rel="icon"]')
    if (favicon) {
      favicon.href = settings.favicon || "/favicon.svg"
      if (settings.favicon) favicon.removeAttribute("type")
    }
    document.documentElement.style.setProperty("--color-muru", settings.accentColor)
    document.documentElement.style.setProperty("--color-muru-deep", settings.accentColor)
    document.documentElement.style.setProperty("--font-sans", `"${settings.bodyFont}", "Kantumruy Pro", system-ui, sans-serif`)
    document.title = `${settings.brand} | ${settings.tagline}`
  } catch {
    // Keep the catalog empty when content is unavailable.
  }
}

export const promises = [
  { icon: "flask", title: "Natural Ingredients", text: "Gentle and skin-friendly." },
  { icon: "shield", title: "Safe Formulation", text: "Dermatologically tested." },
  { icon: "heart", title: "Real Results", text: "Loved by our customers." },
]

export const reviews = []

export let productLinks = []

export const infoLinks = [
  { label: "About Us", href: "/#about" },
  { label: "Contact", href: "/#contact" },
  { label: "FAQ", href: "/#contact" },
  { label: "Privacy Policy", href: "#footer" },
  { label: "Terms & Conditions", href: "#footer" },
]

export const btnClass =
  "inline-flex items-center gap-2 rounded-full bg-muru px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(242,84,138,0.28)] transition hover:bg-muru-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muru"
