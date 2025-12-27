import { useLocation, useParams, Link } from 'react-router-dom';

/**
 * Utility function to generate breadcrumbs based on the current route
 */
const generateBreadcrumbs = (pathname, params = {}, isLoggedIn = false) => {
  const breadcrumbs = [];
  
  // Split pathname into segments
  const segments = pathname.split('/').filter(Boolean);
  
  // Base home route based on login status
  const homeRoute = isLoggedIn ? '/user-home' : '/';
  const homeLabel = 'Home';
  
  // Always start with Home
  breadcrumbs.push({ label: homeLabel, path: homeRoute });
  
  // Handle different route patterns
  if (segments.length === 0) {
    return breadcrumbs;
  }
  
  // Handle assessment-detail route with ID
  if (pathname.includes('/assessment-detail/')) {
    breadcrumbs.push({ 
      label: 'All Assessments', 
      path: isLoggedIn ? '/user/assessments' : '/assessments' 
    });
    
    // Get assessment name from params or use ID
    const assessmentId = params.id;
    const assessmentName = params.name || `Assessment ${assessmentId}` || 'Assessment Detail';
    breadcrumbs.push({ 
      label: assessmentName, 
      path: pathname,
      isActive: true 
    });
    return breadcrumbs;
  }
  
  // Handle assessment-test route
  if (pathname.includes('/assessment-test/')) {
    breadcrumbs.push({ 
      label: 'My Assessments', 
      path: '/my-assessments' 
    });
    breadcrumbs.push({ 
      label: 'Assessment Test', 
      path: pathname,
      isActive: true 
    });
    return breadcrumbs;
  }
  
  // Handle test-result route
  if (pathname.includes('/test-result/')) {
    breadcrumbs.push({ 
      label: 'My Assessments', 
      path: '/my-assessments' 
    });
    breadcrumbs.push({ 
      label: 'Test Result', 
      path: pathname,
      isActive: true 
    });
    return breadcrumbs;
  }
  
  // Handle payment route
  if (pathname === '/payment') {
    breadcrumbs.push({ 
      label: 'All Assessments', 
      path: isLoggedIn ? '/user/assessments' : '/assessments' 
    });
    breadcrumbs.push({ 
      label: 'Assessment Detail', 
      path: '#' // Could be improved to track previous assessment
    });
    breadcrumbs.push({ 
      label: 'Check out', 
      path: pathname,
      isActive: true 
    });
    return breadcrumbs;
  }
  
  // Handle user routes
  if (isLoggedIn && segments[0] === 'user') {
    if (segments[1] === 'assessments') {
      breadcrumbs.push({ 
        label: 'All Assessments', 
        path: pathname,
        isActive: true 
      });
      return breadcrumbs;
    }
    if (segments[1] === 'assessment-detail') {
      breadcrumbs.push({ 
        label: 'All Assessments', 
        path: '/user/assessments' 
      });
      breadcrumbs.push({ 
        label: 'Assessment Detail', 
        path: pathname,
        isActive: true 
      });
      return breadcrumbs;
    }
    if (segments[1] === 'about') {
      breadcrumbs.push({ 
        label: 'About Us', 
        path: pathname,
        isActive: true 
      });
      return breadcrumbs;
    }
    if (segments[1] === 'contact') {
      breadcrumbs.push({ 
        label: 'Contact Us', 
        path: pathname,
        isActive: true 
      });
      return breadcrumbs;
    }
  }
  
  // Handle visitor routes
  if (segments[0] === 'assessments') {
    breadcrumbs.push({ 
      label: 'All Assessments', 
      path: pathname,
      isActive: true 
    });
    return breadcrumbs;
  }
  
  if (segments[0] === 'about') {
    breadcrumbs.push({ 
      label: 'About Us', 
      path: pathname,
      isActive: true 
    });
    return breadcrumbs;
  }
  
  if (segments[0] === 'contact') {
    breadcrumbs.push({ 
      label: 'Contact Us', 
      path: pathname,
      isActive: true 
    });
    return breadcrumbs;
  }
  
  if (segments[0] === 'testimonials') {
    breadcrumbs.push({ 
      label: 'Testimonials', 
      path: pathname,
      isActive: true 
    });
    return breadcrumbs;
  }
  
  if (segments[0] === 'user-home') {
    breadcrumbs.push({ 
      label: 'Services', 
      path: pathname,
      isActive: true 
    });
    return breadcrumbs;
  }
  
  if (segments[0] === 'my-assessments') {
    breadcrumbs.push({ 
      label: 'My Assessments', 
      path: pathname,
      isActive: true 
    });
    return breadcrumbs;
  }
  
  if (segments[0] === 'dashboard') {
    breadcrumbs.push({ 
      label: 'Dashboard', 
      path: pathname,
      isActive: true 
    });
    return breadcrumbs;
  }
  
  // Handle assessment-link routes
  if (segments[0] === 'assessment-link') {
    if (segments[1] === 'step2') {
      breadcrumbs.push({ 
        label: 'Assessment Link', 
        path: '/assessment-link' 
      });
      breadcrumbs.push({ 
        label: 'Step 2', 
        path: pathname,
        isActive: true 
      });
      return breadcrumbs;
    }
    if (segments[1] === 'test') {
      breadcrumbs.push({ 
        label: 'Assessment Link', 
        path: '/assessment-link' 
      });
      breadcrumbs.push({ 
        label: 'Test', 
        path: pathname,
        isActive: true 
      });
      return breadcrumbs;
    }
    breadcrumbs.push({ 
      label: 'Assessment Link', 
      path: pathname,
      isActive: true 
    });
    return breadcrumbs;
  }
  
  // Default: use the last segment as label
  const lastSegment = segments[segments.length - 1];
  const label = lastSegment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  breadcrumbs.push({ 
    label, 
    path: pathname,
    isActive: true 
  });
  
  return breadcrumbs;
};

/**
 * Breadcrumb Component
 * Automatically generates breadcrumbs based on the current route
 */
function Breadcrumb({ isLoggedIn = false, customLabel, assessmentName, variant = 'default' }) {
  const location = useLocation();
  const params = useParams();
  
  // Generate breadcrumbs
  let breadcrumbs = generateBreadcrumbs(location.pathname, params, isLoggedIn);
  
  // Override with custom label if provided (e.g., for assessment detail)
  if (customLabel) {
    const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
    if (lastBreadcrumb) {
      lastBreadcrumb.label = customLabel;
    }
  }
  
  // Override assessment name if provided
  if (assessmentName && breadcrumbs.length > 1) {
    const assessmentBreadcrumb = breadcrumbs.find(b => b.path.includes('/assessment-detail/'));
    if (assessmentBreadcrumb) {
      assessmentBreadcrumb.label = assessmentName;
    }
  }
  
  // Don't show breadcrumb on home page or auth pages
  if (
    location.pathname === '/' || 
    location.pathname === '/user-home' ||
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/signup') ||
    location.pathname.startsWith('/register') ||
    location.pathname.startsWith('/otp') ||
    location.pathname.startsWith('/password')
  ) {
    return null;
  }
  
  // Determine text colors based on variant
  const textColor = variant === 'light' ? 'text-white opacity-80' : 'text-gray-500';
  const activeColor = variant === 'light' ? 'text-white font-medium' : 'text-[#039059] font-medium';
  const hoverColor = variant === 'light' ? 'hover:text-white hover:opacity-100' : 'hover:text-gray-700';
  const separatorColor = variant === 'light' ? 'text-white opacity-50' : 'text-gray-400';
  
  return (
    <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6" aria-label="Breadcrumb">
      <ol className={`flex items-center space-x-2 text-sm ${textColor} mb-4 sm:mb-6`}>
        {breadcrumbs.map((crumb, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span className={`mx-1 sm:mx-2 ${separatorColor}`} aria-hidden="true">
                /
              </span>
            )}
            {crumb.isActive ? (
              <span 
                className={activeColor}
                aria-current={crumb.isActive ? 'page' : undefined}
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className={`${textColor} ${hoverColor} transition-colors cursor-pointer`}
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default Breadcrumb;

