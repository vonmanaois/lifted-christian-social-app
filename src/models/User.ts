import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true, index: true },
    image: { type: String, trim: true },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },
    bio: { type: String, trim: true, maxlength: 280 },
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
    theme: {
      type: String,
      enum: ["light", "dark", "midnight", "purple-rose"],
      default: "light",
    },
    prayersLiftedCount: { type: Number, default: 0 },
    deletionRequestedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
    onboardingComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type User = InferSchemaType<typeof UserSchema>;

const UserModel = (models.User as Model<User>) || model<User>("User", UserSchema);

export default UserModel;
