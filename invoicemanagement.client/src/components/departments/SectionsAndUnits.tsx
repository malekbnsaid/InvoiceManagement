import { useState, useEffect } from 'react';
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
import { departmentApi } from '../../services/api';

// Types that match the actual API response
type DepartmentNode = {
  departmentNumber: number;
  departmentNameArabic: string;
  departmentNameEnglish: string;
  parentId: number | null;
  children: DepartmentNode[];
  isDepartment: boolean;
  isSection: boolean;
  isUnit: boolean;
  sectionAbbreviation?: string;
};

type Department = {
  id: number;
  name: string;
  sections: Section[];
};

type Section = {
  id: number;
  name: string;
  abbreviation: string;
  units: Unit[];
};

type Unit = {
  id: number;
  name: string;
};

const SectionsAndUnits = () => {
  const [expandedSections, setExpandedSections] = useState<number[]>([1]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await departmentApi.getAll();
        
        // Transform the hierarchical data into our component structure
        const transformedData = data.reduce((acc: Department[], node: DepartmentNode) => {
          if (node.isDepartment) {
            const department: Department = {
              id: node.departmentNumber,
              name: node.departmentNameEnglish,
              sections: node.children
                .filter(child => child.isSection)
                .map(section => ({
                  id: section.departmentNumber,
                  name: section.departmentNameEnglish,
                  abbreviation: section.sectionAbbreviation || section.departmentNameEnglish.split(' ').map(word => word[0]).join(''),
                  units: section.children
                    .filter(child => child.isUnit)
                    .map(unit => ({
                      id: unit.departmentNumber,
                      name: unit.departmentNameEnglish
                    }))
                }))
            };
            acc.push(department);
          }
          return acc;
        }, []);

        setDepartments(transformedData);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load department data');
        setIsLoading(false);
        console.error('Error fetching departments:', err);
      }
    };

    fetchDepartments();
  }, []);

  const toggleSection = (sectionId: number) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {departments.map(department => (
        <div key={department.id}>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <UserGroupIcon className="h-6 w-6 mr-2 text-primary-500" />
              {department.name} Structure
            </h1>
            <Button size="sm" className="flex items-center">
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Section
            </Button>
          </div>

          {department.sections.map(section => (
            <Card key={section.id} className="mb-4">
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
                  <div className="space-y-2">
                    {section.units.map(unit => (
                      <div
                        key={unit.id}
                        className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{unit.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
};

export default SectionsAndUnits; 