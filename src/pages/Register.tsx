import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/register', { replace: true });
  }, [navigate]);

  return null;
};

export default Register;
