"use client";

import { useCallback, useEffect, useState } from "react";
import AnimalBackground from "@/components/AnimalBackground";

/* ---------------- Tipos ---------------- */
type User = {
  id: number;
  role: string;
  nombreCompleto: string;
  correo: string;
};

type Denuncia = {
  id: number;
  codigo: string;
  tipoCaso: string;
  descripcion?: string;
  departamento: string;
  ciudad: string;
  estado: string;
  prioridad: string;
  especieAnimal?: string | null;
  createdAt: string;
  updatedAt?: string;
};

type GestorRow = {
  d: Denuncia;
  denunciante: string | null;
  correo: string | null;
  celular: string | null;
};

const DEPARTAMENTOS = [
  "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bogotá D.C.", "Bolívar", "Boyacá",
  "Caldas", "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca",
  "Guainía", "Guaviare", "Huila", "La Guajira", "Magdalena", "Meta", "Nariño",
  "Norte de Santander", "Putumayo", "Quindío", "Risaralda", "San Andrés y Providencia",
  "Santander", "Sucre", "Tolima", "Valle del Cauca", "Vaupés", "Vichada",
];

const TIPOS_CASO = [
  "Maltrato físico", "Abandono", "Negligencia / falta de cuidado", "Crueldad / tortura",
  "Peleas de animales", "Tráfico de fauna silvestre", "Envenenamiento",
  "Condiciones insalubres", "Otro",
];

const ESTADOS: Record<string, { label: string; color: string }> = {
  recibida: { label: "Recibida", color: "bg-sky-500/20 text-sky-300 border-sky-400/30" },
  en_revision: { label: "En revisión", color: "bg-amber-500/20 text-amber-300 border-amber-400/30" },
  en_tramite: { label: "En trámite", color: "bg-violet-500/20 text-violet-300 border-violet-400/30" },
  cerrada: { label: "Cerrada", color: "bg-emerald-600/20 text-emerald-300 border-emerald-400/30" },
};

const PRIORIDADES: Record<string, string> = {
  baja: "text-slate-300",
  media: "text-amber-300",
  alta: "text-rose-400",
};

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Error inesperado");
  return data;
}

/* ---------------- UI helpers ---------------- */
function Spinner() {
  return (
    <span className="spinner inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white" />
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const e = ESTADOS[estado] || ESTADOS.recibida;
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${e.color}`}>
      {e.label}
    </span>
  );
}

/* ---------------- Página principal ---------------- */
export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [view, setView] = useState<"home" | "login" | "register" | "forgot" | "app">("home");
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const showToast = useCallback((msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4200);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api("/api/auth", "GET");
      setUser(data.user);
      if (data.user) setView("app");
    } catch {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = async () => {
    await api("/api/auth", "POST", { action: "logout" });
    setUser(null);
    setView("home");
    showToast("Sesión cerrada");
  };

  return (
    <main className="relative min-h-screen">
      <AnimalBackground />

      {/* Navbar */}
      <header className="sticky top-0 z-30 glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <button
            onClick={() => setView(user ? "app" : "home")}
            className="flex items-center gap-2 text-left"
          >
            <span className="text-2xl">🐾</span>
            <div>
              <div className="text-lg font-extrabold tracking-wide text-emerald-300 glow">
                ALEGATO
              </div>
              <div className="-mt-1 text-[10px] uppercase tracking-widest text-emerald-200/60">
                Juristas por los Animales
              </div>
            </div>
          </button>

          <nav className="flex items-center gap-2">
            {loadingUser ? null : user ? (
              <>
                <span className="hidden text-sm text-emerald-200/80 sm:block">
                  {user.nombreCompleto.split(" ")[0]} · {user.role}
                </span>
                <button
                  onClick={logout}
                  className="rounded-lg border border-emerald-400/30 px-3 py-1.5 text-sm text-emerald-200 hover:bg-emerald-400/10"
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setView("login")}
                  className="rounded-lg px-3 py-1.5 text-sm text-emerald-200 hover:bg-emerald-400/10"
                >
                  Ingresar
                </button>
                <button
                  onClick={() => setView("register")}
                  className="btn-primary rounded-lg px-4 py-1.5 text-sm font-semibold text-white"
                >
                  Registrarme
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Contenido */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-8">
        {view === "home" && !user && (
          <HomeView goRegister={() => setView("register")} goLogin={() => setView("login")} showToast={showToast} />
        )}
        {view === "login" && (
          <LoginView
            onDone={refreshUser}
            goRegister={() => setView("register")}
            goForgot={() => setView("forgot")}
            showToast={showToast}
          />
        )}
        {view === "register" && (
          <RegisterView onDone={refreshUser} goLogin={() => setView("login")} showToast={showToast} />
        )}
        {view === "forgot" && (
          <ForgotView goLogin={() => setView("login")} showToast={showToast} />
        )}
        {view === "app" && user && <AppView user={user} showToast={showToast} />}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-medium shadow-2xl pop ${
            toast.type === "ok"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </main>
  );
}

/* ---------------- HOME ---------------- */
function HomeView({
  goRegister,
  goLogin,
  showToast,
}: {
  goRegister: () => void;
  goLogin: () => void;
  showToast: (m: string, t?: "ok" | "err") => void;
}) {
  const [codigo, setCodigo] = useState("");
  const [result, setResult] = useState<Denuncia | null>(null);
  const [loading, setLoading] = useState(false);

  const track = async () => {
    if (!codigo.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await api(`/api/denuncias?codigo=${encodeURIComponent(codigo.trim())}`, "GET");
      setResult(data.denuncia);
    } catch (e) {
      showToast((e as Error).message, "err");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="rise grid items-center gap-10 pt-6 md:grid-cols-2">
        <div>
          <span className="inline-block rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            🇨🇴 Cobertura en todo Colombia
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            Defiende a quienes <span className="text-emerald-300 glow">no tienen voz</span>
          </h1>
          <p className="mt-4 max-w-lg text-base text-emerald-100/70">
            ALEGATO recibe, organiza y gestiona denuncias de maltrato animal y otras
            problemáticas animalistas, facilitando la atención jurídica y el seguimiento
            de cada caso.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={goRegister}
              className="btn-primary rounded-xl px-6 py-3 font-semibold text-white"
            >
              Registrar una denuncia
            </button>
            <button
              onClick={goLogin}
              className="rounded-xl border border-emerald-400/30 px-6 py-3 font-semibold text-emerald-200 hover:bg-emerald-400/10"
            >
              Ya tengo cuenta
            </button>
          </div>
        </div>

        {/* Tracking card */}
        <div className="glass rounded-2xl p-6 pop">
          <h3 className="text-lg font-bold text-emerald-200">Consulta tu denuncia</h3>
          <p className="mt-1 text-sm text-emerald-100/60">
            Ingresa tu código de seguimiento (ej. ALG-A1B2C3).
          </p>
          <div className="mt-4 flex gap-2">
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="ALG-XXXXXX"
              className="field w-full rounded-lg px-4 py-3 text-white placeholder:text-emerald-100/30"
              onKeyDown={(e) => e.key === "Enter" && track()}
            />
            <button
              onClick={track}
              disabled={loading}
              className="btn-primary rounded-lg px-5 py-3 font-semibold text-white disabled:opacity-60"
            >
              {loading ? <Spinner /> : "Ver"}
            </button>
          </div>
          {result && (
            <div className="mt-4 rounded-xl border border-emerald-400/20 bg-black/20 p-4 pop">
              <div className="flex items-center justify-between">
                <span className="font-mono text-emerald-300">{result.codigo}</span>
                <EstadoBadge estado={result.estado} />
              </div>
              <p className="mt-2 text-sm text-emerald-100/80">{result.tipoCaso}</p>
              <p className="text-xs text-emerald-100/50">
                {result.ciudad}, {result.departamento}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="grid gap-5 sm:grid-cols-3">
        {[
          { icon: "📝", t: "Denuncia fácil", d: "Registra un caso en minutos con los datos mínimos requeridos." },
          { icon: "⚖️", t: "Atención jurídica", d: "Abogados y gestores revisan, clasifican y dan trámite legal." },
          { icon: "🔔", t: "Respuesta automática", d: "Recibe confirmaciones y actualizaciones directamente en tu correo." },
        ].map((f) => (
          <div key={f.t} className="glass rounded-2xl p-6 rise">
            <div className="text-3xl">{f.icon}</div>
            <h4 className="mt-3 font-bold text-emerald-200">{f.t}</h4>
            <p className="mt-1 text-sm text-emerald-100/60">{f.d}</p>
          </div>
        ))}
      </section>

      {/* Cómo funciona */}
      <section className="glass rounded-2xl p-8">
        <h3 className="text-center text-2xl font-bold text-white">¿Cómo funciona?</h3>
        <div className="mt-8 grid gap-6 sm:grid-cols-4">
          {[
            ["1", "Regístrate", "Crea tu cuenta con tus datos de contacto."],
            ["2", "Denuncia", "Describe el hecho de maltrato animal y su ubicación."],
            ["3", "Seguimiento", "Consulta el estado con tu código único."],
            ["4", "Trámite legal", "El equipo de ALEGATO gestiona el caso."],
          ].map(([n, t, d]) => (
            <div key={n} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-xl font-extrabold text-emerald-300">
                {n}
              </div>
              <h5 className="mt-3 font-bold text-emerald-100">{t}</h5>
              <p className="mt-1 text-sm text-emerald-100/50">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ---------------- LOGIN ---------------- */
function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md pt-6">
      <div className="glass rounded-2xl p-8 rise">
        <div className="mb-6 text-center">
          <div className="text-4xl">🐾</div>
          <h2 className="mt-2 text-2xl font-bold text-white">{title}</h2>
          <p className="text-sm text-emerald-100/60">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputCls = "field w-full rounded-lg px-4 py-3 text-white placeholder:text-emerald-100/30";
const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wide text-emerald-200/70";

function LoginView({
  onDone,
  goRegister,
  goForgot,
  showToast,
}: {
  onDone: () => void;
  goRegister: () => void;
  goForgot: () => void;
  showToast: (m: string, t?: "ok" | "err") => void;
}) {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api("/api/auth", "POST", { action: "login", correo, password });
      showToast("¡Bienvenido/a de nuevo!");
      onDone();
    } catch (err) {
      showToast((err as Error).message, "err");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Iniciar sesión" subtitle="Accede a tu cuenta de ALEGATO">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={labelCls}>Correo electrónico</label>
          <input type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} className={inputCls} placeholder="tucorreo@ejemplo.com" />
        </div>
        <div>
          <label className={labelCls}>Contraseña</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="••••••••" />
        </div>
        <button disabled={loading} className="btn-primary flex w-full items-center justify-center gap-2 rounded-lg py-3 font-semibold text-white disabled:opacity-60">
          {loading ? <Spinner /> : "Ingresar"}
        </button>
      </form>
      <div className="mt-5 flex items-center justify-between text-sm">
        <button onClick={goForgot} className="text-emerald-300 hover:underline">¿Olvidaste tu contraseña?</button>
        <button onClick={goRegister} className="text-emerald-100/70 hover:underline">Crear cuenta</button>
      </div>
    </AuthShell>
  );
}

/* ---------------- REGISTER ---------------- */
function RegisterView({
  onDone,
  goLogin,
  showToast,
}: {
  onDone: () => void;
  goLogin: () => void;
  showToast: (m: string, t?: "ok" | "err") => void;
}) {
  const [f, setF] = useState({
    nombreCompleto: "", tipoDocumento: "CC", numeroDocumento: "", celular: "",
    correo: "", direccion: "", departamento: "", ciudad: "", password: "",
  });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api("/api/auth", "POST", { action: "register", ...f });
      showToast(data.emailSent ? "Cuenta creada · revisa tu correo" : "Cuenta creada correctamente");
      onDone();
    } catch (err) {
      showToast((err as Error).message, "err");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl pt-6">
      <div className="glass rounded-2xl p-8 rise">
        <div className="mb-6 text-center">
          <div className="text-4xl">🐾</div>
          <h2 className="mt-2 text-2xl font-bold text-white">Crear cuenta</h2>
          <p className="text-sm text-emerald-100/60">Regístrate como denunciante en ALEGATO</p>
        </div>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>Nombre completo *</label>
            <input required value={f.nombreCompleto} onChange={(e) => set("nombreCompleto", e.target.value)} className={inputCls} placeholder="Nombres y apellidos" />
          </div>
          <div>
            <label className={labelCls}>Tipo de documento *</label>
            <select value={f.tipoDocumento} onChange={(e) => set("tipoDocumento", e.target.value)} className={inputCls}>
              <option value="CC">Cédula de ciudadanía</option>
              <option value="CE">Cédula de extranjería</option>
              <option value="TI">Tarjeta de identidad</option>
              <option value="PA">Pasaporte</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Número de documento *</label>
            <input required value={f.numeroDocumento} onChange={(e) => set("numeroDocumento", e.target.value)} className={inputCls} placeholder="Ej. 1020304050" />
          </div>
          <div>
            <label className={labelCls}>Celular *</label>
            <input required value={f.celular} onChange={(e) => set("celular", e.target.value)} className={inputCls} placeholder="Ej. 3001234567" />
          </div>
          <div>
            <label className={labelCls}>Correo electrónico *</label>
            <input type="email" required value={f.correo} onChange={(e) => set("correo", e.target.value)} className={inputCls} placeholder="tucorreo@ejemplo.com" />
          </div>
          <div>
            <label className={labelCls}>Departamento *</label>
            <select required value={f.departamento} onChange={(e) => set("departamento", e.target.value)} className={inputCls}>
              <option value="">Selecciona...</option>
              {DEPARTAMENTOS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Ciudad / municipio *</label>
            <input required value={f.ciudad} onChange={(e) => set("ciudad", e.target.value)} className={inputCls} placeholder="Ej. Medellín" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Dirección de residencia (opcional)</label>
            <input value={f.direccion} onChange={(e) => set("direccion", e.target.value)} className={inputCls} placeholder="Calle 00 # 00-00" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Contraseña * (mín. 6 caracteres)</label>
            <input type="password" required minLength={6} value={f.password} onChange={(e) => set("password", e.target.value)} className={inputCls} placeholder="••••••••" />
          </div>
          <button disabled={loading} className="btn-primary sm:col-span-2 flex items-center justify-center gap-2 rounded-lg py-3 font-semibold text-white disabled:opacity-60">
            {loading ? <Spinner /> : "Crear mi cuenta"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-emerald-100/70">
          ¿Ya tienes cuenta?{" "}
          <button onClick={goLogin} className="text-emerald-300 hover:underline">Inicia sesión</button>
        </p>
      </div>
    </div>
  );
}

/* ---------------- FORGOT PASSWORD ---------------- */
function ForgotView({
  goLogin,
  showToast,
}: {
  goLogin: () => void;
  showToast: (m: string, t?: "ok" | "err") => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [correo, setCorreo] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const request = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api("/api/recuperar", "POST", { action: "request", correo });
      if (data.devCode) {
        showToast(`Modo demo · código: ${data.devCode}`);
        setCode(data.devCode);
      } else {
        showToast("Si el correo existe, recibirás un código.");
      }
      setStep(2);
    } catch (err) {
      showToast((err as Error).message, "err");
    } finally {
      setLoading(false);
    }
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api("/api/recuperar", "POST", { action: "reset", correo, code, newPassword });
      showToast("Contraseña actualizada. Inicia sesión.");
      goLogin();
    } catch (err) {
      showToast((err as Error).message, "err");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Recuperar contraseña"
      subtitle={step === 1 ? "Te enviaremos un código a tu correo" : "Ingresa el código recibido"}
    >
      {step === 1 ? (
        <form onSubmit={request} className="space-y-4">
          <div>
            <label className={labelCls}>Correo electrónico</label>
            <input type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} className={inputCls} placeholder="tucorreo@ejemplo.com" />
          </div>
          <button disabled={loading} className="btn-primary flex w-full items-center justify-center gap-2 rounded-lg py-3 font-semibold text-white disabled:opacity-60">
            {loading ? <Spinner /> : "Enviar código"}
          </button>
        </form>
      ) : (
        <form onSubmit={reset} className="space-y-4">
          <div>
            <label className={labelCls}>Código de 6 dígitos</label>
            <input required value={code} onChange={(e) => setCode(e.target.value)} className={`${inputCls} text-center text-lg tracking-[0.5em]`} placeholder="000000" maxLength={6} />
          </div>
          <div>
            <label className={labelCls}>Nueva contraseña</label>
            <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} placeholder="••••••••" />
          </div>
          <button disabled={loading} className="btn-primary flex w-full items-center justify-center gap-2 rounded-lg py-3 font-semibold text-white disabled:opacity-60">
            {loading ? <Spinner /> : "Cambiar contraseña"}
          </button>
          <button type="button" onClick={() => setStep(1)} className="w-full text-sm text-emerald-100/60 hover:underline">
            ← Volver
          </button>
        </form>
      )}
      <div className="mt-5 text-center text-sm">
        <button onClick={goLogin} className="text-emerald-300 hover:underline">Volver a iniciar sesión</button>
      </div>
    </AuthShell>
  );
}

/* ---------------- APP (dashboard) ---------------- */
function AppView({ user, showToast }: { user: User; showToast: (m: string, t?: "ok" | "err") => void }) {
  const isGestor = user.role === "gestor" || user.role === "admin";
  return isGestor ? (
    <GestorPanel showToast={showToast} />
  ) : (
    <DenunciantePanel user={user} showToast={showToast} />
  );
}

/* ---------------- Denunciante panel ---------------- */
function DenunciantePanel({ user, showToast }: { user: User; showToast: (m: string, t?: "ok" | "err") => void }) {
  const [tab, setTab] = useState<"mis" | "nueva">("mis");
  const [items, setItems] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("/api/denuncias", "GET");
      setItems(data.denuncias || []);
    } catch (e) {
      showToast((e as Error).message, "err");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="rise">
      <div className="glass mb-6 rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white">Hola, {user.nombreCompleto.split(" ")[0]} 👋</h2>
        <p className="text-sm text-emerald-100/60">Gestiona tus denuncias de maltrato animal.</p>
      </div>

      <div className="mb-6 flex gap-2">
        <button onClick={() => setTab("mis")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === "mis" ? "btn-primary text-white" : "glass text-emerald-200"}`}>
          Mis denuncias
        </button>
        <button onClick={() => setTab("nueva")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === "nueva" ? "btn-primary text-white" : "glass text-emerald-200"}`}>
          + Nueva denuncia
        </button>
      </div>

      {tab === "nueva" ? (
        <NuevaDenuncia
          onCreated={() => { setTab("mis"); load(); }}
          showToast={showToast}
        />
      ) : loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : items.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <div className="text-4xl">🐾</div>
          <p className="mt-3 text-emerald-100/70">Aún no tienes denuncias registradas.</p>
          <button onClick={() => setTab("nueva")} className="btn-primary mt-4 rounded-lg px-5 py-2 font-semibold text-white">
            Registrar mi primera denuncia
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((d) => (
            <div key={d.id} className="glass rounded-2xl p-5 pop">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-emerald-300">{d.codigo}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${PRIORIDADES[d.prioridad]}`}>● {d.prioridad}</span>
                  <EstadoBadge estado={d.estado} />
                </div>
              </div>
              <h4 className="mt-2 font-bold text-emerald-100">{d.tipoCaso}</h4>
              <p className="mt-1 text-sm text-emerald-100/60">{d.descripcion}</p>
              <p className="mt-2 text-xs text-emerald-100/40">
                {d.especieAnimal ? `${d.especieAnimal} · ` : ""}{d.ciudad}, {d.departamento} ·{" "}
                {new Date(d.createdAt).toLocaleDateString("es-CO")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NuevaDenuncia({ onCreated, showToast }: { onCreated: () => void; showToast: (m: string, t?: "ok" | "err") => void }) {
  const [f, setF] = useState({
    tipoCaso: "", especieAnimal: "", cantidadAnimales: "", descripcion: "",
    departamento: "", ciudad: "", direccionHecho: "", fechaHecho: "", prioridad: "media",
  });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api("/api/denuncias", "POST", f);
      showToast(
        data.emailSent
          ? `Denuncia ${data.denuncia.codigo} registrada · revisa tu correo`
          : `Denuncia ${data.denuncia.codigo} registrada`,
      );
      onCreated();
    } catch (err) {
      showToast((err as Error).message, "err");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="glass grid gap-4 rounded-2xl p-6 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className={labelCls}>Tipo de caso *</label>
        <select required value={f.tipoCaso} onChange={(e) => set("tipoCaso", e.target.value)} className={inputCls}>
          <option value="">Selecciona...</option>
          {TIPOS_CASO.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls}>Especie / tipo de animal</label>
        <input value={f.especieAnimal} onChange={(e) => set("especieAnimal", e.target.value)} className={inputCls} placeholder="Ej. Perro, gato, caballo" />
      </div>
      <div>
        <label className={labelCls}>Cantidad de animales</label>
        <input value={f.cantidadAnimales} onChange={(e) => set("cantidadAnimales", e.target.value)} className={inputCls} placeholder="Ej. 1, 2, varios" />
      </div>
      <div className="sm:col-span-2">
        <label className={labelCls}>Descripción del hecho *</label>
        <textarea required rows={4} value={f.descripcion} onChange={(e) => set("descripcion", e.target.value)} className={inputCls} placeholder="Describe con detalle lo ocurrido..." />
      </div>
      <div>
        <label className={labelCls}>Departamento *</label>
        <select required value={f.departamento} onChange={(e) => set("departamento", e.target.value)} className={inputCls}>
          <option value="">Selecciona...</option>
          {DEPARTAMENTOS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls}>Ciudad / municipio *</label>
        <input required value={f.ciudad} onChange={(e) => set("ciudad", e.target.value)} className={inputCls} placeholder="Ej. Cali" />
      </div>
      <div>
        <label className={labelCls}>Dirección / lugar del hecho</label>
        <input value={f.direccionHecho} onChange={(e) => set("direccionHecho", e.target.value)} className={inputCls} placeholder="Barrio, calle, referencia" />
      </div>
      <div>
        <label className={labelCls}>Fecha del hecho</label>
        <input type="date" value={f.fechaHecho} onChange={(e) => set("fechaHecho", e.target.value)} className={inputCls} />
      </div>
      <div className="sm:col-span-2">
        <label className={labelCls}>Prioridad percibida</label>
        <select value={f.prioridad} onChange={(e) => set("prioridad", e.target.value)} className={inputCls}>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta (animal en riesgo inminente)</option>
        </select>
      </div>
      <button disabled={loading} className="btn-primary sm:col-span-2 flex items-center justify-center gap-2 rounded-lg py-3 font-semibold text-white disabled:opacity-60">
        {loading ? <Spinner /> : "Enviar denuncia"}
      </button>
    </form>
  );
}

/* ---------------- Gestor panel ---------------- */
function GestorPanel({ showToast }: { showToast: (m: string, t?: "ok" | "err") => void }) {
  const [rows, setRows] = useState<GestorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("todas");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api("/api/denuncias", "GET");
      setRows(data.denuncias || []);
    } catch (e) {
      showToast((e as Error).message, "err");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const update = async (id: number, patch: Record<string, unknown>) => {
    try {
      await api("/api/denuncias", "PATCH", { id, ...patch });
      showToast("Denuncia actualizada");
      load();
    } catch (e) {
      showToast((e as Error).message, "err");
    }
  };

  const filtered = filter === "todas" ? rows : rows.filter((r) => r.d.estado === filter);
  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.d.estado] = (acc[r.d.estado] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="rise">
      <div className="glass mb-6 rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white">Panel de gestión ALEGATO</h2>
        <p className="text-sm text-emerald-100/60">Revisa, clasifica y da trámite a las denuncias recibidas.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(ESTADOS).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-emerald-400/15 bg-black/20 p-3 text-center">
              <div className="text-2xl font-extrabold text-emerald-300">{counts[k] || 0}</div>
              <div className="text-xs text-emerald-100/60">{v.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {["todas", ...Object.keys(ESTADOS)].map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${filter === k ? "btn-primary text-white" : "glass text-emerald-200"}`}
          >
            {k === "todas" ? "Todas" : ESTADOS[k].label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-emerald-100/60">No hay denuncias en esta categoría.</div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((r) => (
            <div key={r.d.id} className="glass rounded-2xl p-5 pop">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-emerald-300">{r.d.codigo}</span>
                <EstadoBadge estado={r.d.estado} />
              </div>
              <h4 className="mt-2 font-bold text-emerald-100">{r.d.tipoCaso}</h4>
              <p className="mt-1 text-sm text-emerald-100/70">{r.d.descripcion}</p>
              <p className="mt-2 text-xs text-emerald-100/40">
                📍 {r.d.ciudad}, {r.d.departamento}
                {r.d.especieAnimal ? ` · ${r.d.especieAnimal}` : ""} ·{" "}
                {new Date(r.d.createdAt).toLocaleDateString("es-CO")}
              </p>
              <div className="mt-2 rounded-lg bg-black/20 p-2 text-xs text-emerald-100/60">
                👤 {r.denunciante || "N/D"} · ✉️ {r.correo || "N/D"} · 📞 {r.celular || "N/D"}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <select
                  defaultValue={r.d.estado}
                  onChange={(e) => update(r.d.id, { estado: e.target.value })}
                  className="field rounded-lg px-3 py-2 text-sm text-white"
                >
                  {Object.entries(ESTADOS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <select
                  defaultValue={r.d.prioridad}
                  onChange={(e) => update(r.d.id, { prioridad: e.target.value })}
                  className="field rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="baja">Prioridad baja</option>
                  <option value="media">Prioridad media</option>
                  <option value="alta">Prioridad alta</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
