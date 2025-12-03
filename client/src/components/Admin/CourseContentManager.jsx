import { BookOpen, Edit, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import api, { API_ENDPOINTS } from '../../config/api';

const COURSE_OPTIONS = [
  { id: 'a-to-z-mastery', name: 'A to Z Mastery' },
  { id: 'digital-growth-mastery', name: 'Digital Growth Mastery' },
  { id: 'social-media-mastery', name: 'Social Media Mastery' },
  { id: 'video-editing', name: 'Video Editing' },
  { id: 'ai-power-content-creation', name: 'AI Power & Content Creation' },
  { id: 'youtube-mastery', name: 'YouTube Mastery' },
];

const CourseContentManager = () => {
  const [courseContents, setCourseContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [formData, setFormData] = useState({
    courseId: '',
    name: '',
    lessonNo: '',
    shortDescription: '',
    link: '',
    duration: '',
  });

  useEffect(() => {
    fetchCourseContents();
  }, []);

  const fetchCourseContents = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.courseContent.all);
      setCourseContents(response.data.data || []);
    } catch (error) {
      console.error('Error fetching course content:', error);
      alert('Failed to fetch course content');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.courseId || !formData.name || !formData.lessonNo || !formData.shortDescription) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setSaving(true);
      if (editingContent) {
        // Update existing content
        await api.put(
          `${API_ENDPOINTS.courseContent.all}/${editingContent._id}`,
          formData
        );
      } else {
        // Create new content
        await api.post(API_ENDPOINTS.courseContent.all, formData);
      }

      setShowModal(false);
      setEditingContent(null);
      setFormData({
        courseId: '',
        name: '',
        lessonNo: '',
        shortDescription: '',
        link: '',
        duration: '',
      });
      fetchCourseContents();
    } catch (error) {
      console.error('Error saving course content:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save course content';
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (content) => {
    setEditingContent(content);
    setFormData({
      courseId: content.courseId,
      name: content.name,
      lessonNo: content.lessonNo.toString(),
      shortDescription: content.shortDescription,
      link: content.link || '',
      duration: content.duration || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course content?')) {
      return;
    }

    try {
      await api.delete(`${API_ENDPOINTS.courseContent.all}/${id}`);
      fetchCourseContents();
    } catch (error) {
      console.error('Error deleting course content:', error);
      alert('Failed to delete course content');
    }
  };

  const handleToggleStatus = async (content) => {
    try {
      await api.put(`${API_ENDPOINTS.courseContent.all}/${content._id}`, {
        isActive: !content.isActive,
      });
      fetchCourseContents();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update status');
    }
  };

  const openCreateModal = () => {
    setEditingContent(null);
    setFormData({
      courseId: '',
      name: '',
      lessonNo: '',
      shortDescription: '',
    });
    setShowModal(true);
  };

  // Filter course contents
  const filteredContents = courseContents.filter((content) => {
    const matchesSearch =
      content.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.shortDescription.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = selectedCourse === '' || content.courseId === selectedCourse;
    return matchesSearch && matchesCourse;
  });

  // Group by course
  const groupedContents = filteredContents.reduce((acc, content) => {
    if (!acc[content.courseId]) {
      acc[content.courseId] = [];
    }
    acc[content.courseId].push(content);
    return acc;
  }, {});

  // Sort lessons within each course
  Object.keys(groupedContents).forEach((courseId) => {
    groupedContents[courseId].sort((a, b) => a.lessonNo - b.lessonNo);
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center mt-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 mt-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
              <BookOpen className="text-orange-500" size={32} />
              Course Content Manager
            </h1>
            <p className="text-gray-600">Manage course content with name, lesson number, and description</p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Add Course Content
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <BookOpen className="text-blue-500" size={24} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Lessons</p>
                <p className="text-2xl font-bold text-gray-900">{courseContents.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <BookOpen className="text-green-500" size={24} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Lessons</p>
                <p className="text-2xl font-bold text-gray-900">
                  {courseContents.filter((c) => c.isActive).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <BookOpen className="text-purple-500" size={24} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Courses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(courseContents.map((c) => c.courseId)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Courses</option>
              {COURSE_OPTIONS.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Course Contents List */}
        <div className="space-y-6">
          {Object.keys(groupedContents).length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No course content found</p>
              <p className="text-gray-400 text-sm">Add your first course content to get started</p>
            </div>
          ) : (
            Object.keys(groupedContents).map((courseId) => {
              const courseName = COURSE_OPTIONS.find((c) => c.id === courseId)?.name || courseId;
              const lessons = groupedContents[courseId];

              return (
                <div key={courseId} className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">{courseName}</h2>
                    <p className="text-sm text-gray-600">{lessons.length} lesson(s)</p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {lessons.map((content) => (
                        <div
                          key={content._id}
                          className={`p-4 rounded-lg border-2 ${
                            content.isActive
                              ? 'border-green-200 bg-green-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                  Lesson {content.lessonNo}
                                </span>
                                <h3 className="text-lg font-semibold text-gray-800">{content.name}</h3>
                                <span
                                  className={`px-2 py-1 rounded text-xs ${
                                    content.isActive
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {content.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <p className="text-gray-600 mb-2">{content.shortDescription}</p>
                              {content.duration && (
                                <p className="text-gray-500 text-sm mb-1">
                                  <span className="font-medium">Duration:</span> {content.duration}
                                </p>
                              )}
                              {content.link && (
                                <p className="text-gray-500 text-sm mb-1">
                                  <span className="font-medium">Link:</span>{' '}
                                  <a
                                    href={content.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline break-all"
                                  >
                                    {content.link}
                                  </a>
                                </p>
                              )}
                              <p className="text-gray-400 text-xs">
                                Created: {new Date(content.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => handleToggleStatus(content)}
                                className={`px-3 py-1 rounded text-sm ${
                                  content.isActive
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                {content.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleEdit(content)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                title="Edit"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(content._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingContent ? 'Edit Course Content' : 'Add Course Content'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingContent(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course *
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="">Select a course</option>
                    {COURSE_OPTIONS.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lesson Number *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.lessonNo}
                    onChange={(e) => setFormData({ ...formData, lessonNo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter lesson number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter lesson name"
                    required
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Description *
                  </label>
                  <textarea
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter short description"
                    rows="4"
                    required
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.shortDescription.length}/500 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link (URL)
                  </label>
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="https://example.com/lesson-video"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: Add a link to the lesson content (video, document, etc.)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., 15 min, 30 min, 1 hour"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: Add the duration of the lesson
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingContent(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingContent ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseContentManager;

