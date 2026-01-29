import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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
import ProfilePage from './pages/user/ProfilePage';
import GroupAssessmentDashboardPage from './pages/user/GroupAssessmentDashboardPage';
import CreateGroupAssessmentPage from './pages/user/CreateGroupAssessmentPage';
import CombinedReportPage from './pages/user/CombinedReportPage';
// Shared Pages
import AboutUsPage from './pages/shared/AboutUsPage';
import ContactUsPage from './pages/shared/ContactUsPage';
import PrivacyPolicyPage from './pages/shared/PrivacyPolicyPage';
import TermsConditionsPage from './pages/shared/TermsConditionsPage';
// Assessment Via Link Pages
import AssessmentViaLinkPage1 from './pages/assessmentViaLink/AssessmentViaLinkPage1';
import AssessmentViaLinkPage2 from './pages/assessmentViaLink/AssessmentViaLinkPage2';
import AssessmentViaLinkPaymentPage from './pages/assessmentViaLink/AssessmentViaLinkPaymentPage';
import AssessmentViaLinkTestPage from './pages/assessmentViaLink/AssessmentViaLinkTestPage';
import AssessmentViaLinkResultPage from './pages/assessmentViaLink/AssessmentViaLinkResultPage';
// Group Assessment Via Link Pages
import GroupAssessmentRoleSelectionPage from './pages/assessmentViaLink/GroupAssessmentRoleSelectionPage';
// Other Pages 
import DashboardPage from './pages/dashboard/DashboardPage';
import PaymentPage from './pages/payment/PaymentPage';
import NotFoundPage from './pages/NotFoundPage';
// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminReports from './pages/admin/AdminReports';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAssessments from './pages/admin/AdminTests';
import AdminResults from './pages/admin/AdminResults';
import AdminAssessmentLinks from './pages/admin/AdminAssessmentLinks';
import AdminGroupAssessments from './pages/admin/AdminGroupAssessments';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/AdminLayout';

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#000',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            fontFamily: 'Manrope, sans-serif',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#039059',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        {/* Public Routes - Header determined by auth status */}
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/assessments" element={<Layout><AllAssessmentsPage /></Layout>} />
        <Route path="/assessment-detail/:id" element={<Layout><AssessmentDetailPage /></Layout>} />
        <Route path="/testimonials" element={<Layout><TestimonialsPage /></Layout>} />
        <Route path="/about" element={<Layout><AboutUsPage /></Layout>} />
        <Route path="/contact" element={<Layout><ContactUsPage /></Layout>} />
        <Route path="/privacy" element={<Layout><PrivacyPolicyPage /></Layout>} />
        <Route path="/terms" element={<Layout><TermsConditionsPage /></Layout>} />
        
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
        <Route path="/user/privacy" element={<Layout isLoggedIn={true}><PrivacyPolicyPage /></Layout>} />
        <Route path="/user/terms" element={<Layout isLoggedIn={true}><TermsConditionsPage /></Layout>} />
        <Route path="/my-assessments" element={<Layout isLoggedIn={true}><MyAssessmentsPage /></Layout>} />
        <Route path="/profile" element={<Layout isLoggedIn={true}><ProfilePage /></Layout>} />
        <Route path="/assessment-test/:id" element={<Layout isLoggedIn={true}><AssessmentTestPage /></Layout>} />
        <Route path="/test-result/:id" element={<Layout isLoggedIn={true}><AssessmentTestResultPage /></Layout>} />
        <Route path="/user/group-assessments" element={<Layout isLoggedIn={true}><GroupAssessmentDashboardPage /></Layout>} />
        <Route path="/user/group-assessments/create" element={<Layout isLoggedIn={true}><CreateGroupAssessmentPage /></Layout>} />
        <Route path="/user/group-assessments/:groupId" element={<Layout isLoggedIn={true}><GroupAssessmentDashboardPage /></Layout>} />
        <Route path="/user/group-assessments/:groupId/report" element={<Layout isLoggedIn={true}><CombinedReportPage /></Layout>} />
        
        {/* Assessment Via Link Routes */}
        <Route path="/assessment-link/:token" element={<Layout showHeaderFooter={false}><AssessmentViaLinkPage1 /></Layout>} />
        <Route path="/assessment-link/:token/step2" element={<Layout showHeaderFooter={false}><AssessmentViaLinkPage2 /></Layout>} />
        <Route path="/assessment-link/:token/payment" element={<Layout showHeaderFooter={false}><AssessmentViaLinkPaymentPage /></Layout>} />
        <Route path="/assessment-link/:token/test/:attemptId" element={<Layout showHeaderFooter={false}><AssessmentViaLinkTestPage /></Layout>} />
        <Route path="/assessment-link/:token/result/:resultId" element={<Layout showHeaderFooter={false}><AssessmentViaLinkResultPage /></Layout>} />
        
        {/* Group Assessment Via Link Routes */}
        <Route path="/group-assessment-link/:token/select-role" element={<Layout showHeaderFooter={false}><GroupAssessmentRoleSelectionPage /></Layout>} />
        <Route path="/group-assessment-link/:token/step2" element={<Layout showHeaderFooter={false}><AssessmentViaLinkPage2 /></Layout>} />
        <Route path="/group-assessment-link/:token/test/:attemptId" element={<Layout showHeaderFooter={false}><AssessmentViaLinkTestPage /></Layout>} />
        <Route path="/group-assessment-link/:token/result/:resultId" element={<Layout showHeaderFooter={false}><AssessmentViaLinkResultPage /></Layout>} />
        
        {/* Assessment & Payment Routes */}
        <Route path="/dashboard" element={<Layout isLoggedIn={true}><DashboardPage /></Layout>} />
        <Route path="/payment" element={<Layout isLoggedIn={true}><PaymentPage /></Layout>} />
        
        {/* Admin Routes */}
        <Route path="/admin-login" element={<Layout showHeaderFooter={false}><AdminLoginPage /></Layout>} />
        <Route 
          path="/admin/dashboard" 
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/reports" 
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminReports />
              </AdminLayout>
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminUsers />
              </AdminLayout>
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/assessments" 
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminAssessments />
              </AdminLayout>
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/results" 
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminResults />
              </AdminLayout>
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/assessment-links" 
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminAssessmentLinks />
              </AdminLayout>
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/group-assessments" 
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminGroupAssessments />
              </AdminLayout>
            </AdminRoute>
          } 
        />
        
        <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;
