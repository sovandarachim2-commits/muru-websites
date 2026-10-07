import { useEffect, useRef, useState } from "react"
import { useI18n, translate } from "../../data/i18n"
import { IconClose, IconSearch } from "../../components/Icons"

export function optionDefaults() {
  return Object.fromEntries(Object.entries({ packaging: ["pump", "jar", "dropper", "compact", "tube", "bottle"], colors: ["pink", "blue", "rose", "cream"] }).map(([key, values]) => [key, values.map((value) => ({ value, en: value[0].toUpperCase() + value.slice(1), km: translate("km", value) }))]))
}

export function optionLabel(options, group, value, lang) {
  const option = (options || optionDefaults())[group]?.find((entry) => entry.value === value)
  return option ? (lang === "km" ? option.km || option.en : option.en) : value
}

export default function ProductOptions({ initial, products, onSave }) {
  const { tx } = useI18n()
  const [options, setOptions] = useState(() => initial || optionDefaults())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [editor, setEditor] = useState(null)
  const [editorError, setEditorError] = useState("")
  const [query, setQuery] = useState("")
  const [groupFilter, setGroupFilter] = useState("all")
  const groups = [['packaging', 'Packaging', 'variant'], ['colors', 'Color', 'tone']]
  const rows = groups.flatMap(([group, title, field]) => options[group].map((entry, index) => ({ ...entry, group, title, field, index })))
  const visible = rows.filter((entry) => (groupFilter === "all" || entry.group === groupFilter) && `${entry.value} ${entry.en} ${entry.km}`.toLowerCase().includes(query.trim().toLowerCase()))
  const dialog = useRef(null)
  const editorOpen = Boolean(editor)
  useEffect(() => {
    if (editorOpen) dialog.current?.showModal()
  }, [editorOpen])
  function openEditor(group, title, field, index = null) {
    setEditorError("")
    setEditor({ group, title, field, index, ...(index === null ? { value: "", en: "", km: "" } : options[group][index]) })
  }
  async function applyOption(event) {
    event.preventDefault()
    if (busy) return
    const entry = { value: editor.value.trim(), en: editor.en.trim(), km: editor.km.trim() }
    if (!entry.en || !entry.km || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.value)) {
      setEditorError("Enter both labels and a valid value.")
      return
    }
    if (options[editor.group].some((item, index) => item.value === entry.value && index !== editor.index)) {
      setEditorError("That value is already in use.")
      return
    }
    const next = { ...options, [editor.group]: editor.index === null ? [...options[editor.group], entry] : options[editor.group].map((item, index) => index === editor.index ? entry : item) }
    setBusy(true)
    setEditorError("")
    try {
      await onSave(next)
      setOptions(next)
      setEditor(null)
      setError("")
    } catch (failure) { setEditorError(failure.message) } finally { setBusy(false) }
  }
  async function deleteOption(entry) {
    if (busy || products.some((product) => product[entry.field] === entry.value)) return
    const next = { ...options, [entry.group]: options[entry.group].filter((_, i) => i !== entry.index) }
    setBusy(true)
    setError("")
    try { await onSave(next); setOptions(next) } catch (failure) { setError(failure.message) } finally { setBusy(false) }
  }
  return <section className="mb-8 w-full min-w-0">
    <div className="mb-5 flex flex-wrap justify-end gap-3">
      <button type="button" disabled={busy || groups.every(([group]) => options[group].length >= 40)} className="inline-flex min-h-[42px] items-center justify-center rounded-md bg-[#d52c63] px-[18px] py-2.5 text-[14px] font-semibold text-white hover:bg-[#b92153]" onClick={() => { const group = groups.find(([key]) => key === groupFilter && options[key].length < 40) || groups.find(([key]) => options[key].length < 40); openEditor(...group) }}>+ {tx("Add new")}</button>
    </div>
    {error && <p role="alert" className="text-red-700">{tx(error)}</p>}
    <div className="mb-5 flex flex-wrap items-center gap-3 [&>select]:w-auto! [&>select]:max-w-full">
      <label className="relative min-w-[180px] flex-1 [&_input]:pl-9!"><IconSearch className="absolute top-[13px] left-3 size-4 text-[#777a83]" /><input aria-label={tx("Search options")} placeholder={tx("Search options")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <select aria-label={tx("Filter type")} value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)}><option value="all">{tx("All types")}</option>{groups.map(([group, title]) => <option key={group} value={group}>{tx(title)}</option>)}</select>
      <span className="ml-auto text-[13px] text-[#777a83]">{visible.length} {tx("options")}</span>
    </div>
    <div className="w-full overflow-x-auto rounded-md border border-[#e5e7eb] bg-white"><table className="w-full min-w-[680px] table-fixed border-collapse text-left">
      <colgroup><col className="w-[44px]" /><col className="w-[130px]" /><col className="w-[20%]" /><col /><col /><col className="w-[108px]" /></colgroup>
      <thead><tr className="bg-[#fafbfc] text-[12px] font-medium text-[#777a83]">{["No.", "Type", "Value", "Label EN", "Khmer label", "Actions"].map((label) => <th key={label} scope="col" className="px-2.5 py-3">{tx(label)}</th>)}</tr></thead>
      <tbody>{visible.map((entry, rowIndex) => <tr key={`${entry.group}-${entry.value}`} className="border-t border-[#edf0f2] text-[13px]">
        <td className="px-2.5 py-3 text-[#777a83]">{rowIndex + 1}</td><td className="break-words px-2.5 py-3">{tx(entry.title)}</td><td className="break-words px-2.5 py-3 text-[#50525b]">{entry.value}</td><td className="break-words px-2.5 py-3 font-semibold">{entry.en}</td><td lang="km" className="break-words px-2.5 py-3">{entry.km}</td>
        <td className="px-2.5 py-3"><div className="flex gap-3"><button type="button" disabled={busy} className="font-medium text-[#4f515b]" onClick={() => openEditor(entry.group, entry.title, entry.field, entry.index)}>{tx("Edit")}</button><button type="button" title={products.some((product) => product[entry.field] === entry.value) ? tx("Used by a product") : tx("Delete")} aria-label={`${tx("Delete")} ${entry.en}`} disabled={busy || products.some((product) => product[entry.field] === entry.value)} className="font-medium text-[#bf4351]" onClick={() => deleteOption(entry)}>{tx("Delete")}</button></div></td>
      </tr>)}</tbody>
    </table>{!visible.length && <div className="px-5 py-[60px] text-center text-[#777a83]"><h2 className="text-[18px] font-semibold">{tx("No options found")}</h2></div>}</div>
    {editor && <dialog ref={dialog} aria-labelledby="option-dialog-title" onCancel={(event) => { if (busy) event.preventDefault(); else setEditor(null) }} className="m-auto max-h-[calc(100svh_-_32px)] w-[min(480px,calc(100%_-_32px))] overflow-y-auto rounded-lg border border-[#e5e7eb] bg-white p-6 text-[#24252a] backdrop:bg-[#18181b70]">
      <div className="mb-5 flex items-center justify-between gap-3"><h2 id="option-dialog-title" className="text-lg font-semibold">{tx(editor.index === null ? "Add new" : "Edit")} {tx(editor.title)}</h2><button type="button" disabled={busy} aria-label={tx("Close dialog")} className="grid size-8 place-items-center" onClick={() => setEditor(null)}><IconClose className="size-5" /></button></div>
      <form onSubmit={applyOption}><fieldset disabled={busy} className="grid min-w-0 gap-4">
        {editorError && <p role="alert" className="text-sm text-red-700">{tx(editorError)}</p>}
        {editor.index === null && <label className="grid gap-2 text-[13px] font-medium">{tx("Type")}<select className="min-h-[42px] w-full rounded-md border border-[#dfe1e6] bg-white px-3 py-2" value={editor.group} onChange={(event) => { const [group, title, field] = groups.find(([key]) => key === event.target.value); setEditor({ ...editor, group, title, field }); setEditorError("") }}>{groups.map(([group, title]) => <option key={group} value={group} disabled={options[group].length >= 40}>{tx(title)}</option>)}</select></label>}
        {[["value", "Value", 20], ["en", "Label EN", 80], ["km", "Khmer label", 80]].map(([key, label, maxLength]) => <label key={key} className="grid gap-2 text-[13px] font-medium">{tx(label)}<input autoFocus={key === "en"} required maxLength={maxLength} lang={key === "km" ? "km" : "en"} pattern={key === "value" ? "[a-z0-9]+(-[a-z0-9]+)*" : undefined} readOnly={key === "value" && editor.index !== null && products.some((product) => product[editor.field] === options[editor.group][editor.index].value)} value={editor[key]} onChange={(event) => setEditor({ ...editor, [key]: event.target.value })} className="min-h-[42px] w-full rounded-md border border-[#dfe1e6] px-3 py-2 text-[14px] outline-none focus:border-[#d52c63]" /></label>)}
        <div className="mt-2 flex justify-end gap-3"><button type="button" className="rounded-md border border-[#dfe1e6] px-4 py-2" onClick={() => setEditor(null)}>{tx("Cancel")}</button><button className="rounded-md bg-[#d52c63] px-4 py-2 font-semibold text-white">{tx(busy ? "Saving..." : "Save")}</button></div>
      </fieldset>
      </form>
    </dialog>}
  </section>
}
