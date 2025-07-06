"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TestStyles;
function TestStyles() {
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
          Style Test Page
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-xl p-6 hover:shadow-2xl transition-all">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Card 1</h2>
            <p className="text-gray-600">This is a test card with gradient background.</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-xl p-6 hover:shadow-2xl transition-all">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Card 2</h2>
            <p className="text-gray-600">Testing hover effects and shadows.</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-xl p-6 hover:shadow-2xl transition-all">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-full mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Card 3</h2>
            <p className="text-gray-600">Verifying Tailwind CSS is working.</p>
          </div>
        </div>
        
        <button className="mt-8 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:shadow-xl transition-all">
          Test Button
        </button>
      </div>
    </div>);
}
//# sourceMappingURL=page.js.map