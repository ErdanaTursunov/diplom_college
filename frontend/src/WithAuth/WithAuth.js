import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const withAuth = (WrappedComponent, allowedRoles = []) => {
  return (props) => {
    const navigate = useNavigate();
    const [isAuthorized, setIsAuthorized] = useState(false);
    
    useEffect(() => {
      const authtoken = localStorage.getItem("token");
      const storedAuth = localStorage.getItem("user");
      if (!storedAuth) {
        navigate("/login");
        return;
      }
      
      const authData = JSON.parse(storedAuth);
      const token = authtoken;
      const role = authData.role; // Access role from user object
      
      // Check if token exists and role is allowed
      if (!token || !allowedRoles.includes(role)) {
        navigate("/");
      } else {
        setIsAuthorized(true);
      }
    }, [allowedRoles, navigate]);
    
    return isAuthorized ? <WrappedComponent {...props} /> : null;
  };
};

export default withAuth;