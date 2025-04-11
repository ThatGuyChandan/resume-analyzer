import React, { useState } from "react";
import axios from "axios";

export default function UploadResume() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [message, setMessage] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

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
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial",
        maxWidth: "800px",
        margin: "auto",
      }}
    >
      <h2>Upload Your Resume</h2>
      <input type="file" onChange={handleChange} />
      <br />
      <textarea
        placeholder="Paste the job description here..."
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        rows={6}
        style={{ width: "100%", marginTop: "10px", padding: "10px" }}
      />
      <br />
      <button
        onClick={handleUpload}
        style={{ marginTop: "10px" }}
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
            <strong>ATS Score:</strong>
            <p style={{ color: analysis.atsScore >= 50 ? "green" : "red" }}>
              {analysis.ats.score}% match with job description
            </p>
          </div>

          {analysis.missingKeywords?.length > 0 && (
            <div>
              <strong>Missing Keywords:</strong>
              <ul>
                {analysis.missingKeywords.map((kw, i) => (
                  <li key={i}>{kw}</li>
                ))}
              </ul>
            </div>
          )}

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
