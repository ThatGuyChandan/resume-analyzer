import React from "react";
import UploadResume from "./uploadResume";

function App() {
  return (
    <div style={{ textAlign: "center", padding: "30px", fontFamily: "Arial" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "20px" }}>
        AI Resume Analyzer
      </h1>
      <UploadResume />
    </div>
  );
}

export default App;
