import mongoose, { Schema, Document } from 'mongoose';

// FIX 1: Use Omit<Document, '_id'>
// This tells TypeScript: "Take the Document type, but DELETE the default _id rule so I can make my own."
export interface IPoll extends Omit<Document, '_id'> {
  _id: string; // Now we can safely say it's a string
  question: string;
  options: {
    id: string;
    text: string;
    votes: number;
  }[];
  duration: number;
  status: 'active' | 'ended';
  createdAt: Date;
}

const PollSchema: Schema = new Schema({
  _id: { type: String, required: true }, // We set this manually using UUID
  question: { type: String, required: true },
  options: [{
    id: { type: String, required: true },
    text: { type: String, required: true },
    votes: { type: Number, default: 0 }
  }],
  duration: { type: Number, required: true },
  status: { type: String, enum: ['active', 'ended'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
}, {
  _id: false // FIX 2: Tell Mongoose not to touch our ID
});

export default mongoose.model<IPoll>('Poll', PollSchema);