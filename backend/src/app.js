const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const config = require("./config");
const { errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const skillsRoutes = require("./routes/skills.routes");
const requestsRoutes = require("./routes/requests.routes");
const exchangesRoutes = require("./routes/exchanges.routes");
const messagesRoutes = require("./routes/messages.routes");
const ratingsRoutes = require("./routes/ratings.routes");
const matchRoutes = require("./routes/match.routes");

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ estado: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usersRoutes);
app.use("/api/habilidades", skillsRoutes);
app.use("/api/solicitudes", requestsRoutes);
app.use("/api/intercambios", exchangesRoutes);
app.use("/api/mensajes", messagesRoutes);
app.use("/api/calificaciones", ratingsRoutes);
app.use("/api/emparejamiento", matchRoutes);

app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada." }));
app.use(errorHandler);

module.exports = app;
