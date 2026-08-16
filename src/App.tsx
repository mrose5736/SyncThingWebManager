import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { Dashboard } from '@/pages/Dashboard';
import { ServerDetail } from '@/pages/ServerDetail';
import { Settings } from '@/pages/Settings';
import { DEMO_MODE } from '@/lib/demoMode';

// Self-hosted deployments run behind proxy-server.mjs, which serves index.html
// for any path (SPA fallback), so BrowserRouter's clean URLs work fine there.
// Static hosts like GitHub Pages have no server-side rewrite, so a direct
// load of /server/abc would 404 — HashRouter avoids that entirely.
const Router = DEMO_MODE ? HashRouter : BrowserRouter;

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<AppLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="server/:id" element={<ServerDetail />} />
                    <Route path="settings" element={<Settings />} />
                </Route>
            </Routes>
        </Router>
    );
}
