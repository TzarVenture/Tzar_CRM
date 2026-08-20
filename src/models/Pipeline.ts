import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPipelineStage {
  id: string;
  name: string;
  order: number;
}

export interface IPipeline extends Document {
  name: string;
  description?: string;
  stages: IPipelineStage[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PipelineStageSchema = new Schema<IPipelineStage>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  order: { type: Number, required: true },
});

const PipelineSchema: Schema<IPipeline> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    stages: [PipelineStageSchema],
    isDefault: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

const Pipeline: Model<IPipeline> =
  mongoose.models.Pipeline ||
  mongoose.model<IPipeline>("Pipeline", PipelineSchema);

export default Pipeline;
