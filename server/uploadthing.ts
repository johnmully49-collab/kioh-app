import {
  createUploadthing,
  type FileRouter,
} from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/auth";
import { getDb, type UserUploadDocument } from "@/server/lib/mongodb";

const upload = createUploadthing();

async function authorizeUpload(category: UserUploadDocument["category"]) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UploadThingError("Sign in before uploading application documents.");
  }

  return { userId: session.user.id, category };
}

async function saveUpload(
  file: { key: string; name: string; size: number; type: string },
  metadata: { userId: string; category: UserUploadDocument["category"] }
) {
  const db = await getDb();
  const document: UserUploadDocument = {
    _id: file.key,
    userId: metadata.userId,
    name: file.name,
    size: file.size,
    type: file.type,
    category: metadata.category,
    uploadedAt: new Date(),
  };
  await db.collection<UserUploadDocument>("userUploads").insertOne(document);

  return { key: document._id, name: document.name, size: document.size };
}

export const ourFileRouter = {
  pitchDeck: upload({
    pdf: {
      maxFileSize: "16MB",
      maxFileCount: 1,
      acl: "private",
    },
  })
    .middleware(() => authorizeUpload("pitchDeck"))
    .onUploadComplete(({ file, metadata }) => saveUpload(file, metadata)),
  certificates: upload({
    pdf: {
      maxFileSize: "8MB",
      maxFileCount: 1,
      acl: "private",
    },
    image: {
      maxFileSize: "8MB",
      maxFileCount: 1,
      acl: "private",
    },
  })
    .middleware(() => authorizeUpload("certificate"))
    .onUploadComplete(({ file, metadata }) => saveUpload(file, metadata)),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
