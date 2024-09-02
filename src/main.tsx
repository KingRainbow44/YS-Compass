import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import App from "@ui/App.tsx";

export const router = createBrowserRouter([{ path: "*", element: <App /> }]);

const root = createRoot(document.getElementById("root")!);
root.render(<RouterProvider router={router} />);
