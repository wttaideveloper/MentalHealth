import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import OtpPage from './pages/auth/OtpPage';
import EnterPassword from './pages/auth/EnterPassword';
import SignUpPage from './pages/auth/SignUpPage';
import RegisterPage from './pages/auth/RegisterPage';
import ConsentPage from './pages/ConsentPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import AssessmentIntroPage from './pages/assessment/AssessmentIntroPage';
import AssessmentPage from './pages/assessment/AssessmentPage';
import ResultPage from './pages/ResultPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/otp" element={<OtpPage />} />
        <Route path="/password" element={<EnterPassword />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/consent" element={<ConsentPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/assessment-intro" element={<AssessmentIntroPage />} />
        <Route path="/assessment" element={<AssessmentPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
