import React from 'react';
import VendorCalendar from '../../components/VendorCalendar';
import { useAppStore } from '../../store/useAppStore';

const VendorCalendarPage: React.FC = () => {
  const { currentUserId } = useAppStore();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <VendorCalendar
        vendorId={currentUserId}
        vendorName="My Business"
        isVendorView={true}
      />
    </div>
  );
};

export default VendorCalendarPage;
