import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

// Usuarios: denunciantes, gestores y administradores de ALEGATO
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  role: text("role").notNull().default("denunciante"), // denunciante | gestor | admin
  nombreCompleto: text("nombre_completo").notNull(),
  tipoDocumento: text("tipo_documento"),
  numeroDocumento: text("numero_documento"),
  celular: text("celular"),
  correo: text("correo").notNull().unique(),
  direccion: text("direccion"),
  departamento: text("departamento"),
  ciudad: text("ciudad"),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Denuncias de maltrato animal
export const denuncias = pgTable("denuncias", {
  id: serial("id").primaryKey(),
  codigo: text("codigo").notNull().unique(), // referencia pública ALG-XXXXXX
  denuncianteId: integer("denunciante_id").references(() => users.id),
  tipoCaso: text("tipo_caso").notNull(),
  descripcion: text("descripcion").notNull(),
  departamento: text("departamento").notNull(),
  ciudad: text("ciudad").notNull(),
  direccionHecho: text("direccion_hecho"),
  fechaHecho: text("fecha_hecho"),
  especieAnimal: text("especie_animal"),
  cantidadAnimales: text("cantidad_animales"),
  estado: text("estado").notNull().default("recibida"), // recibida | en_revision | en_tramite | cerrada
  prioridad: text("prioridad").notNull().default("media"), // baja | media | alta
  notasGestor: text("notas_gestor"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Sesiones (tokens en cookie httpOnly)
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Códigos de recuperación de contraseña (hash del código, no texto plano)
export const resetCodes = pgTable("reset_codes", {
  id: serial("id").primaryKey(),
  correo: text("correo").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Denuncia = typeof denuncias.$inferSelect;
