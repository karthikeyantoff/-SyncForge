import mongoose from 'mongoose';

const listSchema = new mongoose.Schema(
  {
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'List title is required'],
      trim: true,
      maxlength: 120,
    },
    // Fractional ordering position (O(1) updates)
    position: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

listSchema.index({ board: 1, position: 1 });

listSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

export const List = mongoose.model('List', listSchema);
