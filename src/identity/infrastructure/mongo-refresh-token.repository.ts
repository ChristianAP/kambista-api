import { Model } from 'mongoose';
import { RefreshTokenRepository } from '../application/refresh-token.repository';
import { RefreshToken } from '../domain/refresh-token';
import { RefreshTokenRecord } from './refresh-token.model';

const toRecord = (token: RefreshToken): RefreshTokenRecord => ({
  _id: token.id,
  userId: token.userId,
  familyId: token.familyId,
  tokenHash: token.tokenHash,
  createdAt: token.createdAt,
  expiresAt: token.expiresAt,
  revokedAt: token.revokedAt,
});

const toEntity = (record: RefreshTokenRecord): RefreshToken =>
  RefreshToken.restore({
    id: record._id,
    userId: record.userId,
    familyId: record.familyId,
    tokenHash: record.tokenHash,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
    revokedAt: record.revokedAt ?? null,
  });

export class MongoRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly model: Model<RefreshTokenRecord>) {}

  async save(token: RefreshToken): Promise<void> {
    await this.model.replaceOne({ _id: token.id }, toRecord(token), { upsert: true });
  }

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    const record = await this.model.findOne({ tokenHash }).lean<RefreshTokenRecord>();
    return record ? toEntity(record) : null;
  }

  async revokeIfActive(id: string, revokedAt: Date): Promise<boolean> {
    const result = await this.model.updateOne(
      { _id: id, revokedAt: null },
      { $set: { revokedAt } },
    );
    return result.modifiedCount === 1;
  }

  async revokeFamily(familyId: string, revokedAt: Date): Promise<void> {
    await this.model.updateMany({ familyId, revokedAt: null }, { $set: { revokedAt } });
  }
}
