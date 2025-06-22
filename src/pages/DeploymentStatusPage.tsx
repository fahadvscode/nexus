const LATEST_COMMIT_HASH = "bb8296a";

const DeploymentStatusPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-8">
      <div className="text-center border-4 border-yellow-400 rounded-lg p-10 bg-gray-800 shadow-2xl">
        <h1 className="text-4xl font-bold text-yellow-300 mb-4">
          Deployment Status Check
        </h1>
        <p className="text-lg text-gray-300 mb-6">
          If you can see this page, the deployment system is working.
        </p>
        <div className="space-y-3 text-left bg-gray-900 p-6 rounded-md">
          <p className="text-md">
            <span className="font-semibold text-gray-400">Current Time:</span>
            <span className="ml-2 font-mono text-green-400">{new Date().toISOString()}</span>
          </p>
          <p className="text-md">
            <span className="font-semibold text-gray-400">Commit Hash:</span>
            <span className="ml-2 font-mono text-green-400">{LATEST_COMMIT_HASH}</span>
          </p>
        </div>
        <p className="mt-6 text-yellow-400">
          This is a temporary diagnostic page to resolve a caching issue. The main application will be restored shortly.
        </p>
      </div>
    </div>
  );
};

export default DeploymentStatusPage; 