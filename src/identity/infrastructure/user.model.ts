import { model, Schema } from 'mongoose';
import { Role } from '../../shared/domain/role';

export interface UserRecord {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
}

const userSchema = new Schema<UserRecord>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(Role), required: true },
    createdAt: { type: Date, required: true },
  },
  { collection: 'users', versionKey: false },
);

export const UserModel = model<UserRecord>('User', userSchema);
