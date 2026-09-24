import mongoose, { Model, model, Schema } from "mongoose";
import type { User } from "../types/User.js";

const UserSchema = new Schema<User>({
  Email: {
    type: String,
    required: true,
    unique: true,
  },

  Password: {
    type: String,
  },

  CreatedAt: {
    type: Date,
    default: Date.now,
  },

  DeletedAt: {
    type: Date,
  },
  Location: {
    type: String,
    required: true,
  },
});

const UserModel =
  (mongoose.models.users as Model<User>) || model<User>("users", UserSchema);

export default UserModel;
