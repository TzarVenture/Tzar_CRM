import { NextResponse } from "next/server";
import { z } from "zod";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/lib/auth";

const PresignedUrlSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  fileType: z.string().min(1, "File MIME type is required"),
  fileSize: z.number().min(1, "File size must be greater than 0"),
  category: z
    .enum(["CONTRACT", "PROPOSAL", "DESIGN_ASSET", "INVOICE", "OTHER"])
    .default("OTHER"),
  relatedLeadId: z.string().optional(),
  relatedClientId: z.string().optional(),
  accessLevel: z.enum(["INTERNAL_ONLY", "PUBLIC_CLIENT"]).default("INTERNAL_ONLY"),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = PresignedUrlSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { fileName, fileType } = parseResult.data;
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileKey = `crm-assets/${Date.now()}_${sanitizedFileName}`;

    const awsRegion = process.env.AWS_REGION || "ap-south-1";
    const bucketName = process.env.AWS_S3_BUCKET_NAME || "tzar-crm-file-assets";
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    let presignedUrl = "";
    let fileUrl = `https://${bucketName}.s3.${awsRegion}.amazonaws.com/${fileKey}`;

    // If live AWS credentials present, generate presigned upload URL
    if (accessKeyId && secretAccessKey && accessKeyId.startsWith("AKIA")) {
      try {
        const s3Client = new S3Client({
          region: awsRegion,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });

        const command = new PutObjectCommand({
          Bucket: bucketName,
          Key: fileKey,
          ContentType: fileType,
        });

        presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
      } catch (s3Err) {
        console.error("AWS S3 Presigned URL generation warning:", s3Err);
        presignedUrl = `/api/v1/files/dev-upload?key=${encodeURIComponent(fileKey)}`;
      }
    } else {
      // Dev mode simulated upload endpoint
      presignedUrl = `/api/v1/files/dev-upload?key=${encodeURIComponent(fileKey)}`;
      fileUrl = `/uploads/${sanitizedFileName}`;
    }

    return NextResponse.json(
      {
        presignedUrl,
        fileKey,
        fileUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Presigned URL Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate presigned upload URL" },
      { status: 500 }
    );
  }
}
