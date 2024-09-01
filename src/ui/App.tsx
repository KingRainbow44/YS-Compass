import { Route, Routes } from "react-router-dom";

import "@css/App.scss";

function App() {
    return (
        <div className={"App"}>
            <Routes>
                <Route path={"/"} element={<div>Test</div>} />
            </Routes>
        </div>
    );
}

export default App;
