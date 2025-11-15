import React from 'react';

const FlagCZ = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 10" {...props}>
    <path fill="#fff" d="M0 0h15v10H0z"/>
    <path fill="#d7141a" d="M0 5h15v5H0z"/>
    <path fill="#11457e" d="M0 0l7.5 5L0 10z"/>
  </svg>
);

export default FlagCZ;
