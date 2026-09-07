import { db } from "@/db";
import { denuncias, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { sendDenunciaConfirm } from "@/lib/mailer";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

function bad(msg: string, code = 400) {
  return Response.json({ error: msg }, { status: code });
}

function genCodigo() {
  return "ALG-" + randomBytes(3).toString("hex").toUpperCase();
}

// Consulta pública por código de seguimiento o listado según rol
export async function GET(req: Request) {
  const url = new URL(req.url);
  const codigo = url.searchParams.get("codigo");

  if (codigo) {
    const rows = await db
      .select({
        codigo: denuncias.codigo,
        tipoCaso: denuncias.tipoCaso,
        estado: denuncias.estado,
        prioridad: denuncias.prioridad,
        departamento: denuncias.departamento,
        ciudad: denuncias.ciudad,
        createdAt: denuncias.createdAt,
        updatedAt: denuncias.updatedAt,
      })
      .from(denuncias)
      .where(eq(denuncias.codigo, codigo.trim().toUpperCase()))
      .limit(1);
    if (rows.length === 0) return bad("No se encontró una denuncia con ese código", 404);
    return Response.json({ denuncia: rows[0] });
  }

  const user = await getCurrentUser();
  if (!user) return bad("No autenticado", 401);

  if (user.role === "gestor" || user.role === "admin") {
    const rows = await db
      .select({
        d: denuncias,
        denunciante: users.nombreCompleto,
        correo: users.correo,
        celular: users.celular,
      })
      .from(denuncias)
      .leftJoin(users, eq(denuncias.denuncianteId, users.id))
      .orderBy(desc(denuncias.createdAt));
    return Response.json({ denuncias: rows });
  }

  const rows = await db
    .select()
    .from(denuncias)
    .where(eq(denuncias.denuncianteId, user.id))
    .orderBy(desc(denuncias.createdAt));
  return Response.json({ denuncias: rows });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return bad("Debes iniciar sesión para registrar una denuncia", 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("Solicitud inválida");
  }

  const tipoCaso = String(body.tipoCaso || "").trim();
  const descripcion = String(body.descripcion || "").trim();
  const departamento = String(body.departamento || "").trim();
  const ciudad = String(body.ciudad || "").trim();
  const direccionHecho = String(body.direccionHecho || "").trim();
  const fechaHecho = String(body.fechaHecho || "").trim();
  const especieAnimal = String(body.especieAnimal || "").trim();
  const cantidadAnimales = String(body.cantidadAnimales || "").trim();
  const prioridad = ["baja", "media", "alta"].includes(String(body.prioridad))
    ? String(body.prioridad)
    : "media";

  if (!tipoCaso || !descripcion || !departamento || !ciudad)
    return bad("Faltan campos obligatorios de la denuncia");

  const codigo = genCodigo();
  const [created] = await db
    .insert(denuncias)
    .values({
      codigo,
      denuncianteId: user.id,
      tipoCaso,
      descripcion,
      departamento,
      ciudad,
      direccionHecho: direccionHecho || null,
      fechaHecho: fechaHecho || null,
      especieAnimal: especieAnimal || null,
      cantidadAnimales: cantidadAnimales || null,
      prioridad,
    })
    .returning();

  const mail = await sendDenunciaConfirm(user.correo, user.nombreCompleto, codigo, tipoCaso);
  return Response.json({ denuncia: created, emailSent: mail.sent });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "gestor" && user.role !== "admin"))
    return bad("No autorizado", 403);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("Solicitud inválida");
  }

  const id = Number(body.id);
  if (!id) return bad("ID requerido");
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (body.estado && ["recibida", "en_revision", "en_tramite", "cerrada"].includes(String(body.estado)))
    patch.estado = String(body.estado);
  if (body.prioridad && ["baja", "media", "alta"].includes(String(body.prioridad)))
    patch.prioridad = String(body.prioridad);
  if (typeof body.notasGestor === "string") patch.notasGestor = body.notasGestor;

  const [updated] = await db
    .update(denuncias)
    .set(patch)
    .where(eq(denuncias.id, id))
    .returning();
  if (!updated) return bad("Denuncia no encontrada", 404);
  return Response.json({ denuncia: updated });
}
