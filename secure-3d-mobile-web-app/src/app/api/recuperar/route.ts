import { db } from "@/db";
import { users, resetCodes } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { generateCode, hashCode, hashPassword } from "@/lib/auth";
import { sendResetCode } from "@/lib/mailer";

export const dynamic = "force-dynamic";

function bad(msg: string, code = 400) {
  return Response.json({ error: msg }, { status: code });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("Solicitud inválida");
  }
  const action = String(body.action || "");
  const correo = String(body.correo || "").trim().toLowerCase();

  if (action === "request") {
    if (!correo) return bad("El correo es obligatorio");
    const rows = await db.select().from(users).where(eq(users.correo, correo)).limit(1);
    // Respuesta neutra por seguridad (no revelamos si el correo existe)
    if (rows.length === 0) {
      return Response.json({ ok: true, message: "Si el correo existe, enviaremos un código." });
    }
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await db.insert(resetCodes).values({ correo, codeHash: hashCode(code), expiresAt });
    const mail = await sendResetCode(correo, code);
    return Response.json({
      ok: true,
      message: "Si el correo existe, enviaremos un código.",
      emailSent: mail.sent,
      // En modo demo (sin SMTP) devolvemos el código para poder probar el flujo
      devCode: mail.sent ? undefined : mail.devCode,
    });
  }

  if (action === "reset") {
    const code = String(body.code || "").trim();
    const newPassword = String(body.newPassword || "");
    if (!correo || !code || !newPassword) return bad("Faltan campos obligatorios");
    if (newPassword.length < 6) return bad("La contraseña debe tener al menos 6 caracteres");

    const rows = await db
      .select()
      .from(resetCodes)
      .where(and(eq(resetCodes.correo, correo), eq(resetCodes.used, false)))
      .orderBy(desc(resetCodes.createdAt))
      .limit(1);

    const rc = rows[0];
    if (!rc) return bad("Código inválido o expirado", 400);
    if (rc.expiresAt < new Date()) return bad("El código ha expirado", 400);
    if (rc.codeHash !== hashCode(code)) return bad("Código incorrecto", 400);

    await db
      .update(users)
      .set({ passwordHash: hashPassword(newPassword) })
      .where(eq(users.correo, correo));
    await db.update(resetCodes).set({ used: true }).where(eq(resetCodes.id, rc.id));

    return Response.json({ ok: true, message: "Contraseña actualizada correctamente." });
  }

  return bad("Acción no reconocida");
}
