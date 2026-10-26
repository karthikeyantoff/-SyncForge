import mongoose from 'mongoose';

export const CARD_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const labelSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 30 },
    color: { type: String, default: 'indigo' }, // slate, blue, emerald, amber, rose, indigo, purple
  },
  { _id: false }
);

const cardSchema = new mongoose.Schema(
  {
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true,
    },
    list: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'List',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Card title is required'],
      trim: true,
      maxlength: 280,
    },
    description: {
      type: String,
      default: '',
      maxlength: 5000,
    },
    position: {
      type: Number,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    priority: {
      type: String,
      enum: CARD_PRIORITIES,
      default: 'medium',
    },
    labels: {
      type: [labelSchema],
      default: [],
    },
    dueDate: {
      type: Date,
      default: null,
    },
    // Optimistic Concurrency Control (OCC) version counter
    version: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound index for sorted board column hydration
cardSchema.index({ board: 1, list: 1, position: 1 });

cardSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

export const Card = mongoose.model('Card', cardSchema);
