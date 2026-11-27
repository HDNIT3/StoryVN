import { Schema, Types } from 'mongoose';

export interface SystemConfig {
  _id: string;
  config_key: string;
  config_value: string;
  description: string;
  updated_by: Types.ObjectId;
  updated_at: Date;
}

export const SystemConfigSchema = new Schema<SystemConfig>(
  {
    _id: { type: String, required: true },
    config_key: { type: String, required: true, immutable: true },
    config_value: { type: String, default: '' },
    description: { type: String, default: '' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updated_at: { type: Date, required: true },
  },
  { collection: 'system_config', versionKey: false },
);
