"use server";

import { connectDB } from "@/lib/mongodb";
import Resume from "@/models/Resume";
import { requireAuth } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getUserResumes() {
  const user = await requireAuth();
  await connectDB();
  return Resume.find({ userId: user.id })
    .sort({ createdAt: -1 })
    .select("-parsedText")
    .lean();
}

export async function deleteResume(resumeId) {
  const user = await requireAuth();
  await connectDB();
  await Resume.findOneAndDelete({ _id: resumeId, userId: user.id });
  revalidatePath("/history");
  revalidatePath("/dashboard");
}
