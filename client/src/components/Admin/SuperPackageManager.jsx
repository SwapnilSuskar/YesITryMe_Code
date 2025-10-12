import {
  Edit,
  Eye,
  EyeOff,
  Package,
  Plus,
  Trash2,
  TrendingUp
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { api, API_ENDPOINTS } from '../../config/api';

const SuperPackageManager = () => {
  const [superPackages, setSuperPackages] = useState([]);
  const [allPackages, setAllPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [stats, setStats] = useState({});
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: ''
  });

  useEffect(() => {
    fetchSuperPackages();
    fetchStats();
  }, []);

  const fetchSuperPackages = async () => {
    try {
      const response = await api.get(`${API_ENDPOINTS.superPackages.available}/admin/all`);
      const packages = response.data.data || [];
      setAllPackages(packages);
      filterPackages(packages, statusFilter);
    } catch (error) {
      console.error('Error fetching super packages:', error);
      toast.error('Failed to fetch super packages');
    } finally {
      setLoading(false);
    }
  };

  const filterPackages = (packages, filter) => {
    switch (filter) {
      case 'active':
        setSuperPackages(packages.filter(pkg => pkg.isActive));
        break;
      case 'inactive':
        setSuperPackages(packages.filter(pkg => !pkg.isActive));
        break;
      default:
        setSuperPackages(packages);
    }
  };

  const handleStatusFilterChange = (filter) => {
    setStatusFilter(filter);
    filterPackages(allPackages, filter);
  };

  const fetchStats = async () => {
    try {
      const response = await api.get(`${API_ENDPOINTS.superPackages.available}/stats/overview`);
      setStats(response.data.data || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.description) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      if (editingPackage) {
        await api.put(`${API_ENDPOINTS.superPackages.available}/${editingPackage._id}`, formData);
        toast.success('Super Package updated successfully');
      } else {
        await api.post(API_ENDPOINTS.superPackages.available, formData);
        toast.success('Super Package created successfully');
      }

      setShowForm(false);
      setEditingPackage(null);
      resetForm();
      fetchSuperPackages();
      fetchStats();
    } catch (error) {
      console.error('Error saving super package:', error);
      toast.error(error.response?.data?.message || 'Failed to save super package');
    }
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      price: pkg.price,
      description: pkg.description
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this super package?')) {
      return;
    }

    try {
      await api.delete(`${API_ENDPOINTS.superPackages.available}/${id}`);
      toast.success('Super Package deleted successfully');
      fetchSuperPackages();
      fetchStats();
    } catch (error) {
      console.error('Error deleting super package:', error);
      toast.error('Failed to delete super package');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.patch(`${API_ENDPOINTS.superPackages.available}/${id}/toggle-status`);
      toast.success('Status updated successfully');
      fetchSuperPackages();
      fetchStats();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      description: ''
    });
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingPackage(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 mt-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Super Package Manager</h1>
          <p className="text-gray-600 mt-2">Manage your super packages with advanced commission structures</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Add Super Package
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Packages</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPackages || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Packages</p>
              <p className="text-2xl font-bold text-green-600">{stats.activePackages || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive Packages</p>
              <p className="text-2xl font-bold text-red-600">{stats.inactivePackages || 0}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <EyeOff className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingPackage ? 'Edit Super Package' : 'Add New Super Package'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Package Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Bronze, Silver, Gold"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Note: "Booster" packages will have no commission distribution
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 999"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the package benefits..."
                    rows="3"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    {editingPackage ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelForm}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Packages Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Super Packages</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Packages ({allPackages.length})</option>
                <option value="active">Active Only ({allPackages.filter(pkg => pkg.isActive).length})</option>
                <option value="inactive">Inactive Only ({allPackages.filter(pkg => !pkg.isActive).length})</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Package
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission Levels
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {superPackages.map((pkg) => (
                <tr key={pkg._id} className={`hover:bg-gray-50 ${!pkg.isActive ? 'bg-gray-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Package className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{pkg.name}</div>
                        <div className="text-sm text-gray-500">ID: {pkg._id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">₹{pkg.price}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {pkg.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${pkg.isActive
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${pkg.isActive ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                      {pkg.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {pkg.commissionStructure.length} levels
                    </div>
                    <div className="text-xs text-gray-500">
                      {pkg.name.toLowerCase().includes('booster') ? 'No distribution' : '₹500 total'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(pkg)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(pkg._id)}
                        className={`p-1 rounded transition-colors ${pkg.isActive
                            ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50'
                            : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                          }`}
                        title={pkg.isActive ? 'Deactivate Package' : 'Activate Package'}
                      >
                        {pkg.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        onClick={() => handleDelete(pkg._id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {superPackages.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No super packages</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first super package.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Add Super Package
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperPackageManager;
