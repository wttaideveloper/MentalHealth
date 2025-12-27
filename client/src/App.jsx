import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import OtpPage from './pages/auth/OtpPage';
import EnterPassword from './pages/auth/EnterPassword';
import SignUpPage from './pages/auth/SignUpPage';
import RegisterPage from './pages/auth/RegisterPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
// Visitor Pages
import HomePage from './pages/visitor/HomePage';
import AllAssessmentsPage from './pages/visitor/AllAssessmentsPage';
import AssessmentDetailPage from './pages/visitor/AssessmentDetailPage';
import TestimonialsPage from './pages/visitor/TestimonialsPage';
// User Pages
import UserHomePage from './pages/user/UserHomePage';
import MyAssessmentsPage from './pages/user/MyAssessmentsPage';
import AssessmentTestPage from './pages/user/AssessmentTestPage';
import AssessmentTestResultPage from './pages/user/AssessmentTestResultPage';
// Shared Pages
import AboutUsPage from './pages/shared/AboutUsPage';
import ContactUsPage from './pages/shared/ContactUsPage';
// Assessment Via Link Pages
import AssessmentViaLinkPage1 from './pages/assessmentViaLink/AssessmentViaLinkPage1';
import AssessmentViaLinkPage2 from './pages/assessmentViaLink/AssessmentViaLinkPage2';
import AssessmentViaLinkTestPage from './pages/assessmentViaLink/AssessmentViaLinkTestPage';
// Other Pages 
import DashboardPage from './pages/dashboard/DashboardPage';
import PaymentPage from './pages/payment/PaymentPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Visitor Routes */}
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/assessments" element={<Layout><AllAssessmentsPage /></Layout>} />
        <Route path="/assessment-detail/:id" element={<Layout><AssessmentDetailPage /></Layout>} />
        <Route path="/testimonials" element={<Layout><TestimonialsPage /></Layout>} />
        <Route path="/about" element={<Layout><AboutUsPage /></Layout>} />
        <Route path="/contact" element={<Layout><ContactUsPage /></Layout>} />
        
        {/* Auth Routes - No Header/Footer */}
        <Route path="/login" element={<Layout showHeaderFooter={false}><LoginPage /></Layout>} />
        <Route path="/otp" element={<Layout showHeaderFooter={false}><OtpPage /></Layout>} />
        <Route path="/verify-email" element={<Layout showHeaderFooter={false}><OtpPage /></Layout>} />
        <Route path="/password" element={<Layout showHeaderFooter={false}><EnterPassword /></Layout>} />
        <Route path="/reset-password" element={<Layout showHeaderFooter={false}><ResetPasswordPage /></Layout>} />
        <Route path="/signup" element={<Layout showHeaderFooter={false}><SignUpPage /></Layout>} />
        <Route path="/register" element={<Layout showHeaderFooter={false}><RegisterPage /></Layout>} />
        
        {/* User Routes */}
        <Route path="/user-home" element={<Layout isLoggedIn={true}><UserHomePage /></Layout>} />
        <Route path="/user/assessments" element={<Layout isLoggedIn={true}><AllAssessmentsPage /></Layout>} />
        <Route path="/user/assessment-detail/:id" element={<Layout isLoggedIn={true}><AssessmentDetailPage /></Layout>} />
        <Route path="/user/about" element={<Layout isLoggedIn={true}><AboutUsPage /></Layout>} />
        <Route path="/user/contact" element={<Layout isLoggedIn={true}><ContactUsPage /></Layout>} />
        <Route path="/my-assessments" element={<Layout isLoggedIn={true}><MyAssessmentsPage /></Layout>} />
        <Route path="/assessment-test/:id" element={<Layout isLoggedIn={true} showHeaderFooter={false}><AssessmentTestPage /></Layout>} />
        <Route path="/test-result/:id" element={<Layout isLoggedIn={true} showHeaderFooter={false}><AssessmentTestResultPage /></Layout>} />
        
        {/* Assessment Via Link Routes */}
        <Route path="/assessment-link" element={<Layout showHeaderFooter={false}><AssessmentViaLinkPage1 /></Layout>} />
        <Route path="/assessment-link/step2" element={<Layout showHeaderFooter={false}><AssessmentViaLinkPage2 /></Layout>} />
        <Route path="/assessment-link/test" element={<Layout showHeaderFooter={false}><AssessmentViaLinkTestPage /></Layout>} />
        
        {/* Assessment & Payment Routes */}
        <Route path="/dashboard" element={<Layout isLoggedIn={true}><DashboardPage /></Layout>} />
        <Route path="/payment" element={<Layout isLoggedIn={true}><PaymentPage /></Layout>} />
        
        <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;
