import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const app = initializeApp({ /* your config */ });
export const auth = getAuth(app);