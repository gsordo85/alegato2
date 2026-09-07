import nodemailer from "nodemailer";

type MailResult = { sent: boolean; devCode?: string };

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

const FROM =
  process.env.SMTP_FROM || "ALEGATO – Juristas por los Animales <no-reply@alegato.co>";

function shell(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#0f172a;font-family:Segoe UI,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px">
    <div style="background:linear-gradient(135deg,#059669,#047857);border-radius:20px 20px 0 0;padding:28px 32px">
      <div style="font-size:26px;color:#fff;font-weight:800;letter-spacing:1px">🐾 ALEGATO</div>
      <div style="color:#d1fae5;font-size:13px;margin-top:4px">Juristas por los Animales · Colombia</div>
    </div>
    <div style="background:#fff;border-radius:0 0 20px 20px;padding:32px">
      <h2 style="margin:0 0 12px;color:#065f46">${title}</h2>
      ${body}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0"/>
      <p style="color:#94a3b8;font-size:12px;margin:0">Este es un mensaje automático de ALEGATO. Por favor no respondas a este correo.</p>
    </div>
  </div></body></html>`;
}

async function deliver(
  to: string,
  subject: string,
  html: string,
  devCode?: string,
): Promise<MailResult> {
  const t = getTransporter();
  if (!t) {
    // Sin SMTP configurado: registramos en consola del servidor (modo demo)
    console.log(`[MAILER:DEMO] Para: ${to} | Asunto: ${subject}${devCode ? ` | Código: ${devCode}` : ""}`);
    return { sent: false, devCode };
  }
  await t.sendMail({ from: FROM, to, subject, html });
  return { sent: true };
}

export async function sendWelcome(to: string, nombre: string) {
  return deliver(
    to,
    "Bienvenido/a a ALEGATO",
    shell(
      `Hola, ${nombre} 👋`,
      `<p style="color:#334155;line-height:1.6">Gracias por registrarte en <b>ALEGATO – Juristas por los Animales</b>.
      Tu cuenta ha sido creada correctamente y ya puedes registrar denuncias de maltrato animal
      en todo el territorio colombiano.</p>
      <p style="color:#334155;line-height:1.6">Nuestro equipo jurídico recibirá, clasificará y dará trámite a cada caso.
      Recibirás notificaciones automáticas sobre el estado de tus denuncias.</p>
      <p style="color:#065f46;font-weight:600">🐶🐱 Juntos defendemos a quienes no tienen voz.</p>`,
    ),
  );
}

export async function sendDenunciaConfirm(
  to: string,
  nombre: string,
  codigo: string,
  tipoCaso: string,
) {
  return deliver(
    to,
    `Denuncia recibida · ${codigo}`,
    shell(
      "Hemos recibido tu denuncia ✅",
      `<p style="color:#334155;line-height:1.6">Hola ${nombre}, tu denuncia por <b>${tipoCaso}</b> fue registrada con éxito.</p>
      <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:16px;text-align:center;margin:16px 0">
        <div style="color:#065f46;font-size:13px">Código de seguimiento</div>
        <div style="color:#047857;font-size:28px;font-weight:800;letter-spacing:2px">${codigo}</div>
      </div>
      <p style="color:#334155;line-height:1.6">Guarda este código para consultar el estado de tu caso.
      Un gestor de ALEGATO lo revisará y le dará trámite legal.</p>`,
    ),
  );
}

export async function sendResetCode(to: string, code: string) {
  return deliver(
    to,
    "Código de recuperación de contraseña",
    shell(
      "Recuperación de contraseña 🔐",
      `<p style="color:#334155;line-height:1.6">Recibimos una solicitud para restablecer tu contraseña.
      Usa el siguiente código (válido por 15 minutos):</p>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;text-align:center;margin:16px 0">
        <div style="color:#1e3a8a;font-size:32px;font-weight:800;letter-spacing:8px">${code}</div>
      </div>
      <p style="color:#334155;line-height:1.6">Si no solicitaste este cambio, ignora este mensaje; tu cuenta permanece segura.</p>`,
    ),
    code,
  );
}
