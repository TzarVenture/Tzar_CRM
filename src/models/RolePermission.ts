import mongoose, { Schema, Document, Model } from "mongoose";

/** The owner's saved default access for a role. A role with no document uses the built-in defaults. */
export interface IRolePermission extends Document {
  role: string;
  permissions: string[];
  updatedAt: Date;
}

const RolePermissionSchema: Schema<IRolePermission> = new Schema(
  {
    role: { type: String, required: true, unique: true },
    permissions: { type: [String], default: [] },
  },
  { timestamps: true }
);

const RolePermission: Model<IRolePermission> =
  mongoose.models.RolePermission || mongoose.model<IRolePermission>("RolePermission", RolePermissionSchema);

export default RolePermission;
