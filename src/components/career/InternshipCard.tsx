import React from 'react';
import { CareerListingDTO } from '@/types/prepZone';
import { InternshipOpportunityCard, InternshipOpportunityCardProps } from './InternshipOpportunityCard';

export interface InternshipCardProps {
  listing: CareerListingDTO;
  isSaved: boolean;
  onToggleSave: (id: string, e: React.MouseEvent) => Promise<boolean | void> | void;
  onSelect: (listing: CareerListingDTO) => void;
  className?: string;
}

export const InternshipCard: React.FC<InternshipCardProps> = (props) => {
  return <InternshipOpportunityCard {...props} />;
};

export default InternshipCard;
export * from './InternshipOpportunityCard';
