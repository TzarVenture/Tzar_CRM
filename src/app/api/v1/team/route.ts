import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { auth } from "@/lib/auth";

const AddTeamMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum([
    "SUPER_ADMIN",
    "SALES_MANAGER",
    "BDE",
    "MEDIA_BUYER",
    "ACCOUNT_MANAGER",
    "CLIENT",
  ]),
  phone: z.string().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Super Admin only" },
        { status: 403 }
      );
    }

    await dbConnect();
    const team = await User.find({ role: { $ne: "CLIENT" } })
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    return NextResponse.json({ team }, { status: 200 });
  } catch (error) {
    console.error("GET Team Error:", error);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Super Admin only" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parseResult = AddTeamMemberSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password, role, phone } = parseResult.data;
    await dbConnect();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      phone,
      isActive: true,
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error("POST Team Member Error:", error);
    return NextResponse.json(
      { error: "Failed to add team member" },
      { status: 500 }
    );
  }
}
