import { useEffect, useRef, useState } from "react"
import { IconClose } from "./Icons"

function PhotoDialog({ src, alt, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    const previous = document.activeElement
    const overflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = "hidden"
    return () => {
      dialog.close()
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [])
  return <dialog ref={ref} aria-label={alt || "Full photo"} className="m-auto h-[100svh] max-h-none w-screen max-w-none border-0 bg-black/90 p-4 text-white backdrop:bg-black/80" onCancel={(event) => { event.preventDefault(); onClose() }} onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <button type="button" autoFocus aria-label="Close full photo" title="Close" className="absolute right-4 top-4 z-10 grid size-11 place-items-center rounded bg-black/70 hover:bg-black" onClick={onClose}><IconClose className="size-6" /></button>
    <img src={src} alt={alt} className="!mx-auto !h-full !max-h-full !w-full !max-w-full !rounded-none !object-contain" />
  </dialog>
}

export default function PhotoPreview({ src, alt = "Photo", className = "", children }) {
  const [open, setOpen] = useState(false)
  return <>
    <button type="button" disabled={!src} aria-label={`View full photo: ${alt}`} title="View full photo" className={`${className} ${src ? "cursor-zoom-in" : ""}`} onClick={() => setOpen(true)}>{children}</button>
    {open && src && <PhotoDialog src={src} alt={alt} onClose={() => setOpen(false)} />}
  </>
}
