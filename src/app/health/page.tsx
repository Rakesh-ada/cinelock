"use client";

import { useEffect, useState } from "react";

export default function HealthCheckPage() {
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/health')
            .then(res => res.json())
            .then(data => {
                setHealth(data);
                setLoading(false);
            })
            .catch(err => {
                setHealth({ error: err.message });
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-xl">Loading health check...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">🏥 System Health Check</h1>
                
                <div className={`p-6 rounded-lg mb-6 ${health?.healthy ? 'bg-green-900/30 border border-green-500' : 'bg-red-900/30 border border-red-500'}`}>
                    <h2 className="text-2xl font-semibold mb-2">
                        {health?.healthy ? '✅ System Healthy' : '❌ System Issues Detected'}
                    </h2>
                    <p className="text-sm text-gray-400">
                        Environment: {health?.environment || 'unknown'} | 
                        Time: {health?.timestamp}
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Environment Variables */}
                    <div className="bg-gray-800 rounded-lg p-6">
                        <h3 className="text-xl font-semibold mb-4">📋 Environment Variables</h3>
                        <div className="space-y-2">
                            {health?.checks?.envVars && Object.entries(health.checks.envVars).map(([key, value]: [string, any]) => (
                                <div key={key} className="flex items-center gap-3">
                                    <span className={`text-2xl`}>
                                        {value ? '✅' : '❌'}
                                    </span>
                                    <span className="font-mono text-sm">{key}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* MongoDB Status */}
                    <div className="bg-gray-800 rounded-lg p-6">
                        <h3 className="text-xl font-semibold mb-4">🗄️ MongoDB Connection</h3>
                        {health?.checks?.mongodb?.status === 'connected' ? (
                            <div>
                                <p className="text-green-400 mb-2">✅ Connected</p>
                                <p className="text-sm text-gray-400">Database: <span className="font-mono">{health.checks.mongodb.database}</span></p>
                                <p className="text-sm text-gray-400 mt-2">Collections:</p>
                                <ul className="list-disc list-inside text-sm text-gray-400 ml-4">
                                    {health.checks.mongodb.collections?.map((col: string) => (
                                        <li key={col} className="font-mono">{col}</li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div>
                                <p className="text-red-400 mb-2">❌ Connection Failed</p>
                                <pre className="text-xs bg-gray-900 p-3 rounded overflow-auto">
                                    {health?.checks?.mongodb?.error}
                                </pre>
                            </div>
                        )}
                    </div>

                    {/* Authentication Status */}
                    <div className="bg-gray-800 rounded-lg p-6">
                        <h3 className="text-xl font-semibold mb-4">🔐 Authentication</h3>
                        {health?.checks?.auth?.status === 'authenticated' ? (
                            <div>
                                <p className="text-green-400">✅ Authenticated</p>
                                <p className="text-sm text-gray-400 font-mono mt-1">User ID: {health.checks.auth.userId}</p>
                            </div>
                        ) : health?.checks?.auth?.status === 'not-authenticated' ? (
                            <p className="text-yellow-400">⚠️ Not authenticated (this is OK for health check endpoint)</p>
                        ) : (
                            <div>
                                <p className="text-red-400 mb-2">❌ Error</p>
                                <pre className="text-xs bg-gray-900 p-3 rounded overflow-auto">
                                    {health?.checks?.auth?.error}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Items */}
                {!health?.healthy && (
                    <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-6 mt-6">
                        <h3 className="text-xl font-semibold mb-4">⚠️ Action Required</h3>
                        <ul className="list-disc list-inside space-y-2 text-sm">
                            {!health?.checks?.envVars?.mongodb && (
                                <li>Add <code className="bg-gray-800 px-2 py-1 rounded">MONGODB_URI</code> to your environment variables</li>
                            )}
                            {!health?.checks?.envVars?.azureApiKey && (
                                <li>Add <code className="bg-gray-800 px-2 py-1 rounded">AZURE_OPENAI_API_KEY</code> to your environment variables</li>
                            )}
                            {!health?.checks?.envVars?.azureEndpoint && (
                                <li>Add <code className="bg-gray-800 px-2 py-1 rounded">AZURE_OPENAI_ENDPOINT</code> to your environment variables</li>
                            )}
                            {!health?.checks?.envVars?.clerkSecret && (
                                <li>Add <code className="bg-gray-800 px-2 py-1 rounded">CLERK_SECRET_KEY</code> to your environment variables</li>
                            )}
                            {health?.checks?.mongodb?.status === 'failed' && (
                                <li>Check MongoDB Atlas Network Access - add <code className="bg-gray-800 px-2 py-1 rounded">0.0.0.0/0</code> to IP whitelist</li>
                            )}
                        </ul>
                    </div>
                )}

                <div className="mt-8 text-center text-sm text-gray-500">
                    <button 
                        onClick={() => window.location.reload()} 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                    >
                        Refresh Check
                    </button>
                </div>
            </div>
        </div>
    );
}
