import { Route, Routes } from "react-router-dom";

import PacketVisualizer from "@pages/PacketVisualizer.tsx";

import "@css/App.scss";

import "react-contexify/ReactContexify.css";

function App() {
    return (
        <div className={"App"}>
            <Routes>
                <Route path={"/"} element={<div>Test</div>} />
                <Route path={"/visualizer"} element={<PacketVisualizer />} />
            </Routes>
        </div>
    );
}

export default App;
