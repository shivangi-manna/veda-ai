'use client';

import React, { Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ArrowLeft, LayoutGrid, Sparkles, Bell, ChevronDown, HelpCircle, BarChart3 } from 'lucide-react';

function HeaderContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'home';

  // Determine breadcrumb content based on path/tab
  let showBackBtn = false;
  let BackLink = '/';
  let BreadcrumbIcon = null;
  let BreadcrumbText = '';

  if (pathname === '/') {
    if (activeTab === 'home') {
      showBackBtn = true;
      BackLink = '/?tab=home';
      BreadcrumbIcon = <LayoutGrid size={18} className="breadcrumb-grid-icon" />;
      BreadcrumbText = 'Home';
    } else if (activeTab === 'assignments') {
      showBackBtn = true;
      BackLink = '/?tab=home';
      BreadcrumbIcon = <LayoutGrid size={18} className="breadcrumb-grid-icon" />;
      BreadcrumbText = 'Assignment';
    } else if (activeTab === 'groups') {
      showBackBtn = true;
      BackLink = '/?tab=home';
      BreadcrumbIcon = <LayoutGrid size={18} className="breadcrumb-grid-icon" />;
      BreadcrumbText = 'Classroom Insights & Analytics';
    } else if (activeTab === 'toolkit') {
      showBackBtn = true;
      BackLink = '/?tab=home';
      BreadcrumbIcon = <BarChart3 size={18} className="breadcrumb-grid-icon text-brand" />;
      BreadcrumbText = 'Analytics';
    } else if (activeTab === 'library') {
      showBackBtn = true;
      BackLink = '/?tab=home';
      BreadcrumbIcon = <LayoutGrid size={18} className="breadcrumb-grid-icon" />;
      BreadcrumbText = 'My Library';
    }
  } else if (pathname === '/create') {
    showBackBtn = true;
    BackLink = '/?tab=assignments';
    BreadcrumbIcon = <LayoutGrid size={18} className="breadcrumb-grid-icon" />;
    BreadcrumbText = 'Assignment';
  } else if (pathname.startsWith('/output')) {
    showBackBtn = true;
    BackLink = '/?tab=assignments';
    BreadcrumbIcon = <Sparkles size={18} className="breadcrumb-grid-icon text-brand" />;
    BreadcrumbText = 'Create New';
  }

  const handleBackClick = () => {
    router.push(BackLink);
  };

  return (
    <header className="header-bar">
      <div className="header-breadcrumbs">
        {showBackBtn && (
          <button onClick={handleBackClick} className="header-breadcrumbs-back" aria-label="Go back">
            <ArrowLeft size={16} />
          </button>
        )}
        <div className="header-breadcrumb-content">
          {BreadcrumbIcon}
          <span className="breadcrumb-text">{BreadcrumbText}</span>
        </div>
      </div>
      
      <div className="header-user-actions">
        {/* Help — circular soft button */}
        <button className="header-icon-circle" aria-label="Help">
          <HelpCircle size={19} strokeWidth={1.8} />
        </button>

        {/* Notifications — circular soft button with coral badge */}
        <button className="header-icon-circle header-notify-btn" aria-label="Notifications">
          <Bell size={20} strokeWidth={1.8} />
          <span className="header-notify-badge"></span>
        </button>
        
        {/* Profile 3D pill */}
        <div className="header-user-profile">
          <img 
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150" 
            alt="Madhur Rastogi Avatar" 
            className="header-user-avatar"
          />
          <span className="header-user-name">Madhur Rastogi</span>
          <ChevronDown size={20} strokeWidth={2.2} className="header-user-caret" />
        </div>
      </div>
    </header>
  );
}

export default function Header() {
  return (
    <Suspense fallback={
      <header className="header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="header-breadcrumbs">
          <span className="breadcrumb-text">Loading...</span>
        </div>
      </header>
    }>
      <HeaderContent />
    </Suspense>
  );
}
