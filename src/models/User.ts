import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ISetuCredentials {
  clientId: string;
  clientSecret: string;
  productInstanceId: string;
  webhookSecret: string;
  baseUrl?: string;
  redirectUrl: string;
}

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;
  setuCredentials: ISetuCredentials;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    setuCredentials: {
      clientId: {
        type: String,
        required: true,
      },
      clientSecret: {
        type: String,
        required: true,
      },
      productInstanceId: {
        type: String,
        required: true,
      },
      webhookSecret: {
        type: String,
        required: true,
      },
      baseUrl: {
        type: String,
        default: 'https://dg-sandbox.setu.co',
      },
      redirectUrl: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);
