import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { auth } from "@/lib/auth";
import { cleanPermissions } from "@/lib/permissions";

const UpdateTeamMemberSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(10, "Password must be at least 10 characters").optional(),
  role: z.enum(["SALES_MANAGER", "BDE", "ACCOUNTANT", "ADMIN", "MEDIA_BUYER", "ACCOUNT_MANAGER"]).optional(),
  permissions: z.array(z.string()).nullable().optional(),
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
    if (!session || session.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only the Super Admin can edit team members" },
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

    // The Super Admin account cannot be demoted, deactivated or have its access narrowed, by anyone
    if (user.role === "SUPER_ADMIN") {
      if (
        data.role !== undefined ||
        data.isActive === false ||
        data.permissions !== undefined
      ) {
        return NextResponse.json(
          { error: "The Super Admin's role, status and access cannot be changed" },
          { status: 400 }
        );
      }
    }
    if (data.name) user.name = data.name;
    if (data.email) user.email = data.email.toLowerCase();
    if (data.role) user.role = data.role as any;
    if (data.phone !== undefined) user.phone = data.phone || undefined;
    if (data.permissions !== undefined) user.permissions = data.permissions === null ? undefined : cleanPermissions(data.permissions);
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
