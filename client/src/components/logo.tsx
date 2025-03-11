import React from "react";

interface LogoProps {
  text?: string;
  subtitle?: string;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  text = "ĐẠI HỌC XYZ", 
  subtitle, 
  className = "text-primary-600" 
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <i className="ri-building-4-line mr-2 text-3xl"></i>
      <div>
        <h1 className="font-bold text-lg">{text}</h1>
        {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
      </div>
    </div>
  );
};

export default Logo;
