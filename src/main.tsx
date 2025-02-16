import { createRoot } from "react-dom/client";
import React from "react";
import { Application } from "./modules/app/application";
import "./modules/styles/global.css";
createRoot(document.getElementById("root")!).render(<Application />);
