import dotenv from "dotenv";
import { Telegraf, Markup } from "telegraf";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";

dotenv.config();

// 🔑 Token desde .env
const bot = new Telegraf(process.env.BOT_TOKEN);

// Ruta del archivo JSON
const TASKS_FILE = "./tasks.json";

// 👉 Función para listar comandos
function getCommandsList() {
  return `
📋 *Comandos disponibles*:
/start - Iniciar el bot
/add <tarea> - Añadir una tarea
/list - Listar tareas pendientes
/completed - Ver tareas completadas
/detail <id> - Ver detalles de una tarea
/almuerzo - Ejecutar script de almuerzo
/help - Mostrar esta ayuda
`;
}

// 📂 Cargar tareas
function loadTasks() {
  if (!fs.existsSync(TASKS_FILE)) return [];
  return JSON.parse(fs.readFileSync(TASKS_FILE, "utf8"));
}

// 💾 Guardar tareas
function saveTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

// Base de datos en memoria
let tasks = loadTasks();

// 👉 /start
bot.start((ctx) => {
  ctx.reply("👋 Hola! Soy tu bot de tareas.\n\nComandos:\n➕ /add <tarea>\n📋 /list\n✅ /completed\nℹ️ /detail <id>");
});

// 👉 /help
bot.command("help", (ctx) => {
  ctx.reply(getCommandsList(), { parse_mode: "Markdown" });
});

// 👉 Añadir tarea
bot.command("add", (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text.replace("/add", "").trim();
  if (!text) return ctx.reply("Escribe la tarea después de /add");

  const newTask = {
    id: uuidv4(),
    userId,
    text,
    done: false,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };

  tasks.push(newTask);
  saveTasks(tasks);

  ctx.reply(`✅ Tarea añadida:\n${text}`);
});

// 👉 Listar tareas pendientes
bot.command("list", (ctx) => {
  const userId = ctx.from.id;
  const pending = tasks.filter((t) => t.userId === userId && !t.done);

  if (pending.length === 0) return ctx.reply("🎉 No tienes tareas pendientes.");

  pending.forEach((t) => {
    ctx.reply(
      // `📌 ${t.text}\n🆔 ${t.id}`,
      `📌 ${t.text}`,
      Markup.inlineKeyboard([
        Markup.button.callback("✅ Completar", `done_${t.id}`),
        Markup.button.callback("ℹ️ Detalles", `detail_${t.id}`),
      ])
    );
  });
});

// 👉 Ver tareas completadas
bot.command("completed", (ctx) => {
  const userId = ctx.from.id;
  const completed = tasks.filter((t) => t.userId === userId && t.done);

  if (completed.length === 0) return ctx.reply("❌ No tienes tareas completadas.");

  completed.forEach((t) => {
    ctx.reply(
      // `✅ ${t.text}\n🆔 ${t.id}`,
      `✅ ${t.text}`,
      Markup.inlineKeyboard([
        Markup.button.callback("🔄 Reabrir", `reopen_${t.id}`),
        Markup.button.callback("ℹ️ Detalles", `detail_${t.id}`),
      ])
    );
  });
});

// 👉 Detalles de una tarea
bot.command("detail", (ctx) => {
  const args = ctx.message.text.split(" ");
  const id = args[1];
  if (!id) return ctx.reply("Usa: /detail <id>");

  const task = tasks.find((t) => t.id === id && t.userId === ctx.from.id);
  if (!task) return ctx.reply("❌ No encontré esa tarea.");

  ctx.reply(
    `📌 *${task.text}*\n\n` +
    `🆔 ${task.id}\n` +
    `📅 Creada: ${task.createdAt}\n` +
    (task.done ? `✅ Completada: ${task.completedAt}` : "❌ Pendiente"),
    { parse_mode: "Markdown" }
  );
});

// 👉 Acción: completar
bot.action(/done_(.+)/, (ctx) => {
  const id = ctx.match[1];
  const task = tasks.find((t) => t.id === id && t.userId === ctx.from.id);

  if (!task) return ctx.answerCbQuery("No encontrada");
  task.done = true;
  task.completedAt = new Date().toISOString();
  saveTasks(tasks);

  ctx.editMessageText(`✅ Completada: ${task.text}`);
  ctx.answerCbQuery("Tarea completada 🎉");
});

// 👉 Acción: reabrir
bot.action(/reopen_(.+)/, (ctx) => {
  const id = ctx.match[1];
  const task = tasks.find((t) => t.id === id && t.userId === ctx.from.id);

  if (!task) return ctx.answerCbQuery("No encontrada");
  task.done = false;
  task.completedAt = null;
  saveTasks(tasks);

  ctx.editMessageText(`🔄 Reabierta: ${task.text}`);
  ctx.answerCbQuery("Tarea reabierta");
});

// 👉 Acción: detalles inline
bot.action(/detail_(.+)/, (ctx) => {
  const id = ctx.match[1];
  const task = tasks.find((t) => t.id === id && t.userId === ctx.from.id);

  if (!task) return ctx.answerCbQuery("No encontrada");

  ctx.reply(
    `📌 *${task.text}*\n\n` +
    `🆔 ${task.id}\n` +
    `📅 Creada: ${task.createdAt}\n` +
    (task.done ? `✅ Completada: ${task.completedAt}` : "❌ Pendiente"),
    { parse_mode: "Markdown" }
  );
  ctx.answerCbQuery();
});


// 👉 Regulación NCC
bot.command("almuerzo", async (ctx) => {
  try {
    const response = await fetch("http://13.38.209.190:5000/generar_csv");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 🔽 Buffer del fichero
    const buffer = await response.buffer();

    // Nombre del archivo (si el servidor lo da en el header "content-disposition")
    let filename = "archivo_descargado";
    const disposition = response.headers.get("content-disposition");
    if (disposition && disposition.includes("filename=")) {
      filename = disposition.split("filename=")[1].replace(/["']/g, "");
    }

    // 📤 Enviar al chat como documento
    await ctx.replyWithDocument(
      { source: buffer, filename },
      { caption: "📂 Aquí tienes el archivo de almuerzo" }
    );
  } catch (error) {
    console.error("Error al descargar archivo:", error);
    ctx.reply("⚠️ No se pudo descargar el archivo.");
  }
});

// 🔄 Lanzar bot
bot.launch();
console.log("🤖 Bot de tareas corriendo...");
