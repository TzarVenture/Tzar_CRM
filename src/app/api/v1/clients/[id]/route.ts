import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import Client from "@/models/Client";
import { auth } from "@/lib/auth";

const UpdateClientSchema = z.object({
  companyName: z.string().min(1).optional(),
  primaryContactName: z.string().optional(),
  primaryContactEmail: z.string().email().optional(),
  primaryContactPhone: z.string().optional(),
  industry: z.string().optional(),
  monthlyRetainerBudget: z.number().optional(),
  status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]).optional(),
});

// PATCH: Edit Client Details
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const parseResult = UpdateClientSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    await dbConnect();
    const client = await Client.findById(id);

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const data = parseResult.data;
    if (data.companyName) client.companyName = data.companyName;
    if (data.industry) client.industry = data.industry;
    if (data.monthlyRetainerBudget !== undefined)
      client.monthlyRetainerBudget = data.monthlyRetainerBudget;
    if (data.status) client.status = data.status;

    if (
      data.primaryContactName ||
      data.primaryContactEmail ||
      data.primaryContactPhone
    ) {
      client.primaryContact = {
        name: data.primaryContactName || client.primaryContact.name,
        email: data.primaryContactEmail || client.primaryContact.email,
        phone: data.primaryContactPhone || client.primaryContact.phone,
      };
    }

    await client.save();

    return NextResponse.json({ client }, { status: 200 });
  } catch (error) {
    console.error("PATCH Client Error:", error);
    return NextResponse.json(
      { error: "Failed to update client account" },
      { status: 500 }
    );
  }
}

// DELETE: Delete Client Account
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
    await dbConnect();

    const deletedClient = await Client.findByIdAndDelete(id);
    if (!deletedClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(
      { status: "success", message: "Client deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE Client Error:", error);
    return NextResponse.json(
      { error: "Failed to delete client account" },
      { status: 500 }
    );
  }
}
