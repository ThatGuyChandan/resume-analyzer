const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const comprehend = new AWS.Comprehend({ region: "ap-south-1" });
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

exports.handler = async (event) => {
  const bucket = event.bucket;
  const key = event.key;
  const jobDescription = event.jobDescription;

  try {
    const s3Object = await s3.getObject({ Bucket: bucket, Key: key }).promise();
    const buffer = s3Object.Body;

    let extractedText = "";

    if (key.endsWith(".pdf")) {
      const data = await pdfParse(buffer);
      extractedText = data.text;
    } else if (key.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Unsupported file type." }),
      };
    }

    const cleanText = extractedText.replace(/\s+/g, " ").trim();
    const textForComprehend = cleanText.slice(0, 5000);

    // AWS Comprehend analysis
    const [keyPhrasesResult, entitiesResult] = await Promise.all([
      comprehend
        .detectKeyPhrases({ LanguageCode: "en", Text: textForComprehend })
        .promise(),
      comprehend
        .detectEntities({ LanguageCode: "en", Text: textForComprehend })
        .promise(),
    ]);

    // Basic keyword matching for ATS score
    const resumeTextLower = cleanText.toLowerCase();
    const jdTextLower = jobDescription.toLowerCase();

    // Extract meaningful words from job description
    const rawKeywords = jdTextLower
      .split(/[\n,.;\-•()\[\]\/\\]+/)
      .map((w) => w.trim().toLowerCase());

    const stopWords = new Set([
      "and",
      "the",
      "for",
      "with",
      "are",
      "you",
      "your",
      "our",
      "that",
      "this",
      "will",
      "have",
      "has",
      "but",
      "from",
      "they",
      "them",
      "who",
      "what",
      "how",
      "when",
      "where",
      "which",
      "can",
      "must",
      "should",
      "a",
      "an",
      "to",
      "of",
      "in",
      "on",
    ]);

    const jdKeywords = rawKeywords.filter(
      (word) => word.length > 3 && !stopWords.has(word)
    );

    const found = jdKeywords.filter((keyword) =>
      resumeTextLower.includes(keyword)
    );
    const missing = jdKeywords.filter(
      (keyword) => !resumeTextLower.includes(keyword)
    );

    const atsScore =
      jdKeywords.length > 0
        ? Math.round((found.length / jdKeywords.length) * 100)
        : 0;

    return {
      statusCode: 200,
      body: JSON.stringify({
        wordCount: cleanText.split(/\s+/).length,
        summary: cleanText.slice(0, 300) + "...",
        keyPhrases: keyPhrasesResult.KeyPhrases,
        entities: entitiesResult.Entities,
        ats: {
          score: `${atsScore}% match with job description`,
          missingKeywords: missing,
        },
      }),
    };
  } catch (err) {
    console.error("Lambda error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        errorMessage: err.message || "Failed to process resume.",
      }),
    };
  }
};
