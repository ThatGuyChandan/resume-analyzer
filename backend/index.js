const express = require("express");
const multer = require("multer");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const lambda = new LambdaClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

app.post("/upload", upload.single("resume"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  const s3Key = `resumes/${Date.now()}_${file.originalname}`;
  const stream = fs.createReadStream(file.path);

  const uploadParams = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: s3Key,
    Body: stream,
    ContentType: file.mimetype,
  };

  try {
    // 1. Upload to S3
    await s3.send(new PutObjectCommand(uploadParams));
    fs.unlinkSync(file.path);

    // 2. Call Lambda to analyze
    const lambdaPayload = {
      bucket: process.env.S3_BUCKET_NAME,
      key: s3Key,
    };

    const command = new InvokeCommand({
      FunctionName: process.env.LAMBDA_FUNCTION_NAME,
      Payload: Buffer.from(JSON.stringify(lambdaPayload)),
    });

    const lambdaResponse = await lambda.send(command);
    const lambdaPayloadParsed = JSON.parse(
      Buffer.from(lambdaResponse.Payload).toString()
    );

    res.json({
      message: "Resume uploaded and analyzed!",
      analysis: JSON.parse(lambdaPayloadParsed.body),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Upload or analysis failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
