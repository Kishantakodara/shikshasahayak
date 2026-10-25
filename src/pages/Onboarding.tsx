import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/register', { replace: true });
  }, [navigate]);

  return null;
};

export default Onboarding;
