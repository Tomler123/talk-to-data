// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Upload from "./pages/TalkToData";
import Dashboard from "./pages/Dashboard";
import Enroll from "./pages/EnrollVoice";
import Voices from "./pages/Voices";
import Layout from "./components/Layout";
import MyVoices from './pages/MyVoices';
import AdminAuditLogs from './pages/AdminAuditLogs';
import PrivateRoute from './components/PrivateRoute';
import AdminUsers from "./pages/AdminUsers";

import "./styles/global.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"        element={<Login />} />
        <Route path="/login"   element={<Login />} />
        
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          {/* <Route
            path="/dashboard"
            element={
              <PrivateRoute roles={['admin','data analyst','business user']}>
                <Dashboard />
              </PrivateRoute>
            }
          /> */}
          <Route path="/upload"    element={<Upload />} />
          {/* <Route
            path="/upload"
            element={
              <PrivateRoute roles={['admin','data analyst','business user']}>
                <Upload />
              </PrivateRoute>
            }
          /> */}
          
          <Route path="/my-voices"     element={<MyVoices />} />
          <Route
            path="/enroll"
            element={
              <PrivateRoute roles={['admin','data analyst','business user']}>
                <Enroll />
              </PrivateRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PrivateRoute roles={['admin']}>
                <Register />
              </PrivateRoute>
            }
          />
          <Route
            path="/voices"
            element={
              <PrivateRoute roles={['admin']}>
                <Voices />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <PrivateRoute roles={['admin']}>
                <AdminAuditLogs />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <PrivateRoute roles={['admin']}>
                <AdminUsers />
              </PrivateRoute>
            }
          />
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
