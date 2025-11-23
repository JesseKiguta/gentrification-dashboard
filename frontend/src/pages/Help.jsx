export default function Help() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">Privacy Policy</h1>
        <p className="mb-6 text-gray-700">
          Welcome to the Nairobi Gentrification Monitor. This page explains how we handle 
          your data and ensure privacy while providing insights on neighborhood change.
        </p>

        <h2 className="text-xl font-semibold mb-2 text-gray-800">1. User Information</h2>
        <p className="mb-4 text-gray-700">
          We only store basic user information necessary for authentication and personalization, 
          such as your username and session token. No sensitive personal data is collected.
        </p>

        <h2 className="text-xl font-semibold mb-2 text-gray-800">2. Data Sources</h2>
        <p className="mb-4 text-gray-700">
          All neighborhood and subcounty data comes from publicly available datasets and aggregated 
          metrics. We do not collect private or personally identifiable information from residents.
        </p>

        <h2 className="text-xl font-semibold mb-2 text-gray-800">3. Data Usage</h2>
        <p className="mb-4 text-gray-700">
          Data collected is used to generate predictive analytics, risk assessments, and visualizations 
          on neighborhood trends. Insights are used solely for research, reporting, and public awareness.
        </p>

        <h2 className="text-xl font-semibold mb-2 text-gray-800">4. Notifications</h2>
        <p className="mb-4 text-gray-700">
          Notifications in the application inform you about high-risk areas, model updates, and new 
          predictive results. No personal information is used to generate these alerts.
        </p>

        <h2 className="text-xl font-semibold mb-2 text-gray-800">5. Third-Party Services</h2>
        <p className="mb-4 text-gray-700">
          The application does not share your information with third parties. All processing happens 
          locally in the browser or on our secure server endpoints.
        </p>

        <h2 className="text-xl font-semibold mb-2 text-gray-800">6. Security</h2>
        <p className="mb-4 text-gray-700">
          We implement standard security measures to protect stored user data. However, you are 
          responsible for keeping your login credentials secure.
        </p>

        <h2 className="text-xl font-semibold mb-2 text-gray-800">7. Contact</h2>
        <p className="mb-4 text-gray-700">
          For questions or concerns about this privacy policy or data handling, please contact the 
          project administrator via the contact form on our main website.
        </p>

        <p className="text-gray-500 text-sm mt-6">
          Last updated: November 2025
        </p>
      </div>
    </div>
  );
}
