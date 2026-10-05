import { useEffect, useState } from "react"
import { cmsRequest } from "../../data/cms"
import { AdminFormDialog, ErrorCard, newId } from "./AdminControls"

const blankUser = { email: "", username: "", name: "", role: "", active: true, password: "" }
const blankRole = { id: "", name: "", permissions: [] }

export default function UserManagement({ permissions, email, view }) {
  const [data, setData] = useState(null)
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState("")
  async function load() { setData(await cmsRequest("access")) }
  useEffect(() => { load().catch((failure) => setError(failure.message)) }, [])
  async function save(kind, values) {
    setBusy(true)
    setError("")
    setNotice("")
    try { await cmsRequest("access", { kind, ...values }); await load(); setError(""); setUser(null); setRole(null); setNotice("Changes saved.") }
    catch (failure) { setError(failure.message) }
    finally { setBusy(false) }
  }
  const button = "rounded-md border border-[#dcdfe4] px-3 py-2 text-sm disabled:opacity-50"
  const form = "grid gap-4 [&_label]:grid [&_label]:gap-2 [&_label]:text-sm"
  return <div className="space-y-8">
    {error && <ErrorCard message={error} onClose={() => setError("")} />}{notice && <p role="status" className="text-green-700">{notice}</p>}
    {!data ? <p>Loading...</p> : <>
      {view === "users" && permissions.includes("users") && <section><div className="flex items-center justify-between gap-4"><h2 className="text-lg font-semibold">Users</h2><button className={button} disabled={busy || !Object.keys(data.roles).length} onClick={() => { setError(""); setRole(null); setUser({ ...blankUser, role: Object.keys(data.roles)[0] || "" }) }}>+ Add user</button></div>
        {user && <AdminFormDialog title={user.existing ? "Edit user" : "New user"} busy={busy} onClose={() => { setUser(null); setError("") }}><form className={form} onSubmit={(event) => { event.preventDefault(); save("users", user) }}><fieldset disabled={busy} className="grid gap-4"><label>Name<input required maxLength={80} value={user.name} onChange={(event) => setUser({ ...user, name: event.target.value })} /></label><label>Username<input required minLength={3} maxLength={40} pattern="[a-zA-Z0-9][a-zA-Z0-9._-]{2,39}" value={user.username || ""} onChange={(event) => setUser({ ...user, username: event.target.value })} /></label><label>Email<input type="email" required disabled={user.existing} value={user.email} onChange={(event) => setUser({ ...user, email: event.target.value })} /></label><label>Role<select required value={user.role} onChange={(event) => setUser({ ...user, role: event.target.value })}>{Object.entries(data.roles).map(([id, entry]) => <option key={id} value={id}>{entry.name}</option>)}</select></label><label>{user.existing ? "Reset password" : "Password"}<input type="password" autoComplete="new-password" required={!user.existing} minLength={8} maxLength={256} value={user.password} onChange={(event) => setUser({ ...user, password: event.target.value })} /></label><label className="flex! items-center"><input type="checkbox" checked={user.active} onChange={(event) => setUser({ ...user, active: event.target.checked })} />Active</label></fieldset><div className="flex gap-3"><button disabled={busy} className={button}>Save user</button><button type="button" disabled={busy} className={button} onClick={() => setUser(null)}>Cancel</button></div></form></AdminFormDialog>}
        <div className="mt-4 overflow-x-auto rounded-md border border-[#e5e7eb] bg-white"><table className="w-full border-collapse text-left whitespace-nowrap [&_th]:bg-[#fafbfc] [&_th]:px-[18px] [&_th]:py-3.5 [&_th]:text-[12px] [&_th]:font-medium [&_th]:text-[#777a83] [&_td]:border-t [&_td]:border-[#edf0f2] [&_td]:px-[18px] [&_td]:py-4 [&_td]:text-[13px]"><thead><tr><th scope="col" className="w-16">No</th><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>{data.users.map((entry, index) => <tr key={entry.email}><td className="text-[#777a83]">{index + 1}</td><td>{entry.name}</td><td>{entry.username || "-"}</td><td>{entry.email}</td><td>{entry.role === "owner" ? "Owner" : data.roles[entry.role]?.name}</td><td><span className={`inline-block rounded px-[9px] py-1 text-[12px] ${entry.active ? "bg-[#eaf6ee] text-[#24724c]" : "bg-[#faf2dc] text-[#7b6433]"}`}>{entry.active ? "Active" : "Disabled"}</span></td><td>{entry.role !== "owner" && entry.email !== email && <div className="flex gap-4 [&_button]:font-medium [&_button]:text-[#4f515b]"><button disabled={busy} onClick={() => { setError(""); setRole(null); setUser({ ...entry, existing: true, password: "" }) }}>Edit</button><button disabled={busy} className="text-[#bf4351]!" onClick={() => { if (window.confirm(`Delete ${entry.email}?`)) save("users", { email: entry.email, delete: true }) }}>Delete</button></div>}</td></tr>)}</tbody></table></div>
      </section>}
      {view === "roles" && permissions.includes("roles") && <section><div className="flex items-center justify-between gap-4"><h2 className="text-lg font-semibold">Roles & permissions</h2><button className={button} disabled={busy} onClick={() => { setError(""); setUser(null); setRole({ ...blankRole, id: newId() }) }}>+ Add role</button></div>
        {role && <AdminFormDialog title={role.existing ? "Edit role" : "New role"} busy={busy} onClose={() => { setRole(null); setError("") }}><form className={form} onSubmit={(event) => { event.preventDefault(); save("roles", role) }}><fieldset disabled={busy} className="grid gap-4"><label>Role name<input required maxLength={80} value={role.name} onChange={(event) => setRole({ ...role, name: event.target.value })} /></label><div className="grid grid-cols-2 gap-3">{data.permissions.map((grant) => <label key={grant} className="flex! items-center"><input type="checkbox" checked={role.permissions.includes(grant)} onChange={(event) => setRole({ ...role, permissions: event.target.checked ? [...role.permissions, grant] : role.permissions.filter((value) => value !== grant) })} />{grant.charAt(0).toUpperCase() + grant.slice(1)}</label>)}</div></fieldset><div className="flex gap-3"><button disabled={busy} className={button}>Save role</button><button type="button" disabled={busy} className={button} onClick={() => setRole(null)}>Cancel</button></div></form></AdminFormDialog>}
        <div className="mt-4 overflow-x-auto rounded-md border border-[#e5e7eb] bg-white"><table className="w-full text-left text-sm [&_th]:bg-[#fafbfc] [&_th]:p-4 [&_th]:text-xs [&_th]:font-medium [&_th]:text-[#777a83] [&_td]:border-t [&_td]:border-[#edf0f2] [&_td]:p-4"><thead><tr><th scope="col" className="w-16">No</th><th>Role</th><th>Permissions</th><th>Actions</th></tr></thead><tbody><tr><td className="text-[#777a83]">1</td><td className="font-semibold">Owner</td><td>All permissions</td><td /></tr>{Object.entries(data.roles).map(([id, entry], index) => <tr key={id}><td className="text-[#777a83]">{index + 2}</td><td className="font-semibold">{entry.name}</td><td className="text-[#777a83]">{entry.permissions.join(", ") || "No editing permissions"}</td><td><div className="flex gap-4 font-medium text-[#4f515b]"><button disabled={busy} onClick={() => { setError(""); setUser(null); setRole({ id, ...entry, existing: true }) }}>Edit</button><button disabled={busy} className="text-[#bf4351]!" onClick={() => { if (window.confirm(`Delete ${entry.name}?`)) save("roles", { id, delete: true }) }}>Delete</button></div></td></tr>)}</tbody></table></div>
      </section>}
    </>}
  </div>
}
