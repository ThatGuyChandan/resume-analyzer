const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

exports.handler = async (event) => {
  const bucket = event.bucket;
  const key = event.key;

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
      return { statusCode: 400, body: "Unsupported file type" };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ text: extractedText }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: "Failed to extract resume text",
    };
  }
};
