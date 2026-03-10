import { Router } from "express";
import authRouter from "./auth.js";
import statsRouter from "./stats.js";
import dealersRouter from "./dealers.js";
import subscriptionsRouter from "./subscriptions.js";
import activityRouter from "./activity.js";
import systemRouter from "./system.js";
import applicationsRouter from "./applications.js";
import interestedDealersRouter from "./interestedDealers.js";
import { adminBackupRouter } from "./backup.js";

const adminRouter = Router();

adminRouter.use("/auth", authRouter);
adminRouter.use("/applications", applicationsRouter);
adminRouter.use("/interested-dealers", interestedDealersRouter);
adminRouter.use("/stats", statsRouter);
adminRouter.use("/dealers", dealersRouter);
adminRouter.use("/subscriptions", subscriptionsRouter);
adminRouter.use("/activity", activityRouter);
adminRouter.use("/system", systemRouter);
adminRouter.use("/", adminBackupRouter);

export default adminRouter;
