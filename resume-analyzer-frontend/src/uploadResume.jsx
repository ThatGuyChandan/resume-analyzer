import React, { useState } from "react";
import axios from "axios";

export default function UploadResume() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFile(e.target.files[0]);
    setMessage("");
    setAnalysis(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("resume", file);

    setLoading(true);
    setMessage("");
    try {
      const res = await axios.post("http://localhost:3001/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage(res.data.message);
      setAnalysis(res.data.analysis);
    } catch (err) {
      console.error(err);
      setMessage("Upload or analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>Upload Your Resume</h2>
      <input type="file" onChange={handleChange} />
      <button
        onClick={handleUpload}
        style={{ marginLeft: "10px" }}
        disabled={loading}
      >
        {loading ? "Analyzing..." : "Upload & Analyze"}
      </button>

      {message && <p style={{ marginTop: "10px" }}>{message}</p>}

      {analysis && (
        <div style={{ marginTop: "20px" }}>
          <h3>Analysis Result:</h3>

          <p>
            <strong>Word Count:</strong> {analysis.wordCount}
          </p>

          <div>
            <strong>Key Phrases:</strong>
            <ul>
              {analysis.keyPhrases?.map((phrase, i) => (
                <li key={i}>{phrase.Text}</li>
              ))}
            </ul>
          </div>

          <div>
            <strong>Entities:</strong>
            <ul>
              {analysis.entities?.map((ent, i) => (
                <li key={i}>
                  {ent.Text} ({ent.Type})
                </li>
              ))}
            </ul>
          </div>

          {analysis.summary && (
            <div>
              <strong>Summary:</strong>
              <p>{analysis.summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
