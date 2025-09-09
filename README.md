# 🤖 Bot de Tareas en Telegram

## 🔹 Tecnologías usadas
- **Node.js** (modo ES Modules con `"type": "module"` en `package.json`).
- **Telegraf**: framework para bots de Telegram.
- **dotenv**: para cargar el token desde `.env` (seguridad, no exponer en GitHub).
- **uuid**: generar identificadores únicos para cada tarea.
- **fs** (nativo de Node): leer/escribir el archivo `tasks.json`.

---

## 🔹 Estructura del proyecto
tareas-garredev_bot/
│
├─ index.js # Código del bot
├─ tasks.json # Base de datos local (inicializar con [])
├─ .env # Variables de entorno (BOT_TOKEN)
└─ package.json

yaml
Copiar código

---

## 🔹 Modelo de datos
Cada tarea es un objeto dentro de un array global `tasks.json`:

```json
[
  {
    "id": "f1a2b3c4-d5e6-7890",
    "userId": 123456789,
    "text": "Comprar leche",
    "done": false,
    "createdAt": "2025-09-09T10:15:00.000Z",
    "completedAt": null
  }
]
```
Campos
id: identificador único (uuid).

userId: ID de usuario de Telegram (cada uno tiene su lista independiente).

text: descripción de la tarea.

done: estado (true = completada, false = pendiente).

createdAt: fecha y hora de creación (ISO).

completedAt: fecha de finalización (null si está pendiente).

🔹 Interfaz de usuario
Comandos disponibles
/start → Muestra mensaje de bienvenida y ayuda con comandos.

/add <tarea> → Añade una nueva tarea a la lista.

Ejemplo: /add Comprar pan.

/list → Muestra todas las tareas pendientes, cada una con botones inline.

/completed → Muestra todas las tareas completadas, con opción de reabrir.

/detail <id> → Muestra información detallada de una tarea específica.

Botones inline
En pendientes:

✅ Completar → marca como hecha.

ℹ️ Detalles → información completa.

En completadas:

🔄 Reabrir → vuelve a poner como pendiente.

ℹ️ Detalles → información completa.

🔹 Flujo de usuario
/add Hacer la compra
→ ✅ Tarea añadida.

/list
→ 📌 Hacer la compra + botones inline.

Botón ✅ Completar
→ ✅ Completada: Hacer la compra.

/completed
→ Lista de tareas completadas.

🔹 Persistencia
Todas las tareas se guardan en un único JSON: tasks.json.

Inicializar con [].

Cada tarea tiene userId → multiusuario.

Se guarda en cada operación.

🔹 Estado actual
✅ Funcionalidades:

Añadir / Listar / Completar / Reabrir / Detalles.

Persistencia en JSON.

Multiusuario.

Seguridad con .env.

🔹 Cambios recientes
IDs ocultas en las vistas de listado:

En /list y /completed ya no se muestran las IDs en pantalla.

Las IDs se siguen generando y almacenando en JSON.

En /detail y botón ℹ️ siguen visibles.

🔹 Próximos pasos
Robustez en carga de tasks.json con try/catch.

Migrar a base de datos (SQLite o MongoDB).

Categorías o etiquetas.

Recordatorios automáticos.

API / frontend React.