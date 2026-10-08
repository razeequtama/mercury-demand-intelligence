'use client';

import { useState } from 'react';
import { Database, X } from 'lucide-react';

export default function DatabaseInspectorModal({ isModalOpen, setIsModalOpen, dbData, theme }) {
  const [activeTab, setActiveTab] = useState('products');
  if (!isModalOpen || !dbData) return null;
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className={`border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl scrollbar-thin ${
        isDark 
          ? 'bg-[#201510] border-[#3d2a20] text-[#f5ebd9] scrollbar-thumb-[#4e382b] scrollbar-track-[#18110e]' 
          : 'bg-white border-[#e5d8cc] text-[#3d2c22] scrollbar-thumb-[#d1c2b4] scrollbar-track-[#f3eee8]'
      }`}>
        <div className={`flex justify-between items-center p-4 sm:p-6 border-b ${isDark ? 'border-[#3d2a20]' : 'border-[#e5d8cc]'}`}>
          <div className="flex items-center gap-2">
            <Database className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
            <h2 className="text-base sm:text-xl font-bold">PostgreSQL Raw Database Inspector</h2>
          </div>
          <button 
            onClick={() => setIsModalOpen(false)}
            className={`p-2 rounded-lg transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${isDark ? 'text-[#b8a394] hover:text-[#fff8f0]' : 'text-[#6b5646] hover:text-[#241a14]'}`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className={`flex overflow-x-auto border-b px-4 sm:px-6 pt-3 gap-3 sm:gap-4 scrollbar-none ${
          isDark ? 'border-[#3d2a20] bg-[#18110e]/40' : 'border-[#e5d8cc] bg-[#faf6f0]/40'
        }`}>
          {['products', 'inventory', 'competitorEvents'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm sm:text-base font-semibold capitalize border-b-2 transition cursor-pointer whitespace-nowrap min-h-[40px] px-2 ${
                activeTab === tab 
                  ? (isDark ? 'border-amber-500 text-amber-400' : 'border-amber-700 text-amber-800') 
                  : (isDark ? 'border-transparent text-[#b8a394] hover:text-[#fff8f0]' : 'border-transparent text-[#7a6452] hover:text-[#241a14]')
              }`}
            >
              {tab === 'competitorEvents' ? 'Competitor Events' : tab} ({dbData[tab]?.length || 0})
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 font-mono text-xs sm:text-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
              <thead className={`border-b uppercase text-xs ${isDark ? 'border-[#3d2a20] text-[#b8a394]' : 'border-[#e5d8cc] text-[#7a6452]'}`}>
                <tr>
                  {Object.keys(dbData[activeTab]?.[0] || {}).map(col => (
                    <th key={col} className="pb-3 pr-4">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#3d2a20]/40' : 'divide-[#e5d8cc]/40'}`}>
                {dbData[activeTab]?.map((row, idx) => (
                  <tr key={idx} className={`transition ${isDark ? 'hover:bg-[#2b1e17]/20' : 'hover:bg-[#fcf8f3]'}`}>
                    {Object.values(row).map((val, vIdx) => (
                      <td key={vIdx} className={`py-3.5 pr-4 ${isDark ? 'text-[#d4c2b4]' : 'text-[#4e3b2e]'}`}>
                        {val !== null ? val.toString() : <span className={isDark ? 'text-[#7a6452] italic' : 'text-[#a38f80] italic'}>NULL</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}