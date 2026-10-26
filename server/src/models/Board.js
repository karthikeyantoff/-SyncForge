import mongoose from 'mongoose';

export const BOARD_ROLES = ['owner', 'member', 'viewer'];

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: BOARD_ROLES,
      default: 'member',
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const boardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Board title is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: {
      type: [memberSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Fast lookup of boards a user is a member of
boardSchema.index({ 'members.user': 1 });

boardSchema.methods.membershipOf = function membershipOf(userId) {
  const targetId = String(userId);
  return this.members.find((m) => String(m.user?._id || m.user) === targetId);
};

boardSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

export const Board = mongoose.model('Board', boardSchema);
