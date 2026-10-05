import { lazy, Suspense } from "react"
import Header from "./components/Header"
import Footer from "./components/Footer"
import { IconTelegram } from "./components/Icons"
import Home from "./pages/Home"
import Product from "./pages/Product"
import { social } from "./data/site"
import { LanguageProvider, useI18n } from "./data/i18n"

const Admin = lazy(() => import("./pages/admin/Admin"))

export default function App() {
  const admin = /^\/admin(?:\/|$)/.test(window.location.pathname)
  return (
    <LanguageProvider>
      {admin ? (
        <Suspense fallback={null}>
          <Admin />
        </Suspense>
      ) : (
        <Storefront isProductsPage={window.location.pathname.startsWith("/products")} />
      )}
    </LanguageProvider>
  )
}

function Storefront({ isProductsPage }) {
  const { tx } = useI18n()
  return (
    <div className="min-h-screen bg-white font-sans text-ink antialiased">
      <Header activePage={isProductsPage ? "products" : undefined} />
      {isProductsPage ? <Product /> : <Home />}
      <Footer />
      <a
        href={social.telegram}
        target="_blank"
        rel="noreferrer"
        aria-label={tx("Chat on Telegram")}
        className="fixed right-4 bottom-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#2AABEE] text-white shadow-[0_10px_24px_rgba(42,171,238,0.4)] transition hover:bg-[#229ED9]"
      >
        <IconTelegram className="h-7 w-7" />
      </a>
    </div>
  )
}
