import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const allVehicles = [
  { brand: "Renault", model: "Zoe Intens 50 c/ Bateria".trim(), price: 13450, year: 2021, km: 60000, cv: 109, color: "Branco", battery: "50 kWh", warranty: "18 meses", highlight: "Garantia 18 meses", img: "https://cloud.whc.pt/subscribers/323/vehicles/3084784396999e08d9d99a956985958.webp?w=1024", url: "https://sagiracing.pt/carros-eletricos-usados-viana-do-castelo/63895/renault-zoe-c-bateria-intens-50" },
  { brand: "Citroën", model: "ë-C4 50 kWh Feel Pack".trim(), price: 16490, year: 2021, km: 39000, cv: 136, color: "Verde", battery: "50 kWh", warranty: "18 meses", highlight: "Cor Verde exclusiva", img: "https://cloud.whc.pt/subscribers/323/vehicles/104439930069a32e9b86d42320233761.webp?w=1024", url: "https://sagiracing.pt/carros-eletricos-usados-viana-do-castelo/64404/citroen-e-c4-50-kwh-feel-pack" },

  { brand: "Peugeot", model: "e-208 50 kWh Style".trim(), price: 18980, year: 2024, km: 29000, cv: 136, color: "Preto", battery: "50 kWh", warranty: "18 meses", highlight: "Navegação · Ano 2024 — como novo", img: "https://cloud.whc.pt/subscribers/323/vehicles/69550412369ab1e0859ae3233661188.webp?w=1024", url: "https://sagiracing.pt/carros-eletricos-usados-viana-do-castelo/64823/peugeot-e-208-50-kwh-style" },
  { brand: "Tesla", model: "Model 3 Standard RWD".trim(), price: 26890, year: 2022, km: 80000, cv: 283, color: "Branco", battery: "60 kWh", warranty: "18 meses", highlight: "IVA dedutível · Autopilot", img: "https://cloud.whc.pt/subscribers/323/vehicles/19678367069be758283a82171314439.webp?w=1024", url: "https://sagiracing.pt/carros-eletricos-usados-viana-do-castelo/65857/tesla-model-3-standard-rwd" },
  { brand: "Renault", model: "Mégane E-Tech EV60 Techno".trim(), price: 27400, year: 2024, km: 42000, cv: 218, color: "Preto", battery: "60 kWh", warranty: "18 meses", highlight: "Navegação · Ano 2024 — como novo", img: "https://cloud.whc.pt/subscribers/323/vehicles/178924831469ab183675e85689389865.webp?w=1024", url: "https://sagiracing.pt/carros-eletricos-usados-viana-do-castelo/64817/renault-megane-e-tech-ev60-techno" },
  { brand: "Tesla", model: "Model Y RWD".trim(), price: 32890, year: 2024, km: 129000, cv: 340, color: "Branco", battery: "60 kWh", warranty: "18 meses", highlight: "Estofos pele · Navegação", img: "https://cloud.whc.pt/subscribers/323/vehicles/63303489569b57162c055a125908420.webp?w=1024", url: "https://sagiracing.pt/carros-eletricos-usados-viana-do-castelo/65355/tesla-model-y-rwd" },
  { brand: "Ford", model: "Mustang Mach-E Standard".trim(), price: 34900, year: 2024, km: 30000, cv: 269, color: "Branco", battery: "50 kWh", warranty: "18 meses + baterias até 2032", highlight: "Garantia baterias até 2032 · Teto panorâmico", img: "https://cloud.whc.pt/subscribers/323/vehicles/34581239969343599ec694074516308.webp?w=1024", url: "https://sagiracing.pt/carros-eletricos-usados-viana-do-castelo/59359/ford-mustang-mach-e-standard" },
]

function formatPrice(p: number) {
  return p.toLocaleString('pt-PT') + ' €'
}
function formatKm(km: number) {
  return km.toLocaleString('pt-PT') + ' km'
}

const whatsappMsg = encodeURIComponent("Olá! Vi o vosso stock de elétricos e gostaria de saber mais informações.")
const whatsappUrl = `https://wa.me/351969172360?text=${whatsappMsg}`
const messengerUrl = "https://m.me/379244668597942"

type VehicleData = typeof allVehicles[0]
type AdminState = { sold: string[]; edits: Record<string, Partial<VehicleData>>; deleted: string[] }

function getVehicleId(v: VehicleData) {
  const parts = v.url.split('/').filter(Boolean)
  return parts[parts.length - 2] || ''
}

function AdminPage() {
  const [password, setPassword] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [state, setState] = useState<AdminState>({ sold: [], edits: {}, deleted: [] })
  const [loading, setLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/update-vehicle').then(r => r.json()).then(d => setState({
      sold: d.sold || [], edits: d.edits || {}, deleted: d.deleted || []
    })).catch(() => {})
  }, [])

  const handleLogin = () => {
    if (password === 'Sagiracing2026#') { setLoggedIn(true); setMsg('') }
    else setMsg('Password incorreta')
  }

  const apiCall = async (body: object) => {
    setMsg('')
    const res = await fetch('/api/update-vehicle', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'Sagiracing2026#', ...body })
    })
    const data = await res.json()
    if (data.success) {
      setState({ sold: data.sold || [], edits: data.edits || {}, deleted: data.deleted || [] })
      return true
    }
    setMsg('Erro: ' + (data.error || 'desconhecido'))
    return false
  }

  const toggleSold = async (v: VehicleData) => {
    const id = getVehicleId(v)
    const isSold = state.sold.includes(id)
    setLoading(id)
    const ok = await apiCall({ vehicleId: id, action: isSold ? 'unsell' : 'sell' })
    if (ok) setMsg(`${v.brand} ${v.model} — ${isSold ? 'reposto' : 'marcado como vendido'}. A atualizar (~30s)...`)
    setLoading(null)
  }

  const deleteVehicle = async (v: VehicleData) => {
    const id = getVehicleId(v)
    if (!confirm(`Eliminar ${v.brand} ${v.model} do site?`)) return
    setLoading(id)
    const ok = await apiCall({ vehicleId: id, action: 'delete' })
    if (ok) setMsg(`${v.brand} ${v.model} eliminado. A atualizar (~30s)...`)
    setLoading(null)
  }

  const startEdit = (v: VehicleData) => {
    const id = getVehicleId(v)
    const edits = state.edits[id] || {}
    setEditingId(id)
    setEditForm({
      price: String(edits.price ?? v.price),
      km: String(edits.km ?? v.km),
      year: String(edits.year ?? v.year),
      highlight: String(edits.highlight ?? v.highlight),
    })
  }

  const saveEdit = async (v: VehicleData) => {
    const id = getVehicleId(v)
    setLoading(id)
    const edits: Record<string, number | string> = {}
    if (editForm.price && Number(editForm.price) !== v.price) edits.price = Number(editForm.price)
    if (editForm.km && Number(editForm.km) !== v.km) edits.km = Number(editForm.km)
    if (editForm.year && Number(editForm.year) !== v.year) edits.year = Number(editForm.year)
    if (editForm.highlight && editForm.highlight !== v.highlight) edits.highlight = editForm.highlight
    if (Object.keys(edits).length === 0) { setEditingId(null); setLoading(null); return }
    const ok = await apiCall({ vehicleId: id, action: 'edit', edits })
    if (ok) setMsg(`${v.brand} ${v.model} atualizado. A atualizar (~30s)...`)
    setEditingId(null)
    setLoading(null)
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-[#0D1117] text-white flex items-center justify-center">
        <div className="bg-[#161B22] border border-white/10 rounded-xl p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold mb-1">SAGIRACING</h1>
          <p className="text-[#8B949E] text-sm mb-6">Painel de administração</p>
          <input type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full bg-[#0D1117] border border-white/20 rounded-lg px-4 py-3 text-white mb-4 focus:outline-none focus:border-[#2DDAB5]" />
          <button onClick={handleLogin} className="w-full bg-[#2DDAB5] text-[#0D1117] font-bold rounded-lg py-3 hover:bg-[#26c4a1]">Entrar</button>
          {msg && <p className="text-red-400 text-sm mt-3">{msg}</p>}
        </div>
      </div>
    )
  }

  const visibleVehicles = allVehicles.filter(v => !state.deleted.includes(getVehicleId(v)))
  const deletedVehicles = allVehicles.filter(v => state.deleted.includes(getVehicleId(v)))

  return (
    <div className="min-h-screen bg-[#0D1117] text-white">
      <header className="border-b border-white/10 bg-[#0D1117] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">SAGIRACING — Admin</h1>
            <p className="text-[#8B949E] text-sm">Gerir stock · Editar · Vendidos</p>
          </div>
          <a href="/"><Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">Ver site</Button></a>
        </div>
      </header>
      {msg && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className="bg-[#2DDAB5]/10 border border-[#2DDAB5]/30 rounded-lg px-4 py-3 text-sm text-[#2DDAB5]">{msg}</div>
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-3">
        {visibleVehicles.map((v, i) => {
          const id = getVehicleId(v)
          const isSold = state.sold.includes(id)
          const edits = state.edits[id] || {}
          const displayV = { ...v, ...edits }
          const isEditing = editingId === id
          return (
            <div key={i} className={`p-4 rounded-xl border ${isSold ? 'bg-red-950/30 border-red-500/30' : 'bg-[#161B22] border-white/[0.06]'}`}>
              <div className="flex items-center gap-4">
                <img src={v.img} alt="" className="w-20 h-14 object-cover rounded-lg shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{v.brand} {v.model}</p>
                  <p className="text-[#8B949E] text-xs">{displayV.year} · {formatKm(displayV.km as number)} · {formatPrice(displayV.price as number)}</p>
                  {isSold && <span className="text-red-400 text-xs font-bold">VENDIDO</span>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => isEditing ? saveEdit(v) : startEdit(v)}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white">
                    {isEditing ? 'Guardar' : 'Editar'}
                  </button>
                  <button onClick={() => toggleSold(v)} disabled={loading === id}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold ${isSold ? 'bg-green-600 hover:bg-green-500' : 'bg-amber-600 hover:bg-amber-500'} text-white ${loading === id ? 'opacity-50' : ''}`}>
                    {loading === id ? '...' : isSold ? 'Repor' : 'Vendido'}
                  </button>
                  <button onClick={() => deleteVehicle(v)} disabled={loading === id}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-red-700 hover:bg-red-600 text-white">
                    Eliminar
                  </button>
                </div>
              </div>
              {isEditing && (
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[#8B949E] text-xs">Preço (€)</label>
                    <input type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                      className="w-full bg-[#0D1117] border border-white/20 rounded px-3 py-2 text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-[#8B949E] text-xs">Km</label>
                    <input type="number" value={editForm.km} onChange={e => setEditForm({ ...editForm, km: e.target.value })}
                      className="w-full bg-[#0D1117] border border-white/20 rounded px-3 py-2 text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-[#8B949E] text-xs">Ano</label>
                    <input type="number" value={editForm.year} onChange={e => setEditForm({ ...editForm, year: e.target.value })}
                      className="w-full bg-[#0D1117] border border-white/20 rounded px-3 py-2 text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-[#8B949E] text-xs">Destaque</label>
                    <input type="text" value={editForm.highlight} onChange={e => setEditForm({ ...editForm, highlight: e.target.value })}
                      className="w-full bg-[#0D1117] border border-white/20 rounded px-3 py-2 text-sm text-white" />
                  </div>
                  <button onClick={() => setEditingId(null)} className="col-span-2 md:col-span-4 text-[#8B949E] text-xs hover:text-white py-1">Cancelar</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {deletedVehicles.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 pb-6">
          <p className="text-[#8B949E] text-sm mb-3">Eliminados</p>
          <div className="space-y-2">
            {deletedVehicles.map((v, i) => {
              const id = getVehicleId(v)
              return (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-white/5 bg-[#161B22]/50 opacity-60">
                  <p className="flex-1 text-sm line-through">{v.brand} {v.model} — {formatPrice(v.price)}</p>
                  <button onClick={async () => { setLoading(id); await apiCall({ vehicleId: id, action: 'undelete' }); setLoading(null) }}
                    className="px-3 py-1 rounded text-xs bg-white/10 hover:bg-white/20 text-white">Restaurar</button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  const isAdmin = window.location.pathname === '/admin'
  const [state, setState] = useState<AdminState>({ sold: [], edits: {}, deleted: [] })
  const [sort, setSort] = useState<'price' | 'year' | 'km'>('price')

  useEffect(() => {
    fetch('/sold.json').then(r => r.json()).then(d => setState({
      sold: d.sold || [], edits: d.edits || {}, deleted: d.deleted || []
    })).catch(() => {})
  }, [])

  if (isAdmin) return <AdminPage />

  // Apply edits and filter deleted
  const vehicles = allVehicles
    .filter(v => !state.deleted.includes(getVehicleId(v)))
    .map(v => {
      const id = getVehicleId(v)
      const edits = state.edits[id]
      return edits ? { ...v, ...edits } as VehicleData : v
    })

  // Sort: available first, then sold
  const available = vehicles.filter(v => !state.sold.includes(getVehicleId(v)))
  const sold = vehicles.filter(v => state.sold.includes(getVehicleId(v)))

  const sortFn = (a: VehicleData, b: VehicleData) => {
    if (sort === 'price') return a.price - b.price
    if (sort === 'year') return b.year - a.year
    return a.km - b.km
  }

  const sorted = [...available.sort(sortFn), ...sold.sort(sortFn)]

  return (
    <div className="min-h-screen bg-[#0D1117] text-white">
      {/* Header */}
      <header className="border-b border-white/10 sticky top-0 z-40 bg-[#0D1117]/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">SAGIRACING</h1>
            <p className="text-xs text-[#8B949E]">Elétricos seminovos · Neiva</p>
          </div>
          <a href="tel:+351258373486">
            <Button size="sm" className="bg-white hover:bg-gray-100 text-[#0D1117] font-bold flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              Ligar
            </Button>
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-12 pb-10">
        <div className="max-w-xl">
          <p className="text-[#2DDAB5] font-semibold text-sm tracking-wider uppercase mb-3">Stock disponível · {available.length} viaturas</p>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            Elétricos Seminovos
          </h2>
          <p className="text-[#8B949E] text-lg mb-8 leading-relaxed">
            Poucos km e garantia real de 18 meses.
            <br />16 anos de experiência. Retoma do seu usado.
          </p>
          <div className="flex gap-3 flex-wrap">
            <a href={messengerUrl} target="_blank" rel="noopener">
              <Button size="lg" className="bg-[#2DDAB5] hover:bg-[#26c4a1] text-[#0D1117] font-bold text-base px-8">
                Enviar mensagem
              </Button>
            </a>
            <a href="tel:+351258373486">
              <Button size="lg" className="bg-white/10 hover:bg-white/20 text-white font-semibold text-base border border-white/20">
                Ligar agora
              </Button>
            </a>
          </div>
        </div>
      </section>

      <Separator className="bg-white/10 max-w-6xl mx-auto" />

      {/* Sort bar */}
      <section className="max-w-6xl mx-auto px-4 py-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-[#8B949E] text-sm">{available.length} veículos disponíveis</p>
          <div className="flex gap-2">
            {(['price', 'year', 'km'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${sort === s ? 'bg-[#2DDAB5] text-[#0D1117]' : 'bg-white/5 text-[#8B949E] hover:bg-white/10 hover:text-white'}`}
              >
                {s === 'price' ? 'Preço' : s === 'year' ? 'Mais recente' : 'Menos km'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Vehicle Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map((v, i) => {
            const id = getVehicleId(v)
            const isSold = state.sold.includes(id)
            const carMsg = encodeURIComponent(`Olá! Tenho interesse no ${v.brand} ${v.model} (${v.year}) por ${formatPrice(v.price)}. Podem dar mais informações?`)
            return (
              <Card key={i} className={`overflow-hidden group transition-all duration-300 ${isSold ? 'bg-[#161B22]/60 border-red-500/20 opacity-75' : 'bg-[#161B22] border-white/[0.06] hover:border-[#2DDAB5]/40'}`}>
                <a href={v.url} target="_blank" rel="noopener" className="block">
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#0D1117]">
                    <img
                      src={v.img}
                      alt={`${v.brand} ${v.model}`}
                      className={`w-full h-full object-cover transition-transform duration-500 ${isSold ? 'grayscale' : 'group-hover:scale-[1.03]'}`}
                      loading="lazy"
                    />
                    {isSold ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <span className="bg-red-600 text-white font-bold text-lg px-6 py-2 rounded-lg tracking-wider">VENDIDO</span>
                      </div>
                    ) : (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-[#2DDAB5] text-[#0D1117] font-bold text-sm hover:bg-[#2DDAB5] px-3">
                          {formatPrice(v.price)}
                        </Badge>
                      </div>
                    )}
                    {!isSold && v.year >= 2024 && (
                      <div className="absolute top-3 right-3">
                        <Badge variant="outline" className="border-white/30 text-white text-xs bg-black/40 backdrop-blur-sm">
                          {v.year}
                        </Badge>
                      </div>
                    )}
                  </div>
                </a>
                <CardContent className="p-4">
                  <h3 className={`font-bold text-base mb-0.5 ${isSold ? 'text-[#8B949E] line-through' : 'text-white'}`}>{v.brand} {v.model}</h3>
                  {!isSold && <p className="text-[#2DDAB5] text-sm mb-3">{v.highlight}</p>}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#8B949E] mb-4">
                    <span>{v.year}</span>
                    <span>{formatKm(v.km)}</span>
                    <span>{v.cv} cv</span>
                    <span>{v.battery}</span>
                  </div>
                  {isSold ? (
                    <p className="text-red-400/80 text-sm font-medium">Este veículo já foi vendido</p>
                  ) : (
                    <div className="flex gap-2">
                      <a href={`https://wa.me/351969172360?text=${carMsg}`} target="_blank" rel="noopener" className="flex-1">
                        <Button className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-semibold h-9">
                          WhatsApp
                        </Button>
                      </a>
                      <a href={messengerUrl} target="_blank" rel="noopener" className="flex-1">
                        <Button className="w-full bg-[#2DDAB5] hover:bg-[#26c4a1] text-[#0D1117] text-sm font-semibold h-9">
                          Messenger
                        </Button>
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Trust section */}
      <section className="border-t border-white/10 bg-[#161B22]">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-[#2DDAB5]">16</p>
              <p className="text-[#8B949E] text-sm mt-1">Anos de experiência</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#2DDAB5]">18</p>
              <p className="text-[#8B949E] text-sm mt-1">Meses de garantia</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#2DDAB5]">{available.length}</p>
              <p className="text-[#8B949E] text-sm mt-1">Elétricos em stock</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#2DDAB5]">IVA</p>
              <p className="text-[#8B949E] text-sm mt-1">Dedutível disponível</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-bold text-lg mb-3">SAGIRACING</h4>
              <p className="text-[#8B949E] text-sm leading-relaxed">
                Stand de veículos elétricos seminovos em Viana do Castelo.
                Garantia real, preços justos e 16 anos de confiança.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-3">Contactos</h4>
              <div className="space-y-2 text-sm text-[#8B949E]">
                <p><a href="tel:+351258373486" className="hover:text-white transition">+351 258 373 486</a></p>
                <p><a href="tel:+351969172360" className="hover:text-white transition">+351 969 172 360</a></p>
                <p><a href="tel:+351929352022" className="hover:text-white transition">+351 929 352 022</a></p>
                <p><a href="mailto:auto.sagiracing@sapo.pt" className="hover:text-white transition">auto.sagiracing@sapo.pt</a></p>
                <p><a href="https://sagiracing.pt" target="_blank" className="text-[#2DDAB5] hover:underline">sagiracing.pt</a></p>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-3">Localização</h4>
              <div className="space-y-2 text-sm text-[#8B949E]">
                <p>Av. S. Romão, nº 13</p>
                <p>Neiva — Viana do Castelo</p>
                <p className="pt-2">Seg-Sex: 09h-18h30</p>
                <p>Sáb: 09h-17h30</p>
              </div>
            </div>
          </div>
          <Separator className="bg-white/10 my-8" />
          <p className="text-[#8B949E] text-xs text-center">
            © 2026 Sagiracing Unipessoal, Lda. · NIF 509339174 · Todos os preços incluem IVA.
          </p>
        </div>
      </footer>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0D1117]/95 backdrop-blur-md border-t border-white/10 safe-area-pb">
        <div className="max-w-6xl mx-auto px-3 py-2.5 flex gap-2">
          {/* Messenger */}
          <a href={messengerUrl} target="_blank" rel="noopener" className="flex-1">
            <button className="w-full flex items-center justify-center gap-2 bg-[#2DDAB5] hover:bg-[#26c4a1] text-[#0D1117] font-semibold rounded-lg py-3 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.2 5.42 3.15 7.2V22l2.98-1.64c.84.23 1.73.34 2.87.34 5.64 0 10-4.13 10-9.7S17.64 2 12 2zm1.05 13.02l-2.55-2.72L5.67 15l4.93-5.23 2.55 2.72L17.95 10l-4.9 5.02z"/>
              </svg>
              <span className="text-sm">Messenger</span>
            </button>
          </a>
          {/* Ligar - 30% bigger */}
          <a href="tel:+351258373486" className="flex-[1.3]">
            <button className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-[#0D1117] font-bold rounded-lg py-3 transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              <span className="text-sm">Ligar</span>
            </button>
          </a>
          {/* WhatsApp */}
          <a href={whatsappUrl} target="_blank" rel="noopener" className="flex-1">
            <button className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold rounded-lg py-3 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="text-sm">WhatsApp</span>
            </button>
          </a>
        </div>
      </div>
      {/* Spacer for fixed bottom bar */}
      <div className="h-20" />
    </div>
  )
}

export default App
