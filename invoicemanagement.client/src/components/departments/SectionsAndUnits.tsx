import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { 
  UserGroupIcon, 
  ChevronDownIcon, 
  ChevronRightIcon,
  UserIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import React from 'react';

// Mock data for IT Department structure
const mockITDepartment = {
  id: 1,
  name: "IT Department",
  sections: [
    {
      id: 1,
      name: "Software Development",
      units: [
        { id: 1, name: "Frontend Development", projects: 8 },
        { id: 2, name: "Backend Development", projects: 12 },
        { id: 3, name: "QA & Testing", projects: 7 }
      ]
    },
    {
      id: 2,
      name: "Infrastructure",
      units: [
        { id: 4, name: "Network Operations", projects: 5 },
        { id: 5, name: "System Administration", projects: 9 },
        { id: 6, name: "Security", projects: 6 }
      ]
    },
    {
      id: 3,
      name: "Support Services",
      units: [
        { id: 7, name: "Help Desk", projects: 3 },
        { id: 8, name: "Technical Support", projects: 2 }
      ]
    }
  ]
};

type Unit = {
  id: number;
  name: string;
  projects: number;
};

type Section = {
  id: number;
  name: string;
  units: Unit[];
};

type Department = {
  id: number;
  name: string;
  sections: Section[];
};

const SectionsAndUnits = () => {
  const [expandedSections, setExpandedSections] = useState<number[]>([1]); // Start with first section expanded
  const [department] = useState<Department>(mockITDepartment);

  const toggleSection = (sectionId: number) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <UserGroupIcon className="h-6 w-6 mr-2 text-primary-500" />
          {department.name} Structure
        </h1>
        <Button size="sm" className="flex items-center">
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Section
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {department.sections.map(section => (
          <Card key={section.id}>
            <CardHeader 
              className="cursor-pointer py-3 flex flex-row items-center justify-between"
              onClick={() => toggleSection(section.id)}
            >
              <CardTitle className="text-lg flex items-center">
                <UserGroupIcon className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400" />
                {section.name}
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  ({section.units.length} units)
                </span>
              </CardTitle>
              {expandedSections.includes(section.id) ? (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRightIcon className="h-5 w-5 text-gray-500" />
              )}
            </CardHeader>
            
            {expandedSections.includes(section.id) && (
              <CardContent>
                <div className="space-y-3">
                  {section.units.map(unit => (
                    <motion.div
                      key={unit.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="font-medium text-gray-800 dark:text-gray-200">{unit.name}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {unit.projects} projects
                        </span>
                        <Button variant="outline" size="sm">
                          View Projects
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                  <Button variant="ghost" size="sm" className="mt-2">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Unit
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SectionsAndUnits; 