import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

export default function UploadResume() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [message, setMessage] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Default theme
    document.body.classList.add("dark");
  }, []);

  const toggleTheme = () => {
    document.body.classList.toggle("light");
  };

  const handleChange = (e) => {
    setFile(e.target.files[0]);
    setMessage("");
    setAnalysis(null);
  };

  const handleUpload = async () => {
    if (!file || !jobDescription) {
      alert("Please upload a resume and enter a job description.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobDescription", jobDescription);

    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post("http://localhost:3001/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
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
    <div className="container">
      <h1 className="title">AI Resume Analyzer</h1>

      <button className="theme-toggle" onClick={toggleTheme}>
        Toggle Theme
      </button>

      <div className="upload-section">
        <input type="file" onChange={handleChange} />
        <textarea
          placeholder="Paste the job description here..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
        <button onClick={handleUpload} disabled={loading}>
          {loading ? "Analyzing..." : "Upload & Analyze"}
        </button>
        {message && <p className="message">{message}</p>}
      </div>

      {analysis && (
        <div className="result-section">
          <h2>Analysis Result:</h2>

          <p>
            <strong>Word Count:</strong> {analysis.wordCount}
          </p>

          <div>
            <strong>ATS Score:</strong>
            <p
              className={`score ${
                parseInt(analysis.ats.score) >= 50 ? "good" : "bad"
              }`}
            >
              {analysis.ats.score}
            </p>
          </div>

          {analysis.ats?.missingKeywords?.length > 0 && (
            <div>
              <strong>Missing Keywords:</strong>
              <div className="scroll-box">
                <ul>
                  {analysis.ats.missingKeywords.map((kw, i) => (
                    <li key={i}>{kw}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {analysis.summary && (
            <div>
              <strong>Summary:</strong>
              <div className="scroll-box">
                <p style={{ whiteSpace: "pre-wrap" }}>{analysis.summary}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
