import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  getCurrentUser,
} from "@/lib/auth";
import { sendWelcome } from "@/lib/mailer";

export const dynamic = "force-dynamic";

function bad(msg: string, code = 400) {
  return Response.json({ error: msg }, { status: code });
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const user = await getCurrentUser();
  return Response.json({ user });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("Solicitud inválida");
  }
  const action = String(body.action || "");

  if (action === "logout") {
    await destroySession();
    return Response.json({ ok: true });
  }

  if (action === "login") {
    const correo = String(body.correo || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!correo || !password) return bad("Correo y contraseña son obligatorios");
    const rows = await db.select().from(users).where(eq(users.correo, correo)).limit(1);
    const u = rows[0];
    if (!u || !verifyPassword(password, u.passwordHash))
      return bad("Credenciales incorrectas", 401);
    await createSession(u.id);
    return Response.json({
      user: { id: u.id, role: u.role, nombreCompleto: u.nombreCompleto, correo: u.correo },
    });
  }

  if (action === "register") {
    const nombreCompleto = String(body.nombreCompleto || "").trim();
    const correo = String(body.correo || "").trim().toLowerCase();
    const password = String(body.password || "");
    const celular = String(body.celular || "").trim();
    const tipoDocumento = String(body.tipoDocumento || "").trim();
    const numeroDocumento = String(body.numeroDocumento || "").trim();
    const departamento = String(body.departamento || "").trim();
    const ciudad = String(body.ciudad || "").trim();
    const direccion = String(body.direccion || "").trim();

    if (!nombreCompleto || !correo || !password || !departamento || !ciudad)
      return bad("Faltan campos obligatorios");
    if (!emailRe.test(correo)) return bad("Correo inválido");
    if (password.length < 6) return bad("La contraseña debe tener al menos 6 caracteres");
    if (!celular) return bad("El número de celular es obligatorio");
    if (!tipoDocumento || !numeroDocumento)
      return bad("El documento de identidad es obligatorio");

    const existing = await db.select().from(users).where(eq(users.correo, correo)).limit(1);
    if (existing.length > 0) return bad("Ya existe una cuenta con este correo", 409);

    const [created] = await db
      .insert(users)
      .values({
        nombreCompleto,
        correo,
        passwordHash: hashPassword(password),
        celular,
        tipoDocumento,
        numeroDocumento,
        departamento,
        ciudad,
        direccion: direccion || null,
        role: "denunciante",
      })
      .returning();

    await createSession(created.id);
    const mail = await sendWelcome(correo, nombreCompleto);
    return Response.json({
      user: {
        id: created.id,
        role: created.role,
        nombreCompleto: created.nombreCompleto,
        correo: created.correo,
      },
      emailSent: mail.sent,
    });
  }

  return bad("Acción no reconocida");
}
