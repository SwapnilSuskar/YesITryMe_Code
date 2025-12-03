import mongoose from "mongoose";

const courseContentSchema = new mongoose.Schema(
  {
    courseId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, "Name cannot exceed 200 characters"],
    },
    lessonNo: {
      type: Number,
      required: true,
      min: 1,
    },
    shortDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, "Short description cannot exceed 500 characters"],
    },
    link: {
      type: String,
      trim: true,
      default: "",
    },
    duration: {
      type: String,
      trim: true,
      default: "",
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
courseContentSchema.index({ courseId: 1, lessonNo: 1 });
courseContentSchema.index({ courseId: 1, isActive: 1 });

const CourseContent = mongoose.model("CourseContent", courseContentSchema);

export default CourseContent;

