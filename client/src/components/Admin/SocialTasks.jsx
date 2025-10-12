import {
  Calendar,
  Coins,
  ExternalLink,
  Eye,
  EyeOff,
  MessageCircle,
  Play,
  Plus,
  ThumbsUp,
  UserPlus
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../styles/toast.css';
import { API_ENDPOINTS } from '../../config/api';
import { useAuthStore } from '../../store/useAuthStore';

const SocialTasks = () => {
  const { user, token } = useAuthStore();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    url: '',
    action: 'view',
    startAt: '',
    endAt: ''
  });
  const [formData, setFormData] = useState({
    action: 'view',
    title: '',
    url: '',
    videoId: '',
    channelId: '',
    startAt: '',
    endAt: ''
  });

  useEffect(() => {
    if (user && token && user.role === 'admin') {
      fetchTasks();
    }
  }, [user, token]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.social.adminTasks, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(API_ENDPOINTS.social.adminTasks, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(prev => [data.data, ...prev]);
        resetForm();
        setShowCreateForm(false);
        toast.success('Task created successfully!');
      } else {
        const error = await response.json();
        toast.error(error.message);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  const toggleTaskStatus = async (taskId, currentStatus) => {
    try {
      const response = await fetch(
        API_ENDPOINTS.social.adminToggleTask.replace(':taskId', taskId),
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        setTasks(prev => prev.map(task =>
          task._id === taskId
            ? { ...task, isActive: !task.isActive }
            : task
        ));
      } else {
        const error = await response.json();
        toast.error(error.message);
      }
    } catch (error) {
      console.error('Error toggling task status:', error);
      toast.error('Failed to toggle task status');
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const response = await fetch(`${API_ENDPOINTS.social.adminTasks}/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setTasks(prev => prev.filter(t => t._id !== taskId));
      } else {
        const error = await response.json();
        toast.error(error.message);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleInlineUpdate = async (taskId, updates) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.social.adminTasks}/${taskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(prev => prev.map(t => t._id === taskId ? data.data : t));
        toast.success('Task updated');
      } else {
        const error = await response.json();
        toast.error(error.message);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title || '',
      url: task.url || '',
      action: task.action || 'view',
      startAt: task.startAt ? new Date(task.startAt).toISOString().slice(0, 16) : '',
      endAt: task.endAt ? new Date(task.endAt).toISOString().slice(0, 16) : ''
    });
    setShowEditModal(true);
  };

  const submitEdit = async () => {
    if (!editingTask) return;
    const payload = {
      title: editForm.title,
      url: editForm.url,
      action: editForm.action,
      startAt: editForm.startAt || undefined,
      endAt: editForm.endAt || undefined
    };
    await handleInlineUpdate(editingTask._id, payload);
    setShowEditModal(false);
    setEditingTask(null);
  };

  const resetForm = () => {
    setFormData({
      action: 'view',
      title: '',
      url: '',
      videoId: '',
      channelId: '',
      maxClaimsPerUser: 1,
      startAt: '',
      endAt: ''
    });
    setEditingTask(null);
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'view': return <Play className="w-5 h-5" />;
      case 'like': return <ThumbsUp className="w-5 h-5" />;
      case 'comment': return <MessageCircle className="w-5 h-5" />;
      case 'subscribe': return <UserPlus className="w-5 h-5" />;
      default: return <ExternalLink className="w-5 h-5" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'view': return 'text-blue-600 bg-blue-100';
      case 'like': return 'text-red-600 bg-red-100';
      case 'comment': return 'text-green-600 bg-green-100';
      case 'subscribe': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const extractVideoId = (url) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : '';
  };

  const extractChannelId = (url) => {
    const regex = /youtube\.com\/(?:c\/|channel\/|@)([^\/\?]+)/;
    const match = url.match(regex);
    return match ? match[1] : '';
  };

  const handleUrlChange = (url) => {
    setFormData(prev => ({
      ...prev,
      url,
      videoId: extractVideoId(url),
      channelId: extractChannelId(url)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-20 pb-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading social tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 pt-20 pb-10">
      <ToastContainer
        position="top-center"
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
        autoClose={2500}
        hideProgressBar={false}
        draggable
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Social Tasks Management</h1>
            <p className="text-gray-600">Create and manage YouTube social earning tasks</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Task
          </button>
        </div>

        {/* Create Task Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Create Social Task</h2>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      resetForm();
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Default coin mapping per action (view 10, like 15, comment 20, subscribe 25) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Action Type
                    </label>
                    <select
                      value={formData.action}
                      onChange={(e) => setFormData(prev => ({ ...prev, action: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    >
                      <option value="view">View (10 coins)</option>
                      <option value="like">Like (15 coins)</option>
                      <option value="comment">Comment (20 coins)</option>
                      <option value="subscribe">Subscribe (25 coins)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.action === 'view' && 'This task will award 10 coins.'}
                      {formData.action === 'like' && 'This task will award 15 coins.'}
                      {formData.action === 'comment' && 'This task will award 20 coins.'}
                      {formData.action === 'subscribe' && 'This task will award 25 coins.'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Task Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="e.g., Watch our latest video"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      YouTube URL
                    </label>
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="https://www.youtube.com/watch?v=..."
                      required
                    />
                  </div>



                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.startAt}
                        onChange={(e) => setFormData(prev => ({ ...prev, startAt: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.endAt}
                        onChange={(e) => setFormData(prev => ({ ...prev, endAt: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-colors"
                    >
                      Create Task
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        resetForm();
                      }}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Tasks List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">All Tasks ({tasks.length})</h3>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <Coins className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No social tasks created yet</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Create First Task
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <div key={task._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${getActionColor(task.action)}`}>
                          {getActionIcon(task.action)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{task.title}</h4>
                          <p className="text-sm text-gray-600 capitalize">
                            {task.action} • {task.coins} coins • Max {task.maxClaimsPerUser} per user
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        <a
                          href={task.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open in YouTube
                        </a>
                        {task.videoId && (
                          <span>Video ID: {task.videoId}</span>
                        )}
                        {task.channelId && (
                          <span>Channel ID: {task.channelId}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Created: {new Date(task.createdAt).toLocaleDateString()}
                        </span>
                        {task.startAt && (
                          <span>Starts: {new Date(task.startAt).toLocaleDateString()}</span>
                        )}
                        {task.endAt && (
                          <span>Ends: {new Date(task.endAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleTaskStatus(task._id, task.isActive)}
                        className={`p-2 rounded-lg transition-colors ${task.isActive
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        title={task.isActive ? 'Deactivate task' : 'Activate task'}
                      >
                        {task.isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => openEditModal(task)}
                        className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                        title="Edit task"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(task._id)}
                        className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                        title="Delete task"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Edit Social Task</h2>
                  <button onClick={() => { setShowEditModal(false); setEditingTask(null); }} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Action Type</label>
                    <select
                      value={editForm.action}
                      onChange={(e) => setEditForm(prev => ({ ...prev, action: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="view">View (10 coins)</option>
                      <option value="like">Like (15 coins)</option>
                      <option value="comment">Comment (20 coins)</option>
                      <option value="subscribe">Subscribe (25 coins)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {editForm.action === 'view' && 'This task will award 10 coins.'}
                      {editForm.action === 'like' && 'This task will award 15 coins.'}
                      {editForm.action === 'comment' && 'This task will award 20 coins.'}
                      {editForm.action === 'subscribe' && 'This task will award 25 coins.'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">YouTube URL</label>
                    <input
                      type="url"
                      value={editForm.url}
                      onChange={(e) => setEditForm(prev => ({ ...prev, url: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date (Optional)</label>
                      <input
                        type="datetime-local"
                        value={editForm.startAt}
                        onChange={(e) => setEditForm(prev => ({ ...prev, startAt: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
                      <input
                        type="datetime-local"
                        value={editForm.endAt}
                        onChange={(e) => setEditForm(prev => ({ ...prev, endAt: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={submitEdit} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-colors">Save</button>
                    <button onClick={() => { setShowEditModal(false); setEditingTask(null); }} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors">Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialTasks;

