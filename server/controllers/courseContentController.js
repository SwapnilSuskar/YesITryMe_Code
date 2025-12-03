import CourseContent from "../models/CourseContent.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// @desc    Get all course content
// @route   GET /api/course-content
// @access  Private/Admin
export const getAllCourseContent = asyncHandler(async (req, res) => {
  const { courseId } = req.query;
  
  const query = {};
  if (courseId) {
    query.courseId = courseId;
  }

  const courseContents = await CourseContent.find(query)
    .populate("uploadedBy", "firstName lastName email")
    .sort({ courseId: 1, lessonNo: 1 });

  res.status(200).json({
    success: true,
    data: courseContents,
    count: courseContents.length,
  });
});

// @desc    Get course content by ID
// @route   GET /api/course-content/:id
// @access  Private/Admin
export const getCourseContentById = asyncHandler(async (req, res) => {
  const courseContent = await CourseContent.findById(req.params.id).populate(
    "uploadedBy",
    "firstName lastName email"
  );

  if (!courseContent) {
    return res.status(404).json({
      success: false,
      message: "Course content not found",
    });
  }

  res.status(200).json({
    success: true,
    data: courseContent,
  });
});

// @desc    Create course content
// @route   POST /api/course-content
// @access  Private/Admin
export const createCourseContent = asyncHandler(async (req, res) => {
  const { courseId, name, lessonNo, shortDescription, link, duration } = req.body;

  // Validation
  if (!courseId || !name || !lessonNo || !shortDescription) {
    return res.status(400).json({
      success: false,
      message: "Please provide courseId, name, lessonNo, and shortDescription",
    });
  }

  // Check if lesson number already exists for this course
  const existingContent = await CourseContent.findOne({
    courseId,
    lessonNo,
  });

  if (existingContent) {
    return res.status(400).json({
      success: false,
      message: `Lesson ${lessonNo} already exists for this course`,
    });
  }

  const courseContent = await CourseContent.create({
    courseId,
    name,
    lessonNo: parseInt(lessonNo),
    shortDescription,
    link: link || "",
    duration: duration || "",
    uploadedBy: req.user.id,
  });

  await courseContent.populate("uploadedBy", "firstName lastName email");

  res.status(201).json({
    success: true,
    message: "Course content created successfully",
    data: courseContent,
  });
});

// @desc    Update course content
// @route   PUT /api/course-content/:id
// @access  Private/Admin
export const updateCourseContent = asyncHandler(async (req, res) => {
  const { name, lessonNo, shortDescription, link, duration, isActive } = req.body;

  const courseContent = await CourseContent.findById(req.params.id);

  if (!courseContent) {
    return res.status(404).json({
      success: false,
      message: "Course content not found",
    });
  }

  // If lessonNo is being changed, check for conflicts
  if (lessonNo && lessonNo !== courseContent.lessonNo) {
    const existingContent = await CourseContent.findOne({
      courseId: courseContent.courseId,
      lessonNo: parseInt(lessonNo),
      _id: { $ne: req.params.id },
    });

    if (existingContent) {
      return res.status(400).json({
        success: false,
        message: `Lesson ${lessonNo} already exists for this course`,
      });
    }
  }

  // Update fields
  if (name !== undefined) courseContent.name = name;
  if (lessonNo !== undefined) courseContent.lessonNo = parseInt(lessonNo);
  if (shortDescription !== undefined)
    courseContent.shortDescription = shortDescription;
  if (link !== undefined) courseContent.link = link;
  if (duration !== undefined) courseContent.duration = duration;
  if (isActive !== undefined) courseContent.isActive = isActive;

  await courseContent.save();
  await courseContent.populate("uploadedBy", "firstName lastName email");

  res.status(200).json({
    success: true,
    message: "Course content updated successfully",
    data: courseContent,
  });
});

// @desc    Delete course content
// @route   DELETE /api/course-content/:id
// @access  Private/Admin
export const deleteCourseContent = asyncHandler(async (req, res) => {
  const courseContent = await CourseContent.findById(req.params.id);

  if (!courseContent) {
    return res.status(404).json({
      success: false,
      message: "Course content not found",
    });
  }

  await CourseContent.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Course content deleted successfully",
  });
});

// @desc    Get course content by courseId
// @route   GET /api/course-content/course/:courseId
// @access  Public (for course detail page)
export const getCourseContentByCourseId = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const courseContents = await CourseContent.find({
    courseId,
    isActive: true,
  })
    .populate("uploadedBy", "firstName lastName")
    .sort({ lessonNo: 1 });

  res.status(200).json({
    success: true,
    data: courseContents,
    count: courseContents.length,
  });
});

