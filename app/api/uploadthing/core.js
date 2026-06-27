import { createUploadthing } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  resumeUploader: f({
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      return { userId: "authenticated" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.ufsUrl || file.url, name: file.name, type: file.type };
    }),
};
