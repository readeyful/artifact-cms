import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Eye, Code, Copy, Check, Heart, LogOut, User, Lock, Mail, Globe, Share2 } from 'lucide-react';

const API_URL = 'http://localhost:3000/api';

export default function MultiUserArtifactCMS() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [artifacts, setArtifacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterScope, setFilterScope] = useState('all'); // all, mine, public
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    type: 'html',
    description: '',
    code: '',
    tags: '',
    isPublic: false
  });
  const [authData, setAuthData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const artifactTypes = [
    { value: 'html', label: 'HTML' },
    { value: 'react', label: 'React (JSX)' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'mermaid', label: 'Mermaid' },
    { value: 'svg', label: 'SVG' }
  ];

  useEffect(() => {
    if (token) {
      fetchUser();
      fetchArtifacts();
    } else {
      setShowAuth(true);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  const fetchArtifacts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/artifacts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setArtifacts(data);
      }
    } catch (err) {
      setError('Error fetching artifacts');
    }
    setLoading(false);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const body = isLogin 
      ? { username: authData.username, password: authData.password }
      : authData;

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setShowAuth(false);
        setAuthData({ username: '', email: '', password: '' });
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setArtifacts([]);
    setShowAuth(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const body = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    };

    try {
      const url = isEditing 
        ? `${API_URL}/artifacts/${selectedArtifact.id}`
        : `${API_URL}/artifacts`;
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        await fetchArtifacts();
        resetForm();
      } else {
        const data = await response.json();
        setError(data.error || 'Error saving artifact');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({ title: '', type: 'html', description: '', code: '', tags: '', isPublic: false });
    setIsEditing(false);
    setSelectedArtifact(null);
  };

  const handleEdit = (artifact) => {
    setFormData({
      title: artifact.title,
      type: artifact.type,
      description: artifact.description || '',
      code: artifact.code,
      tags: artifact.tags.join(', '),
      isPublic: artifact.isPublic
    });
    setSelectedArtifact(artifact);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this artifact?')) return;

    try {
      const response = await fetch(`${API_URL}/artifacts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchArtifacts();
        if (selectedArtifact?.id === id) {
          resetForm();
        }
      }
    } catch (err) {
      setError('Error deleting artifact');
    }
  };

  const handleLike = async (id) => {
    try {
      const response = await fetch(`${API_URL}/artifacts/${id}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchArtifacts();
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handlePreview = (artifact) => {
    setSelectedArtifact(artifact);
    setShowPreview(true);
  };

  const handleCopy = async (code) => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredArtifacts = artifacts.filter(artifact => {
    const matchesSearch = artifact.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         artifact.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         artifact.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         artifact.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || artifact.type === filterType;
    const matchesScope = filterScope === 'all' || 
                        (filterScope === 'mine' && artifact.user_id === user?.id) ||
                        (filterScope === 'public' && artifact.isPublic);
    return matchesSearch && matchesType && matchesScope;
  });

  const renderPreview = () => {
    if (!selectedArtifact) return null;

    const { type, code } = selectedArtifact;

    if (type === 'html') {
      return (
        <iframe
          srcDoc={code}
          className="w-full h-full border-0"
          sandbox="allow-scripts"
          title="Preview"
        />
      );
    }

    if (type === 'react') {
      const wrappedCode = `
        <!DOCTYPE html>
        <html>
          <head>
            <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
            <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
            <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body>
            <div id="root"></div>
            <script type="text/babel">
              ${code}
              const root = ReactDOM.createRoot(document.getElementById('root'));
              root.render(React.createElement(Component || (() => React.createElement('div', null, 'Component not found'))));
            </script>
          </body>
        </html>
      `;
      return (
        <iframe
          srcDoc={wrappedCode}
          className="w-full h-full border-0"
          sandbox="allow-scripts"
          title="Preview"
        />
      );
    }

    if (type === 'markdown') {
      return (
        <div className="w-full h-full overflow-auto p-6 bg-white prose max-w-none">
          <pre className="whitespace-pre-wrap">{code}</pre>
        </div>
      );
    }

    if (type === 'svg') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-50">
          <div dangerouslySetInnerHTML={{ __html: code }} />
        </div>
      );
    }

    return (
      <pre className="w-full h-full overflow-auto p-6 bg-gray-900 text-gray-100">
        <code>{code}</code>
      </pre>
    );
  };

  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Code size={48} className="mx-auto mb-4 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Claude Artifact CMS</h1>
            <p className="text-gray-600">Collaborative artifact management</p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                isLogin ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                !isLogin ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={authData.username}
                  onChange={(e) => setAuthData({ ...authData, username: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={authData.email}
                    onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={authData.password}
                  onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-5/6 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{selectedArtifact?.title}</h3>
                <p className="text-sm text-gray-600">by {selectedArtifact?.username}</p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {renderPreview()}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Claude Artifact CMS</h1>
            <p className="text-gray-600">Collaborative artifact management</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">{user?.username}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {isEditing ? 'Edit Artifact' : 'Add New Artifact'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="My awesome artifact"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {artifactTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of your artifact"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="dashboard, interactive, data-viz"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="rounded"
                />
                <Globe size={16} />
                Make this artifact public (visible to all users)
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
              <textarea
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                rows="12"
                placeholder="Paste your artifact code here..."
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Plus size={18} />
                {isEditing ? 'Update Artifact' : 'Add Artifact'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search artifacts or users..."
              />
            </div>
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                {artifactTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filterScope}
                onChange={(e) => setFilterScope(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Artifacts</option>
                <option value="mine">My Artifacts</option>
                <option value="public">Public Artifacts</option>
              </select>
            </div>
          </div>
        </div>

        {/* Artifacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <Code size={48} className="mx-auto mb-4 opacity-50 animate-pulse" />
              <p className="text-lg">Loading artifacts...</p>
            </div>
          ) : filteredArtifacts.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <Code size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">No artifacts found. Add your first one above!</p>
            </div>
          ) : (
            filteredArtifacts.map(artifact => (
              <div key={artifact.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">{artifact.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {artifactTypes.find(t => t.value === artifact.type)?.label}
                        </span>
                        {artifact.isPublic && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            <Globe size={12} />
                            Public
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">by <span className="font-medium">{artifact.username}</span></p>
                  
                  {artifact.description && (
                    <p className="text-sm text-gray-600 mb-3">{artifact.description}</p>
                  )}
                  
                  {artifact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {artifact.tags.map((tag, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => handleLike(artifact.id)}
                      className={`flex items-center gap-1 text-sm ${
                        artifact.userLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                      } transition-colors`}
                    >
                      <Heart size={16} fill={artifact.userLiked ? 'currentColor' : 'none'} />
                      {artifact.likeCount}
                    </button>
                    <div className="text-xs text-gray-500">
                      {new Date(artifact.updated_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePreview(artifact)}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors text-sm"
                    >
                      <Eye size={16} />
                      Preview
                    </button>
                    {artifact.user_id === user?.id && (
                      <>
                        <button
                          onClick={() => handleEdit(artifact)}
                          className="flex items-center justify-center bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(artifact.id)}
                          className="flex items-center justify-center bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleCopy(artifact.code)}
                      className="flex items-center justify-center bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 transition-colors"
                      title="Copy code"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats Footer */}
        {artifacts.length > 0 && (
          <div className="mt-8 text-center text-gray-600">
            <p>Total Artifacts: {artifacts.length} | Showing: {filteredArtifacts.length}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const Component = MultiUserArtifactCMS;
