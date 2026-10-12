import { generateUploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/server/uploadthing";

export const UploadButton = generateUploadButton<OurFileRouter>();
