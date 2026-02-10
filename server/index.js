import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import "./config/firebase.js";
import authRouter from "./routes/authRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import hodRouter from "./routes/hodRoutes.js";
import facultyRouter from "./routes/facultyRoutes.js";
import module1Router from "./routes/module1Routes.js";
import appealRouter from "./routes/appealRoutes.js";
import module1HodRouter from "./routes/module1HodRoutes.js";
import module5Router from "./routes/module5Routes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api", (req, res) => {
  res.send("API working");
});

app.use('/api/committee',authRouter);
app.use('/api/admin',adminRouter);
app.use('/api/hod',hodRouter);
app.use('/api/faculty',facultyRouter);
app.use('/api/module1',module1Router);
app.use('/api/module5',module5Router)
app.use('/api/appeal',appealRouter);
app.use('/api/hod/parta',module1HodRouter)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
