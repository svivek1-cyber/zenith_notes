import React from 'react';

export default function Profile() {
  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white shadow-xl rounded-lg text-gray-900">
      {/* Cover Photo */}
      <div className="rounded-t-lg h-32 bg-linear-to-r from-blue-500 to-indigo-600"></div>
      
      {/* Profile Header */}
      <div className="mx-auto w-32 h-32 relative -mt-16 border-4 border-white rounded-full overflow-hidden">
        <img className="object-cover object-center h-32 w-32" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDYCFbCTHRD4_nKlr1KI2beV1fGhYYjK2Wz8H9wctJ_A&s=10" alt="Avatar"/>
      </div>
      
      {/* Profile Bio */}
      <div className="text-center mt-2 px-4">
        <h2 className="font-semibold text-2xl">Jane Doe</h2>
        <p className="text-gray-500 text-sm">Full Stack Developer</p>
        <p className="mt-2 text-gray-600 text-sm max-w-sm mx-auto">Building responsive web apps with React, Tailwind, and Node.js.</p>
      </div>

      {/* Profile Actions */}
      <div className="p-4 border-t mx-8 mt-6 flex justify-around text-center text-sm text-gray-600">
        <div><span className="font-bold block">42</span> Projects</div>
        <div><span className="font-bold block">1000</span> Notes</div>
        <div><span className="font-bold block">412</span> Tasks</div>
      </div>
    </div>
  );
}
