import React from 'react';

const Spinner = () => (
  <div className="flex justify-center items-center py-10">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-pink"></div>
    <div className="absolute w-16 h-16 border-4 border-dotted rounded-full animate-spin border-brand-purple animation-delay-[-0.2s]"></div>
  </div>
);

export default Spinner;
