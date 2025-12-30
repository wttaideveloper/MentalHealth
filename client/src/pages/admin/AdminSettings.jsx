import { useState } from 'react';
import { showToast } from '../../utils/toast';

function AdminSettings() {
  const [settings, setSettings] = useState({
    consentVersion: '',
    tosUrl: '',
    privacyUrl: '',
    effectiveAt: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // This would call an API to update consent version
    showToast.info('Settings update feature coming soon!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-mh-dark">Settings</h1>
        <p className="text-gray-600 mt-1">Manage system configuration</p>
      </div>

      {/* Consent Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-mh-dark mb-4">Consent Version Management</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Version</label>
            <input
              type="text"
              value={settings.consentVersion}
              onChange={(e) => setSettings({ ...settings, consentVersion: e.target.value })}
              placeholder="e.g., 1.0.0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Terms of Service URL</label>
            <input
              type="url"
              value={settings.tosUrl}
              onChange={(e) => setSettings({ ...settings, tosUrl: e.target.value })}
              placeholder="https://example.com/terms"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Privacy Policy URL</label>
            <input
              type="url"
              value={settings.privacyUrl}
              onChange={(e) => setSettings({ ...settings, privacyUrl: e.target.value })}
              placeholder="https://example.com/privacy"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Effective Date</label>
            <input
              type="date"
              value={settings.effectiveAt}
              onChange={(e) => setSettings({ ...settings, effectiveAt: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-mh-green text-white px-6 py-2 rounded-lg hover:bg-[#027a4f] transition-colors"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-mh-dark mb-4">System Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">Platform Version</span>
            <span className="text-sm text-gray-900">1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">Environment</span>
            <span className="text-sm text-gray-900">Development</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">Database</span>
            <span className="text-sm text-gray-900">MongoDB</span>
          </div>
        </div>
      </div>

      {/* Additional Settings Placeholder */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-mh-dark mb-4">Additional Settings</h3>
        <p className="text-sm text-gray-600">More configuration options will be available here.</p>
      </div>
    </div>
  );
}

export default AdminSettings;

