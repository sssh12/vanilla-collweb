import { getAuth } from "firebase/auth";
import app from "./config.js";

export const auth = getAuth(app);
