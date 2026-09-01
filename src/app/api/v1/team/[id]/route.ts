import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { auth } from "@/lib/auth";

const UpdateTeamMemberSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z
    .enum([
      "SUPER_ADMIN",
      "ADMIN",
      "SALES_MANAGER",
      "BDE",
      "MEDIA_BUYER",
      "ACCOUNT_MANAGER",
      "CLIENT",
    ])
    .optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  allowedBusinesses: z.array(z.string()).optional(),
});

// PATCH: Edit Team Member
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user?.role !== "SUPER_ADMIN" && session.user?.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized: Admin only" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const parseResult = UpdateTeamMemberSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    await dbConnect();
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
    }

    const data = parseResult.data;
    if (data.name) user.name = data.name;
    if (data.email) user.email = data.email.toLowerCase();
    if (data.role) user.role = data.role as any;
    if (data.phone !== undefined) user.phone = data.phone;
    if (data.isActive !== undefined) user.isActive = data.isActive;
    if (data.allowedBusinesses !== undefined) user.allowedBusinesses = data.allowedBusinesses as any;
    if (data.password) {
      user.passwordHash = await bcrypt.hash(data.password, 10);
    }

    await user.save();

    const updatedUser = await User.findById(id).select("-passwordHash");
    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("PATCH Team Member Error:", error);
    return NextResponse.json(
      { error: "Failed to update team member" },
      { status: 500 }
    );
  }
}

// DELETE: Delete or Deactivate Team Member
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Super Admin only" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Prevent self-deletion
    if (session.user.id === id) {
      return NextResponse.json(
        { error: "Cannot delete your own admin account" },
        { status: 400 }
      );
    }

    await dbConnect();
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
    }

    return NextResponse.json(
      { status: "success", message: "Team member deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE Team Member Error:", error);
    return NextResponse.json(
      { error: "Failed to delete team member" },
      { status: 500 }
    );
  }
}
