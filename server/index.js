import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import "./config/firebase.js";
import authRouter from "./routes/authRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import hodRouter from "./routes/hodRoutes.js";
import facultyRouter from "./routes/facultyRoutes.js";
import module1Router from "./routes/module1Routes.js";
import appealRouter from "./routes/appealRoutes.js";
import module1HodRouter from "./routes/module1HodRoutes.js";
import module5Router from "./routes/module5Routes.js";
import module1HodPartbRouter from "./routes/module1HodPartbRoutes.js";
import appealHodRouter from "./routes/appealHodRoutes.js";
import module2Router from "./routes/module2Routes.js";
import module3Router from "./routes/module3Routes.js";
import module4Router from "./routes/module4Routes.js";
import deanRouter from "./routes/deanRoutes.js";
import superadminRouter from "./routes/superadminRoutes.js";
import submissionRouter from "./routes/submissionRoutes.js";



const app = express();
app.use(cors());
app.use(express.json());

app.get("/api", (req, res) => {
  res.send("API working");
});

app.use("/api/auth", authRouter);
app.use("/api/committee", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/hod", hodRouter);
app.use("/api/dean", deanRouter);
app.use("/api/faculty", facultyRouter);
app.use("/api/module1", module1Router);
app.use("/api/module5", module5Router);
app.use("/api/appeal", appealRouter);
app.use("/api/hod/parta", module1HodRouter);
app.use("/api/hod/partb", module1HodPartbRouter);
app.use("/api/hod/appeals", appealHodRouter);
app.use("/api/module2", module2Router);
app.use("/api/module3", module3Router);
app.use("/api/module4", module4Router);
app.use("/api/superadmin", superadminRouter);
app.use("/api/submissions", submissionRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
