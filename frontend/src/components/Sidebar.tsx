'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { 
  LayoutGrid, 
  Users, 
  FileText, 
  BarChart3, 
  History, 
  Settings, 
  Plus,
  Sparkles 
} from 'lucide-react';
import { useAssignmentStore } from '../store/useAssignmentStore';

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const assignments = useAssignmentStore((state) => state.assignments);

  const activeTab = searchParams.get('tab') || 'home';
  
  // Dynamic CTA button in the sidebar matching figma screenshots
  const isToolkitActive = activeTab === 'toolkit' || pathname.startsWith('/output');
  const ctaText = isToolkitActive ? 'AI Teacher\'s Toolkit' : 'Create Assignment';
  const ctaHref = isToolkitActive ? '/?tab=toolkit' : '/create';
  const CTAIcon = isToolkitActive ? Sparkles : Plus;

  const menuItems = [
    { name: 'Home', tab: 'home', href: '/?tab=home', icon: LayoutGrid },
    { name: 'My Classes', tab: 'groups', href: '/?tab=groups', icon: Users },
    { name: 'Assignments', tab: 'assignments', href: '/?tab=assignments', icon: FileText, badge: assignments.length || undefined },
    { name: 'Analytics', tab: 'toolkit', href: '/?tab=toolkit', icon: BarChart3 },
    { name: 'My Library', tab: 'library', href: '/?tab=library', icon: History, badge: 32 }
  ];

  return (
    <aside className="sidebar">
      <div>
        <Link href="/?tab=home" className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <span style={{ transform: 'translateY(-1px)' }}>V</span>
          </div>
          <span>VedaAI</span>
        </Link>

        <div className="btn-create-assignment-wrapper">
          <Link href={ctaHref} style={{ textDecoration: 'none' }}>
            <button className="btn-create-assignment">
              <CTAIcon size={16} />
              <span>{ctaText}</span>
            </button>
          </Link>
        </div>

        <nav>
          <ul className="sidebar-menu">
            {menuItems.map((item) => {
              const Icon = item.icon;
              
              // Handle active highlights: either matching active tab query, or path-based for output/creation views
              const isActive = (activeTab === item.tab && pathname === '/') || 
                               (item.tab === 'assignments' && (pathname.startsWith('/output') || pathname.startsWith('/create')));
              
              return (
                <li key={item.name}>
                  <Link 
                    href={item.href} 
                    className={`sidebar-item-link ${isActive ? 'sidebar-item-active' : ''}`}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                    {item.badge !== undefined && (
                      <span className="sidebar-item-badge">{item.badge}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="sidebar-footer">
        <Link href="/settings" className="sidebar-settings-link">
          <Settings size={18} />
          <span>Settings</span>
        </Link>

        <div className="sidebar-school-card">
          <img 
            src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100&h=100" 
            alt="School Avatar" 
            className="sidebar-school-avatar"
          />
          <div className="sidebar-school-info">
            <div className="sidebar-school-name" title="Delhi Public School">Delhi Public School</div>
            <div className="sidebar-school-location">Bokaro Steel City</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function Sidebar() {
  return (
    <Suspense fallback={<div className="sidebar">Loading...</div>}>
      <SidebarContent />
    </Suspense>
  );
}


