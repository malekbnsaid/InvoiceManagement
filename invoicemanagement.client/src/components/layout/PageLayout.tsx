import React from 'react';
import { motion } from 'framer-motion';
import { Breadcrumb, SectionHeader } from '../shared/UIComponents';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  className?: string;
}

export const PageLayout = ({
  children,
  title,
  description,
  action,
  breadcrumbs,
  className
}: PageLayoutProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {breadcrumbs && (
          <div className="mb-4">
            <Breadcrumb items={breadcrumbs} />
          </div>
        )}
        
        <SectionHeader
          title={title}
          description={description}
          action={action}
        />
        
        <div className="mt-6">
          {children}
        </div>
      </div>
    </motion.div>
  );
}; 