import { infoLinks, productLinks, settings, social } from "../data/site"
import { settingText, useI18n } from "../data/i18n"
import { IconArrow, IconFacebook, IconInstagram, IconTelegram, IconTikTok } from "./Icons"

const socialItems = [
  { label: "Facebook", key: "facebook", Icon: IconFacebook, color: "bg-[#1877f2]" },
  { label: "Instagram", key: "instagram", Icon: IconInstagram, color: "bg-[#c13584]" },
  { label: "TikTok", key: "tiktok", Icon: IconTikTok, color: "bg-black border border-white/30" },
  { label: "Telegram", key: "telegram", Icon: IconTelegram, color: "bg-[#0088cc]" },
]

export default function Footer() {
  const { lang, tx } = useI18n()
  const telegramContact = social.telegramContact || social.telegram
  const socials = socialItems.flatMap(({ label, key, Icon, color }) => social[key] ? [{ label, href: social[key], Icon, color }] : [])
  const contact = [
    social.phone ? { label: social.phone, href: `tel:${social.phone.replace(/[^\d+]/g, "")}`, Icon: IconPhone } : null,
    social.email ? { label: social.email, href: `mailto:${social.email}`, Icon: IconMail } : null,
    social.address ? { label: social.address, href: `https://maps.google.com/?q=${encodeURIComponent(social.address)}`, Icon: IconPin } : null,
  ].filter(Boolean)
  return (
    <footer id="footer" className="relative bg-[#09131D] text-white">
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-full h-12 w-full text-[#f7d6e6] sm:h-16" aria-hidden="true">
        <path fill="currentColor" d="M0 80C220 18 460 72 760 42s460-28 680 8v30H0Z" />
      </svg>

      <div className="relative overflow-hidden">
        <Blossoms className="pointer-events-none absolute -bottom-8 -left-6 w-36 text-[#f7b7cf] opacity-70 sm:w-48 md:-bottom-10 md:-left-8 md:opacity-90" />
        <Blossoms className="pointer-events-none absolute -right-8 -bottom-6 w-44 rotate-12 text-[#f4a8c4] opacity-60 sm:w-64 md:-right-10 md:-bottom-8 md:opacity-90" />

        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.25fr_0.8fr_0.95fr_1.15fr] lg:gap-8 lg:py-14">
          <div className="col-span-2 lg:col-span-1">
            <a href="/" className="relative inline-block pt-5 text-3xl font-extrabold tracking-[0.16em] text-muru">
              {!settings.logo && <MuruFlower className="absolute top-0 left-1/2 h-6 w-6 -translate-x-1/2 text-muru" />}
              {settings.logo ? <img src={settings.logo} alt={settings.brand} className="h-16 w-auto max-w-[200px] object-contain" /> : settings.brand}
            </a>
            <p className="mt-5 text-sm font-semibold text-white">{settingText(lang, "tagline")}</p>
            <p className="mt-2 max-w-[16rem] text-sm leading-6 text-white/55">
              {tx("Because you deserve to feel beautiful, inside and out.")}
            </p>
            <h2 className="mt-6 text-sm font-semibold text-white">{tx("Follow us")}</h2>
            <div className="mt-3 flex flex-wrap gap-3">
              {socials.map(({ label, href, Icon, color }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} title={label} className={`grid size-10 place-items-center rounded-full text-white transition hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${color}`}>
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title={tx("Products")} links={productLinks.map((link) => ({ ...link, label: tx(link.label) }))} />
          <FooterColumn title={tx("Information")} links={infoLinks.map((link) => ({ ...link, label: tx(link.label) }))} />

          <div className="col-span-2 min-w-0 lg:col-span-1">
            <h2 className="text-sm font-semibold text-white">{tx("Contact")}</h2>
            <ul className="mt-4 space-y-3">
              {contact.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a href={href} className="inline-flex min-w-0 items-start gap-3 text-sm text-white/70 hover:text-white">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-white/80" />
                    <span className="break-words">{tx(label)}</span>
                  </a>
                </li>
              ))}
            </ul>
            {telegramContact && <a
              href={telegramContact}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-muru px-4 py-2.5 text-sm font-semibold text-white hover:bg-muru-deep"
            >
              <IconTelegram className="h-4 w-4" />
              {tx("Chat on Telegram")}
              <IconArrow className="h-4 w-4" />
            </a>}
          </div>
        </div>

        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-3 border-t border-white/10 px-4 py-5 text-center text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left">
          <p>© 2026 {settings.brand}. {tx("All rights reserved.")}</p>
          <p className="flex flex-wrap justify-center gap-x-3 gap-y-1 sm:justify-end">
            <a href="#footer" className="hover:text-white">{tx("Privacy")}</a>
            <span aria-hidden="true">|</span>
            <a href="#footer" className="hover:text-white">{tx("Terms & Conditions")}</a>
            <span aria-hidden="true">|</span>
            <a href="/" className="hover:text-white">{tx("Sitemap")}</a>
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }) {
  return (
    <div className="min-w-0">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <a href={link.href} className="block text-sm leading-5 text-white/65 transition hover:text-white">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function MuruFlower({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="currentColor" aria-hidden="true">
      <FlowerMark />
    </svg>
  )
}

function Blossoms({ className }) {
  return (
    <svg viewBox="0 0 240 260" className={className} fill="currentColor" aria-hidden="true">
      <FlowerMark x="78" y="148" scale="1.15" />
      <FlowerMark x="148" y="198" scale="0.7" />
      <FlowerMark x="34" y="210" scale="0.48" />
    </svg>
  )
}

function FlowerMark({ x = 32, y = 32, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {[0, 90, 180, 270].map((angle) => (
        <path key={angle} transform={`rotate(${angle})`} d="M0 3C-8 3-18-4-18-13c0-7 5-12 11-12 4 0 6 2 7 5 1-3 3-5 7-5 6 0 11 5 11 12 0 9-10 16-18 16Z" />
      ))}
      <circle r="3.5" />
    </g>
  )
}

function IconPhone(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" {...props}>
      <path d="M8 4h2l1 4-2 1a12 12 0 0 0 6 6l1-2 4 1v2a2 2 0 0 1-2 2A14 14 0 0 1 6 6a2 2 0 0 1 2-2Z" strokeLinejoin="round" />
    </svg>
  )
}

function IconMail(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  )
}

function IconPin(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" {...props}>
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  )
}
