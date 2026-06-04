'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { LayoutGrid, Presentation, FileText, Book, PieChart } from 'lucide-react';
import { useAssignmentStore } from '../store/useAssignmentStore';

function MobileNavbarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const assignments = useAssignmentStore((state) => state.assignments);

  const activeTab = searchParams.get('tab') || 'home';

  const navItems = [
    { name: 'Home', tab: 'home', href: '/?tab=home', icon: LayoutGrid },
    { name: 'Groups', tab: 'groups', href: '/?tab=groups', icon: Presentation },
    { name: 'Assignments', tab: 'assignments', href: '/?tab=assignments', icon: FileText, badge: assignments.length || undefined },
    { name: 'Toolkit', tab: 'toolkit', href: '/?tab=toolkit', icon: Book },
    { name: 'Library', tab: 'library', href: '/?tab=library', icon: PieChart }
  ];

  return (
    <nav className="mobile-navbar">
      {navItems.map((item) => {
        const Icon = item.icon;
        
        // Handle active state matching Sidebar.tsx
        const isActive = (activeTab === item.tab && pathname === '/') || 
                         (item.tab === 'assignments' && (pathname.startsWith('/output') || pathname.startsWith('/create')));
        
        return (
          <Link 
            key={item.name} 
            href={item.href} 
            className={`mobile-nav-item ${isActive ? 'mobile-nav-item-active' : ''}`}
          >
            <div className="mobile-nav-icon-wrapper">
              <Icon size={20} />
              {item.badge !== undefined && (
                <span className="mobile-nav-badge">{item.badge}</span>
              )}
            </div>
            <span className="mobile-nav-label">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function MobileNavbar() {
  return (
    <Suspense fallback={<div className="mobile-navbar">Loading...</div>}>
      <MobileNavbarContent />
    </Suspense>
  );
}
